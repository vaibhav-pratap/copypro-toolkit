// js/features/page.js - Page URL logic (Self-Contained)

export function copyPage() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Page URL Copied", "success");
    chrome.runtime.sendMessage({ 
      action: 'addToHistory', 
      data: { 
        type: 'Page URL', 
        value: url,
        sourceUrl: window.location.href,
        sourceTitle: document.title
      } 
    });
  }).catch(() => {
    showToast("Failed to copy URL", "error");
  });
}
