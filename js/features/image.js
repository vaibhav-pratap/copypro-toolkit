/**
 * @file image.js - Image Feature Orchestrator (v6.3.0)
 * @description Decoupled UI and Interaction handler for Image features.
 * Runs as a content script to ensure reliable notifications and engine access.
 */

(function() {
  'use strict';

  // --- Feature Orchestrator ---

  const Orchestrator = {
    /**
     * Common notification and history reporting bridge
     */
    report: (label, value, data = {}) => {
      const displayValue = value && value !== 'None Found' && value !== 'No Context Found' ? value : 'None';
      
      // 1. Direct UI Notification (Guaranteed in Content Scope)
      if (typeof window.showToast === 'function') {
        const toastType = data.source ? 'success' : 'warning';
        // v6.6: Universal Minimalist - No suffixes or labels
        window.showToast(`${label}: ${displayValue.substring(0, 50)}`, toastType);
      }

      // 2. Background Sync for History
      chrome.runtime.sendMessage({
        action: 'addToHistory',
        data: {
          type: label,
          value: value.substring(0, 150),
          sourceUrl: window.location.href,
          sourceTitle: document.title,
          meta: data.meta || {}
        }
      });
    },

    /**
     * Copy Image Name
     */
    copyName: () => {
      if (!window.CopyPro) return console.error("[CopyPro] Engine not loaded");
      const data = window.CopyPro.findImageData();
      
      if (!data || data.type === 'none') {
        Orchestrator.report("Image Name", "No Asset Found", { type: 'fail' });
        return;
      }

      navigator.clipboard.writeText(data.name).then(() => {
        Orchestrator.report("Image Name", data.name, data);
      });
    },

    /**
     * Copy Alt Text
     */
    copyAlt: () => {
      if (!window.CopyPro) return console.error("[CopyPro] Engine not loaded");
      const data = window.CopyPro.findImageData();

      if (!data || data.type === 'none') {
        Orchestrator.report("Alt Text", "No Context Found", { type: 'fail' });
        return;
      }

      navigator.clipboard.writeText(data.alt).then(() => {
        Orchestrator.report("Alt Text", data.alt, data);
      });
    },

    /**
     * Copy Data URI
     */
    copyData: () => {
      if (!window.CopyPro) return console.error("[CopyPro] Engine not loaded");
      const data = window.CopyPro.findImageData();

      if (!data || !data.source || data.type === 'none') {
        if (window.showToast) window.showToast("No convertible media found", "error");
        return;
      }

      const convert = (src, type, el) => {
        // Vector Bridge
        if (type === 'tag_svg') {
          try {
            const s = new XMLSerializer();
            const xml = s.serializeToString(el);
            const b64 = btoa(unescape(encodeURIComponent(xml)));
            const uri = `data:image/svg+xml;base64,${b64}`;
            navigator.clipboard.writeText(uri).then(() => Orchestrator.report("SVG Data URI", "Vector String", data));
          } catch(e) { if (window.showToast) window.showToast("SVG Serialization Error", "error"); }
          return;
        }

        // Canvas Bridge
        if (type === 'tag_canvas') {
          try {
            const uri = el.toDataURL('image/png');
            navigator.clipboard.writeText(uri).then(() => Orchestrator.report("Canvas Data URI", "Image Snapshot", data));
          } catch(e) { if (window.showToast) window.showToast("Canvas Security Error", "error"); }
          return;
        }

        // Raster Bridge
        if (typeof src !== 'string') return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const cvs = document.createElement('canvas');
          cvs.width = img.naturalWidth;
          cvs.height = img.naturalHeight;
          const ctx = cvs.getContext('2d');
          ctx.drawImage(img, 0, 0);
          try {
            const uri = cvs.toDataURL('image/png');
            navigator.clipboard.writeText(uri).then(() => Orchestrator.report("Data URI", "Base64 Image", data));
          } catch(e) { if (window.showToast) window.showToast("CORS policy blocked conversion", "error"); }
        };
        img.onerror = () => { if (window.showToast) window.showToast("Media resource bridge failed", "error"); };
        img.src = src;
      };

      convert(data.source, data.type, data.el);
    }
  };

  // --- Messaging Initialization ---

  const init = () => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        if (request.action === 'copy-image-name') Orchestrator.copyName();
        else if (request.action === 'copy-alt-text') Orchestrator.copyAlt();
        else if (request.action === 'copy-image-data') Orchestrator.copyData();
      } catch (e) { console.error("[CopyPro] Image Feature Error:", e); }
    });
    console.log("[CopyPro] Image Feature Orchestrator (Modular) Ready.");
  };

  init();

})();
