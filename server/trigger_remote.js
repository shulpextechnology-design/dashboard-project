const axios = require('axios');

async function triggerRemote() {
  const baseURL = 'https://shulpextechnology-dashboard-server.hf.space';
  try {
    console.log('[TriggerRemote] Logging into HF backend...');
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      emailOrUsername: 'admin',
      password: 'admin' // or whatever default admin pass is
    }).catch(async () => {
      // try with common admin pass
      return await axios.post(`${baseURL}/api/auth/login`, {
        emailOrUsername: 'admin@gmail.com',
        password: 'admin'
      });
    });

    const token = loginRes.data.token;
    console.log('[TriggerRemote] Admin logged in! Token:', token.substring(0, 30));

    const triggerRes = await axios.post(`${baseURL}/api/admin/sync-trigger/2`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('[TriggerRemote] Trigger Instance 2 response:', triggerRes.data);
  } catch (e) {
    console.error('[TriggerRemote] Error:', e.response?.data || e.message);
  }
}

triggerRemote();
