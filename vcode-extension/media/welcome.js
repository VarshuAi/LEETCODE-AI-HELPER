(function () {
    const vscode = acquireVsCodeApi();

    const themeBtn = document.getElementById('btn-theme');
    const chatBtn = document.getElementById('btn-chat');
    const apiBtn = document.getElementById('btn-api');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'applyTheme' });
        });
    }

    const macThemeBtn = document.getElementById('btn-mac-theme');
    if (macThemeBtn) {
        macThemeBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'applyMacTheme' });
        });
    }

    if (chatBtn) {
        chatBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'openChat' });
        });
    }

    if (apiBtn) {
        apiBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'configureApiKey' });
        });
    }
}());
