const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function testSync() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({
        jar,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    }));

    const amember_login = 'vigneshsingaravelan@kyda.in';
    const amember_pass = 'vigneshsingaravelan@kyda.in';
    const login_url = 'https://members.freelancerservice.site/login';
    const source_url = 'https://members.freelancerservice.site/content/p/id/173/';

    try {
        console.log('Step 1: Getting login page...');
        const loginPageRes = await client.get(login_url);
        const attemptIdMatch = loginPageRes.data.match(/name="login_attempt_id" value="(.*?)"/);
        const attemptId = attemptIdMatch ? attemptIdMatch[1] : null;

        if (!attemptId) {
            console.error('Failed to find login_attempt_id');
            return;
        }
        console.log('Found attemptId:', attemptId);

        const formData = new URLSearchParams();
        formData.append('amember_login', amember_login);
        formData.append('amember_pass', amember_pass);
        formData.append('login_attempt_id', attemptId);

        console.log('Step 2: Performing login...');
        const loginRes = await client.post(login_url, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://members.freelancerservice.site',
                'Referer': login_url
            }
        });

        console.log('Login Response Status:', loginRes.status);

        console.log('Step 3: Verifying session at /member...');
        const verifyRes = await client.get('https://members.freelancerservice.site/member');
        const isLogged = verifyRes.data.includes('logout') || verifyRes.data.includes('Logout');
        console.log('Is Logged In:', isLogged);

        if (!isLogged) {
            console.log('Login failed. Page content snippet:', verifyRes.data.substring(0, 500));
            // return;
        }

        console.log('Step 4: Fetching content page...');
        const contentPageRes = await client.get(source_url);
        // console.log('Content Page Sample:', contentPageRes.data.substring(0, 1000));

        let tokenMatch = contentPageRes.data.match(/(?:var\s+)?copyText\s*=\s*["']\s*(brandseotools.*?)\s*["']/s);
        let token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
            console.log('First regex fail. Checking for raw token snippet...');
            const altMatch = contentPageRes.data.match(/brandseotools\(created-by-premiumtools\.shop\)[^"']+/);
            token = altMatch ? altMatch[0] : null;
        }

        if (token) {
            console.log('Success! Extracted Token:', token.substring(0, 50) + '...');
        } else {
            console.log('Failed to extract token.');
            const fs = require('fs');
            fs.writeFileSync('failed_content.html', contentPageRes.data);
            console.log('Saved page content to failed_content.html');
        }

    } catch (err) {
        console.error('Error during test:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data.substring(0, 500));
        }
    }
}

testSync();
