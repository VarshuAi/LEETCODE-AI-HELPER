require('dotenv').config();
const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ANSI Escape Codes for stunning terminal aesthetics
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GRAY = '\x1b[90m';

function printHeader() {
  console.clear();
  console.log(`${MAGENTA}${BOLD}====================================================${RESET}`);
  console.log(`${MAGENTA}${BOLD}      UNIVERSAL AI STUDY COMPANION (YT & PW)        ${RESET}`);
  console.log(`${MAGENTA}${BOLD}====================================================${RESET}`);
  console.log(`${GRAY}Status: Active Multimodal Lecture Monitoring Service${RESET}`);
  console.log(`${GRAY}Workspace: ${path.basename(process.cwd())}${RESET}`);
  console.log(`${MAGENTA}${BOLD}====================================================${RESET}\n`);
}

// Scan Windows filesystem for installed real browsers
function scanBrowsers() {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Local');
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidates = [
    {
      name: "Google Chrome",
      paths: [
        path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
      ]
    },
    {
      name: "Microsoft Edge",
      paths: [
        path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      ]
    },
    {
      name: "Brave Browser",
      paths: [
        path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
        path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
      ]
    }
  ];

  const found = [];
  for (const item of candidates) {
    for (const p of item.paths) {
      if (fs.existsSync(p)) {
        found.push({ name: item.name, path: p });
        break; // grab the first found path
      }
    }
  }
  return found;
}

// Prompt helper
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

// Browser selection interface
async function selectBrowser() {
  const browsers = scanBrowsers();
  console.log(`${CYAN}${BOLD}====================================================${RESET}`);
  console.log(`${CYAN}${BOLD}          SELECT YOUR PREFERRED BROWSER             ${RESET}`);
  console.log(`${CYAN}${BOLD}====================================================${RESET}`);
  console.log(`We detected the following installed browsers on your PC:\n`);
  
  let index = 1;
  const menuOptions = [];
  
  for (const b of browsers) {
    console.log(` [${index}] ${BOLD}${b.name}${RESET}  ${GRAY}(Real Daily-Use Browser)${RESET}`);
    menuOptions.push(b);
    index++;
  }
  
  console.log(` [${index}] ${BOLD}Standard Playwright Chromium${RESET} ${GRAY}(Isolated Sandbox)${RESET}`);
  console.log(`${CYAN}----------------------------------------------------${RESET}`);
  
  const choice = await askQuestion(`${CYAN}Enter your browser choice (1-${index}): ${RESET}`);
  const choiceNum = parseInt(choice, 10);
  
  if (choiceNum >= 1 && choiceNum <= browsers.length) {
    const selected = browsers[choiceNum - 1];
    console.log(`\n${GREEN}✔ Loading your real browser binary: ${selected.name}${RESET}\n`);
    return selected.path;
  }
  
  console.log(`\n${GREEN}✔ Loading default Playwright Chromium.${RESET}\n`);
  return null; // default
}

async function main() {
  printHeader();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.error(`${RED}Error: GEMINI_API_KEY is not configured in the .env file.${RESET}`);
    process.exit(1);
  }

  // Setup Gemini
  const ai = new GoogleGenerativeAI(apiKey);

  // Let the user pick which browser they want to open!
  const browserPath = await selectBrowser();

  printHeader();
  console.log(`${CYAN}Launching browser context...${RESET}`);
  console.log(`${GRAY}Persistent session: ./user_data (login is saved)${RESET}\n`);

  const userDataDir = path.join(__dirname, 'user_data');
  const contextOptions = {
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    permissions: ['clipboard-read', 'clipboard-write']
  };

  // If a real browser was selected, feed its path into Playwright
  if (browserPath) {
    contextOptions.executablePath = browserPath;
  }

  const context = await chromium.launchPersistentContext(userDataDir, contextOptions);
  const page = await context.newPage();

  // Expose backend functions to the browser page context
  await context.exposeFunction('bridgeExplainFrame', async (subject, lectureTitle, customNotes) => {
    try {
      console.log(`\n${CYAN}----------------------------------------------------${RESET}`);
      console.log(`${MAGENTA}${BOLD}[Multimodal Capture]${RESET} Video slide capture triggered!${RESET}`);
      console.log(`${GRAY}Subject: ${subject} | Lecture: ${lectureTitle}${RESET}`);

      // 1. Locate active video element on the browser tab
      const pages = context.pages();
      // Find the page currently playing video (youtube or pw.live)
      const activePage = pages.find(p => p.url().includes('youtube.com') || p.url().includes('pw.live') || p.url().includes('physicswallah')) || page;
      
      const videoLocator = activePage.locator('video').first();
      await videoLocator.waitFor({ state: 'attached', timeout: 5000 });

      // 2. Take a high-resolution snapshot of the video player element
      console.log(`${CYAN}Capturing active video player frame...${RESET}`);
      const screenshotBuffer = await videoLocator.screenshot({ type: 'jpeg', quality: 90 });
      const base64Image = screenshotBuffer.toString('base64');

      // 3. Prepare Multimodal payload for Gemini 3.5
      console.log(`${MAGENTA}${BOLD}[Gemini Vision]${RESET} Decoding slide contents & whiteboard math...`);
      
      const systemPrompt = `
      You are an elite, supportive, and world-class academic tutor and personal study mentor.
      Your task is to analyze the screenshot taken from a lecture video frame (which could be YouTube or Physics Wallah).
      The student has provided the following details:
      - Subject: ${subject}
      - Lecture Title: ${lectureTitle}
      - Student's custom query/context: ${customNotes || 'None'}

      INSTRUCTIONS:
      1. Carefully scan the image for any slide text, whiteboard handwriting, mathematical equations, code blocks, or diagrams.
      2. Perform OCR (optical character recognition) to transcribe any visible formulas, equations, or code.
      3. Explain the core concepts, theories, or processes shown in the frame in a clear, educational, and easy-to-understand manner.
      4. Format your output beautifully using clean sections:
         - 📸 **Transcribed Contents**: Write down all text, mathematical formulas (use clean readable formats), or code blocks visible on the screen.
         - 🧠 **Concept Breakdown**: Explain what the slide/lecture segment is about. Break down the theories simply.
         - 📝 **Key Takeaways & Formulas**: Bullet list of essential formulas, definitions, or steps to memorize.
      `;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      };

      // Call Gemini 3.5 Flash Model
      const model = ai.getGenerativeModel({ model: "gemini-3.5-flash" });
      const result = await model.generateContent([systemPrompt, imagePart]);
      const response = await result.response;
      const explanation = response.text().trim();

      console.log(`${GREEN}✔ Success! Gemini compiled rich lecture notes.${RESET}`);

      // 4. Save the note locally in our study vault!
      const notesDir = path.join(__dirname, 'notes', subject.replace(/[^a-zA-Z0-9]/g, '_'));
      fs.mkdirSync(notesDir, { recursive: true });
      
      const sanitizedTitle = lectureTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'lecture_note';
      const filePath = path.join(notesDir, `${sanitizedTitle}.md`);

      const noteHeader = `# Study Notes: ${lectureTitle}\n\n**Subject**: ${subject}\n**Date**: ${new Date().toLocaleDateString()}\n**Source**: YouTube / PW.live\n\n---\n\n`;
      const fullNote = noteHeader + explanation + `\n\n---\n*Slide screenshot captured and processed by Gemini 3.5 study helper.*\n`;

      fs.writeFileSync(filePath, fullNote);
      console.log(`${GREEN}✔ Notes successfully saved to: ${BOLD}${path.relative(__dirname, filePath)}${RESET}`);
      console.log(`${CYAN}----------------------------------------------------${RESET}`);

      return { success: true, data: explanation, path: path.relative(__dirname, filePath) };
    } catch (err) {
      console.error(`${RED}Error in Multimodal Bridge: ${err.message}${RESET}`);
      return { success: false, error: err.message };
    }
  });

  // Inject study sidebar on YouTube, pw.live, and general physicswallah pages
  const injectStudySidebar = async (p) => {
    try {
      await p.evaluate(() => {
        if (window.studyCompanionInterval) return;

        window.studyCompanionInterval = setInterval(() => {
          const url = window.location.href;
          const isLearningPortal = url.includes('youtube.com/watch') || url.includes('pw.live') || url.includes('physicswallah');
          
          if (!isLearningPortal) {
            const existing = document.querySelector('study-companion-widget');
            if (existing) existing.remove();
            return;
          }

          if (document.querySelector('study-companion-widget')) return;

          const widget = document.createElement('study-companion-widget');
          document.body.appendChild(widget);

          const shadow = widget.attachShadow({ mode: 'open' });

          const style = document.createElement('style');
          style.textContent = `
            :host {
              all: initial;
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            .floating-trigger {
              position: fixed;
              bottom: 24px;
              right: 24px;
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background: linear-gradient(135deg, #ec4899, #f43f5e);
              box-shadow: 0 4px 20px rgba(236, 72, 153, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 999999;
              transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              border: 2px solid rgba(255, 255, 255, 0.2);
            }
            .floating-trigger:hover {
              transform: scale(1.15) rotate(15deg);
              box-shadow: 0 6px 24px rgba(236, 72, 153, 0.7);
            }
            .floating-trigger svg {
              width: 28px;
              height: 28px;
              fill: white;
            }
            .sidebar {
              position: fixed;
              top: 0;
              right: 0;
              width: 380px;
              height: 100vh;
              background: rgba(15, 11, 20, 0.88);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              box-shadow: -5px 0 30px rgba(0, 0, 0, 0.5);
              border-left: 1px solid rgba(236, 72, 153, 0.3);
              z-index: 999998;
              transform: translateX(100%);
              transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
              display: flex;
              flex-direction: column;
              color: #f8fafc;
            }
            .sidebar.open {
              transform: translateX(0);
            }
            .header {
              padding: 20px;
              border-bottom: 1px solid rgba(236, 72, 153, 0.2);
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: rgba(255, 255, 255, 0.03);
            }
            .header-title {
              font-size: 16px;
              font-weight: 700;
              letter-spacing: 0.5px;
              background: linear-gradient(120deg, #f472b6, #fb7185);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .close-btn {
              background: none;
              border: none;
              color: #94a3b8;
              cursor: pointer;
              font-size: 20px;
              transition: color 0.2s;
            }
            .close-btn:hover {
              color: #f43f5e;
            }
            .content-area {
              flex: 1;
              overflow-y: auto;
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            .form-group {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            label {
              font-size: 11.5px;
              font-weight: 700;
              color: #f472b6;
              letter-spacing: 0.5px;
            }
            input, textarea {
              padding: 10px;
              border-radius: 6px;
              border: 1px solid rgba(236, 72, 153, 0.25);
              background: rgba(0, 0, 0, 0.3);
              color: white;
              font-size: 13px;
              outline: none;
              transition: border-color 0.2s;
            }
            input:focus, textarea:focus {
              border-color: #ec4899;
            }
            .btn-action {
              padding: 14px;
              border-radius: 8px;
              border: none;
              font-weight: 700;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: linear-gradient(135deg, #ec4899, #f43f5e);
              color: white;
              box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
            }
            .btn-action:hover {
              background: linear-gradient(135deg, #f472b6, #ec4899);
              box-shadow: 0 6px 16px rgba(236, 72, 153, 0.5);
              transform: translateY(-1px);
            }
            .btn-action:active {
              transform: translateY(1px);
            }
            .report-card {
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(236, 72, 153, 0.15);
              border-radius: 8px;
              padding: 15px;
              font-size: 13.5px;
              line-height: 1.6;
              color: #cbd5e1;
              overflow-x: auto;
              min-height: 120px;
            }
            .report-card h3 {
              margin-top: 0;
              color: #f8fafc;
              font-size: 14px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              padding-bottom: 6px;
            }
            .loader {
              display: none;
              align-items: center;
              justify-content: center;
              flex-direction: column;
              gap: 15px;
              padding: 30px 0;
            }
            .spinner {
              width: 36px;
              height: 36px;
              border: 3px solid rgba(236, 72, 153, 0.2);
              border-top-color: #f472b6;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            .loader-text {
              font-size: 12px;
              color: #94a3b8;
              letter-spacing: 0.5px;
              text-align: center;
            }
            .empty-state {
              text-align: center;
              color: #64748b;
              font-size: 13px;
              padding: 40px 0;
            }
            .footer {
              padding: 12px;
              text-align: center;
              font-size: 11px;
              color: #475569;
              border-top: 1px solid rgba(255, 255, 255, 0.02);
              background: rgba(0, 0, 0, 0.15);
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            code {
              font-family: 'Fira Code', Consolas, Monaco, monospace;
              background: rgba(0, 0, 0, 0.3);
              padding: 2px 4px;
              border-radius: 4px;
              color: #f472b6;
            }
            pre {
              background: rgba(0, 0, 0, 0.4);
              padding: 10px;
              border-radius: 6px;
              overflow-x: auto;
              border: 1px solid rgba(255, 255, 255, 0.05);
            }
            pre code {
              background: none;
              padding: 0;
              color: #e2e8f0;
            }
          `;
          shadow.appendChild(style);

          // Create Floating Trigger
          const trigger = document.createElement('div');
          trigger.className = 'floating-trigger';
          trigger.innerHTML = `
            <svg viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          `;
          shadow.appendChild(trigger);

          // Create Sidebar Structure
          const sidebar = document.createElement('div');
          sidebar.className = 'sidebar';
          sidebar.innerHTML = `
            <div class="header">
              <span class="header-title">AI Study Companion</span>
              <button class="close-btn">×</button>
            </div>

            <div class="content-area">
              <div class="form-group">
                <label>SUBJECT / EXAM</label>
                <input type="text" id="study-subject" value="JEE Preparation" placeholder="e.g. Physics, Calculus, Organic Chemistry">
              </div>

              <div class="form-group">
                <label>LECTURE TITLE</label>
                <input type="text" id="study-title" placeholder="e.g., Rotation Mechanics Lecture 1">
              </div>

              <div class="form-group">
                <label>CUSTOM NOTES / QUERY (OPTIONAL)</label>
                <textarea id="study-query" rows="2" placeholder="e.g. Explain that equation, Summarize this slide"></textarea>
              </div>

              <button class="btn-action" id="action-capture">
                📸 Capture Lecture & Explain
              </button>

              <div class="loader" id="study-loader">
                <div class="spinner"></div>
                <span class="loader-text">AI TUTOR IS SCRAPING SLIDE & EQUATIONS...</span>
              </div>

              <div class="report-card" id="study-report">
                <div class="empty-state">Ready to study! Pause your lecture video on any slide, equation, or drawing and click "Capture" above!</div>
              </div>
            </div>

            <div class="footer">
              Local Vault Connected • Powered by Gemini 3.5
            </div>
          `;
          shadow.appendChild(sidebar);

          // Click Handlers
          trigger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
          });

          sidebar.querySelector('.close-btn').addEventListener('click', () => {
            sidebar.classList.remove('open');
          });

          // Automatically extract lecture title from YouTube or PW page
          const autoDetectLectureTitle = () => {
            try {
              if (window.location.host.includes('youtube.com')) {
                const ytTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
                if (ytTitle) return ytTitle.innerText.trim();
              }
              // Fallback to tab title
              return document.title.replace('- YouTube', '').trim();
            } catch (e) {
              return "";
            }
          };

          // Populate initial lecture title automatically!
          const autoTitle = autoDetectLectureTitle();
          if (autoTitle) {
            sidebar.querySelector('#study-title').value = autoTitle;
          }

          // Format AI Markdown response as clean HTML
          const formatNotes = (text) => {
            return text
              .replace(/\n/g, '<br>')
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .replace(/\* ([^*]+)/g, '• $1')
              .replace(/`([^`]+)`/g, '<code>$1</code>');
          };

          // CAPTURE ACTION
          sidebar.querySelector('#action-capture').addEventListener('click', async () => {
            const btn = sidebar.querySelector('#action-capture');
            const loader = sidebar.querySelector('#study-loader');
            const report = sidebar.querySelector('#study-report');

            const subject = sidebar.querySelector('#study-subject').value.trim() || "General Studies";
            let title = sidebar.querySelector('#study-title').value.trim();
            if (!title) {
              title = autoDetectLectureTitle() || "Lecture Note";
              sidebar.querySelector('#study-title').value = title;
            }
            const query = sidebar.querySelector('#study-query').value.trim();

            btn.style.display = 'none';
            loader.style.display = 'flex';
            report.innerHTML = '';

            try {
              // Call exposed backend Node multimodal bridge
              const response = await window.bridgeExplainFrame(subject, title, query);
              
              if (response.success) {
                report.innerHTML = `
                  <h3 style="color: #ec4899;">📚 Lecture Note Compiled</h3>
                  <div style="font-size: 11.5px; color: #10b981; font-weight: 600; margin-bottom: 10px;">
                    ✔ Saved to vault: ${response.path}
                  </div>
                  <div>${formatNotes(response.data)}</div>
                `;
              } else {
                report.innerHTML = `<div style="color: #f43f5e;">API Error: ${response.error}</div>`;
              }
            } catch (err) {
              report.innerHTML = `<div style="color: #f43f5e;">Error capturing player frame: ${err.message}. Make sure a video is open on the page!</div>`;
            } finally {
              btn.style.display = 'flex';
              loader.style.display = 'none';
            }
          });

        }, 1000);
      });
    } catch (e) {
      // Suppress minor background frame navigation errors
    }
  };

  // Listen to frame navigated events to re-apply the injector dynamically on SPAs
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      await injectStudySidebar(page);
    }
  });

  // Default navigate to Physics Wallah or YouTube
  await page.goto('https://youtube.com/');
  await injectStudySidebar(page);

  printHeader();
  console.log(`${GREEN}${BOLD}✔ AI Study Companion service successfully started!${RESET}`);
  console.log(`${YELLOW}Monitoring video player context in the background...${RESET}`);
  console.log(`${CYAN}----------------------------------------------------${RESET}`);
  console.log(` • minimize this terminal - no keyboard inputs needed!`);
  console.log(` • watch educational videos on YouTube or pw.live`);
  console.log(` • click the glowing pink ${BOLD}[Study AI]${RESET} bubble on the bottom right of the page`);
  console.log(` • enter Subject and click Capture to let Gemini OCR & explain slides!`);
  console.log(`${CYAN}----------------------------------------------------\n${RESET}`);
}

main().catch(err => {
  console.error(`${RED}Fatal error: ${err.message}${RESET}`);
});
