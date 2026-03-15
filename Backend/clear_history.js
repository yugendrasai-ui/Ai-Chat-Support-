const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db/chat_history.db');
const db = new sqlite3.Database(dbPath);

console.log('Clearing messages table...');
db.run('DELETE FROM messages', (err) => {
    if (err) console.error(err);
    console.log('Clearing sessions table...');
    db.run('DELETE FROM sessions', (err) => {
        if (err) console.error(err);
        console.log('Database cleared successfully.');
        db.close();
    });
});
