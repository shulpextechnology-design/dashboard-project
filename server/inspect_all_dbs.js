const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const databases = ['data.db', 'database.sqlite', 'data-DESKTOP-GES1NCQ.db'];

async function inspect(dbFile) {
    return new Promise((resolve) => {
        const dbPath = path.join(__dirname, dbFile);
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log(`Failed to open ${dbFile}`);
                return resolve();
            }
        });

        db.all("SELECT id, email, username, role, access_expires_at FROM users", [], (err, rows) => {
            if (err) {
                console.log(`Error reading ${dbFile}: ${err.message}`);
            } else {
                console.log(`\n--- USERS IN ${dbFile} (${rows.length} total) ---`);
                rows.forEach(r => {
                    console.log(`ID: ${r.id} | User: ${r.username} | Role: ${r.role} | Expiry: ${r.access_expires_at}`);
                });
            }
            db.close();
            resolve();
        });
    });
}

async function main() {
    for (const db of databases) {
        await inspect(db);
    }
}

main();
