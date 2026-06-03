# 🖤 VCode Companion

> Welcome to **VCode** (Varshan Code), a premium workspace enhancement bundle developed by **Varshan** for Visual Studio Code!

This all-in-one extension completely transforms your editor into a high-end development environment with a customized Slate-Carbon Dark Theme, a custom welcoming splash experience, and a built-in sidebar Gemini AI chat assistant.

---

## ✨ Features

### 1. 🖤 VCode Carbon Slate Dark Theme
*   A custom theme styled around elegant graphite and deep carbon HSL layers.
*   High-contrast syntax highlighting custom-tuned with soft indigo/lavender tones for long coding sessions.

### 🚀 2. Brand Welcome Page
*   An elegant, interactive welcome tab that opens automatically on first start.
*   Includes quick actions to instantly apply the color theme, configure settings, or open the sidebar.

### 🤖 3. Built-in Gemini AI Chat Sidebar
*   Integrated Gemini assistant accessible directly from your VS Code activity bar.
*   Fully context-aware: option to automatically attach currently selected code into prompts.
*   Includes code insertion actions: with one click, inject generated code right into your active editor.

---

## 🛠️ Getting Started (Local Development & Testing)

To load and run the extension locally in VS Code:

1.  Open VS Code and choose **File** -> **Open Folder...** -> select `C:\Users\Varshan\Documents\antigravity\magical-hypatia\vcode-extension`.
2.  Press **`F5`** on your keyboard (or click `Run` -> `Start Debugging` in the menu).
3.  A new window labeled **`[Extension Development Host]`** will open.
4.  In the new host window:
    - Change your theme to `VCode Carbon Slate` (it may apply automatically, or press `Ctrl+K Ctrl+T` and select it).
    - Open the Command Palette (`Ctrl+Shift+P`), search for `VCode: Configure Gemini API Key`, and input your key.
    - Click the custom **VCode Logo** in the left sidebar activity bar to begin chatting with Gemini!

---

## 📦 File Structure

```
C:\Users\Varshan\Documents\antigravity\magical-hypatia\vcode-extension\
├── package.json                    # Extension manifest and settings configuration
├── README.md                       # Instruction guide
├── themes/
│   └── vcode-carbon-slate.json     # Custom VS Code carbon-slate color theme
├── media/
│   ├── chat.css                    # UI styles for the Gemini chat webview
│   ├── chat.js                     # UI interactivity for the Gemini chat webview
│   ├── welcome.css                 # Custom welcome page styling
│   ├── welcome.js                  # Welcome page scripts/interactivity
│   └── vcode-icon.svg              # Custom VCode sidebar icon
└── src/
    ├── extension.js                # Extension entry point, registers commands and views
    ├── sidebarProvider.js          # Webview provider logic for the Gemini Sidebar
    └── welcomeProvider.js          # Webview provider logic for the custom Welcome Screen
```
