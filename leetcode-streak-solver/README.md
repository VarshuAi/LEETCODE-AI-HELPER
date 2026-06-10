# 🚀 LeetCode Daily Streak Auto-Solver

This is a lightweight, zero-dependency Node.js automation script designed for **Varshan** that fetches today's Daily Coding Challenge from LeetCode, solves it using Google's **Gemini 3.5 Flash** API, submits it, and verifies it.

If the submission fails (e.g. wrong answer or runtime error), the script triggers a **self-correction loop**: it feeds the runtime error and failed test case back to Gemini, generates a fix, and resubmits!

---

## 🛠️ Setup Instructions

### 1. Configure Credentials
1.  Duplicate `.env.example` and rename it to `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Input your **`GEMINI_API_KEY`**.
3.  Extract your LeetCode session values:
    *   Open your browser and navigate to [leetcode.com](https://leetcode.com). Make sure you are logged in.
    *   Press **`F12`** (or right-click -> `Inspect`) to open Developer Tools.
    *   Go to the **Application** tab (or **Storage** tab on Firefox).
    *   In the left sidebar, expand **Cookies** and select `https://leetcode.com`.
    *   Find and copy the values for:
        *   **`LEETCODE_SESSION`**
        *   **`csrftoken`** (paste this into `LEETCODE_CSRFTOKEN` in your `.env` file).

---

## 🚀 Running the Solver

Since you are running Node.js `v24.15.0`, you can execute the script using Node's built-in `.env` file loader without needing to install any package dependencies:

```bash
node --env-file=.env solve.js
```

---

## ⏰ Automating Daily Streak (Windows Task Scheduler)

To ensure you never miss your streak, you can schedule the solver to run automatically every day at a specific time:

1.  Open the Windows start menu, search for **Task Scheduler**, and open it.
2.  In the right panel, click **Create Basic Task...**.
3.  Set the name to **`LeetCode Streak Solver`** and click Next.
4.  Choose **Daily**, click Next, and set the daily execution time (e.g., `10:00 AM`).
5.  Under Action, select **Start a program**.
6.  Set the parameters:
    *   **Program/script**: `node` (or the absolute path to your node executable, e.g. `C:\Program Files\nodejs\node.exe`).
    *   **Add arguments**: `--env-file=.env solve.js`
    *   **Start in**: The absolute path to this folder (e.g., `C:\Users\Varshan\Documents\antigravity\magical-hypatia\leetcode-streak-solver`).
7.  Click Finish. 

Now, Windows will automatically trigger the script once a day, query Gemini for the daily challenge, resolve it, and verify the submission passed accepted criteria!
