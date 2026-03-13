import { getSettings } from './main.js';
import { copyCleanText } from '../features/text.js';
import { copySlugFromFocused } from '../features/slug.js';
import { copyPage } from '../features/page.js';

export function initializeCommands() {
  chrome.commands.onCommand.addListener(async (command, tab) => {
    if (!tab || !tab.id) return;

    // Ignore restricted sites
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

    // Use synchronous settings to preserve user gesture
    const settings = getSettings();
    const preferMd = settings.preferMarkdown === true;

    let func = null;
    let args = [];

    switch (command) {
      case "copy-clean-text":
        func = copyCleanText;
        args = [preferMd];
        break;
      case "copy-slug":
        func = copySlugFromFocused;
        break;
      case "copy-page":
        func = copyPage;
        break;
      case "copy-alt-text":
        chrome.tabs.sendMessage(tab.id, { action: 'copy-alt-text' });
        return;
      case "copy-page":
        func = copyPage;
        break;
    }

    if (func) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: func,
          args: args
        });
      } catch (err) {
        console.error("Keyboard Shortcut Error:", err);
      }
    }
  });
}
