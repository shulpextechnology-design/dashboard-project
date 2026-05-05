const { createClient } = require('@libsql/client/http');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
require('dotenv').config();

const db = createClient({
    url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

async function dbExecuteWithRetry(queryObj, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await db.execute(queryObj);
        } catch (err) {
            console.warn(`[DB] Retry ${i + 1}/${retries} error: ${err.message}`);
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            if (i === retries - 1) throw err;
        }
    }
}

async function debugSync(instanceId) {
    console.log(`Starting Debug Sync for Instance ${instanceId}...`);
    const jar = new CookieJar();
    const client = wrapper(axios.create({
        jar,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    }));

    try {
        // Fetch config
        const configResult = await db.execute({
            sql: 'SELECT * FROM sync_config WHERE id = ?',
            args: [instanceId]
        });
        const config = configResult.rows[0];
        console.log('Config:', config);

        if (!config) throw new Error('No config found');

        const { source_url, login_url, amember_login, amember_pass } = config;

        // Step A: Initial Check
        console.log(`Checking ${source_url}...`);
        let contentPageRes;
        try {
            contentPageRes = await client.get(source_url, { timeout: 20000, responseType: 'text' });
            console.log(`Initial Check Status: ${contentPageRes.status}`);
        } catch (e) {
            console.log(`Initial check failed: ${e.message}`);
            contentPageRes = { data: '' };
        }

        let tokenMatch = contentPageRes.data.match(/var copyText = ["'](brandseotools.*?)["']/);
        let token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
            console.log('Token not found. Logging in...');
            const loginPageRes = await client.get(login_url, { timeout: 10000, responseType: 'text' });

            // Extract attempt ID
            const attemptIdMatch = loginPageRes.data.match(/name="login_attempt_id" value="(.*?)"/);
            const attemptId = attemptIdMatch ? attemptIdMatch[1] : null;
            console.log(`Login Attempt ID: ${attemptId}`);

            if (!attemptId) throw new Error('Failed to find login_attempt_id');

            const formData = new URLSearchParams();
            formData.append('amember_login', amember_login);
            formData.append('amember_pass', amember_pass);
            formData.append('login_attempt_id', attemptId);

            console.log(`Posting login to ${login_url}...`);
            const loginRes = await client.post(login_url, formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://members.freelancerservice.site', // Generic origin, might need specific
                    'Referer': login_url
                },
                maxRedirects: 5,
                timeout: 20000,
                validateStatus: false
            });

            console.log(`Login Response Status: ${loginRes.status}`);
            console.log('Login Response Body:', typeof loginRes.data === 'string' ? loginRes.data.substring(0, 500) : 'Non-text');

            if (loginRes.status >= 400) {
                console.log('Login Response Body First 500 chars:', typeof loginRes.data === 'string' ? loginRes.data.substring(0, 500) : 'Non-text');
                throw new Error(`Login failed with status ${loginRes.status}`);
            }

            if (typeof loginRes.data === 'string' && (loginRes.data.includes('name="login_attempt_id"') || loginRes.data.includes('amember_login'))) {
                throw new Error('Login failed (Credentials might be incorrect or account locked)');
            }

            // Verify Session
            console.log('Verifying session...');
            try {
                const verifyRes = await client.get('https://members.freelancerservice.site/member', { timeout: 20000 });
                const isLogged = verifyRes.data.includes('logout') || verifyRes.data.includes('Logout');
                console.log(`Session Active: ${isLogged}`);
            } catch (vErr) {
                console.warn('Session verification failed (ignoring):', vErr.message);
            }

            // Final Extraction
            console.log(`Fetching content from ${source_url}...`);
            contentPageRes = await client.get(source_url, {
                headers: { 'Referer': 'https://members.freelancerservice.site/member' },
                timeout: 20000,
                responseType: 'text'
            });

            // Improved Regex from index.js
            tokenMatch = contentPageRes.data.match(/(?:var\s+)?copyText\s*=\s*["']\s*(brandseotools.*?)\s*["']/s);
            token = tokenMatch ? tokenMatch[1] : null;

            if (!token) {
                const altMatch = contentPageRes.data.match(/brandseotools\(created-by-premiumtools\.shop\)[^"']+/);
                token = altMatch ? altMatch[0] : null;
            }
        }

        if (token) {
            console.log('SUCCESS! Token found:', token);
        } else {
            console.error('FAILED to extract token.');
            console.log('Final Page Sample:', contentPageRes.data.substring(0, 500));
        }

    } catch (err) {
        console.error('Debug Sync Error:', err.message);
        if (err.config) {
            console.error('Failed URL:', err.config.url);
        }
        if (err.response) {
            console.error('Response Status:', err.response.status);
            // console.error('Response Data:', err.response.data); // Too verbose
        }
    }
}

// Wrap verify in try/catch in the main logic (not applying here, just modifying the catch block below)
// Actually, I'll modify the verify section in a separate chunk to be safe.
debugSync(2);
