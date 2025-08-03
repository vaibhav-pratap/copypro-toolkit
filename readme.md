CopyPro Toolkit
Welcome to CopyPro Toolkit, a robust Chrome browser extension designed to supercharge your productivity as a web developer, designer, SEO specialist, or content creator. This tool enhances the right-click context menu, allowing you to copy image names, alt text, URL slugs, clean text from selections, button/link labels, and full page URLs with precision and ease. Built with modern web technologies, CopyPro Toolkit is your go-to solution for extracting critical webpage element details efficiently.
Version Information

Version: v2.5.8
Release Date: August 03, 2025
Last Updated: 08:58 PM IST (Sunday)
Status: Stable
Change Log: 
Implemented dynamic image detection for banners (.single-wrapper > .image-wrapper > img) and sliders (.elementor-widget-container).
Restored top slider image functionality using event delegation and MutationObserver.
Maintained full compatibility with standalone images and background images.
Optimized code for performance and reliability.



Features

Copy Image Name: Extracts filenames (e.g., "image.jpg") from image URLs, data attributes, or CSS background images.
Copy Alt Text: Retrieves alt text attributes from images, supporting accessibility and SEO workflows.
Copy Slug Address: Extracts the pathname portion of URLs (e.g., "/path/to/page") from hyperlinks.
Copy Clean Text: Sanitizes selected text into clean HTML (TinyMCE compatible) and plain text, removing unwanted tags, styles, and excessive whitespace.
Copy Label: Captures text content, title, or aria-label attributes from buttons and links for UI analysis.
Copy Page URL: Copies the complete URL of the current webpage.
Customizable: Toggle menu items via Chrome extension settings (future enhancement planned).
Keyboard Shortcuts: Predefined hotkeys for rapid access to copying functions.

Developed By

Designer & Developer: Vaibhav
Powered By: Exiverlabs
Assisted By: Grok 3, an advanced AI tool by xAI, for code optimization, debugging, and innovative solutions.

Installation
Follow these detailed steps to install and configure CopyPro Toolkit in your Chrome browser:

Clone or Download the Repository:

Clone the repository using Git for the latest updates:git clone https://github.com/your-username/copypro-toolkit.git


Alternatively, download the ZIP file from the GitHub releases page or the main repository page, then extract it to a local directory.


Load the Extension in Chrome:

Launch Google Chrome and navigate to chrome://extensions/.
Toggle on "Developer mode" in the top right corner.
Click the "Load unpacked" button.
Browse to the project folder (containing manifest.json) and select it, then click "Open".
The CopyPro Toolkit icon should appear in your Chrome toolbar (puzzle piece icon).


Verify Installation:

Right-click on any webpage element (e.g., image, link, or text) to ensure the custom context menu options are visible.
Open Chrome DevTools (Ctrl+Shift+I > Console tab) to check for any error messages and confirm successful loading.



Usage
Context Menu Actions

Available Options:
"Copy Image Name": Copies the filename of the right-clicked image.
"Copy Alt Text": Copies the alt text associated with the image.
"Copy Slug Address": Extracts the slug from a clicked hyperlink.
"Copy Clean Text": Copies sanitized text from a highlighted selection.
"Copy Button/Link Label": Extracts the label from a button or link element.
"Copy Page URL": Copies the full URL of the current page.


How to Use:
Visit any webpage in Chrome.
Right-click on an image, link, or selected text to open the enhanced context menu.
Select the desired option, and the extracted data will be copied to your clipboard for immediate use.



Keyboard Shortcuts

Predefined shortcuts for efficiency (editable in manifest.json):
Ctrl+Shift+C: Copy Clean Text
Ctrl+Shift+S: Copy Slug
Ctrl+Shift+I: Copy Image Name
Ctrl+Shift+A: Copy Alt Text
Ctrl+Shift+P: Copy Page URL


Customization:
To modify shortcuts, edit the commands object in manifest.json, save changes, and reload the extension via chrome://extensions/.



Settings

Currently, menu item toggles are managed via chrome.storage.sync. An options page for runtime configuration is planned for future releases to enhance user control.

Project Structure

background.js: The backbone of the extension, handling context menu logic, keyboard shortcuts, and clipboard operations (over 600 lines with detailed comments).
content.js: Manages DOM events (e.g., right-click tracking) and employs MutationObserver to detect dynamically loaded content like sliders.
manifest.json: Defines extension metadata, permissions, background scripts, content scripts, and commands.

Contributing
We enthusiastically welcome contributions to make CopyPro Toolkit even better! Here's a step-by-step guide to contribute:

Fork the Repository:

Click the "Fork" button on the GitHub page to create your own copy of the repository.


Clone Your Fork:

Clone your forked repository to your local machine:git clone https://github.com/your-username/copypro-toolkit.git


Navigate to the project directory:cd copypro-toolkit




Create a Feature Branch:

Start a new branch for your changes:git checkout -b feature/your-feature-name


Example: git checkout -b feature/add-options-page


Make and Test Changes:

Edit the relevant files (e.g., background.js, content.js).
Test thoroughly across different webpages to ensure compatibility.
Use Chrome DevTools to debug and validate functionality.


Commit Your Changes:

Stage your modifications:git add .


Commit with a clear message:git commit -m "Added feature: [description of your change]"


Push to your fork:git push origin feature/your-feature-name




Submit a Pull Request:

Go to the original repository on GitHub.
Click "New Pull Request," select your branch, and submit a detailed description of your changes.
Await review and feedback from the maintainers.



Contribution Guidelines

Adhere to the existing code style (e.g., verbose comments, consistent error handling).
Include unit tests or manual test cases if applicable.
Update the README.md with new features or changes.
Ensure cross-browser compatibility (primarily Chrome).

Troubleshooting

Problem: Context menu options are missing.
Solution: Confirm "Developer mode" is enabled and the extension is loaded. Check the console for errors (e.g., permission issues).


Problem: Images are not detected.
Solution: Verify the DOM structure matches .single-wrapper, .image-wrapper, or .elementor-widget-container. Report the specific HTML via a GitHub Issue with a screenshot or code snippet.


Problem: Clipboard operations fail.
Solution: Ensure the webpage allows clipboard access. Test in a new tab or incognito mode. Check console for Clipboard API errors.



License
CopyPro Toolkit is released under the MIT License. You are free to use, modify, distribute, and build upon this software, provided you include the original credits to Vaibhav and Exiverlabs in all copies or substantial portions of the software.
Acknowledgments

Grok 3 by xAI: Provided cutting-edge AI assistance in developing and refining the codebase.
Chrome Extensions Community: Offered valuable resources, forums, and best practices.
Exiverlabs Team: Supplied the infrastructure and support to bring this project to life.

Future Enhancements

Options Page: Add a UI for runtime settings (e.g., enabling/disabling menu items).
Advanced Metadata: Support additional image metadata (e.g., dimensions, captions).
Custom Selectors: Allow users to define custom CSS selectors for image detection.
Cross-Browser Support: Extend compatibility to Firefox and Edge.

Contact

GitHub Issues: Report bugs or suggest features at Issues Page.
Email: [vaibhav@exiverlabs.co.in]
