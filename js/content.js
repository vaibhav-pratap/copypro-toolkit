/**
 * @file content.js - Pure Pattern Omni-Engine (v6.3.0)
 * @author CopyPro Toolkit Team
 * 
 * v6.3 Improvements:
 * - Restored Elite Metadata Accuracy (decoding, sanitization, extension fallbacks).
 * - Decoupled Architecture (Library-only mode for window.CopyPro).
 * - Advanced 49-Point Matrix Discovery for Hero sections.
 * - Universal Background Shorthand parsing.
 */

(function() {
  'use strict';

  // --- Configuration ---

  const CONFIG = {
    VERSION: '6.3.0',
    ENGINE_TAG: 'Omni-v6.3-Elite',
    
    // Scopes
    DEPTH_ASCEND: 20,
    DEPTH_DESCEND: 10,
    SIB_LIMIT: 30,
    
    // Matrix Hit-Test (7x7)
    HIT_TEST_SAMPLES: 49,
    HIT_TEST_RADIUS: 120, // Expanded for massive modern containers
    
    // Patterns
    IMAGE_URL_PATTERN: /https?:\/\/[^\s"'<>()]+?\.(?:png|jpg|jpeg|gif|webp|svg|avif|jxl|heic|ico|cur|svgz|pjpeg|pjp|apng|bmp|tiff|tif)/gi,
    FORMAT_EXTENSION: /\.(png|jpg|jpeg|gif|webp|svg|avif|jxl|heic|ico|cur|svgz|pjpeg|pjp|apng|bmp|tiff|tif)(?:\?|#|$)/i,
    BASE64_PATTERN: /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml|avif|jxl|heic|ico);base64,/i
  };

  // --- Internal State ---

  const STATE = {
    lastTarget: null,
    lastCoords: { x: 0, y: 0 },
    activeHighlight: null
  };

  // --- Precision Utilities ---

  const Utils = {
    resolve: (url) => {
      if (!url || typeof url !== 'string' || url.startsWith('javascript:')) return null;
      try {
        if (url.startsWith('//')) url = (window.location.protocol || 'https:') + url;
        return new URL(url.trim(), window.location.href).href;
      } catch (e) { return url; }
    },

    toName: (url) => {
      try {
        const path = new URL(url).pathname;
        let base = decodeURIComponent(path.split('/').pop()) || 'media_asset';
        
        // v6.7: Base-Asset Naming (Thumbnail Cleaner)
        // Strips common thumbnail patterns (-320x240, -150x150, -NxM-c-default, -scaled)
        // Uses lookahead to ensure we only strip at the end of the filename (before extension)
        base = base.replace(/-(?:\d+x\d+|scaled|c-default)(?:-c-default)?(?=\.|$)/i, '');
        
        const clean = base.split('?')[0].split('#')[0].replace(/[<>:"/\\|?*]/g, '_');
        return clean.includes('.') ? clean : `${clean}.jpg`;
      } catch (e) { return 'media_asset.jpg'; }
    },

    getTrace: (el) => {
      if (!el) return 'element';
      const parts = [];
      let c = el;
      while (c && parts.length < 4 && c !== document.body) {
        let tag = c.tagName.toLowerCase();
        if (c.id) tag += `#${c.id}`;
        else if (c.className && typeof c.className === 'string') tag += `.${c.className.split(/\s+/)[0]}`;
        parts.unshift(tag.replace(/[^a-zA-Z0-9_.-]/g, '_'));
        c = c.parentElement;
      }
      return parts.join('_') || 'component';
    },

    /**
     * v7.1: Sovereign Boundary Heuristic
     * Identifies the logical card/tile boundary based on structural patterns.
     */
    getBoundary: (el) => {
      if (!el || el === document.body) return document.body;
      let curr = el;
      while (curr && curr.parentElement && curr !== document.body) {
        const cls = (typeof curr.className === 'string' ? curr.className : '').toLowerCase();
        const tag = curr.tagName.toLowerCase();
        
        // Signals for "Item Level" (Card, Tile, Wrapper)
        const isItem = /(?:card|item|tile|teaser|entry|post|product|single|wrap|block|unit)/.test(cls);
        const sibs = Array.from(curr.parentElement.children);
        const similarSibs = sibs.filter(s => s !== curr && s.tagName === curr.tagName).length;
        
        // If it looks like an item and has similar neighbors, it's a boundary
        if (isItem && similarSibs > 0) return curr;
        if (tag === 'article' || tag === 'section' || tag === 'li') return curr;
        if (cls.includes('elementor-widget')) return curr;
        
        curr = curr.parentElement;
      }
      return el.parentElement || el;
    }
  };

  // --- Mineral Extraction Units ---

  const Miners = {
    /**
     * DOM Tag Extraction (Optimized)
     */
    tags: (el) => {
      if (!el || !el.tagName) return null;
      const T = el.tagName.toUpperCase();

      if (T === 'IMG') {
        return { 
          source: el.currentSrc || el.src || el.getAttribute('data-src') || el.getAttribute('srcset')?.split(',')[0].trim().split(' ')[0], 
          type: 'tag_img', el 
        };
      }

      if (T === 'PICTURE') {
        const img = el.querySelector('img');
        const sources = Array.from(el.querySelectorAll('source'));
        let src = img?.currentSrc || img?.src;
        if (!src && sources.length) {
          src = sources[0].getAttribute('srcset')?.split(',').pop().trim().split(' ')[0] || sources[0].getAttribute('src');
        }
        return src ? { source: src, type: 'tag_picture', el: img || el } : null;
      }

      if (T === 'SVG' || el.closest('svg')) {
        const s = T === 'SVG' ? el : el.closest('svg');
        return { source: s, type: 'tag_svg', el: s };
      }

      if (T === 'CANVAS') return { source: el, type: 'tag_canvas', el };
      if (T === 'VIDEO') return el.poster ? { source: el.poster, type: 'tag_video_poster', el } : null;

      if (T === 'IFRAME') {
        const s = el.src || el.getAttribute('data-src') || '';
        const yt = s.match(/(?:youtube\.com|youtu\.be)\/.*?(?:embed\/|v\/|watch\?v=)([^?&]+)/i);
        if (yt) return { source: `https://img.youtube.com/vi/${yt[1]}/maxresdefault.jpg`, type: 'video_thumb', el };
        const vm = s.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
        if (vm) return { source: `https://vumbnail.com/${vm[1]}.jpg`, type: 'video_thumb', el };
      }
      return null;
    },

    /**
     * Style discovery (Background-Shorthand Parser)
     */
    styles: (el) => {
      if (el.nodeType !== 1) return [];
      const hits = [];
      const style = window.getComputedStyle(el);
      if (!style) return [];

      const parse = (val, label) => {
        if (!val || val === 'none' || !val.includes('url(')) return;
        const urls = val.match(/url\(["']?(.+?)["']?\)/gi) || [];
        urls.forEach(u => {
          const clean = u.match(/url\(["']?(.+?)["']?\)/i)?.[1];
          // Exclude typical sprite/icon keywords in the URL
          if (clean && !clean.match(/(?:sprite|icon|logo|tracker|pixel)\.(?:png|gif|webp)/i)) {
            hits.push({ source: clean, type: label, el });
          }
        });
      };

      parse(style.backgroundImage, 'css_bg');
      parse(style.background, 'css_bg_shorthand');
      parse(style.maskImage, 'css_mask');
      return hits;
    },

    /**
     * Deep Attribute Mining
     */
    attributes: (el) => {
      if (!el.attributes) return [];
      const out = [];
      for (const attr of el.attributes) {
        const val = attr.value;
        if (!val || val.length > 2500) continue;
        if (CONFIG.IMAGE_URL_PATTERN.test(val)) {
          const m = val.match(CONFIG.IMAGE_URL_PATTERN);
          if (m) m.forEach(url => out.push({ source: url, type: 'mine_attr', el }));
        } else if (CONFIG.BASE64_PATTERN.test(val)) {
          out.push({ source: val, type: 'mine_data', el });
        }
      }
      return out;
    }
  };

  // --- Discovery Intelligence ---

  const discover = (target) => {
    if (!target) return null;
    const collector = new Map();

    const push = (asset, forcedDist = null) => {
      if (!asset) return;
      if (Array.isArray(asset)) { asset.forEach(a => push(a, forcedDist)); return; }
      let src = asset.source;
      if (!src) return;
      if (typeof src === 'string') src = Utils.resolve(src);
      
      let dist = forcedDist;
      if (dist === null && asset.el && asset.el.getBoundingClientRect) {
        const r = asset.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        dist = Math.sqrt(Math.pow(cx - STATE.lastCoords.x, 2) + Math.pow(cy - STATE.lastCoords.y, 2));
      }
      if (dist === null) dist = 1000;

      const key = `${asset.type}:${src}`;
      const entry = { ...asset, source: src, dist };
      
      if (!collector.has(key)) {
        collector.set(key, entry);
      } else {
        const existing = collector.get(key);
        if (dist < existing.dist) existing.dist = dist;
      }
    };

    /**
     * Structural Breadth-First Scan
     */
    const walk = (node, depth = 0, mode = 'down') => {
      if (!node || depth > (mode === 'down' ? CONFIG.DEPTH_DESCEND : CONFIG.DEPTH_ASCEND)) return;
      
      // Filter out typical UI/Admin overlays from discovery
      if (node.id?.includes('elementor-editor') || node.className?.includes?.('admin-bar')) return;

      push(Miners.tags(node));
      push(Miners.styles(node));
      push(Miners.attributes(node));

      if (mode === 'down') {
        if (node.shadowRoot) walk(node.shadowRoot, depth + 1, 'down');
        if (node.children) {
          for (const c of node.children) walk(c, depth + 1, 'down');
        }
      }
    };

    // 1. Structural Proximity Scan (Highest Priority)
    walk(target, 0, 'down');

    // 2. Deep Container Discovery (Fix for "outside wrapper" issues)
    // v7.1: Sovereign Item Detection (Smart Boundary)
    const container = Utils.getBoundary(target);
    if (container && container !== document.body) {
      walk(container, 0, 'down');
      // Sibling Probe: Check for high-priority picture/img in logical neighbors
      if (container.parentElement && container.parentElement.children.length < 10) {
        Array.from(container.parentElement.children).forEach(s => {
          if (s !== container) walk(s, 0, 'down');
        });
      }
    }

    // 3. Ancestral Ascent (Wider Breadth)
    let curr = target.parentElement || target.parentNode;
    let up = 0;
    while (curr && up < 12) { // Even deeper ascent for complex Elementor stacks
      push(Miners.tags(curr));
      push(Miners.styles(curr));
      push(Miners.attributes(curr));

      // Sibling Probe (Crucial for images outside the clicked content-wrapper)
      if (curr.children && curr.children.length < 15) {
        Array.from(curr.children).forEach(s => {
          if (s !== target) {
            push(Miners.tags(s));
            push(Miners.styles(s));
          }
        });
      }
      curr = curr.parentElement || curr.parentNode;
      up++;
    }

    // 4. Matrix Bypass (Continuous Verification)
    if (target.getBoundingClientRect) {
      const cx = STATE.lastCoords.x || 0;
      const cy = STATE.lastCoords.y || 0;
      const side = Math.sqrt(CONFIG.HIT_TEST_SAMPLES);
      const gap = (CONFIG.HIT_TEST_RADIUS * 2) / (side - 1);

      for (let i = 0; i < side; i++) {
        for (let j = 0; j < side; j++) {
          const x = cx - CONFIG.HIT_TEST_RADIUS + (i * gap);
          const y = cy - CONFIG.HIT_TEST_RADIUS + (j * gap);
          const el = document.elementFromPoint(x, y);
          if (el && el !== target && el !== document.body) {
             const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
             push(Miners.tags(el), dist);
             push(Miners.styles(el), dist);
             push(Miners.attributes(el), dist);
          }
        }
      }
    }

    if (collector.size === 0) return null;

    // --- Ranking Suite ---
    const rank = {
      'tag_img': 1000, 'tag_picture': 980, 'tag_video_poster': 950, 'css_bg': 920, 'css_bg_shorthand': 910,
      'mine_attr': 850, 'video_thumb': 750, 'tag_svg': 700, 'tag_canvas': 600, 'mine_data': 500
    };

    const sorted = Array.from(collector.values()).sort((a,b) => {
      // Priority 1: Atomic Distance (Visual Proximity)
      // 15px threshold for "same area"
      if (Math.abs(a.dist - b.dist) > 15) return a.dist - b.dist;

      const sA = rank[a.type] || 0;
      const sB = rank[b.type] || 0;
      
      // Calculate Area-Significance (Second-order tie breaker)
      const areaA = (a.el?.offsetWidth || 1) * (a.el?.offsetHeight || 1);
      const areaB = (b.el?.offsetWidth || 1) * (b.el?.offsetHeight || 1);
      
      if (Math.abs(areaA - areaB) > 5000) return areaB - areaA;

      if (sA === sB) return areaB - areaA;
      return sB - sA;
    });

    const winner = sorted[0];
    const el = winner.el || target;
    const trace = Utils.getTrace(el);

    // --- Elite Metadata Mapping ---
    let name = '', alt = '';
    if (winner.type === 'tag_svg') {
       name = `${trace}.svg`;
       alt = el.getAttribute('aria-label') || el.querySelector('title')?.textContent || 'SVG Icon';
    } else if (winner.type === 'tag_canvas') {
       name = `${trace}_frame.png`;
       alt = 'Dynamic Canvas Content';
    } else {
      const raw = Utils.toName(winner.source);
      name = raw.includes('.') ? raw : `${raw}.jpg`;

      // Strict Alt-Text logic (v6.7: Locality-Locked Heuristics)
      const nativeAlt = el.alt || el.getAttribute('alt') || el.title || el.getAttribute('aria-label');
      const areaWinner = (el.offsetWidth || 0) * (el.offsetHeight || 0);
      let isDecorative = false;

      if (typeof nativeAlt === 'string') {
        alt = nativeAlt.trim();
        if (alt === '') isDecorative = true;
      }

      // Contextual description: Lock to local container (Widget/Section boundary)
      if (!alt && !isDecorative && areaWinner > 50000) {
        // v7.1: Behavioral Locality Lockdown.
        // 1. Proximity Cap: Winner must be within 200px of click point.
        // 2. Sovereign Lock: Winner and target must share the same "Sovereign Item" container.
        if (winner.dist < 200) {
          const localContainer = Utils.getBoundary(el);
          const targetContainer = Utils.getBoundary(target);
          
          if (localContainer && localContainer === targetContainer) {
             const context = localContainer.innerText?.substring(0, 100);
             alt = context?.replace(/\s+/g, ' ').trim() || '';
          }
        }
      }

      if (!alt) alt = 'None Found';

      // If name is too generic (media_asset), use trace to make it descriptive
      if (name.startsWith('media_asset') || name.length < 5) {
        name = `${trace}_${name}`;
      }
    }

    return {
      name: name.substring(0, 80),
      alt: alt.substring(0, 100).trim() || 'No Alt Text Identified',
      source: winner.source,
      type: winner.type,
      el: el,
      meta: {
        engine: CONFIG.ENGINE_TAG,
        sourceType: winner.type,
        trace: trace,
        dims: `${el.offsetWidth}x${el.offsetHeight}`
      }
    };
  };

  // --- Integration & UI ---

  const highlight = (el) => {
    if (!el || el === document.body) return;
    const id = 'copypro-v6-3-style';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = `
        .copypro-v6-3-active {
          outline: 5px solid #4CAF50 !important;
          outline-offset: -5px !important;
          box-shadow: 0 0 40px rgba(76, 175, 80, 0.75) !important;
          transition: all 0.25s cubic-bezier(0.19, 1, 0.22, 1) !important;
          z-index: 2147483647 !important;
        }
      `;
      document.head.appendChild(s);
    }
    el.classList.add('copypro-v6-3-active');
    setTimeout(() => el.classList.remove('copypro-v6-3-active'), 2500);
  };

  const init = () => {
    console.log(`[CopyPro] Omni-Engine v${CONFIG.VERSION} (Elite Metadata) Active.`);

    document.addEventListener('contextmenu', (e) => {
      STATE.lastTarget = e.target;
      STATE.lastCoords = { x: e.clientX, y: e.clientY };
      window.lastRightClickedElement = e.target;
      highlight(e.target);
    }, true);

    document.addEventListener('mousemove', (e) => {
      STATE.lastTarget = e.target;
    }, { passive: true });

    // Public API for Decoupled Features
    window.CopyPro = {
      engine: CONFIG.ENGINE_TAG,
      version: CONFIG.VERSION,
      findImageData: (target) => discover(target || STATE.lastTarget || document.activeElement)
    };
  };

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);

})();