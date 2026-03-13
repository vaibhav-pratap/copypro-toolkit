# 📋 CopyPro Toolkit

**Welcome to CopyPro Toolkit** — a robust Chrome browser extension designed to supercharge your productivity as a web developer, designer, SEO specialist, or content creator.

This tool enhances the right-click context menu, allowing you to copy image names, alt text, URL slugs, clean text from selections, button/link labels, and full page URLs with precision and ease. Built with modern web technologies, **CopyPro Toolkit** is your go-to solution for extracting critical webpage element details efficiently.

---

## 📦 Version Information

- **Version:** v2.7.1  
- **Release Date:** March 14, 2026  
- **Last Updated:** 12:05 AM IST (Saturday)  
- **Status:** ✅ Stable  

### 🛠️ Change Log

- **Notification Bridge**: Fixed broken toasts for Clean Text, Slug, and Page URL actions by implementing a cross-world messaging bridge.
- **Shortcut Cleanup**: Removed the invalid and conflicting `Ctrl+Shift+I` shortcut for image copying.
- **Engine Optimization**: Refined feature modules for better reliability when injected into pages.

### 🛠️ Change Log

- Implemented dynamic image detection for banners (`.single-wrapper > .image-wrapper > img`) and sliders (`.elementor-widget-container`)
- Restored top slider image functionality using `event delegation` and `MutationObserver`
- Maintained full compatibility with standalone and background images
- Optimized code for performance and reliability

---

## ✨ Features

- **Copy Image Name:** Extracts filenames (e.g., `image.jpg`) from image URLs, data attributes, or CSS background images.
- **Copy Alt Text:** Retrieves `alt` attributes from images for SEO and accessibility workflows.
- **Copy Slug Address:** Extracts the pathname portion of URLs (e.g., `/path/to/page`) from hyperlinks.
- **Copy Clean Text:** Cleans selected text into sanitized HTML and plain text. Removes unwanted tags, inline styles, and excess whitespace.
- **Copy Label:** Captures text, `title`, or `aria-label` from buttons and links.
- **Copy Page URL:** Gets the full URL of the active webpage.
- **Customizable (Planned):** Enable/disable context items via UI settings.
- **Keyboard Shortcuts:** Predefined hotkeys for quick actions.

---

## 👨‍💻 Developed By

- **Designer & Developer:** Vaibhav Singh

---

## 🧩 Installation

### 1. Clone or Download

Clone the repository:

```bash
git clone https://github.com/your-username/copypro-toolkit.git
