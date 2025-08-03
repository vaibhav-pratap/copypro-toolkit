// Initializing context menus and handling settings
function initializeContextMenus() {
  // Remove all existing context menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Retrieve stored settings for enabling/disabling menu items
    chrome.storage.sync.get(['enableSlug', 'enableCleanText', 'enableImageName', 'enableAltText', 'enableLabel', 'enablePage'], (settings) => {
      // Check and create context menu for copying slug from links
      if (settings.enableSlug !== false) {
        chrome.contextMenus.create({
          id: "copy-slug",
          title: "Copy Slug Address",
          contexts: ["link"]
        });
      }
      // Check and create context menu for copying clean text from selection
      if (settings.enableCleanText !== false) {
        chrome.contextMenus.create({
          id: "copy-clean-text",
          title: "Copy Clean Text",
          contexts: ["selection"]
        });
      }
      // Check and create context menu for copying image name
      if (settings.enableImageName !== false) {
        chrome.contextMenus.create({
          id: "copy-image-name",
          title: "Copy Image Name",
          contexts: ["image", "all"]
        });
      }
      // Check and create context menu for copying alt text
      if (settings.enableAltText !== false) {
        chrome.contextMenus.create({
          id: "copy-alt-text",
          title: "Copy Alt Text",
          contexts: ["image", "all"]
        });
      }
      // Check and create context menu for copying label
      if (settings.enableLabel !== false) {
        chrome.contextMenus.create({
          id: "copy-label",
          title: "Copy Button/Link Label",
          contexts: ["link", "all"]
        });
      }
      // Check and create context menu for copying page URL
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
  // Log installation or update event
  console.log("Extension installed or updated");
  // Initialize context menus on install
  initializeContextMenus();
  // Set default values for all settings
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
  // Check if changes are in sync storage and affect menu items
  if (namespace === 'sync' && (changes.enableSlug || changes.enableCleanText || changes.enableImageName || changes.enableAltText || changes.enableLabel || changes.enablePage)) {
    console.log("Storage changed, updating context menus");
    initializeContextMenus();
  }
});

// Handling context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Validate tab existence and ID
  if (!tab || !tab.id || tab.id === -1) {
    console.error("Invalid tab ID:", tab ? tab.id : 'undefined');
    showToast("Cannot perform action: No valid tab found", "error");
    return;
  }

  // Handle different context menu actions
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
  } else if (info.menuItemId === "copy-page") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyPage
    });
  }
});

// Handling keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  // Validate tab existence and ID
  if (!tab || !tab.id || tab.id === -1) {
    console.error("Invalid tab ID for command:", command, tab ? tab.id : 'undefined');
    showToast("Cannot perform action: No valid tab found", "error");
    return;
  }

  // Handle different keyboard commands
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
      func: copyImageName
    });
  } else if (command === "copy-alt-text") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyAltText
    });
  } else if (command === "copy-page") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyPage
    });
  }
});

// Copy slug from link URL
function copySlug(linkUrl) {
  // Validate input URL
  try {
    if (!linkUrl || !linkUrl.trim()) {
      showToast("No valid link URL provided", "error");
      return;
    }
    const url = new URL(linkUrl);
    const slug = url.pathname;
    // Attempt to copy to clipboard
    navigator.clipboard.writeText(slug).then(() => {
      showToast("Slug Copied", "success");
    }).catch((e) => {
      console.error("Error copying slug:", e);
      showToast("Failed to copy slug", "error");
    });
  } catch (e) {
    console.error("Invalid URL for slug:", linkUrl, e);
    showToast("Failed to copy slug: Invalid URL", "error");
  }
}

// Copy clean highlighted text
function copyCleanText() {
  // Get selected text
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

  // Explicitly remove div tags and replace <br> with spaces
  const divs = tempDiv.getElementsByTagName("DIV");
  while (divs.length > 0) {
    const div = divs[0];
    div.replaceWith(...div.childNodes);
  }
  const brs = tempDiv.getElementsByTagName("BR");
  while (brs.length > 0) {
    const br = brs[0];
    br.replaceWith(" ");
  }

  // Normalize whitespace and remove all newlines
  let cleanHtml = tempDiv.innerHTML
    .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with space
    .replace(/<br\s*\/?>/gi, ' ') // Handle any remaining <br> tags
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
  const plainText = plainDiv.textContent
    .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim(); // Trim leading/trailing whitespace

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
  let linkUrl = null;
  if (activeElement && activeElement.tagName === 'A' && activeElement.href && activeElement.href.trim()) {
    linkUrl = activeElement.href;
  } else {
    linkUrl = window.location.href;
  }
  try {
    if (!linkUrl) {
      showToast("No link or page URL available", "error");
      return;
    }
    const url = new URL(linkUrl);
    const slug = url.pathname;
    navigator.clipboard.writeText(slug).then(() => {
      showToast("Slug Copied", "success");
    }).catch((e) => {
      console.error("Error copying slug:", e);
      showToast("Failed to copy slug", "error");
    });
  } catch (e) {
    console.error("Invalid URL for slug:", linkUrl, e);
    showToast("Failed to copy slug: Invalid URL", "error");
  }
}

// Copy image name from URL or background image
function copyImageName() {
  // Helper function to find the first image in the DOM hierarchy
  function findFirstImage(element) {
    if (!element) return null;
    // Check banner structure: .single-wrapper > .image-wrapper > img
    const singleWrapper = element.closest('.single-wrapper');
    if (singleWrapper) {
      const imageWrapper = singleWrapper.querySelector('.image-wrapper');
      if (imageWrapper) {
        const img = imageWrapper.querySelector('img');
        if (img) {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
          if (src) return img;
        }
      }
    }
    // Check slider or dynamic content within .elementor-widget-container
    const widgetContainer = element.closest('.elementor-widget-container');
    if (widgetContainer) {
      const img = widgetContainer.querySelector('img');
      if (img) {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        if (src) return img;
      }
    }
    // Check if current element is an image
    if (element.tagName === 'IMG') {
      const src = element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
      if (src) return element;
    }
    // Search through all images in the element's children
    const images = element.getElementsByTagName('img');
    for (const img of images) {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (src) return img;
    }
    // Check for background-image as a fallback
    const computedStyle = window.getComputedStyle(element);
    const bgImage = computedStyle.backgroundImage;
    if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
      return element; // Return element with background image
    }
    return null;
  }

  // Main execution block with error handling
  try {
    let imageName = '';
    const imageFormats = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)$/i;
    const pageUrl = window.location.href;
    const activeElement = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

    if (!activeElement) {
      throw new Error("No active element found for image name extraction");
    }

    // Check if active element is an <img> tag
    if (activeElement.tagName === 'IMG') {
      const src = activeElement.src || activeElement.getAttribute('data-src') || activeElement.getAttribute('data-lazy-src');
      if (src) {
        const url = new URL(src, pageUrl);
        const pathname = url.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (imageFormats.test(filename)) {
          imageName = decodeURIComponent(filename);
        }
      }
    }

    // If no valid image name, check hierarchy or banner/slider structure
    if (!imageName) {
      const img = findFirstImage(activeElement);
      if (img) {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        if (src) {
          const url = new URL(src, pageUrl);
          const pathname = url.pathname;
          const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
          if (imageFormats.test(filename)) {
            imageName = decodeURIComponent(filename);
          }
        }
      }
    }

    // Fallback to background image
    if (!imageName) {
      const computedStyle = window.getComputedStyle(activeElement);
      const bgImage = computedStyle.backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/i);
        if (urlMatch && urlMatch[1]) {
          const url = new URL(urlMatch[1], pageUrl);
          const pathname = url.pathname;
          const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
          if (imageFormats.test(filename)) {
            imageName = decodeURIComponent(filename);
          }
        }
      }
    }

    if (!imageName) {
      throw new Error("No valid image found");
    }

    // Copy to clipboard
    navigator.clipboard.writeText(imageName).then(() => {
      showToast("Image Name Copied: " + imageName, "success");
    }).catch((e) => {
      console.error("Failed to write image name to clipboard:", e);
      showToast("Failed to copy image name", "error");
    });
  } catch (e) {
    console.error("Error in copyImageName function:", e.message, e.stack);
    showToast("Failed to copy image name: " + e.message, "error");
  }
}

// Copy alt text from image
function copyAltText() {
  // Helper function to find the first image with alt text
  function findFirstImageWithAlt(element) {
    if (!element) return null;
    // Check banner structure: .single-wrapper > .image-wrapper > img
    const singleWrapper = element.closest('.single-wrapper');
    if (singleWrapper) {
      const imageWrapper = singleWrapper.querySelector('.image-wrapper');
      if (imageWrapper) {
        const img = imageWrapper.querySelector('img');
        if (img && img.hasAttribute('alt')) {
          const altText = img.getAttribute('alt').trim();
          if (altText) return img;
        }
      }
    }
    // Check slider or dynamic content within .elementor-widget-container
    const widgetContainer = element.closest('.elementor-widget-container');
    if (widgetContainer) {
      const img = widgetContainer.querySelector('img');
      if (img && img.hasAttribute('alt')) {
        const altText = img.getAttribute('alt').trim();
        if (altText) return img;
      }
    }
    // Check if current element has alt text
    if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
      const altText = element.getAttribute('alt').trim();
      if (altText) return element;
    }
    // Search through all images for alt text
    const images = element.getElementsByTagName('img');
    for (const img of images) {
      if (img.hasAttribute('alt')) {
        const altText = img.getAttribute('alt').trim();
        if (altText) return img;
      }
    }
    return null;
  }

  // Main execution block with error handling
  try {
    let altText = '';
    const activeElement = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

    if (!activeElement) {
      throw new Error("No active element found for alt text extraction");
    }

    // Check if active element is an <img> tag with alt attribute
    if (activeElement.tagName === 'IMG') {
      const potentialAlt = activeElement.getAttribute('alt');
      if (potentialAlt && potentialAlt.trim()) {
        altText = potentialAlt.trim();
      }
    }

    // If no alt text, check hierarchy or banner/slider structure
    if (!altText) {
      const img = findFirstImageWithAlt(activeElement);
      if (img) {
        const potentialAlt = img.getAttribute('alt');
        if (potentialAlt && potentialAlt.trim()) {
          altText = potentialAlt.trim();
        }
      }
    }

    if (!altText) {
      throw new Error("No alt text found or alt attribute is empty");
    }

    // Copy to clipboard
    navigator.clipboard.writeText(altText).then(() => {
      showToast("Alt Text Copied: " + altText, "success");
    }).catch((e) => {
      console.error("Failed to write alt text to clipboard:", e);
      showToast("Failed to copy alt text", "error");
    });
  } catch (e) {
    console.error("Error in copyAltText function:", e.message, e.stack);
    showToast("Failed to copy alt text: " + e.message, "error");
  }
}

// Copy button or link label
function copyLabel() {
  try {
    let labelText = '';
    const activeElement = window.lastRightClickedElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    let depth = 0;
    const maxDepth = 5;

    if (!activeElement) {
      throw new Error("No active element found for label extraction");
    }

    let current = activeElement;
    while (current && depth < maxDepth && !labelText) {
      if ((current.tagName === 'BUTTON' || current.tagName === 'A') && current.textContent.trim()) {
        labelText = current.textContent.trim();
        console.log("Found label from textContent:", labelText);
        break;
      } else if (current.hasAttribute('title') && current.getAttribute('title').trim()) {
        labelText = current.getAttribute('title').trim();
        console.log("Found label from title:", labelText);
        break;
      } else if (current.hasAttribute('aria-label') && current.getAttribute('aria-label').trim()) {
        labelText = current.getAttribute('aria-label').trim();
        console.log("Found label from aria-label:", labelText);
        break;
      }
      current = current.parentElement;
      depth++;
    }

    if (!labelText) {
      throw new Error("No button or link label found in hierarchy");
    }

    navigator.clipboard.writeText(labelText).then(() => {
      showToast("Label Copied: " + labelText, "success");
    }).catch((e) => {
      console.error("Failed to write label to clipboard:", e);
      showToast("Failed to copy label", "error");
    });
  } catch (e) {
    console.error("Error in copyLabel function:", e.message, e.stack);
    showToast("Failed to copy label: " + e.message, "error");
  }
}

// Placeholder for showToast function (assuming it's defined elsewhere or in a utility script)
// This is included to maintain functionality; adjust as per your implementation
function showToast(message, type) {
  console.log(`Toast - ${type}: ${message}`);
  // Add your toast notification logic here if not already defined
}