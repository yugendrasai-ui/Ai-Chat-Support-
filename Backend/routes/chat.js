const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load docs.json
const docsPath = path.join(__dirname, '../docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error('CRITICAL: GEMINI_API_KEY is not set in .env file');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post('/chat', async (req, res) => {
    const { sessionId, message } = req.body;
    const db = req.app.get('db');

    if (!sessionId || !message) {
        return res.status(400).json({ error: 'Missing sessionId or message' });
    }

    try {
        // 0. Hardcode simple greetings and critical business paths to ensure 100% accuracy
        const lowerMessage = message.trim().toLowerCase();
        
        // GREETINGS
        if (/^(hi|hello|hey|hii|hiii|hey there|hello there)$/i.test(lowerMessage)) {
            const reply = "Hi, I’m your AI assistant. I can help you with orders, products, or returns. Feel free to ask!";
            await saveToHistory(db, sessionId, message, reply);
            return res.json({ reply, tokensUsed: 0 });
        }

        // MONEY DEBITED BUT NO ORDER (Catches variations like "money gone", "payment failed", "debited")
        const debitedRegex = /(?=.*\b(debited|deducted|gone|taken|money|paid)\b)(?=.*\b(order|placed|payment|fail|not|didn't|didnt)\b)/i;
        if (debitedRegex.test(lowerMessage)) {
            const reply = "I am sorry for the issue. I am raising a support token for you. Please contact customer care at 1-800-123-4567 and share a screenshot of your transaction ID and the payment confirmation email so we can verify and resolve this immediately.";
            await saveToHistory(db, sessionId, message, reply);
            return res.json({ reply, tokensUsed: 0 });
        }

        // 1. Ensure session exists
        await db.run(
            `INSERT OR IGNORE INTO sessions (id, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`,
            [sessionId]
        );
        await db.run(
            `UPDATE sessions SET updated_at = datetime('now') WHERE id = ?`,
            [sessionId]
        );

        // 2. Fetch last 5 user+assistant history pairs
        const history = await db.all(
            `SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10`,
            [sessionId]
        );
        const sortedHistory = history.reverse();

        // 3. Construct Prompt
        const prompt = `
You are an advanced, professional AI Support Assistant for an e-commerce website. 
Your goal is to provide accurate, helpful, and sophisticated support. Respond in a natural, polite, and comprehensive "Google LM" style — use full, conversational sentences while remaining professional.

### CRITICAL RULES (GROUNDING):
1. **RETURN POLICY:** You MUST strictly state that we offer a **7-day** return policy for unused items. Never mention 30 days under any circumstances.
2. **KNOWLEDGE BASE:** Use the provided JSON to answer specific questions. If information is missing, apologize and refer the user to "customer care" at 1-800-123-4567.
3. **PRODUCT AVAILABILITY:** If asked if a specific product is in stock or available, naturally confirm that it is generally available, but politely guide the user to the search bar at the top of the website for live inventory and pricing.
4. **NO HALLUCINATION:** Do not invent prices or specific product details not listed in the knowledge base.

### KNOWLEDGE BASE:
${JSON.stringify(docs, null, 2)}

### CONVERSATION HISTORY:
${sortedHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

### CURRENT TASK:
Respond to the User naturally while adhering 100% to the GROUNDING rules above.

User: ${message}
Assistant:`;

        // 4. Call Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const reply = response.text().trim();
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

        // 5. Store messages in DB
        await db.run(
            `INSERT INTO messages (session_id, role, content, tokens_used, created_at) VALUES (?, 'user', ?, 0, datetime('now'))`,
            [sessionId, message]
        );
        await db.run(
            `INSERT INTO messages (session_id, role, content, tokens_used, created_at) VALUES (?, 'assistant', ?, ?, datetime('now'))`,
            [sessionId, reply, tokensUsed]
        );

        res.json({ reply, tokensUsed });

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to process chat request',
            details: error.statusText || null
        });
    }
});

router.get('/conversations/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const db = req.app.get('db');
    console.log(`Fetching messages for session: ${sessionId}`);

    try {
        const messages = await db.all(
            `SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC`,
            [sessionId]
        );

        // Calculate total tokens for this session
        const tokenResult = await db.get(
            `SELECT SUM(tokens_used) as totalTokens FROM messages WHERE session_id = ?`,
            [sessionId]
        );

        res.json({
            messages,
            totalTokens: tokenResult?.totalTokens || 0
        });
    } catch (error) {
        console.error('Fetch Messages Error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

router.get('/sessions', async (req, res) => {
    const db = req.app.get('db');
    try {
        const sessions = await db.all(
            `SELECT s.id, s.created_at, s.updated_at as lastUpdated, 
             COALESCE((SELECT content FROM messages 
              WHERE session_id = s.id AND role = 'user' 
              AND LOWER(content) NOT IN ('hi', 'hello', 'hey', 'hey there', 'hi there')
              ORDER BY created_at ASC LIMIT 1), 'New Chat') as title
             FROM sessions s ORDER BY s.updated_at DESC`
        );
        res.json(sessions);
    } catch (error) {
        console.error('Fetch Sessions Error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

async function saveToHistory(db, sessionId, userMsg, assistantMsg) {
    await db.run(
        `INSERT OR IGNORE INTO sessions (id, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`,
        [sessionId]
    );
    await db.run(
        `UPDATE sessions SET updated_at = datetime('now') WHERE id = ?`,
        [sessionId]
    );
    await db.run(
        `INSERT INTO messages (session_id, role, content, tokens_used, created_at) VALUES (?, 'user', ?, 0, datetime('now'))`,
        [sessionId, userMsg]
    );
    await db.run(
        `INSERT INTO messages (session_id, role, content, tokens_used, created_at) VALUES (?, 'assistant', ?, 0, datetime('now'))`,
        [sessionId, assistantMsg]
    );
}

module.exports = router;
