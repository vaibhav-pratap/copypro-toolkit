// Injecting Font Awesome CDN and toast styles
document.addEventListener('DOMContentLoaded', () => {
  // Inject Font Awesome CSS
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';
  document.head.appendChild(fontAwesome);
});