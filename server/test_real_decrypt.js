const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const CryptoJS = require('crypto-js');

const AES_KEY = 'brandseotools(created-by-premiumtools.shop)iLFB0yJSdidhLStH6tNcfXMqo7L8qkdofk';

async function testRealTokenDecrypt() {
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
  const fullMatch = res1.data.match(/brandseotools[^"']+/)[0];
  const payload = fullMatch.replace('brandseotools(created-by-premiumtools.shop)', '').trim();

  console.log('Full Payload length:', payload.length);
  try {
    const bytes = CryptoJS.AES.decrypt(payload, AES_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    console.log('✅ Decrypted string length:', decryptedStr.length);
    console.log('✅ Decrypted snippet:', decryptedStr.substring(0, 150));
    const obj = JSON.parse(decryptedStr);
    console.log('✅ Parsed JSON object successfully!');
    console.log('Target URL:', obj.url);
    console.log('Cookies count:', obj.cookies?.length);
  } catch (e) {
    console.error('❌ Decryption failed:', e.message);
  }
}

testRealTokenDecrypt().catch(console.error);
