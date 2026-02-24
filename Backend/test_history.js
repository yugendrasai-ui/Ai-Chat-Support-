const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

(async () => {
    const db = await open({
        filename: path.join(__dirname, 'db/database.sqlite'),
        driver: sqlite3.Database
    });
    const sessionId = '8cbed629-7853-459b-8292-f61e735085bb';
    const messages = await db.all(
        `SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC`,
        [sessionId]
    );
    console.log(`Messages count: ${messages.length}`);
    console.log(JSON.stringify(messages, null, 2));
})();
