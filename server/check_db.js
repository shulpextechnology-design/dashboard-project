const { createClient } = require('@libsql/client');

const db = createClient({
    url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

async function check() {
    try {
        const result = await db.execute("SELECT * FROM users");
        console.log('--- USERS ---');
        console.log(JSON.stringify(result.rows, null, 2));

        const sessions = await db.execute("SELECT * FROM helium10_session");
        console.log('--- SESSIONS ---');
        console.log(JSON.stringify(sessions.rows, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
