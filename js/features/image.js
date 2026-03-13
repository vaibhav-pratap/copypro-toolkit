// js/features/image.js - Image name & Alt text logic (Self-Contained)

export function copyImageName() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const imageFormats = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)$/i;
  const pageUrl = window.location.href;
  const activeElement = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

  const findFirstImage = (element) => {
    if (!element) return null;
    const singleWrapper = element.closest('.single-wrapper');
    if (singleWrapper) {
      const img = singleWrapper.querySelector('.image-wrapper img');
      if (img) return img;
    }
    const widgetContainer = element.closest('.elementor-widget-container');
    if (widgetContainer) {
      const img = widgetContainer.querySelector('img');
      if (img) return img;
    }
    if (element.tagName === 'IMG') return element;
    const images = element.getElementsByTagName('img');
    if (images.length > 0) return images[0];
    
    const computedStyle = window.getComputedStyle(element);
    const bgImage = computedStyle.backgroundImage;
    if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) return element;
    
    return null;
  };

  try {
    let imageName = '';
    const img = findFirstImage(activeElement);
    if (!img) throw new Error("No valid image found");

    let src = '';
    if (img.tagName === 'IMG') {
      src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    } else {
      const bgImage = window.getComputedStyle(img).backgroundImage;
      const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/i);
      if (urlMatch) src = urlMatch[1];
    }

    if (src) {
      const url = new URL(src, pageUrl);
      const filename = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
      if (imageFormats.test(filename)) {
        imageName = decodeURIComponent(filename);
      }
    }

    if (!imageName) throw new Error("No valid filename found");

    navigator.clipboard.writeText(imageName).then(() => {
      showToast("Image Name Copied: " + imageName, "success");
      chrome.runtime.sendMessage({ action: 'addToHistory', data: { type: 'Image Name', value: imageName } });
    });
  } catch (e) {
    showToast("Failed to copy image name: " + e.message, "error");
  }
}

export function copyAltText() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const activeElement = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

  const findFirstAlt = (element) => {
    if (!element) return null;
    if (element.tagName === 'IMG' && element.alt.trim()) return element.alt.trim();
    
    const singleWrapper = element.closest('.single-wrapper');
    if (singleWrapper) {
      const img = singleWrapper.querySelector('.image-wrapper img');
      if (img && img.alt.trim()) return img.alt.trim();
    }
    
    const widgetContainer = element.closest('.elementor-widget-container');
    if (widgetContainer) {
      const img = widgetContainer.querySelector('img');
      if (img && img.alt.trim()) return img.alt.trim();
    }

    const images = element.getElementsByTagName('img');
    for (const img of images) {
      if (img.alt.trim()) return img.alt.trim();
    }
    return null;
  };

  try {
    const altText = findFirstAlt(activeElement);
    if (!altText) throw new Error("No alt text found");

    navigator.clipboard.writeText(altText).then(() => {
      showToast("Alt Text Copied: " + altText, "success");
      chrome.runtime.sendMessage({ action: 'addToHistory', data: { type: 'Alt Text', value: altText } });
    });
  } catch (e) {
    showToast("Failed to copy alt text: " + e.message, "error");
  }
}

export function copyImageDataUri() {
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
    else console.log(`[CopyPro] ${type}: ${msg}`);
  };

  const activeElement = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  let target = activeElement;
  if (target.tagName !== 'IMG') {
    target = target.querySelector('img') || target.closest('img');
  }

  if (!target || target.tagName !== 'IMG') {
    showToast("Please right-click an actual image", "error");
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = target.naturalWidth;
  canvas.height = target.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(target, 0, 0);
  
  try {
    const dataUri = canvas.toDataURL('image/png');
    navigator.clipboard.writeText(dataUri).then(() => {
      showToast("Image Data URI Copied", "success");
      chrome.runtime.sendMessage({ 
        action: 'addToHistory', 
        data: { 
          type: 'Data URI', 
          value: 'Base64 Data',
          sourceUrl: window.location.href,
          sourceTitle: document.title
        } 
      });
    });
  } catch (e) {
    showToast("Failed to convert image (CORS?)", "error");
  }
}
