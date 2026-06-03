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
            'vcodeWelcome',
            'Welcome to VCode',
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
                    vscode.commands.executeCommand('vcode.applyTheme');
                    break;
                case 'configureApiKey':
                    vscode.commands.executeCommand('vcode.configureApiKey');
                    break;
                case 'openChat':
                    vscode.commands.executeCommand('workbench.view.extension.vcode-sidebar');
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
    <title>Welcome to VCode</title>
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
                <img src="${iconUri}" class="logo" alt="VCode Logo" />
                <h1 class="title">VCode</h1>
                <p class="subtitle">Personalized Workspace by Varshan</p>
                <div class="divider"></div>
            </header>

            <main class="grid">
                <!-- Theme Card -->
                <div class="card card-theme">
                    <div class="card-icon">🖤</div>
                    <h2>Carbon Slate Theme</h2>
                    <p>Activate the premium, high-contrast matte dark theme crafted with tailored slate tokens.</p>
                    <button class="btn btn-primary" id="btn-theme">Apply Theme</button>
                </div>

                <!-- AI Sidebar Card -->
                <div class="card card-ai">
                    <div class="card-icon">🤖</div>
                    <h2>Gemini Assistant</h2>
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
                <p>Use the Command Palette (<span>Ctrl+Shift+P</span>) and search for "VCode" to open this page at any time.</p>
            </footer>
        </div>
    </div>

    <script src="${jsUri}"></script>
</body>
</html>`;
    }
}

module.exports = WelcomeProvider;
