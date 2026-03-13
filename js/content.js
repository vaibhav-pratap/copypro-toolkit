// content.js - Handling context menu persistence and dynamic DOM observation

// Track the last clicked element for accurately targeting images/links
document.addEventListener('contextmenu', (event) => {
  window.lastRightClickedElement = event.target;
  // console.debug('Right-click target captured:', event.target);
});


// MutationObserver to handle dynamic content like sliders
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector('.single-wrapper') || node.querySelector('.elementor-widget-container'))) {
          console.log('New image container detected:', node);
          // Optionally trigger a re-evaluation of context menu
          chrome.runtime.sendMessage({ type: "domChanged" });
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('Content script loaded, observing DOM changes');