(function () {
    const vscode = acquireVsCodeApi();

    const messagesList = document.getElementById('messages-list');
    const txtPrompt = document.getElementById('txt-prompt');
    const btnSend = document.getElementById('btn-send');
    const chkIncludeCode = document.getElementById('chk-include-code');
    const selectionBar = document.getElementById('selection-bar');
    const selectionPreview = document.getElementById('selection-preview-box');

    let currentSelection = '';

    // Handle messages sent from the extension backend
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'receiveMessage':
                removeLoadingIndicator();
                addMessage(message.sender, message.text, message.showApiKeyButton);
                break;
            case 'updateSelection':
                if (message.hasSelection) {
                    currentSelection = message.selectionText;
                    selectionPreview.textContent = currentSelection;
                    selectionBar.classList.remove('hidden');
                } else {
                    currentSelection = '';
                    selectionBar.classList.add('hidden');
                }
                break;
        }
    });

    // Send prompt handler
    function sendPrompt() {
        const text = txtPrompt.value.trim();
        if (!text) return;

        // Add user message to UI
        addMessage('user', text);

        // Clear input and reset heights
        txtPrompt.value = '';
        txtPrompt.style.height = '24px';

        // Add loading state
        addLoadingIndicator();

        // Send to backend
        vscode.postMessage({
            command: 'sendMessage',
            text: text,
            includeCode: chkIncludeCode.checked
        });
    }

    // Auto-grow input text area
    txtPrompt.addEventListener('input', () => {
        txtPrompt.style.height = 'auto';
        txtPrompt.style.height = (txtPrompt.scrollHeight - 4) + 'px';
    });

    // Enter key binds
    txtPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrompt();
        }
    });

    btnSend.addEventListener('click', sendPrompt);

    // Dynamic message bubble creator
    function addMessage(sender, text, showApiKeyButton = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${sender}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.textContent = sender === 'user' ? '👤' : '👾';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'msg-bubble';
        
        // Parse and style markdown blocks (especially code)
        bubbleDiv.innerHTML = formatMarkdown(text);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);
        messagesList.appendChild(messageDiv);

        // Add API configure button if requested
        if (showApiKeyButton) {
            const btn = document.createElement('button');
            btn.className = 'btn-inline';
            btn.textContent = 'Configure API Key';
            btn.addEventListener('click', () => {
                vscode.postMessage({ command: 'configureApiKey' });
            });
            bubbleDiv.appendChild(btn);
        }

        // Attach action handlers for injected code blocks
        bubbleDiv.querySelectorAll('.code-block-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-code');
                vscode.postMessage({
                    command: 'insertCode',
                    code: decodeURIComponent(code)
                });
            });
        });

        // Auto-scroll
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Thinking indicator
    function addLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message message-ai';
        loadingDiv.id = 'loading-bubble';

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.textContent = '👾';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'msg-bubble';
        bubbleDiv.innerHTML = `
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;

        loadingDiv.appendChild(avatarDiv);
        loadingDiv.appendChild(bubbleDiv);
        messagesList.appendChild(loadingDiv);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function removeLoadingIndicator() {
        const loadingDiv = document.getElementById('loading-bubble');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // A lightweight markdown formatter to render markdown natively in VSCode Webviews
    function formatMarkdown(text) {
        // Safe HTML escape
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Code blocks: ```javascript [code] ```
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        html = html.replace(codeBlockRegex, (match, lang, code) => {
            const trimmedCode = code.trim();
            const encodedCode = encodeURIComponent(trimmedCode);
            return `
                <div class="code-block-container">
                    <div class="code-block-header">
                        <span>${lang || 'code'}</span>
                        <button class="code-block-action" data-code="${encodedCode}">Insert Code</button>
                    </div>
                    <pre><code>${trimmedCode}</code></pre>
                </div>
            `;
        });

        // Inline code blocks: `code`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold formatting: **bold**
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Linebreaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // Request active selection on boot
    vscode.postMessage({ command: 'getSelectedCode' });
}());
