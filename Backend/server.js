require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure DB directory exists
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', limiter);

// Database Initialization
(async () => {
    try {
        const db = await open({
            filename: path.join(__dirname, 'db/database.sqlite'),
            driver: sqlite3.Database
        });

        // Create Tables (Added tokens_used column to messages)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                created_at DATETIME,
                updated_at DATETIME
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                role TEXT,
                content TEXT,
                tokens_used INTEGER DEFAULT 0,
                created_at DATETIME,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            );
        `);

        // Migration: If tokens_used doesn't exist (for existing tables)
        try {
            await db.exec(`ALTER TABLE messages ADD COLUMN tokens_used INTEGER DEFAULT 0`);
        } catch (e) {
            // Column already exists, ignore
        }

        app.set('db', db);
        console.log('Database initialized successfully.');

        // Routes
        app.use('/api', chatRoutes);

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
})();
