/**
 * Enhanced Copy Clean Text - Self-Contained version for injection
 * @param {boolean} preferMarkdown - Boolean flag passed from background
 */
export function copyCleanText(preferMarkdown = false) {
  // Helpers MUST be inside the function if injected via executeScript(func)
  const toReadableText = (element) => {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, tr').forEach(el => { el.innerHTML += '\n'; });
    return clone.innerText.replace(/\n\s*\n/g, '\n\n').trim();
  };

  const toMarkdown = (element) => {
    let html = element.innerHTML;
    html = html.replace(/<(p|div|h[1-6]|li|blockquote|pre|tr)[^>]*>/gi, '\n$&');
    let md = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
      .replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="(.*?)"[^>]*alt="(.*?)"[^>]*>/gi, '![$2]($1)')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n')
      .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (m, c) => c.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n') + '\n')
      .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (m, c) => {
        let i = 1;
        return c.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${i++}. $1\n`) + '\n';
      });

    md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (m, c) => {
      const rows = c.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      if (!rows.length) return '';
      let table = '\n';
      rows.forEach((r, i) => {
        const cells = r.match(/<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi) || [];
        table += '| ' + cells.map(cl => cl.replace(/<[^>]+>/g, '').trim()).join(' | ') + ' |\n';
        if (i === 0) table += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
      });
      return table + '\n';
    });
    return md.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  };

  const getSanitizedHtml = (element) => {
    const allowedTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'A', 'IMG', 'STRONG', 'B', 'EM', 'I', 'BR', 'TABLE', 'TR', 'TD', 'TH', 'CODE', 'PRE', 'BLOCKQUOTE'];
    const allowedAttrs = { 'A': ['href', 'target'], 'IMG': ['src', 'alt'] };
    const cleanNode = (node) => {
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        const child = node.childNodes[i];
        if (child.nodeType === 1) {
          if (!allowedTags.includes(child.tagName)) {
            while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
            child.parentNode.removeChild(child);
          } else {
            const attrs = Array.from(child.attributes);
            attrs.forEach(a => { if (!(allowedAttrs[child.tagName] || []).includes(a.name)) child.removeAttribute(a.name); });
            cleanNode(child);
          }
        } else if (child.nodeType !== 3) { child.parentNode.removeChild(child); }
      }
    };
    const clone = element.cloneNode(true);
    cleanNode(clone);
    return clone.innerHTML;
  };

  const showToast = (msg, type) => {
    chrome.runtime.sendMessage({ action: 'show-toast', message: msg, type: type });
  };

  const selection = window.getSelection();
  if (!selection.rangeCount || !selection.toString().trim()) {
    showToast("No text selected", "error");
    return;
  }

  const range = selection.getRangeAt(0);
  const frag = range.cloneContents();
  const div = document.createElement('div');
  div.appendChild(frag);

  const cleanHtml = getSanitizedHtml(div);
  const readableText = toReadableText(div);
  const markdownText = toMarkdown(div);

  // Use the passed flag
  const isMd = preferMarkdown === true;
  const mainText = isMd ? markdownText : readableText;

  try {
    const clipboardData = {
      'text/html': new Blob([`<!--StartFragment-->${cleanHtml}<!--EndFragment-->`], { type: 'text/html' }),
      'text/plain': new Blob([mainText], { type: 'text/plain' })
    };

    const item = new ClipboardItem(clipboardData);

    navigator.clipboard.write([item]).then(() => {
      showToast(isMd ? "Markdown Copied" : "Clean Text Copied", "success");
      chrome.runtime.sendMessage({ 
        action: 'addToHistory', 
        data: { 
          type: isMd ? 'Markdown' : 'Clean Text', 
          value: mainText.substring(0, 100),
          sourceUrl: window.location.href,
          sourceTitle: document.title
        } 
      });
    }).catch(err => {
      console.error("Clipboard API Error:", err);
      navigator.clipboard.writeText(mainText).then(() => {
        showToast("Copied (Plain Text)", "warning");
      });
    });
  } catch (e) {
    console.error("ClipboardItem failed:", e);
    navigator.clipboard.writeText(mainText);
    showToast("Copied (Fallback)", "warning");
  }
}
