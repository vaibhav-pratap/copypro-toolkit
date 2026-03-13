// js/features/slug.js - Slug extraction logic (Self-Contained)

export function copySlug(linkUrl) {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  try {
    if (!linkUrl || !linkUrl.trim()) {
      showToast("No valid link URL provided", "error");
      return;
    }
    const url = new URL(linkUrl);
    const slug = url.pathname;
    navigator.clipboard.writeText(slug).then(() => {
      showToast("Slug Copied", "success");
      chrome.runtime.sendMessage({ action: 'addToHistory', data: { type: 'Slug (URL)', value: slug } });
    }).catch((e) => {
      showToast("Failed to copy slug", "error");
    });
  } catch (e) {
    showToast("Failed: Invalid URL", "error");
  }
}

export function copySelectionAsSlug() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const selection = window.getSelection().toString().trim();
  if (!selection) {
    showToast("No text selected", "error");
    return;
  }

  const slug = selection.toLowerCase()
    .replace(/[^\w ]+/g,'')
    .replace(/ +/g,'-');

  navigator.clipboard.writeText(slug).then(() => {
    showToast("Selection as Slug Copied", "success");
    chrome.runtime.sendMessage({
      action: 'addToHistory',
      data: {
        type: 'Slug (Selection)',
        value: slug,
        sourceUrl: window.location.href,
        sourceTitle: document.title
      }
    });
  }).catch(() => {
    showToast("Failed to copy selection", "error");
  });
}

export function copySlugFromFocused() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const activeElement = document.activeElement;
  let linkUrl = (activeElement && activeElement.tagName === 'A' && activeElement.href) ? activeElement.href : window.location.href;
  
  try {
    const url = new URL(linkUrl);
    const slug = url.pathname;
    navigator.clipboard.writeText(slug).then(() => {
      showToast("Slug Copied", "success");
      chrome.runtime.sendMessage({ action: 'addToHistory', data: { type: 'Slug (URL)', value: slug } });
    });
  } catch (e) {
    showToast("Failed to copy slug", "error");
  }
}
