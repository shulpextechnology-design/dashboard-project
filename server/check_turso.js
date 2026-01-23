const { createClient } = require('@libsql/client/http');
require('dotenv').config();

const db = createClient({
    url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

async function check() {
    try {
        console.log('--- Tables ---');
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log(JSON.stringify(tables.rows, null, 2));

        console.log('--- Sync Status ---');
        const status = await db.execute('SELECT * FROM sync_status');
        console.log(JSON.stringify(status.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
