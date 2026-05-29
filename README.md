# 🧠 LeetCode AI Companion & Co-Pilot

> A premium, zero-friction local browser companion that injects a gorgeous, interactive AI Sidepanel directly into the LeetCode website itself. 

Minimize your terminal and stay focused on your browser. This tool runs silently in the background, rendering a stunning glassmorphic AI Companion sidebar directly inside LeetCode so you can autosolve challenges or get guided hints in real-time as you code!

---

## ✨ Features

- **📺 100% In-Browser Interaction**: Once launched, the terminal is completely minimized. You control the AI, read hints, and inject code directly inside LeetCode via our custom floating companion widget.
- **🧠 Interactive AI Co-Pilot (Mentor Mode)**: Stuck on a problem? Toggle the **Mentor Tab** and click *Analyze My Code*. The AI reads your current LeetCode editor, reviews your logic, identifies bugs, and prints step-by-step guidance and hints on your screen—**without spoiling the final solution**.
- **🚀 One-Click Autosolver**: Short on time? Click *Autosolve & Paste*. Gemini 3.5 will immediately analyze the problem, craft the optimal space-time complexity solution, and write it directly into LeetCode's Monaco Editor in milliseconds.
- **🧬 Isolated Shadow DOM Injector**: The entire UI companion is mounted inside an isolated Shadow Root. This guarantees that our styling will **never** conflict with LeetCode's UI, and LeetCode's internal style modifications will never break our widget.
- **💾 Persistent Sessions**: Launches your browser using a persistent Chrome profile. **Log in once**, and you remain logged in for every subsequent session.
- **🔒 100% Secure & Local**: All credentials, LeetCode session cookies, and API keys are stored locally on your PC. No data is ever transmitted to third-party tracking services.

---

## 🧭 System Architecture

The companion combines a high-speed local Node.js process with headless browser control, binding secure background API tunnels straight into LeetCode's execution thread:

```mermaid
sequenceDiagram
    participant User as Browser Screen
    participant Sidebar as AI Companion Sidebar (Shadow DOM)
    participant Bridge as Playwright Bridge (Exposed Node Context)
    participant GraphQL as LeetCode GraphQL API
    participant Gemini as Gemini 3.5 API (Local Key)

    User->>Sidebar: Click "🧠 Analyze My Code"
    Sidebar->>Bridge: bridgeCallGemini("guide", activeCode, activeSlug, activeLang)
    Bridge->>GraphQL: Query problem details, stubs & constraints
    GraphQL-->>Bridge: Return clean structured metadata
    Bridge->>Gemini: Request pedagogical hints (no code spoilers)
    Gemini-->>Bridge: Return constructive bug analysis & next steps
    Bridge-->>Sidebar: Return formatted results
    Sidebar->>User: Render gorgeous glassmorphic review on LeetCode screen
```

---

## 🚀 Installation & Launch

### Prerequisites
- Make sure you have [**Node.js (v18+)**](https://nodejs.org/) installed on your machine.
- Get a free Gemini API Key from **[Google AI Studio](https://aistudio.google.com/)**.

### Step 1: Install Dependencies
Open your terminal in the repository folder and run:
```bash
npm install
```

### Step 2: Configure your Gemini API Key
Create a `.env` file in the root folder (or edit the existing template) and paste your Gemini Key:
```env
GEMINI_API_KEY=AIzaSyBic7E224vK8efI-U87aq8KthY_-nd-DpI
```

### Step 3: Start the Companion!
Launch the browser bridge by executing:
```bash
npm start
```

---

## 🎮 How to Use It

1. **Log in to LeetCode**: When the browser window launches, log into your LeetCode account.
2. **Navigate to any Problem**: Go to any problem (e.g. `https://leetcode.com/problems/two-sum/`).
3. **Open the Sidepanel**:
   - You will see a glowing, pulsing deep-purple circular button floating in the bottom-right corner of LeetCode.
   - Click it to slide in the gorgeous glassmorphic AI Sidepanel.
4. **🧠 Use Co-Pilot Mentor**:
   - Write some partial or buggy code in the LeetCode editor.
   - Click **Analyze My Code & Get Hint**.
   - Review the detailed feedback detailing your bugs, approach checks, and next steps right on the screen.
5. **🚀 Use Autosolve**:
   - Go to the **Autosolve** tab in the sidebar.
   - Click **Autosolve & Paste Code** to instantly inject the optimized solution straight into your editor!

---

## 📁 Project Structure

- `solve.js`: The backend automation manager and Playwright context orchestrator.
- `package.json`: Manages scripts and Node packages (`playwright`, `@google/generative-ai`, `dotenv`).
- `.env`: Stores your local credentials safely.
- `user_data/`: Local folder storing your browser persistent cache, cookies, and login session.

---

*Enjoy a premium, hands-free LeetCode learning companion. Happy coding! 🚀*
