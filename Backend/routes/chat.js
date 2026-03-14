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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

router.post('/chat', async (req, res) => {
    const { sessionId, message } = req.body;
    const db = req.app.get('db');

    if (!sessionId || !message) {
        return res.status(400).json({ error: 'Missing sessionId or message' });
    }

    try {
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
You are an advanced, professional AI Support Assistant for an e-commerce website. Your quality and conversational abilities should match advanced AI assistants like ChatGPT.
Your goal is to provide accurate, helpful, and polite support based ONLY on the provided knowledge base.

### KNOWLEDGE BASE:
\${JSON.stringify(docs, null, 2)}

### RULES:
- **GREETINGS:** If the user's message is just a greeting (e.g., "hi", "hello", "hey", "good morning"), **ONLY say hello back**. Introduce yourself as the E-commerce AI Support Assistant and ask how you can help. **DO NOT** provide any specific information about shipping, returns, policies, or products unless the user actually asks a question about them.
- Act like an expert, friendly e-commerce customer support agent.
- Use **ONLY** the information in the KNOWLEDGE BASE above to answer questions.
- If the requested information is not found in the KNOWLEDGE BASE, you **MUST** respond politely with: "I'm sorry, but I don't have that specific information. Please contact our human support team for further assistance."
- DO NOT use any external knowledge, general intelligence, or hallucinate products, policies, or prices.
- Provide clear, concise, and structured answers.
- Be empathetic and professional in your tone.

### CONVERSATION HISTORY:
\${sortedHistory.map(m => \`\${m.role === 'user' ? 'User' : 'Assistant'}: \${m.content}\`).join('\\n')}

### CURRENT USER QUESTION:
User: \${message}

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

module.exports = router;
