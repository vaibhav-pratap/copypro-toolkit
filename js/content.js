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