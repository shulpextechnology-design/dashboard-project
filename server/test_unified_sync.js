const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const { createClient } = require('@libsql/client/http');

const db = createClient({
  url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

async function runUnifiedSyncTest() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }));

  console.log('1. Logging in to freelancerservice.site...');
  const loginPageRes = await client.get('https://members.freelancerservice.site/login', { timeout: 25000 });
  const attemptId = (loginPageRes.data.match(/name="login_attempt_id" value="(.*?)"/) || [])[1];

  const formData = new URLSearchParams();
  formData.append('amember_login', 'Pathak123@gmail.com');
  formData.append('amember_pass', 'Pathak123@gmail.com');
  formData.append('login_attempt_id', attemptId);

  await client.post('https://members.freelancerservice.site/login', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://members.freelancerservice.site',
      'Referer': 'https://members.freelancerservice.site/login'
    },
    maxRedirects: 5,
    timeout: 25000
  });

  console.log('2. Fetching Instance 1 token (/content/p/id/173/)...');
  const res1 = await client.get('https://members.freelancerservice.site/content/p/id/173/', { timeout: 25000 });
  let token1Match = res1.data.match(/(?:var\s+)?copyText\s*=\s*["']\s*(brandseotools.*?)\s*["']/s);
  let token1 = token1Match ? token1Match[1] : null;

  console.log('Instance 1 Token found:', !!token1);

  console.log('3. Fetching Instance 2 token (/content/p/id/45/)...');
  const res2 = await client.get('https://members.freelancerservice.site/content/p/id/45/', { timeout: 25000 });
  let token2Match = res2.data.match(/(?:var\s+)?copyText\s*=\s*["']\s*(brandseotools.*?)\s*["']/s);
  let token2 = token2Match ? token2Match[1] : null;

  console.log('Instance 2 Token found:', !!token2);

  const now = new Date().toISOString();

  if (token1) {
    await db.execute({
      sql: `INSERT INTO helium10_session (id, session_json, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
      args: [token1.trim(), now]
    });
    await db.execute({
      sql: 'UPDATE sync_status SET last_success = ?, last_error = NULL, message = ?, is_syncing = 0, fail_count = 0 WHERE id = 1',
      args: [now, 'Success']
    });
    console.log('✅ Instance 1 DB Updated successfully at', now);
  }

  if (token2) {
    await db.execute({
      sql: `INSERT INTO helium10_session (id, session_json, updated_at) VALUES (2, ?, ?) ON CONFLICT(id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
      args: [token2.trim(), now]
    });
    await db.execute({
      sql: 'UPDATE sync_status SET last_success = ?, last_error = NULL, message = ?, is_syncing = 0, fail_count = 0 WHERE id = 2',
      args: [now, 'Success']
    });
    console.log('✅ Instance 2 DB Updated successfully at', now);
  }
}

runUnifiedSyncTest().catch(console.error);
