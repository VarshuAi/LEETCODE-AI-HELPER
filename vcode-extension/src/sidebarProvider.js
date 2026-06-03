const vscode = require('vscode');
const path = require('path');

class SidebarProvider {
    /**
     * @param {vscode.ExtensionContext} context
     */
    constructor(context) {
        this.context = context;
        this._view = null;
    }

    /**
     * @param {vscode.WebviewView} webviewView
     */
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'sendMessage':
                    await this._handleSendMessage(data.text, data.includeCode);
                    break;
                case 'configureApiKey':
                    vscode.commands.executeCommand('vcode.configureApiKey');
                    break;
                case 'insertCode':
                    this._insertCodeIntoEditor(data.code);
                    break;
                case 'getSelectedCode':
                    this._sendSelectedCodeToWebview();
                    break;
            }
        });

        // Whenever active editor selection changes, update the webview
        vscode.window.onDidChangeTextEditorSelection(() => {
            this._sendSelectedCodeToWebview();
        });
    }

    async _handleSendMessage(userPrompt, includeCode) {
        if (!this._view) return;

        const config = vscode.workspace.getConfiguration('vcode');
        const apiKey = config.get('geminiApiKey');
        const model = config.get('geminiModel') || 'gemini-3.5-flash';

        if (!apiKey) {
            this._view.webview.postMessage({
                command: 'receiveMessage',
                sender: 'ai',
                text: '⚠️ **Gemini API Key is missing!**\nPlease click the button below or use the command palette to configure your API key.',
                showApiKeyButton: true
            });
            return;
        }

        let fullPrompt = userPrompt;
        if (includeCode) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.document.getText(editor.selection);
                if (selection) {
                    fullPrompt += `\n\n[Context Code Selection]:\n\`\`\`\n${selection}\n\`\`\``;
                }
            }
        }

        try {
            // Call Gemini API
            const responseText = await this._callGeminiApi(apiKey, model, fullPrompt);
            this._view.webview.postMessage({
                command: 'receiveMessage',
                sender: 'ai',
                text: responseText
            });
        } catch (error) {
            this._view.webview.postMessage({
                command: 'receiveMessage',
                sender: 'ai',
                text: `❌ **Error calling Gemini API:**\n${error.message || error}`
            });
        }
    }

    async _callGeminiApi(apiKey, model, prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        // System instruction to ensure responses match VCode branding and style
        const systemInstruction = "You are VCode AI, a premium assistant built for Varshan. Be concise, highly professional, and provide clear code snippets. If providing code modifications, format them with markdown blocks.";

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: `${systemInstruction}\n\nUser request: ${prompt}` }
                    ]
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData?.error?.message || `HTTP error! status: ${response.status}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";
    }

    _insertCodeIntoEditor(code) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit(editBuilder => {
                const selection = editor.selection;
                if (!selection.isEmpty) {
                    editBuilder.replace(selection, code);
                } else {
                    editBuilder.insert(editor.selection.active, code);
                }
            });
        } else {
            vscode.window.showInformationMessage("Please open a text file first to insert code.");
        }
    }

    _sendSelectedCodeToWebview() {
        if (!this._view) return;
        const editor = vscode.window.activeTextEditor;
        let selectedText = "";
        if (editor) {
            selectedText = editor.document.getText(editor.selection);
        }
        this._view.webview.postMessage({
            command: 'updateSelection',
            hasSelection: selectedText.length > 0,
            selectionText: selectedText
        });
    }

    _getHtmlForWebview(webview) {
        const cssUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'chat.css')
        ));
        const jsUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'chat.js')
        ));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VCode Gemini AI</title>
    <link rel="stylesheet" href="${cssUri}">
</head>
<body>
    <div class="chat-container">
        <!-- Messages Area -->
        <div class="chat-messages" id="messages-list">
            <div class="message message-ai">
                <div class="avatar">🤖</div>
                <div class="msg-bubble">
                    Hello Varshan! I am your <strong>VCode Gemini AI</strong> assistant. How can I help you program today?
                </div>
            </div>
        </div>

        <!-- Selected Code indicator -->
        <div class="selection-indicator hidden" id="selection-bar">
            <div class="selection-title">Selected code included:</div>
            <pre class="selection-preview" id="selection-preview-box"></pre>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
            <div class="checkbox-row">
                <label class="checkbox-container">
                    <input type="checkbox" id="chk-include-code" checked>
                    <span class="checkmark"></span>
                    Reference selected code
                </label>
            </div>
            <div class="input-row">
                <textarea id="txt-prompt" placeholder="Ask Gemini... (Ctrl+Enter to send)"></textarea>
                <button class="send-btn" id="btn-send">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <script src="${jsUri}"></script>
</body>
</html>`;
    }
}

module.exports = SidebarProvider;
