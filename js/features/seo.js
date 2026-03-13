// js/features/seo.js - SEO Heading Architecture logic (Self-Contained)

export function copyHeadingStructure() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.length === 0) {
    showToast("No headings found on this page", "error");
    return;
  }

  const structure = headings.map(h => {
    const level = parseInt(h.tagName[1]);
    const indent = '  '.repeat(level - 1);
    const prefix = level === 1 ? '# ' : '- '.padStart(level, '  ');
    return `${indent}${prefix}${h.textContent.trim()}`;
  }).join('\n');

  navigator.clipboard.writeText(structure).then(() => {
    showToast("SEO Heading Tree Copied", "success");
    chrome.runtime.sendMessage({ 
      action: 'addToHistory', 
      data: { 
        type: 'SEO Audit', 
        value: `Heading Tree (${headings.length} items)`,
        sourceUrl: window.location.href,
        sourceTitle: document.title
      } 
    });
  }).catch(() => {
    showToast("Failed to copy heading structure", "error");
  });
}
