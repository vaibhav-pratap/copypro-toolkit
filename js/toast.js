// Toast notification utility
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `copypro-toast copypro-toast-${type}`;
  
  // Add Font Awesome icon
  const icon = document.createElement('i');
  icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} copypro-toast-icon`;
  toast.appendChild(icon);
  
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 2500);
}