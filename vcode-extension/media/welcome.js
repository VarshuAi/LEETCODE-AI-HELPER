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
