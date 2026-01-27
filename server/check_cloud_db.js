const { createClient } = require('@libsql/client/http');

const db = createClient({
    url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

async function check() {
    try {
        console.log('Checking sync_config table...');
        const config = await db.execute('SELECT id FROM sync_config');
        console.log('IDs in sync_config:', config.rows.map(r => r.id));

        console.log('\nChecking table schema...');
        const schema = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='sync_config'");
        console.log('Schema for sync_config:', schema.rows[0].sql);
    } catch (e) {
        console.error('Error:', e);
    }
}

check();
