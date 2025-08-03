// Inject Font Awesome CSS for icons
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';
fontAwesomeLink.crossOrigin = 'anonymous';
document.head.appendChild(fontAwesomeLink);

// Inject toast.css
const toastStyles = document.createElement('link');
toastStyles.rel = 'stylesheet';
toastStyles.href = chrome.runtime.getURL('toast.css');
document.head.appendChild(toastStyles);

// Inject toast.js
const toastScript = document.createElement('script');
toastScript.src = chrome.runtime.getURL('toast.js');
document.head.appendChild(toastScript);

// content.js
document.addEventListener('contextmenu', (event) => {
  window.lastRightClickedElement = event.target;
  console.log('Right-click detected on:', event.target);
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