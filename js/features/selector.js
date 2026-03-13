// js/features/selector.js - CSS Selector extraction logic (Self-Contained)

export function copyCssSelector() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const element = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  if (!element) {
    showToast("No element found", "error");
    return;
  }

  const getSelector = (el) => {
    if (el.id) return `#${el.id}`;
    if (el === document.body) return 'body';

    const path = [];
    while (el.parentElement) {
      if (el.id) {
        path.unshift(`#${el.id}`);
        break;
      }
      
      let selector = el.tagName.toLowerCase();
      const siblings = Array.from(el.parentElement.children).filter(e => e.tagName === el.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(el) + 1;
        selector += `:nth-of-type(${index})`;
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  };

  const selector = getSelector(element);
  navigator.clipboard.writeText(selector).then(() => {
    showToast("Selector Copied", "success");
    chrome.runtime.sendMessage({ 
      action: 'addToHistory', 
      data: { 
        type: 'Selector', 
        value: selector,
        sourceUrl: window.location.href,
        sourceTitle: document.title
      } 
    });
  }).catch(() => {
    showToast("Failed to copy selector", "error");
  });
}
