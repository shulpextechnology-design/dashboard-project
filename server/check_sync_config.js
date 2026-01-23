const { createClient } = require('@libsql/client/http');

const db = createClient({
    url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

async function check() {
    try {
        const res = await db.execute('SELECT * FROM sync_config WHERE id = 1');
        console.log('Sync Config:', JSON.stringify(res.rows[0], null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

check();
