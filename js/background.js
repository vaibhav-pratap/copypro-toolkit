// Initializing context menus and handling settings
function initializeContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.sync.get(['enableSlug', 'enableCleanText', 'enableImageName', 'enableAltText', 'enableLabel'], (settings) => {
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
    });
  });
}

// Setting up on extension install or update
chrome.runtime.onInstalled.addListener(() => {
  initializeContextMenus();
  chrome.storage.sync.set({ enableSlug: true, enableCleanText: true, enableImageName: true, enableAltText: true, enableLabel: true });
});

// Updating context menus on storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.enableSlug || changes.enableCleanText || changes.enableImageName || changes.enableAltText || changes.enableLabel)) {
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
      func: copyImageName
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
  } else if (command === "copy-page") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyPage
    });
  } else if (command === "copy-slug") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copySlugFromFocused
    });
  } else if (command === "copy-image-name") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyImageName
    });
  } else if (command === "copy-alt-text") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyAltText
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
function copyImageName() {
  // Define findFirstImage within content script context
  function findFirstImage(element) {
    if (!element) return null;
    if (element.tagName === 'IMG' && element.src) return element;
    const images = element.getElementsByTagName('img');
    for (const img of images) {
      if (img.src) return img;
    }
    return null;
  }

  try {
    let imageName = '';
    const imageFormats = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)$/i;
    const activeElement = document.activeElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const pageUrl = window.location.href;

    if (!activeElement) {
      throw new Error("No active element found");
    }

    // Check if active element is an <img> tag
    if (activeElement.tagName === 'IMG' && activeElement.src) {
      const url = new URL(activeElement.src);
      const pathname = url.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (imageFormats.test(filename)) {
        imageName = decodeURIComponent(filename);
      }
    }

    // If no valid image name, check for background-image
    if (!imageName) {
      const computedStyle = window.getComputedStyle(activeElement);
      const bgImage = computedStyle.backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/i);
        if (urlMatch && urlMatch[1]) {
          const url = new URL(urlMatch[1], pageUrl); // Resolve relative URLs
          const pathname = url.pathname;
          const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
          if (imageFormats.test(filename)) {
            imageName = decodeURIComponent(filename);
          }
        }
      }
      // Check for first <img> in hierarchy
      if (!imageName) {
        const img = findFirstImage(activeElement);
        if (img && img.src) {
          const url = new URL(img.src);
          const pathname = url.pathname;
          const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
          if (imageFormats.test(filename)) {
            imageName = decodeURIComponent(filename);
          }
        }
      }
    }

    // If no image name found, show error
    if (!imageName) {
      throw new Error("No valid image found");
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
  // Define findFirstImage within content script context
  function findFirstImage(element) {
    if (!element) return null;
    if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
      const altText = element.getAttribute('alt').trim();
      if (altText) return element;
    }
    const images = element.getElementsByTagName('img');
    for (const img of images) {
      if (img.hasAttribute('alt')) {
        const altText = img.getAttribute('alt').trim();
        if (altText) return img;
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

    // Check if active element is an <img> tag with alt attribute
    if (activeElement.tagName === 'IMG') {
      const potentialAlt = activeElement.getAttribute('alt');
      if (potentialAlt && potentialAlt.trim()) {
        altText = potentialAlt.trim();
      }
    }

    // If no alt text, check for first <img> in hierarchy with non-empty alt
    if (!altText) {
      const img = findFirstImage(activeElement);
      if (img) {
        const potentialAlt = img.getAttribute('alt');
        if (potentialAlt && potentialAlt.trim()) {
          altText = potentialAlt.trim();
        }
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
  // Define findFirstLabelElement within content script context
  function findFirstLabelElement(element) {
    if (!element) return null;
    if ((element.tagName === 'BUTTON' || element.tagName === 'A') && element.textContent.trim()) {
      return element;
    }
    const elements = element.querySelectorAll('button, a');
    for (const el of elements) {
      if (el.textContent.trim()) return el;
    }
    return null;
  }

  try {
    let labelText = '';
    const activeElement = document.activeElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

    if (!activeElement) {
      throw new Error("No active element found");
    }

    // Check if active element is a <button> or <a> tag with text content
    if ((activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A') && activeElement.textContent.trim()) {
      labelText = activeElement.textContent.trim();
    }

    // If no label text, check for first <button> or <a> in hierarchy
    if (!labelText) {
      const element = findFirstLabelElement(activeElement);
      if (element) {
        labelText = element.textContent.trim();
      }
    }

    // If no label text found or empty, show error
    if (!labelText) {
      throw new Error("No button or link label found");
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