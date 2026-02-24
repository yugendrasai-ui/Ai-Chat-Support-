require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // The listModels method is on the genAI instance in some versions or requires a different approach.
        // In the current SDK, we usually just know the strings.
        // Let's try to just test a few common ones.
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-pro"];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`✅ Model ${m} is WORKING`);
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message}`);
            }
        }
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
