// Initializing popup settings
document.addEventListener("DOMContentLoaded", () => {
  const toggles = [
    { id: "enable-slug", key: 'enableSlug' },
    { id: "enable-clean-text", key: 'enableCleanText' },
    { id: "enable-image-name", key: 'enableImageName' },
    { id: "enable-alt-text", key: 'enableAltText' },
    { id: "enable-page", key: 'enablePage' },
    { id: "enable-label", key: 'enableLabel' },
    { id: "enable-selector", key: 'enableSelector' },
    { id: "enable-seo", key: 'enableSeo' },
    { id: "prefer-markdown", key: 'preferMarkdown' }
  ];

  // Tab Switching
  const tabs = document.querySelectorAll('.m3-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${target}-tab`).classList.add('active');
    });
  });

  // Load saved settings
  const keys = toggles.map(t => t.key);
  chrome.storage.sync.get(keys, (settings) => {
    toggles.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) el.checked = settings[t.key] !== false;
    });
  });

  // Bind events
  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) {
      el.addEventListener("change", () => {
        const update = {};
        update[t.key] = el.checked;
        chrome.storage.sync.set(update, () => {
          chrome.runtime.sendMessage({ action: 'updateContextMenus' });
        });
      });
    }
  });

  // History logic
  const historyList = document.getElementById("history-list");
  const clearButton = document.getElementById("clear-history");

  function renderHistory() {
    chrome.storage.local.get(['copyHistory'], (result) => {
      const history = result.copyHistory || [];
      if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No recent copies</div>';
        return;
      }

      historyList.innerHTML = history.map(item => {
        const sourceDomain = item.sourceUrl ? new URL(item.sourceUrl).hostname : '';
        const displaySource = item.sourceTitle || sourceDomain || 'Unknown Source';

        return `
        <div class="history-card">
          <div class="card-header">
            <span class="item-badge">${item.type}</span>
            <span class="item-time">${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div class="card-content" title="${item.value}">${item.value}</div>
          <div class="card-footer">
            ${item.sourceUrl ? `
              <a href="${item.sourceUrl}" target="_blank" class="source-link" title="${item.sourceUrl}">
                ${displaySource}
              </a>
            ` : '<span></span>'}
            <div class="card-actions">
              <button class="icon-button copy-btn" data-value="${encodeURIComponent(item.value)}" title="Copy again">
                <span class="material-symbols-outlined">content_copy</span>
              </button>
              <button class="icon-button delete-btn" data-id="${item.id}" title="Delete">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
      `}).join('');

      // Add Actions
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const val = decodeURIComponent(btn.getAttribute('data-value'));
          navigator.clipboard.writeText(val).then(() => {
            const icon = btn.querySelector('.material-symbols-outlined');
            icon.innerText = "check";
            setTimeout(() => icon.innerText = "content_copy", 1000);
          });
        });
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          deleteHistoryItem(id);
        });
      });
    });
  }

  function deleteHistoryItem(id) {
    chrome.storage.local.get(['copyHistory'], (result) => {
      const history = result.copyHistory || [];
      const updated = history.filter(item => String(item.id) !== String(id));
      chrome.storage.local.set({ copyHistory: updated }, renderHistory);
    });
  }

  clearButton.addEventListener("click", () => {
    if (confirm("Clear all history?")) {
      chrome.storage.local.set({ copyHistory: [] }, renderHistory);
    }
  });

  renderHistory();
  // Listen for background updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.copyHistory) renderHistory();
  });
});