// content-isolated.js - Renders UI and interacts with background script

if (!window.aiCompanionInterval) {
  window.aiCompanionInterval = setInterval(() => {
    // Check if extension context is still valid
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        clearInterval(window.aiCompanionInterval);
        window.aiCompanionInterval = null;
        const existing = document.querySelector('ai-companion-widget');
        if (existing) existing.remove();
        return;
      }
    } catch (e) {
      clearInterval(window.aiCompanionInterval);
      window.aiCompanionInterval = null;
      const existing = document.querySelector('ai-companion-widget');
      if (existing) existing.remove();
      return;
    }

    const isProblemPage = window.location.pathname.includes('/problems/');
    if (!isProblemPage) {
      const existing = document.querySelector('ai-companion-widget');
      if (existing) existing.remove();
      return;
    }

    if (!document.body) return;
    if (document.querySelector('ai-companion-widget')) return;

    initializeWidget();
  }, 1000);
}

function initializeWidget() {
  const widget = document.createElement('ai-companion-widget');
  document.body.appendChild(widget);

  const shadow = widget.attachShadow({ mode: 'open' });

  // Injected CSS for smooth light and dark glassmorphic styling
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* Floating Bubble Button */
    .floating-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #3b82f6; /* Modern Smooth Blue */
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
    }
    .floating-trigger:hover {
      transform: scale(1.08) translateY(-2px);
      background: #2563eb;
      box-shadow: 0 6px 24px rgba(37, 99, 235, 0.5);
    }
    .floating-trigger svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    /* Core Sliding Panel */
    .sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 360px;
      height: 100vh;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      z-index: 2147483646;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--border-color);
      background: var(--bg-color);
      color: var(--text-color);
    }
    .sidebar.open {
      transform: translateX(0);
    }

    /* Theme definitions */
    .sidebar.dark {
      --bg-color: #0f172a; /* Slate Dark */
      --text-color: #f8fafc;
      --text-muted: #94a3b8;
      --border-color: rgba(255, 255, 255, 0.08);
      --card-bg: #1e293b;
      --card-border: rgba(255, 255, 255, 0.04);
      --tab-inactive: #475569;
      --loader-bg: rgba(255, 255, 255, 0.02);
    }
    .sidebar.light {
      --bg-color: #f8fafc; /* Smooth Off-White */
      --text-color: #0f172a;
      --text-muted: #475569;
      --border-color: rgba(15, 23, 42, 0.08);
      --card-bg: #ffffff;
      --card-border: rgba(15, 23, 42, 0.04);
      --tab-inactive: #94a3b8;
      --loader-bg: rgba(15, 23, 42, 0.02);
    }

    /* Header Panel */
    .header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #3b82f6;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .action-icon {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .action-icon:hover {
      color: var(--text-color);
      background: var(--card-bg);
    }

    /* Tabs Panel */
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      background: rgba(0, 0, 0, 0.02);
    }
    .tab {
      flex: 1;
      padding: 14px;
      background: none;
      border: none;
      color: var(--tab-inactive);
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
      text-align: center;
      border-bottom: 2px solid transparent;
    }
    .tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .tab-panel {
      display: none;
      flex-direction: column;
      gap: 16px;
    }
    .tab-panel.active {
      display: flex;
    }

    /* Standard Card formatting */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 8px;
    }
    .card-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Button styles */
    .btn-action {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
    }
    .btn-action:hover {
      background: #2563eb;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .btn-action:active {
      transform: scale(0.98);
    }

    /* Loader */
    .loader {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 10px;
      gap: 12px;
      background: var(--loader-bg);
      border-radius: 12px;
      border: 1px dashed var(--border-color);
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--border-color);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loader-text {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: center;
    }

    /* Markdown/Hints Report styling */
    .report-card {
      font-size: 13px;
      color: var(--text-color);
      line-height: 1.6;
    }
    .report-card h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 700;
    }
    .report-card div {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .report-card strong {
      color: #3b82f6;
    }
    .report-card code {
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
      padding: 2px 6px;
      background: var(--loader-bg);
      border-radius: 4px;
      font-size: 12px;
    }
    .report-card pre {
      margin: 10px 0 0 0;
      padding: 12px;
      background: var(--loader-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow-x: auto;
    }
    .report-card pre code {
      padding: 0;
      background: none;
      font-size: 11px;
      color: var(--text-muted);
    }
    .empty-state {
      font-size: 12px;
      color: var(--text-muted);
      text-align: center;
      padding: 10px 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  shadow.appendChild(style);

  // Injected HTML template for trigger and sidebar panels
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="floating-trigger" id="ai-trigger">
      <svg viewBox="0 0 24 24">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18Z" />
      </svg>
    </div>
    
    <div class="sidebar dark" id="ai-sidebar">
      <div class="header">
        <div class="header-title">LeetCode AI Companion</div>
        <div class="header-actions">
          <button class="action-icon" id="theme-toggle" title="Toggle Theme">
            <svg style="width:16px;height:16px;" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12,18C11.11,18 10.26,17.8 9.5,17.45C11.56,16.5 13,14.42 13,12C13,9.58 11.56,7.5 9.5,6.55C10.26,6.2 11.11,6 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z" />
            </svg>
          </button>
          <button class="action-icon" id="ai-close" title="Close Panel">
            <svg style="width:16px;height:16px;" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="copilot">🧠 Mentor</button>
        <button class="tab" data-tab="autosolve">🚀 Autosolve</button>
      </div>

      <div class="content-area">
        <!-- Mentor Panel -->
        <div class="tab-panel active" id="panel-copilot">
          <div class="card">
            <div class="card-title">Pedagogical Hints Mode</div>
            <div class="card-desc">Gently evaluates your approach, identifies logic bugs, and guides you to the solution without spoiling code.</div>
          </div>
          <button class="btn-action" id="action-copilot">
            <span>Analyze My Code</span>
          </button>
          <div class="loader" id="loader-copilot">
            <div class="spinner"></div>
            <span class="loader-text">Analyzing logic patterns...</span>
          </div>
          <div class="report-card" id="report-copilot">
            <div class="empty-state">No analysis logged yet. Write some code in the editor and click "Analyze My Code".</div>
          </div>
        </div>

        <!-- Autosolve Panel -->
        <div class="tab-panel" id="panel-autosolve">
          <div class="card">
            <div class="card-title">Optimal Solution Mode</div>
            <div class="card-desc">Generates the space-time optimal solution for the current problem and writes it directly into your Monaco editor.</div>
          </div>
          <button class="btn-action" id="action-autosolve">
            <span>Autosolve & Paste Code</span>
          </button>
          <div class="loader" id="loader-autosolve">
            <div class="spinner"></div>
            <span class="loader-text">Gemini is solving the problem...</span>
          </div>
          <div class="report-card" id="report-autosolve">
            <div class="empty-state">Ready to solve! Click the button above to paste the optimized solution.</div>
          </div>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(container);

  // Selector cache
  const trigger = shadow.getElementById('ai-trigger');
  const sidebar = shadow.getElementById('ai-sidebar');
  const closeBtn = shadow.getElementById('ai-close');
  const themeBtn = shadow.getElementById('theme-toggle');

  // Load user default theme preference
  chrome.storage.local.get(['widget_theme'], (res) => {
    if (res.widget_theme === 'light') {
      sidebar.className = 'sidebar light';
    } else {
      sidebar.className = 'sidebar dark';
    }
  });

  // Toggle widget sidebar
  trigger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  // Theme switcher
  themeBtn.addEventListener('click', () => {
    const isDark = sidebar.classList.contains('dark');
    if (isDark) {
      sidebar.className = 'sidebar light';
      chrome.storage.local.set({ 'widget_theme': 'light' });
    } else {
      sidebar.className = 'sidebar dark';
      chrome.storage.local.set({ 'widget_theme': 'dark' });
    }
  });

  // Tab switching
  const tabs = shadow.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      shadow.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      shadow.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = shadow.getElementById(`panel-${tab.dataset.tab}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // State handles for async read messages from page context
  let pendingResolve = null;

  window.addEventListener('AI_EDITOR_DATA', (e) => {
    if (pendingResolve) {
      pendingResolve(e.detail);
      pendingResolve = null;
    }
  });

  // Requests code from MAIN world content script
  const requestEditorData = () => {
    return new Promise((resolve) => {
      pendingResolve = resolve;
      window.dispatchEvent(new CustomEvent('AI_READ_EDITOR'));
      // Fallback timeout in case context is busy
      setTimeout(() => {
        if (pendingResolve) {
          resolve({ code: "", language: "Python3" });
          pendingResolve = null;
        }
      }, 1000);
    });
  };

  // --- MENTOR BLOCK TRIGGER ---
  shadow.getElementById('action-copilot').addEventListener('click', async () => {
    // Check if extension context is valid
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        alert("The AI Companion extension context was invalidated (likely due to a reload or update). Please refresh this browser tab to restart the companion.");
        return;
      }
    } catch (e) {
      alert("The AI Companion extension context was invalidated (likely due to a reload or update). Please refresh this browser tab to restart the companion.");
      return;
    }

    const btn = shadow.getElementById('action-copilot');
    const loader = shadow.getElementById('loader-copilot');
    const report = shadow.getElementById('report-copilot');

    btn.style.display = 'none';
    loader.style.display = 'flex';
    report.innerHTML = '';

    try {
      const editorData = await requestEditorData();
      const slug = window.location.pathname.split('/')[2];

      chrome.runtime.sendMessage({
        action: 'guide',
        slug: slug,
        lang: editorData.language,
        currentCode: editorData.code
      }, (response) => {
        btn.style.display = 'flex';
        loader.style.display = 'none';

        if (response && response.success) {
          report.innerHTML = `
            <div class="card">
              <div class="card-title">🧠 Mentor Feedback</div>
              <div style="font-size: 12px; line-height: 1.5;">${response.data}</div>
            </div>
          `;
        } else {
          const errMsg = response ? response.error : 'Connection timeout to service worker.';
          report.innerHTML = `<div style="color: #ef4444; font-size: 12px;">${errMsg}</div>`;
        }
      });
    } catch (err) {
      btn.style.display = 'flex';
      loader.style.display = 'none';
      report.innerHTML = `<div style="color: #ef4444; font-size: 12px;">Error: ${err.message}</div>`;
    }
  });

  // --- AUTOSOLVE BLOCK TRIGGER ---
  shadow.getElementById('action-autosolve').addEventListener('click', async () => {
    // Check if extension context is valid
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        alert("The AI Companion extension context was invalidated (likely due to a reload or update). Please refresh this browser tab to restart the companion.");
        return;
      }
    } catch (e) {
      alert("The AI Companion extension context was invalidated (likely due to a reload or update). Please refresh this browser tab to restart the companion.");
      return;
    }

    const btn = shadow.getElementById('action-autosolve');
    const loader = shadow.getElementById('loader-autosolve');
    const report = shadow.getElementById('report-autosolve');

    btn.style.display = 'none';
    loader.style.display = 'flex';
    report.innerHTML = '';

    try {
      const editorData = await requestEditorData();
      const slug = window.location.pathname.split('/')[2];

      chrome.runtime.sendMessage({
        action: 'solve',
        slug: slug,
        lang: editorData.language
      }, (response) => {
        btn.style.display = 'flex';
        loader.style.display = 'none';

        if (response && response.success) {
          // Trigger MAIN world script to write to Monaco editor
          window.dispatchEvent(new CustomEvent('AI_INJECT_CODE', {
            detail: { code: response.data }
          }));

          const cleanCodeHtml = response.data
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          report.innerHTML = `
            <div class="card" style="border-color: rgba(16, 185, 129, 0.2);">
              <div class="card-title" style="color: #10b981;">✔ Autosolve Complete</div>
              <div style="font-size: 12px; margin-bottom: 8px;">Solution has been written directly to your Monaco editor.</div>
              <pre><code>${cleanCodeHtml}</code></pre>
            </div>
          `;
        } else {
          const errMsg = response ? response.error : 'Connection timeout to service worker.';
          report.innerHTML = `<div style="color: #ef4444; font-size: 12px;">${errMsg}</div>`;
        }
      });
    } catch (err) {
      btn.style.display = 'flex';
      loader.style.display = 'none';
      report.innerHTML = `<div style="color: #ef4444; font-size: 12px;">Error: ${err.message}</div>`;
    }
  });
}
