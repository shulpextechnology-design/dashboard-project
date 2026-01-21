const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
        console.error('Error reading data.db:', err);
    } else {
        console.log('--- USERS IN data.db ---');
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
