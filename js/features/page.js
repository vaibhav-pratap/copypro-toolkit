// js/features/page.js - Page URL logic (Self-Contained)

const showToast = (msg, type) => {
  chrome.runtime.sendMessage({ action: 'show-toast', message: msg, type: type || 'success' });
};

export function copyPage() {
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
