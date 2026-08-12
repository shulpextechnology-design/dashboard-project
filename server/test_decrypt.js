const CryptoJS = require('crypto-js');

const AES_KEY = 'brandseotools(created-by-premiumtools.shop)iLFB0yJSdidhLStH6tNcfXMqo7L8qkdofk';
const encryptedPayload = "U2FsdGVkX189yPCfPuJLA/r5k5Vf8hjQrSt8nK5lUrkedipaOoNPCKjl66J/PQ+gfCsvbTspSrKG72GRBKxxnVoNuFcr3J5CqzCwLDRq/wDE0Gbsa2cHlR4Z6rk4S6iV37l+GQkd7PxAtfwp6FEYXtCnC8DEQL15rvS9V79r6y0JEhkmLIk6eh+WSaU2MhLq8gNkB2Ch/x/MkGVuWRHzIY65x2tifVVZA1ygtYJv7sqhYHrdlvyYsvxiuJfO";

try {
  const bytes = CryptoJS.AES.decrypt(encryptedPayload, AES_KEY);
  const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
  console.log('Decrypted string length:', decryptedStr.length);
  console.log('Decrypted string:', decryptedStr.substring(0, 200));
  const obj = JSON.parse(decryptedStr);
  console.log('Parsed JSON object successfully!');
  console.log('Target URL:', obj.url);
  console.log('Cookies count:', obj.cookies?.length);
} catch (e) {
  console.error('Decryption failed:', e.message);
}
