console.log("Background script loaded");

// Initializing context menus and handling settings
function initializeContextMenus() {
  console.log("Initializing context menus");
  chrome.contextMenus.removeAll(() => {
    chrome.storage.sync.get(['enableSlug', 'enableCleanText', 'enableImageName', 'enableAltText', 'enableLabel', 'enablePage'], (settings) => {
      if (settings.enableSlug !== false) {
        chrome.contextMenus.create({
          id: "copy-slug",
          title: "Copy Slug Address",
          contexts: ["link"]
        });
      }
      if (settings.enableCleanText !== false) {
        chrome.contextMenus.create({
          id: "copy-clean-text",
          title: "Copy Clean Text",
          contexts: ["selection"]
        });
      }
      if (settings.enableImageName !== false) {
        chrome.contextMenus.create({
          id: "copy-image-name",
          title: "Copy Image Name",
          contexts: ["image", "all"]
        });
      }
      if (settings.enableAltText !== false) {
        chrome.contextMenus.create({
          id: "copy-alt-text",
          title: "Copy Alt Text",
          contexts: ["image", "all"]
        });
      }
      if (settings.enableLabel !== false) {
        chrome.contextMenus.create({
          id: "copy-label",
          title: "Copy Button/Link Label",
          contexts: ["link", "all"]
        });
      }
      if (settings.enablePage !== false) {
        chrome.contextMenus.create({
          id: "copy-page",
          title: "Copy Page URL",
          contexts: ["all"]
        });
      }
    });
  });
}

// Setting up on extension install or update
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated");
  initializeContextMenus();
  chrome.storage.sync.set({
    enableSlug: true,
    enableCleanText: true,
    enableImageName: true,
    enableAltText: true,
    enableLabel: true,
    enablePage: true
  });
});

// Updating context menus on storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.enableSlug || changes.enableCleanText || changes.enableImageName || changes.enableAltText || changes.enableLabel || changes.enablePage)) {
    console.log("Storage changed, updating context menus");
    initializeContextMenus();
  }
});

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === 'updateContextMenus') {
    initializeContextMenus();
  }
});

// Handling context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id || tab.id === -1) {
    console.error("Invalid tab ID:", tab ? tab.id : 'undefined');
    showToast("Cannot perform action: No valid tab found", "error");
    return;
  }

  if (info.menuItemId === "copy-slug") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copySlug,
      args: [info.linkUrl]
    });
  } else if (info.menuItemId === "copy-clean-text") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyCleanText
    });
  } else if (info.menuItemId === "copy-image-name") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyImageName,
      args: [info.srcUrl || null, info.pageUrl || window.location.href]
    });
  } else if (info.menuItemId === "copy-alt-text") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyAltText
    });
  } else if (info.menuItemId === "copy-label") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyLabel
    });
  } else if (info.menuItemId === "copy-page") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyPage
    });
  }
});

// Handling keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (!tab || !tab.id || tab.id === -1) {
    console.error("Invalid tab ID for command:", command, tab ? tab.id : 'undefined');
    showToast("Cannot perform action: No valid tab found", "error");
    return;
  }

  if (command === "copy-clean-text") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyCleanText
    });
  } else if (command === "copy-slug") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copySlugFromFocused
    });
  } else if (command === "copy-image-name") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyImageName,
      args: [null, window.location.href]
    });
  } else if (command === "copy-label") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyLabel
    });
  }
});

// Copy slug from link URL
function copySlug(linkUrl) {
  try {
    const url = new URL(linkUrl);
    const slug = url.pathname;
    navigator.clipboard.writeText(slug).then(() => {
      showToast("Slug Copied", "success");
    });
  } catch (e) {
    console.error("Error copying slug:", e);
    showToast("Failed to copy slug", "error");
  }
}

// Copy clean highlighted text
function copyCleanText() {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    showToast("No text selected", "error");
    return;
  }

  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const cleanDiv = document.createElement("div");
  cleanDiv.appendChild(fragment);

  // Sanitize HTML for TinyMCE compatibility
  const allowedTags = ['P', 'B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'A', 'BR', 'TABLE', 'TR', 'TD', 'THEAD', 'TBODY', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = cleanDiv.innerHTML;

  // Remove unwanted tags, attributes, and styles
  const elements = tempDiv.getElementsByTagName("*");
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (!allowedTags.includes(element.tagName)) {
      element.replaceWith(...element.childNodes);
    } else {
      // Remove all attributes except href for <a> tags
      const attributes = element.attributes;
      for (let j = attributes.length - 1; j >= 0; j--) {
        const attr = attributes[j];
        if (!(element.tagName === 'A' && attr.name === 'href')) {
          element.removeAttribute(attr.name);
        }
      }
    }
  }

  // Explicitly remove div tags
  const divs = tempDiv.getElementsByTagName("DIV");
  while (divs.length > 0) {
    const div = divs[0];
    div.replaceWith(...div.childNodes);
  }

  // Normalize whitespace and prepare HTML
  let cleanHtml = tempDiv.innerHTML
    .replace(/(\r\n|\n|\r)/gm, '') // Remove line breaks
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim(); // Trim leading/trailing whitespace

  // Ensure content is wrapped in <p> if no block-level tags
  const hasBlockTag = cleanHtml.match(/<(p|ul|ol|table|h[1-6])/i);
  if (!hasBlockTag && cleanHtml) {
    cleanHtml = `<p>${cleanHtml}</p>`;
  }

  // Generate plain text version
  const plainDiv = document.createElement("div");
  plainDiv.innerHTML = cleanHtml;
  const plainText = plainDiv.textContent.trim();

  // Try Clipboard API with ClipboardItem
  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([cleanHtml], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' })
    });
    navigator.clipboard.write([clipboardItem]).then(() => {
      showToast("Clean Text Copied", "success");
    }).catch((e) => {
      console.error("Clipboard API failed:", e.message, e.stack);
      // Fallback to execCommand
      try {
        const tempInput = document.createElement("div");
        tempInput.style.position = "absolute";
        tempInput.style.left = "-9999px";
        tempInput.innerHTML = cleanHtml;
        document.body.appendChild(tempInput);

        const range = document.createRange();
        range.selectNodeContents(tempInput);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const success = document.execCommand("copy");
        document.body.removeChild(tempInput);

        if (success) {
          showToast("Clean Text Copied (Fallback)", "success");
        } else {
          throw new Error("execCommand('copy') failed");
        }
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError.message, fallbackError.stack);
        showToast("Failed to copy text: " + fallbackError.message, "error");
      }
    });
  } catch (e) {
    console.error("Error creating ClipboardItem:", e.message, e.stack);
    showToast("Failed to copy text: " + e.message, "error");
  }
}

// Copy current page URL
function copyPage() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Page URL Copied", "success");
  }).catch(() => {
    showToast("Failed to copy URL", "error");
  });
}

// Copy slug from focused link or current page
function copySlugFromFocused() {
  const activeElement = document.activeElement;
  let linkUrl = window.location.href;
  if (activeElement.tagName === 'A' && activeElement.href) {
    linkUrl = activeElement.href;
  }
  try {
    const url = new URL(linkUrl);
    const slug = url.pathname;
    navigator.clipboard.writeText(slug).then(() => {
      showToast("Slug Copied", "success");
    });
  } catch (e) {
    console.error("Error copying slug:", e);
    showToast("Failed to copy slug", "error");
  }
}

// Copy image name from URL or background image
function copyImageName(srcUrl, pageUrl) {
  // Define findClosestImage within content script context
  function findClosestImage(element) {
    if (!element) return null;

    // Check if element itself is an <img> with src
    if (element.tagName === 'IMG' && element.src) {
      return element;
    }

    // Check if element is a <picture> and get its <img> or <source>
    if (element.tagName === 'PICTURE') {
      const img = element.querySelector('img');
      if (img && img.src) {
        return img;
      }
      const source = element.querySelector('source[srcset]');
      if (source && source.srcset) {
        // Extract first URL from srcset (handles multiple entries)
        const srcset = source.srcset.split(',').map(s => s.trim().split(' ')[0]).find(url => url);
        if (srcset) {
          return { src: srcset };
        }
      }
    }

    // Check for background-image on the element
    const computedStyle = window.getComputedStyle(element);
    const bgImage = computedStyle.backgroundImage;
    if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
      const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/i);
      if (urlMatch && urlMatch[1]) {
        return { src: urlMatch[1] };
      }
    }

    // Search upward to parents for <img>, <picture>, or background-image
    let current = element;
    while (current && current !== document.documentElement) {
      if (current.tagName === 'IMG' && current.src) {
        return current;
      }
      if (current.tagName === 'PICTURE') {
        const img = current.querySelector('img');
        if (img && img.src) {
          return img;
        }
        const source = current.querySelector('source[srcset]');
        if (source && source.srcset) {
          const srcset = source.srcset.split(',').map(s => s.trim().split(' ')[0]).find(url => url);
          if (srcset) {
            return { src: srcset };
          }
        }
      }
      const parentStyle = window.getComputedStyle(current);
      const parentBgImage = parentStyle.backgroundImage;
      if (parentBgImage && parentBgImage !== 'none' && parentBgImage.includes('url(')) {
        const urlMatch = parentBgImage.match(/url\(["']?(.+?)["']?\)/i);
        if (urlMatch && urlMatch[1]) {
          return { src: urlMatch[1] };
        }
      }
      current = current.parentElement;
    }

    // Search downward to children for <img> or <picture>
    const pictures = element.getElementsByTagName('picture');
    for (const picture of pictures) {
      const img = picture.querySelector('img');
      if (img && img.src) {
        return img;
      }
      const source = picture.querySelector('source[srcset]');
      if (source && source.srcset) {
        const srcset = source.srcset.split(',').map(s => s.trim().split(' ')[0]).find(url => url);
        if (srcset) {
          return { src: srcset };
        }
      }
    }

    const images = element.getElementsByTagName('img');
    for (const img of images) {
      if (img.src) {
        return img;
      }
    }

    // Search siblings for <img> or <picture>
    if (element.parentElement) {
      const siblings = element.parentElement.children;
      for (const sibling of siblings) {
        if (sibling !== element) {
          if (sibling.tagName === 'IMG' && sibling.src) {
            return sibling;
          }
          if (sibling.tagName === 'PICTURE') {
            const img = sibling.querySelector('img');
            if (img && img.src) {
              return img;
            }
            const source = sibling.querySelector('source[srcset]');
            if (source && source.srcset) {
              const srcset = source.srcset.split(',').map(s => s.trim().split(' ')[0]).find(url => url);
              if (srcset) {
                return { src: srcset };
              }
            }
          }
        }
      }
    }

    return null;
  }

  try {
    let imageName = '';
    const imageFormats = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)$/i;

    // If srcUrl is provided (context menu on <img>), use it directly
    if (srcUrl) {
      const url = new URL(srcUrl, pageUrl);
      const pathname = url.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (imageFormats.test(filename)) {
        imageName = decodeURIComponent(filename);
      }
    }

    // If no valid imageName from srcUrl, check active element
    if (!imageName) {
      const activeElement = document.activeElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      if (!activeElement) {
        throw new Error("No active element found");
      }

      // Check for closest image in hierarchy
      const img = findClosestImage(activeElement);
      if (img && img.src) {
        const url = new URL(img.src, pageUrl);
        const pathname = url.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (imageFormats.test(filename)) {
          imageName = decodeURIComponent(filename);
        }
      }
    }

    // If no image name found, show error
    if (!imageName) {
      throw new Error("No valid image found in hierarchy");
    }

    // Copy only the filename (without path)
    const filenameOnly = imageName.split('/').pop();
    navigator.clipboard.writeText(filenameOnly).then(() => {
      showToast("Image Name Copied: " + filenameOnly, "success");
    });
  } catch (e) {
    console.error("Error copying image name:", e);
    showToast("Failed to copy image name: " + e.message, "error");
  }
}

// Copy alt text from image
function copyAltText() {
  // Define findClosestImage within content script context
  function findClosestImage(element) {
    if (!element) return null;

    // Check if element itself is an <img> with alt
    if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
      const altText = element.getAttribute('alt').trim();
      if (altText) return element;
    }

    // Check if element is a <picture> and get its <img>
    if (element.tagName === 'PICTURE') {
      const img = element.querySelector('img');
      if (img && img.hasAttribute('alt')) {
        const altText = img.getAttribute('alt').trim();
        if (altText) return img;
      }
    }

    // Search upward to parents for <img> or <picture>
    let current = element;
    while (current && current !== document.documentElement) {
      if (current.tagName === 'IMG' && current.hasAttribute('alt')) {
        const altText = current.getAttribute('alt').trim();
        if (altText) return current;
      }
      if (current.tagName === 'PICTURE') {
        const img = current.querySelector('img');
        if (img && img.hasAttribute('alt')) {
          const altText = img.getAttribute('alt').trim();
          if (altText) return img;
        }
      }
      current = current.parentElement;
    }

    // Search downward to children for <img> or <picture>
    const pictures = element.getElementsByTagName('picture');
    for (const picture of pictures) {
      const img = picture.querySelector('img');
      if (img && img.hasAttribute('alt')) {
        const altText = img.getAttribute('alt').trim();
        if (altText) return img;
      }
    }

    const images = element.getElementsByTagName('img');
    for (const img of images) {
      if (img.hasAttribute('alt')) {
        const altText = img.getAttribute('alt').trim();
        if (altText) return img;
      }
    }

    // Search siblings for <img> or <picture>
    if (element.parentElement) {
      const siblings = element.parentElement.children;
      for (const sibling of siblings) {
        if (sibling !== element) {
          if (sibling.tagName === 'IMG' && sibling.hasAttribute('alt')) {
            const altText = sibling.getAttribute('alt').trim();
            if (altText) return sibling;
          }
          if (sibling.tagName === 'PICTURE') {
            const img = sibling.querySelector('img');
            if (img && img.hasAttribute('alt')) {
              const altText = img.getAttribute('alt').trim();
              if (altText) return img;
            }
          }
        }
      }
    }

    return null;
  }

  try {
    let altText = '';
    const activeElement = document.activeElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

    if (!activeElement) {
      throw new Error("No active element found");
    }

    // Check for closest image with alt text in hierarchy
    const img = findClosestImage(activeElement);
    if (img && img.hasAttribute('alt')) {
      const potentialAlt = img.getAttribute('alt');
      if (potentialAlt && potentialAlt.trim()) {
        altText = potentialAlt.trim();
      }
    }

    // If no alt text found or empty, show error
    if (!altText) {
      throw new Error("No alt text found or alt attribute is empty");
    }

    // Copy alt text to clipboard
    navigator.clipboard.writeText(altText).then(() => {
      showToast("Alt Text Copied: " + altText, "success");
    });
  } catch (e) {
    console.error("Error copying alt text:", e);
    showToast("Failed to copy alt text: " + e.message, "error");
  }
}

// Copy button or link label
function copyLabel() {
  // Define findClosestLabelElement within content script context
  function findClosestLabelElement(element) {
    if (!element) return null;

    // Check if element itself is a <button> or <a> with text content
    if ((element.tagName === 'BUTTON' || element.tagName === 'A') && element.textContent.trim()) {
      return element;
    }

    // Search upward to parents for <button> or <a>
    let current = element;
    while (current && current !== document.documentElement) {
      if ((current.tagName === 'BUTTON' || current.tagName === 'A') && current.textContent.trim()) {
        return current;
      }
      current = current.parentElement;
    }

    // Search downward to children for <button> or <a>
    const elements = element.querySelectorAll('button, a');
    for (const el of elements) {
      if (el.textContent.trim()) {
        return el;
      }
    }

    // Search siblings for <button> or <a>
    if (element.parentElement) {
      const siblings = element.parentElement.children;
      for (const sibling of siblings) {
        if (sibling !== element && (sibling.tagName === 'BUTTON' || sibling.tagName === 'A') && sibling.textContent.trim()) {
          return sibling;
        }
      }
    }

    return null;
  }

  try {
    let labelText = '';
    const activeElement = document.activeElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

    if (!activeElement) {
      throw new Error("No active element found");
    }

    // Check for closest <button> or <a> in hierarchy
    const element = findClosestLabelElement(activeElement);
    if (element) {
      labelText = element.textContent.trim();
    }

    // If no label text found or empty, show error
    if (!labelText) {
      throw new Error("No button or link label found in hierarchy");
    }

    // Copy label text to clipboard
    navigator.clipboard.writeText(labelText).then(() => {
      showToast("Label Copied: " + labelText, "success");
    });
  } catch (e) {
    console.error("Error copying label:", e);
    showToast("Failed to copy label: " + e.message, "error");
  }
}