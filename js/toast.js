// Toast notification utility - M3 Snackbar style with Embedded SVGs
window.showToast = function(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `copypro-toast copypro-toast-${type}`;
  
  // Embedded SVGs for robustness (Material Symbols lookalikes)
  const successIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d0bcff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  const errorIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f2b8b5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  const warningIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffb74d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

  const iconContainer = document.createElement('div');
  iconContainer.className = 'copypro-toast-icon';
  iconContainer.innerHTML = type === 'success' ? successIcon : (type === 'warning' ? warningIcon : errorIcon);
  toast.appendChild(iconContainer);
  
  const text = document.createElement('span');
  text.className = 'copypro-toast-message';
  text.textContent = message;
  toast.appendChild(text);
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}