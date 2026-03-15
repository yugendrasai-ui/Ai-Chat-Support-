const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Diagnostic Test",
    }
});

async function test() {
    console.log("Testing OpenRouter Key...");
    console.log("Key starts with:", process.env.OPENROUTER_API_KEY.substring(0, 10));
    try {
        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3-8b-instruct",
            messages: [{ role: "user", content: "hi" }],
        });
        console.log("Success! Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("OpenRouter Error Details:");
        console.error("Status:", error.status);
        console.error("Message:", error.message);
        console.error("Body:", JSON.stringify(error.body, null, 2));
    }
}

test();
