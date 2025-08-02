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
  // Define findClosestImage with BFS traversal
  function findClosestImage(element) {
    if (!element) return null;

    // Queue for BFS traversal
    const queue = [{ node: element, depth: 0 }];
    const visited = new Set();
    const maxDepth = 10; // Increased for page builder DOMs
    const imageFormats = /\.(png|jpg|jpeg|gif|webp|svg|bmp|tiff)$/i;

    while (queue.length > 0) {
      const { node, depth } = queue.shift();
      if (depth > maxDepth || visited.has(node)) continue;
      visited.add(node);

      // Check for shadow DOM
      if (node.shadowRoot) {
        queue.push({ node: node.shadowRoot, depth: depth + 1 });
      }

      // Check if node is an <img> with src, data-src, or data-lazy-src
      if (node.tagName === 'IMG' && (node.src || node.dataset.src || node.dataset.lazySrc || node.dataset.image)) {
        const src = node.src || node.dataset.src || node.dataset.lazySrc || node.dataset.image;
        try {
          const url = new URL(src, pageUrl);
          if (imageFormats.test(url.pathname)) {
            return { src };
          }
        } catch (e) {
          console.warn("Invalid image URL:", src, e);
        }
      }

      // Check if node is a <picture>
      if (node.tagName === 'PICTURE') {
        const img = node.querySelector('img');
        if (img && (img.src || img.dataset.src || img.dataset.lazySrc || img.dataset.image)) {
          const src = img.src || img.dataset.src || img.dataset.lazySrc || img.dataset.image;
          try {
            const url = new URL(src, pageUrl);
            if (imageFormats.test(url.pathname)) {
              return { src };
            }
          } catch (e) {
            console.warn("Invalid picture img URL:", src, e);
          }
        }
        const source = node.querySelector('source[srcset], source[data-srcset], source[data-lazy-srcset]');
        if (source && (source.srcset || source.dataset.srcset || source.dataset.lazySrcset)) {
          const srcset = (source.srcset || source.dataset.srcset || source.dataset.lazySrcset).split(',').map(s => s.trim().split(' ')[0]).find(url => url);
          if (srcset) {
            try {
              const url = new URL(srcset, pageUrl);
              if (imageFormats.test(url.pathname)) {
                return { src: srcset };
              }
            } catch (e) {
              console.warn("Invalid srcset URL:", srcset, e);
            }
          }
        }
      }

      // Check for background-image
      const computedStyle = window.getComputedStyle(node);
      const bgImage = computedStyle.backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        const urlMatch = bgImage.match(/url\(["']?(.+?)["']?\)/i);
        if (urlMatch && urlMatch[1]) {
          try {
            const url = new URL(urlMatch[1], pageUrl);
            if (imageFormats.test(url.pathname)) {
              return { src: urlMatch[1] };
            }
          } catch (e) {
            console.warn("Invalid background-image URL:", urlMatch[1], e);
          }
        }
      }

      // Add parent, children, and siblings to queue
      if (node.parentElement && node !== document.documentElement) {
        queue.push({ node: node.parentElement, depth: depth + 1 });
      }
      const children = node.children || [];
      for (const child of children) {
        queue.push({ node: child, depth: depth + 1 });
      }
      if (node.parentElement) {
        const siblings = node.parentElement.children;
        for (const sibling of siblings) {
          if (sibling !== node) {
            queue.push({ node: sibling, depth: depth + 1 });
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

      // Check for page builder classes
      const pageBuilder = activeElement.closest('.elementor, .wix, .sqs-block, .wp-block, .et_pb_module, .vc_custom, .vc_row');
      console.log("Page builder detected:", pageBuilder ? pageBuilder.className : 'none');

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
  // Define findClosestImage with DFS traversal
  function findClosestImage(element) {
    if (!element) return null;

    const visited = new Set();
    const maxDepth = 20;

    function dfs(node, depth) {
      if (depth > maxDepth || visited.has(node)) return null;
      visited.add(node);

      // Check for shadow DOM
      if (node.shadowRoot) {
        const shadowResult = dfs(node.shadowRoot, depth + 1);
        if (shadowResult) return shadowResult;
      }

      // Check if node is an <img> with alt, data-alt, or data-image-alt
      if (node.tagName === 'IMG' && (node.hasAttribute('alt') || node.dataset.alt || node.dataset.imageAlt)) {
        const altText = (node.getAttribute('alt') || node.dataset.alt || node.dataset.imageAlt || '').trim();
        if (altText) {
          console.log("Found alt text on:", node.tagName, "alt:", altText);
          return { element: node, alt: altText };
        }
      }

      // Check if node is a <picture>
      if (node.tagName === 'PICTURE') {
        const img = node.querySelector('img');
        if (img && (img.hasAttribute('alt') || img.dataset.alt || img.dataset.imageAlt)) {
          const altText = (img.getAttribute('alt') || img.dataset.alt || img.dataset.imageAlt || '').trim();
          if (altText) {
            console.log("Found alt text in picture on:", img.tagName, "alt:", altText);
            return { element: img, alt: altText };
          }
        }
      }

      // Recurse on children
      const children = node.children || [];
      for (const child of children) {
        const result = dfs(child, depth + 1);
        if (result) return result;
      }

      // Recurse on parent if not root
      if (node.parentElement && node !== document.documentElement) {
        const result = dfs(node.parentElement, depth + 1);
        if (result) return result;
      }

      return null;
    }

    return dfs(element, 0);
  }

  try {
    let altText = '';
    const activeElement = document.activeElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

    if (!activeElement) {
      throw new Error("No active element found");
    }

    // Check for page builder classes
    const pageBuilder = activeElement.closest('.elementor, .wix, .sqs-block, .wp-block, .et_pb_module, .vc_custom, .vc_row');
    console.log("Page builder detected for alt text:", pageBuilder ? pageBuilder.className : 'none');

    // If activeElement is an image or in image-wrapper, check parent container
    let startElement = activeElement;
    if (activeElement.tagName === 'IMG' || activeElement.closest('.image-wrapper, .elementor-image, .sqs-block-image')) {
      const container = activeElement.closest('.container, .elementor-container, .sqs-block, .wp-block, .et_pb_row, .vc_row');
      if (container) {
        console.log("Detected image layer, searching container:", container.className);
        startElement = container;
      }
    }

    // Check for closest image with alt text in hierarchy
    const img = findClosestImage(startElement);
    if (img && img.alt) {
      altText = img.alt;
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
  // Define findClosestLabelElement with DFS traversal
  function findClosestLabelElement(element) {
    if (!element) return null;

    const visited = new Set();
    const maxDepth = 20;

    function dfs(node, depth) {
      if (depth > maxDepth || visited.has(node)) return null;
      visited.add(node);

      // Check for shadow DOM
      if (node.shadowRoot) {
        const shadowResult = dfs(node.shadowRoot, depth + 1);
        if (shadowResult) return shadowResult;
      }

      // Check if node is a <button> or <a> with text content
      if ((node.tagName === 'BUTTON' || node.tagName === 'A') && node.textContent.trim()) {
        console.log("Found button/a:", node.tagName, "text:", node.textContent.trim());
        return { element: node, text: node.textContent.trim() };
      }

      // Check for interactive elements with descriptive attributes
      const isInteractive = node.hasAttribute('onclick') || 
                           node.getAttribute('role') === 'button' || 
                           node.hasAttribute('tabindex') || 
                           node.className.includes('button') || 
                           node.className.includes('btn') || 
                           node.className.includes('elementor-button') || 
                           node.className.includes('sqs-block-button') || 
                           node.className.includes('wp-block-button');
      if (isInteractive) {
        let text = '';
        const title = node.getAttribute('title');
        if (title && title.trim()) {
          text = title.trim();
          console.log("Found title on:", node.tagName, "title:", title);
        }
        const ariaDescribedBy = node.getAttribute('aria-describedby');
        if (ariaDescribedBy && !text) {
          const describedElement = document.getElementById(ariaDescribedBy) || document.querySelector(`[id="${ariaDescribedBy}"]`);
          if (describedElement && describedElement.textContent.trim()) {
            text = describedElement.textContent.trim();
            console.log("Found aria-describedby on:", node.tagName, "text:", text);
          }
        }
        const ariaLabel = node.getAttribute('aria-label');
        if (ariaLabel && !text) {
          text = ariaLabel.trim();
          console.log("Found aria-label on:", node.tagName, "text:", ariaLabel);
        }
        const dataTitle = node.dataset.title;
        if (dataTitle && !text) {
          text = dataTitle.trim();
          console.log("Found data-title on:", node.tagName, "text:", dataTitle);
        }
        const dataLabel = node.dataset.label;
        if (dataLabel && !text) {
          text = dataLabel.trim();
          console.log("Found data-label on:", node.tagName, "text:", dataLabel);
        }
        if (!text && node.textContent.trim()) {
          text = node.textContent.trim();
          console.log("Found textContent on:", node.tagName, "text:", text);
        }
        if (text) {
          return { element: node, text };
        }
      }

      // Recurse on children
      const children = node.children || [];
      for (const child of children) {
        const result = dfs(child, depth + 1);
        if (result) return result;
      }

      // Recurse on parent if not root
      if (node.parentElement && node !== document.documentElement) {
        const result = dfs(node.parentElement, depth + 1);
        if (result) return result;
      }

      return null;
    }

    return dfs(element, 0);
  }

  try {
    let labelText = '';
    const activeElement = document.activeElement || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);

    if (!activeElement) {
      throw new Error("No active element found");
    }

    // Check for page builder classes
    const pageBuilder = activeElement.closest('.elementor, .wix, .sqs-block, .wp-block, .et_pb_module, .vc_custom, .vc_row');
    console.log("Page builder detected for label:", pageBuilder ? pageBuilder.className : 'none');

    // If activeElement is an image or in image-wrapper, check parent container
    let startElement = activeElement;
    if (activeElement.tagName === 'IMG' || activeElement.closest('.image-wrapper, .elementor-image, .sqs-block-image')) {
      const container = activeElement.closest('.container, .elementor-container, .sqs-block, .wp-block, .et_pb_row, .vc_row');
      if (container) {
        console.log("Detected image layer, searching container:", container.className);
        startElement = container;
      }
    }

    // Check for closest label element in hierarchy
    const element = findClosestLabelElement(startElement);
    if (element && element.text) {
      labelText = element.text;
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