const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

(async () => {
    const db = await open({
        filename: path.join(__dirname, 'db/database.sqlite'),
        driver: sqlite3.Database
    });
    const sessions = await db.all("SELECT id FROM sessions LIMIT 10");
    for (const s of sessions) {
        const msg = await db.get("SELECT content FROM messages WHERE session_id = ? LIMIT 1", [s.id]);
        console.log(`ID: [${s.id}] | Msg: [${msg?.content || 'NONE'}]`);
    }
})();
