const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

(async () => {
    const db = await open({
        filename: path.join(__dirname, 'db/database.sqlite'),
        driver: sqlite3.Database
    });
    const columns = await db.all("PRAGMA table_info(messages)");
    console.log(JSON.stringify(columns, null, 2));
})();
