// js/features/label.js - Button/Link label logic (Self-Contained)

export function copyLabel() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  try {
    let labelText = '';
    const activeElement = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    let depth = 0;
    const maxDepth = 5;

    if (!activeElement) throw new Error("No active element found");

    let current = activeElement;
    while (current && depth < maxDepth && !labelText) {
      if ((current.tagName === 'BUTTON' || current.tagName === 'A') && current.textContent.trim()) {
        labelText = current.textContent.trim();
        break;
      } else if (current.getAttribute('title') && current.getAttribute('title').trim()) {
        labelText = current.getAttribute('title').trim();
        break;
      } else if (current.getAttribute('aria-label') && current.getAttribute('aria-label').trim()) {
        labelText = current.getAttribute('aria-label').trim();
        break;
      }
      current = current.parentElement;
      depth++;
    }

    if (!labelText) throw new Error("No button or link label found");

    navigator.clipboard.writeText(labelText).then(() => {
      showToast("Label Copied: " + labelText, "success");
      chrome.runtime.sendMessage({ 
        action: 'addToHistory', 
        data: { 
          type: 'Label', 
          value: labelText,
          sourceUrl: window.location.href,
          sourceTitle: document.title
        } 
      });
    });
  } catch (e) {
    showToast("Failed to copy label: " + e.message, "error");
  }
}
