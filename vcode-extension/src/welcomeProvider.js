const vscode = require('vscode');
const path = require('path');

class WelcomeProvider {
    /**
     * @param {vscode.ExtensionContext} context
     */
    constructor(context) {
        this.context = context;
        this.panel = null;
    }

    show() {
        // If panel already exists, bring it to front
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create a new webview panel
        this.panel = vscode.window.createWebviewPanel(
            'antigravityWelcome',
            'Welcome to Antigravity IDE',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
                ]
            }
        );

        // Set HTML content
        this.panel.webview.html = this.getHtmlContent();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'applyTheme':
                    vscode.commands.executeCommand('antigravity.applyTheme');
                    break;
                case 'applyMacTheme':
                    vscode.commands.executeCommand('antigravity.applyMacTheme');
                    break;
                case 'configureApiKey':
                    vscode.commands.executeCommand('antigravity.configureApiKey');
                    break;
                case 'openChat':
                    vscode.commands.executeCommand('workbench.view.extension.antigravity-sidebar');
                    break;
            }
        });

        // Clean up on close
        this.panel.onDidDispose(() => {
            this.panel = null;
        });
    }

    getHtmlContent() {
        const webview = this.panel.webview;
        
        // URIs for styles and scripts
        const cssUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'welcome.css')
        ));
        const jsUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'welcome.js')
        ));
        const iconUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'vcode-icon.svg')
        ));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Antigravity IDE</title>
    <link rel="stylesheet" href="${cssUri}">
</head>
<body>
    <div class="background-decor">
        <div class="glow-sphere sphere-1"></div>
        <div class="glow-sphere sphere-2"></div>
    </div>
    
    <div class="container">
        <div class="welcome-card">
            <header class="welcome-header">
                <img src="${iconUri}" class="logo" alt="Antigravity IDE Logo" />
                <h1 class="title">Antigravity IDE</h1>
                <p class="subtitle">Personalized Workspace for Varshan</p>
                <div class="divider"></div>
            </header>

            <main class="grid">
                <!-- Theme Card -->
                <div class="card card-theme">
                    <div class="card-icon">🖤</div>
                    <h2>Workspace Themes</h2>
                    <p>Apply either the premium Carbon Slate theme, or the macOS Dark style theme with one click.</p>
                    <button class="btn btn-primary" id="btn-theme" style="margin-bottom: 8px;">Carbon Slate Theme</button>
                    <button class="btn btn-secondary" id="btn-mac-theme">macOS Dark Theme</button>
                </div>

                <!-- AI Sidebar Card -->
                <div class="card card-ai">
                    <div class="card-icon">👾</div>
                    <h2>Antigravity AI</h2>
                    <p>Directly chat with Google's Gemini models in your sidebar for instant explanations and coding co-piloting.</p>
                    <button class="btn btn-secondary" id="btn-chat">Open Chat Sidebar</button>
                </div>

                <!-- API Key Card -->
                <div class="card card-settings">
                    <div class="card-icon">🔑</div>
                    <h2>Gemini API Key</h2>
                    <p>Enter your Google Gemini API key to activate the intelligent chat assistant features.</p>
                    <button class="btn btn-secondary" id="btn-api">Configure API Key</button>
                </div>
            </main>

            <footer class="welcome-footer">
                <p>Use the Command Palette (<span>Ctrl+Shift+P</span>) and search for "Antigravity" to open this page at any time.</p>
            </footer>
        </div>
    </div>

    <script src="${jsUri}"></script>
</body>
</html>`;
    }
}

module.exports = WelcomeProvider;
