/**
 * LeetCode Daily Challenge Auto-Streak Solver
 * Designed for Varshan. Uses Gemini 3.5 Flash to write solutions
 * and submits them automatically using your LeetCode session cookies.
 */

const fs = require('fs');
const path = require('path');

// Colors for console logging
const Colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    bold: "\x1b[1m"
};

const log = {
    info: (msg) => console.log(`${Colors.cyan}[*] ${msg}${Colors.reset}`),
    success: (msg) => console.log(`${Colors.green}${Colors.bold}[+] ${msg}${Colors.reset}`),
    warn: (msg) => console.log(`${Colors.yellow}[!] ${msg}${Colors.reset}`),
    error: (msg) => console.log(`${Colors.red}${Colors.bold}[-] ${msg}${Colors.reset}`),
    step: (msg) => console.log(`${Colors.magenta}${Colors.bold}➔ ${msg}${Colors.reset}`)
};

// Check environment variables
const sessionCookie = process.env.LEETCODE_SESSION;
const csrfToken = process.env.LEETCODE_CSRFTOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;
const langSlug = process.env.LEETCODE_LANGUAGE || 'python3';

if (!sessionCookie || !csrfToken || !geminiApiKey) {
    log.error("Missing credentials! Please make sure your .env file is populated with:");
    console.log("  - LEETCODE_SESSION");
    console.log("  - LEETCODE_CSRFTOKEN");
    console.log("  - GEMINI_API_KEY");
    process.exit(1);
}

const headers = {
    "cookie": `LEETCODE_SESSION=${sessionCookie}; csrftoken=${csrfToken}`,
    "x-csrftoken": csrfToken,
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "referer": "https://leetcode.com"
};

// Main Solver Workflow
async function main() {
    log.info("Starting Daily LeetCode Streak Solver...");

    try {
        // Step 1: Fetch the Daily Problem
        log.step("Fetching today's coding challenge...");
        const dailyQuestion = await fetchDailyQuestion();
        log.success(`Found daily challenge: "${dailyQuestion.title}" (${dailyQuestion.difficulty})`);

        // Step 2: Extract code snippet template
        const snippetObj = dailyQuestion.codeSnippets.find(s => s.langSlug === langSlug);
        if (!snippetObj) {
            throw new Error(`Template snippet not found for language: ${langSlug}`);
        }
        log.info(`Extracted code template for language: ${langSlug}`);

        // Step 3: Solve via Gemini with self-correction loop
        let attempts = 0;
        const maxAttempts = 3;
        let lastErrorLog = null;
        let currentCode = null;

        while (attempts < maxAttempts) {
            attempts++;
            log.step(`Attempt ${attempts}/${maxAttempts}: Generating solution via Gemini API...`);
            
            const prompt = constructPrompt(dailyQuestion, snippetObj.code, lastErrorLog, currentCode);
            currentCode = await queryGemini(prompt);
            
            log.info("Solution generated. Submitting to LeetCode...");

            // Step 4: Submit to LeetCode
            const submissionId = await submitSolution(dailyQuestion.titleSlug, dailyQuestion.questionId, currentCode);
            log.info(`Submitted! Submission ID: ${submissionId}. Checking status...`);

            // Step 5: Poll status
            const result = await checkSubmissionStatus(dailyQuestion.titleSlug, submissionId);

            if (result.status_msg === "Accepted") {
                log.success(`Accepted! Streak extended successfully! (${result.total_correct}/${result.total_testcases} cases passed)`);
                return;
            } else {
                log.warn(`Submission failed with status: ${result.status_msg}`);
                lastErrorLog = result;
                
                if (attempts < maxAttempts) {
                    log.info("Failed case details gathered. Triggering self-correction loop...");
                }
            }
        }

        log.error("Failed to solve the problem after maximum attempts. Please review the problem manually.");

    } catch (err) {
        log.error(`An error occurred: ${err.message || err}`);
    }
}

// Fetch Daily Question Details from LeetCode GraphQL API
async function fetchDailyQuestion() {
    const query = `
    query questionOfToday {
      activeDailyCodingChallengeQuestion {
        question {
          questionId
          title
          titleSlug
          content
          difficulty
          codeSnippets {
            lang
            langSlug
            code
          }
        }
      }
    }
    `;

    const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ query })
    });

    if (!res.ok) {
        throw new Error(`LeetCode GraphQL request failed with status: ${res.status}`);
    }

    const json = await res.json();
    const question = json.data?.activeDailyCodingChallengeQuestion?.question;

    if (!question) {
        throw new Error("Failed to extract active Daily challenge question from response.");
    }

    return question;
}

// Call Google Gemini API to get code solution
async function queryGemini(prompt) {
    const model = "gemini-3.5-flash"; // default high-speed model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt }
                ]
            }
        ]
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP error! status: ${res.status}`;
        throw new Error(`Gemini API Error: ${errMsg}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw new Error("No response text returned from Gemini API.");
    }

    // Extract the code block inside markdown code tags
    return cleanCodeResponse(rawText);
}

// Helper to remove markdown wrap tags from Gemini outputs
function cleanCodeResponse(rawText) {
    const regex = /```(?:\w+)?\n([\s\S]*?)```/;
    const match = rawText.match(regex);
    if (match) {
        return match[1].trim();
    }
    return rawText.trim();
}

// Construct clear prompt for Gemini
function constructPrompt(question, template, lastError, originalCode) {
    // Strip HTML tags from problem description to make it smaller/cleaner
    const cleanContent = question.content.replace(/<[^>]*>/g, ' ');

    let prompt = `You are a world-class competitive programmer. Solve the following LeetCode challenge using ${langSlug}.
You must output ONLY the code inside a markdown code block. Do NOT write any explanations, tests, or comments outside the code block.

---
Problem: "${question.title}" (Difficulty: ${question.difficulty})
Description:
${cleanContent}

---
Use this code template structure:
\`\`\`${langSlug}
${template}
\`\`\`
`;

    // Add self-correction details if there was a previous attempt
    if (lastError && originalCode) {
        prompt += `
\n⚠️ PREVIOUS ATTEMPT FAILED:
The solution you generated previously failed with status: "${lastError.status_msg}".
Here is the code you generated:
\`\`\`${langSlug}
${originalCode}
\`\`\`

Here are the failure details from the LeetCode evaluation runner:
`;

        if (lastError.compile_error) {
            prompt += `- Compile Error log:\n${lastError.compile_error}\n`;
        }
        if (lastError.runtime_error) {
            prompt += `- Runtime Error log:\n${lastError.runtime_error}\n`;
        }
        if (lastError.last_testcase) {
            prompt += `- Last evaluated Testcase input:\n${lastError.last_testcase}\n`;
        }
        if (lastError.code_output) {
            prompt += `- Output from your code:\n${lastError.code_output}\n`;
        }
        if (lastError.expected_output) {
            prompt += `- Expected output:\n${lastError.expected_output}\n`;
        }

        prompt += `\nAnalyze the bug carefully, fix the errors, and generate a new corrected, fully-working code solution. Ensure all edge cases are handled correctly. Output ONLY the code block.`;
    }

    return prompt;
}

// POST submission request to LeetCode
async function submitSolution(titleSlug, questionId, code) {
    const url = `https://leetcode.com/problems/${titleSlug}/submit/`;
    
    const body = {
        lang: langSlug,
        question_id: questionId,
        typed_code: code
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            ...headers,
            "referer": `https://leetcode.com/problems/${titleSlug}/`
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error(`Submission failed with status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.submission_id) {
        throw new Error(`Submission rejected. Details: ${JSON.stringify(data)}`);
    }

    return data.submission_id;
}

// Poll LeetCode submission check endpoint
async function checkSubmissionStatus(titleSlug, submissionId) {
    const checkUrl = `https://leetcode.com/submissions/detail/${submissionId}/check/`;
    
    // Max polling attempts
    const maxPolls = 15;
    for (let i = 0; i < maxPolls; i++) {
        // Wait 1.5s between polls
        await new Promise(r => setTimeout(r, 1500));

        const res = await fetch(checkUrl, {
            method: "GET",
            headers: {
                ...headers,
                "referer": `https://leetcode.com/problems/${titleSlug}/`
            }
        });

        if (!res.ok) {
            throw new Error(`Poll check failed with status: ${res.status}`);
        }

        const data = await res.json();
        
        // State can be "PENDING" or "SUCCESS"
        if (data.state === "SUCCESS") {
            return data;
        }
        
        log.info(`Evaluating solution... (ping ${i + 1})`);
    }

    throw new Error("Polling timeout: evaluation took too long.");
}

// Run the script
main();
