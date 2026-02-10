const { createClient } = require('@libsql/client/http');
require('dotenv').config();

const db = createClient({
    url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

async function run() {
    try {
        const res = await db.execute('SELECT * FROM sync_logs ORDER BY id DESC LIMIT 50');
        console.log('--- LATEST SYNC LOGS ---');
        res.rows.forEach(row => {
            console.log(`[${row.timestamp}] ${row.event}: ${row.details}`);
        });

        const status1 = await db.execute('SELECT * FROM sync_status WHERE id = 1');
        const status2 = await db.execute('SELECT * FROM sync_status WHERE id = 2');
        console.log('\n--- CURRENT STATUS (Instance 1) ---');
        console.log(status1.rows[0]);
        console.log('\n--- CURRENT STATUS (Instance 2) ---');
        console.log(status2.rows[0]);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();
