const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function inspectCopyText() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }));

  const loginPageRes = await client.get('https://members.freelancerservice.site/login', { timeout: 20000 });
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
    timeout: 20000
  });

  const res1 = await client.get('https://members.freelancerservice.site/content/p/id/173/', { timeout: 20000 });
  console.log('=== INSTANCE 1 HTML copyText ===');
  const match1 = res1.data.match(/copyText[\s\S]{0,300}/);
  console.log(match1 ? match1[0] : 'No match1');

  const res2 = await client.get('https://members.freelancerservice.site/content/p/id/45/', { timeout: 20000 });
  console.log('=== INSTANCE 2 HTML copyText ===');
  const match2 = res2.data.match(/copyText[\s\S]{0,300}/);
  console.log(match2 ? match2[0] : 'No match2');
}

inspectCopyText().catch(console.error);
