const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client/http');
const path = require('path');
const https = require('https');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const SYNC_SECRET = process.env.SYNC_SECRET || 'helium_sync_default_secret_9988';
const BACKEND_VERSION = 'v1.2.5-sync-TIMEOUT-FIX';

// --- Database Initialization ---
async function initDb() {
  try {
    // 1. Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        access_expires_at TEXT,
        mobile_number TEXT,
        is_logged_in INTEGER DEFAULT 0,
        is_demo INTEGER DEFAULT 0,
        last_ip TEXT
      )
    `);

    // 2. Helium 10 session table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS helium10_session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        session_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 3. Sync configuration table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        source_url TEXT NOT NULL,
        login_url TEXT NOT NULL,
        amember_login TEXT NOT NULL,
        amember_pass TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 4. Sync status table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_success TEXT,
        last_error TEXT,
        message TEXT,
        is_syncing INTEGER DEFAULT 0
      )
    `);

    // 5. Sync logs table (Detailed history)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        event TEXT NOT NULL,
        details TEXT
      )
    `);

    // 6. App assets table (Extension zip meta)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS app_assets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        file_size INTEGER
      )
    `);

    // Seed/Migrate as needed...
    // Migration: Add is_demo column (users)
    try { await db.execute('ALTER TABLE users ADD COLUMN is_demo INTEGER DEFAULT 0'); } catch (e) { }
    // Migration: Add last_ip column (users)
    try { await db.execute('ALTER TABLE users ADD COLUMN last_ip TEXT'); } catch (e) { }

    // Reset login status
    await db.execute('UPDATE users SET is_logged_in = 0');
    // Reset syncing status
    await db.execute('UPDATE sync_status SET is_syncing = 0 WHERE id = 1');

    // Seed default admin
    const adminEmail = 'admin@example.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin1239';
    const adminHash = bcrypt.hashSync(adminPassword, 10);
    const checkAdmin = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [adminUsername] });
    if (checkAdmin.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, 'admin')`,
        args: [adminEmail, adminUsername, adminHash]
      });
      console.log('Default admin user created');
    }

    // Seed default sync config
    const checkSyncConfig = await db.execute('SELECT * FROM sync_config WHERE id = 1');
    if (checkSyncConfig.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO sync_config (id, source_url, login_url, amember_login, amember_pass, updated_at)
             VALUES (1, ?, ?, ?, ?, ?)`,
        args: ['https://members.freelancerservice.site/content/p/id/173/', 'https://members.freelancerservice.site/login', 'vigneshsingaravelan@kyda.in', 'vigneshsingaravelan@kyda.in', new Date().toISOString()]
      });
    }

    // Seed initial sync status
    const checkStatus = await db.execute('SELECT * FROM sync_status WHERE id = 1');
    if (checkStatus.rows.length === 0) {
      await db.execute({ sql: 'INSERT INTO sync_status (id, message) VALUES (1, ?)', args: ['Worker initialized'] });
    }

    console.log('Database initialization complete');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}



// Database setup (Turso Cloud SQLite)
// NOTE: Data is stored in the Turso Cloud. This ensures persistence across server restarts and redeployments.
// DO NOT delete the authToken or change the URL unless migrating the database.
const db = createClient({
  url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

// Initialize database
initDb();


app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('<h1>Bharat Tools Hub API Server</h1><p>The server is running successfully. Please access the dashboard via your Vercel URL.</p>');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', version: BACKEND_VERSION, timestamp: new Date().toISOString() });
});

app.get('/api/version', (req, res) => {
  res.send(BACKEND_VERSION);
});

// --- Database Helper with Retry Logic ---
async function dbExecuteWithRetry(queryObj, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await db.execute(queryObj);
    } catch (err) {
      const isNetworkError = err.message.includes('ETIMEDOUT') || err.message.includes('ECONNRESET') || err.message.includes('fetch failed');
      if (isNetworkError && i < retries - 1) {
        console.warn(`[DB] Retry ${i + 1}/${retries} after error: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

// --- File Upload Setup ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'extension.zip');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed!'));
    }
  }
});

// Redundant initDb block removed

// --- Helpers ---
function createToken(user) {
  const expiresIn = user.role === 'admin' ? '7d' : '5m';
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });

    // Strict Access Check: Verify user still has active access in DB
    if (decoded.role === 'user') {
      try {
        const result = await db.execute({
          sql: 'SELECT access_expires_at FROM users WHERE id = ?',
          args: [decoded.id]
        });
        const user = result.rows[0];
        if (!user || !user.access_expires_at) {
          return res.status(403).json({ message: 'Access expired' });
        }
        const expires = new Date(user.access_expires_at);
        if (Number.isNaN(expires.getTime()) || new Date() > expires) {
          return res.status(403).json({ message: 'Access expired' });
        }
      } catch (dbErr) {
        console.error('Middleware DB check error:', dbErr);
        // Fail open or closed? Closed is safer for demo/paid access.
        return res.status(500).json({ message: 'Internal verification error' });
      }
    }

    req.user = decoded;
    next();
  });
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

// --- Auth routes ---
app.post('/api/auth/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const result = await db.execute({
      sql: `SELECT * FROM users WHERE email = ? OR username = ?`,
      args: [emailOrUsername, emailOrUsername]
    });

    const user = result.rows[0];

    if (!user) {
      console.log('Login attempt failed: User not found for', emailOrUsername);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      console.log('Login attempt failed: Incorrect password for', emailOrUsername);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if already logged in (Single Session Enforcement)
    // Robust exemption: Check input credentials, role AND username
    const inputId = String(emailOrUsername || '').toLowerCase().trim();
    const dbUsername = String(user.username || '').toLowerCase().trim();
    const dbRole = String(user.role || '').toLowerCase().trim();

    // Admin if input is 'admin' OR if database says role/username is 'admin'
    const isAdmin = inputId === 'admin' || inputId === 'admin@example.com' || dbUsername === 'admin' || dbRole === 'admin';

    // Extract IP Address
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    console.log(`Login debug: Input[${inputId}] DB[${dbUsername}] Role[${dbRole}] isAdmin[${isAdmin}] is_logged_in[${user.is_logged_in}] IP[${clientIp}] LastIP[${user.last_ip}]`);

    if (!isAdmin && Number(user.is_logged_in) === 1) {
      // If same IP, allow re-login (handles browser refresh/session loss)
      if (user.last_ip && user.last_ip === clientIp) {
        console.log(`Allowing re-login for ${user.username} from same IP: ${clientIp}`);
      } else {
        console.log(`Blocking login for ${user.username} - already logged in on IP: ${user.last_ip}, new IP: ${clientIp}`);
        return res.status(403).json({ message: 'Authentication error. User already logged in on another device. Contact administrator.' });
      }
    }

    // If normal user, require active access and check expiry
    if (user.role === 'user') {
      const now = new Date();

      // No access date at all = no active subscription
      if (!user.access_expires_at) {
        return res.status(403).json({ message: 'Your access expired please renew your subscription.' });
      }

      const expires = new Date(user.access_expires_at);
      if (Number.isNaN(expires.getTime()) || now > expires) {
        return res.status(403).json({ message: 'Your access expired please renew your subscription.' });
      }
    }

    // Set is_logged_in = 1 and update last_ip
    await db.execute({
      sql: `UPDATE users SET is_logged_in = 1, last_ip = ? WHERE id = ?`,
      args: [clientIp, user.id]
    });

    const token = createToken(user);
    console.log('Login successful for user:', user.username, 'Role:', user.role);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        access_expires_at: user.access_expires_at,
        mobile_number: user.mobile_number
      }
    });

  } catch (err) {
    console.error('Database error during login:', err);
    return res.status(500).json({ message: 'Database error. Please try again.' });
  }
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    await db.execute({
      sql: `UPDATE users SET is_logged_in = 0 WHERE id = ?`,
      args: [req.user.id]
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Error logging out:', err);
    return res.status(500).json({ message: 'Error logging out' });
  }
});

// --- Admin: manage users & access ---
app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT id, email, username, role, access_expires_at, mobile_number, is_logged_in, is_demo FROM users WHERE role = 'user'`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('DB error fetching users:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

app.get('/api/admin/sync-secret', authMiddleware, adminOnly, (req, res) => {
  res.json({ secret: SYNC_SECRET });
});

app.post('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  const { email, username, password, months, expiresAt, mobile_number, is_demo } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const hash = bcrypt.hashSync(password, 10);
  let access_expires_at = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ message: 'Invalid expiresAt date' });
    }
    access_expires_at = d.toISOString();
  } else if (months && months > 0) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    access_expires_at = d.toISOString();
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO users (email, username, password_hash, role, access_expires_at, mobile_number, is_demo)
            VALUES (?, ?, ?, 'user', ?, ?, ?)`,
      args: [email, username, hash, access_expires_at, mobile_number || null, is_demo ? 1 : 0]
    });
    res.status(201).json({ id: result.lastInsertRowid ? result.lastInsertRowid.toString() : null });
  } catch (err) {
    const errMsg = err.message.toLowerCase();
    if (errMsg.includes('unique constraint') || errMsg.includes('unique')) {
      if (errMsg.includes('email')) {
        return res.status(400).json({ message: 'Email already exists' });
      } else if (errMsg.includes('username')) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    console.error('Database error creating user:', err);
    return res.status(500).json({ message: 'Database error: ' + (err.message || 'Unknown error') });
  }
});

app.put('/api/admin/users/:id/access', authMiddleware, adminOnly, async (req, res) => {
  const { months, expiresAt, is_demo } = req.body;
  const { id } = req.params;

  let access_expires_at = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ message: 'Invalid expiresAt date' });
    }
    access_expires_at = d.toISOString();
  } else if (months && months > 0) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    access_expires_at = d.toISOString();
  }

  try {
    let sql = `UPDATE users SET access_expires_at = ? WHERE id = ? AND role = 'user'`;
    let args = [access_expires_at, id];

    if (is_demo !== undefined) {
      sql = `UPDATE users SET access_expires_at = ?, is_demo = ? WHERE id = ? AND role = 'user'`;
      args = [access_expires_at, is_demo ? 1 : 0, id];
    }

    const result = await db.execute({
      sql,
      args
    });
    res.json({ updated: result.rowsAffected });
  } catch (err) {
    console.error('DB error updating access:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: `DELETE FROM users WHERE id = ? AND role = 'user'`,
      args: [id]
    });
    res.json({ deleted: result.rowsAffected });
  } catch (err) {
    console.error('DB error deleting user:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// Admin Reset Session
app.post('/api/admin/users/:id/reset-session', authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: `UPDATE users SET is_logged_in = 0 WHERE id = ?`,
      args: [id]
    });
    res.json({ message: 'User session reset successfully', changes: result.rowsAffected });
  } catch (err) {
    console.error('DB error resetting session:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// --- Admin: manage Helium 10 session/cookies ---
app.get('/api/admin/helium10-session', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.execute(`SELECT session_json, updated_at FROM helium10_session WHERE id = 1`);
    const row = result.rows[0];
    if (!row) {
      return res.json({ sessionJson: '', updatedAt: null });
    }
    res.json({
      sessionJson: row.session_json,
      updatedAt: row.updated_at
    });
  } catch (err) {
    console.error('DB error fetching helium10 session:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

app.put('/api/admin/helium10-session', authMiddleware, adminOnly, async (req, res) => {
  const { sessionData } = req.body;

  if (!sessionData || typeof sessionData !== 'string') {
    return res.status(400).json({ message: 'sessionData (string) is required' });
  }

  const now = new Date().toISOString();

  try {
    await db.execute({
      sql: `INSERT INTO helium10_session (id, session_json, updated_at)
           VALUES (1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
      args: [sessionData, now]
    });
    res.json({ saved: true, updatedAt: now });
  } catch (err) {
    console.error('DB error saving helium10 session:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// Sync Debug & Trigger
app.get('/api/admin/sync-debug', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM sync_status WHERE id = 1');
    const row = result.rows[0];
    if (row) {
      res.json({
        lastSuccess: row.last_success,
        lastError: row.last_error,
        message: row.message,
        isSyncing: row.is_syncing === 1
      });
    } else {
      res.json({ message: 'No status found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'DB error fetching sync status' });
  }
});


app.post('/api/admin/sync-trigger', authMiddleware, adminOnly, async (req, res) => {
  console.log('[API] Manual sync triggered by admin');
  if (global.triggerBackgroundSync) {
    global.triggerBackgroundSync();
    res.json({ message: 'Sync triggered' });
  } else {
    console.warn('[API] Trigger failed: background worker not initialized');
    res.status(500).json({ message: 'Background worker not initialized' });
  }
});

app.get('/api/admin/sync-config', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM sync_config WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'DB error' });
  }
});

app.put('/api/admin/sync-config', authMiddleware, adminOnly, async (req, res) => {
  const { source_url, login_url, amember_login, amember_pass } = req.body;
  const now = new Date().toISOString();

  try {
    await db.execute({
      sql: `UPDATE sync_config SET 
            source_url = ?, 
            login_url = ?, 
            amember_login = ?, 
            amember_pass = ?, 
            updated_at = ? 
            WHERE id = 1`,
      args: [source_url, login_url, amember_login, amember_pass, now]
    });
    res.json({ success: true, updatedAt: now });
  } catch (err) {
    console.error('Update sync config error:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// --- Public: Automated token sync ---
app.post('/api/helium10-sync', async (req, res) => {
  const { sessionData, secret } = req.body;

  if (secret !== SYNC_SECRET) {
    return res.status(401).json({ message: 'Invalid sync secret' });
  }

  if (!sessionData || typeof sessionData !== 'string') {
    return res.status(400).json({ message: 'sessionData (string) is required' });
  }

  const now = new Date().toISOString();

  try {
    await db.execute({
      sql: `INSERT INTO helium10_session (id, session_json, updated_at)
           VALUES (1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
      args: [sessionData, now]
    });
    console.log('Automated Helium 10 session sync successful');
    res.json({ saved: true, updatedAt: now });
  } catch (err) {
    console.error('DB error syncing helium10 session:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// --- Admin: upload extension ---
app.post('/api/admin/upload-extension', authMiddleware, adminOnly, upload.single('extension'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const now = new Date().toISOString();
  try {
    await db.execute({
      sql: `INSERT INTO app_assets (id, filename, updated_at, file_size)
           VALUES ('extension_zip', ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET filename = excluded.filename, updated_at = excluded.updated_at, file_size = excluded.file_size`,
      args: ['extension.zip', now, req.file.size]
    });
    res.json({ message: 'Extension uploaded successfully', filename: req.file.filename, updatedAt: now });
  } catch (err) {
    console.error('DB error recording asset upload:', err);
    res.status(500).json({ message: 'File saved but failed to record metadata' });
  }
});

app.get('/api/admin/extension-meta', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.execute(`SELECT updated_at, file_size FROM app_assets WHERE id = 'extension_zip'`);
    res.json(result.rows[0] || { updated_at: null, file_size: null });
  } catch (err) {
    res.status(500).json({ message: 'DB error' });
  }
});

// --- User: fetch Helium 10 session for extension ---
app.get('/api/helium10-session', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute(`SELECT session_json, updated_at FROM helium10_session WHERE id = 1`);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Helium 10 session not configured by admin' });
    }
    res.json({
      sessionData: row.session_json,
      updatedAt: row.updated_at
    });
  } catch (err) {
    console.error('DB error fetching helium10 session:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// Example protected route for dashboard
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT id, email, username, role, access_expires_at, mobile_number FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error fetching current user:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

app.put('/api/user/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const result = await db.execute({
      sql: `SELECT password_hash FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    const user = result.rows[0];
    if (!user) return res.status(500).json({ message: 'User not found' });

    const ok = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Incorrect current password' });

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.execute({
      sql: `UPDATE users SET password_hash = ? WHERE id = ?`,
      args: [newHash, req.user.id]
    });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('DB error changing password:', err);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Download local extension
app.get('/api/download/extension', authMiddleware, (req, res) => {
  const filePath = path.join(uploadsDir, 'extension.zip');

  if (fs.existsSync(filePath)) {
    res.download(filePath, 'freelance_extension.zip', (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
    });
  } else {
    res.status(404).json({ message: 'Extension file not found on server. Admin needs to upload it first.' });
  }
});

// --- Fully Automated Background Sync (Source Site -> Dashboard) ---
async function startBackgroundSync() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }));

  async function performSync() {
    try {
      // LOG ATTEMPT
      await dbExecuteWithRetry({
        sql: 'INSERT INTO sync_logs (event, details) VALUES (?, ?)',
        args: ['Attempt', 'Starting background sync cycle']
      });

      // Check if already syncing + Stale worker protection (if stuck for >15 mins)
      const statusCheck = await dbExecuteWithRetry('SELECT is_syncing, last_success, message FROM sync_status WHERE id = 1');
      const status = statusCheck.rows[0];

      if (status?.is_syncing === 1) {
        const lastUpdate = new Date(status.last_success || 0).getTime();
        const nowTime = Date.now();
        if (nowTime - lastUpdate > 15 * 60 * 1000) {
          console.warn('[BackgroundSync] Worker seems stale. Forcing reset.');
          await dbExecuteWithRetry({
            sql: 'INSERT INTO sync_logs (event, details) VALUES (?, ?)',
            args: ['Recovery', 'Forcing reset of stale is_syncing flag']
          });
        } else {
          await dbExecuteWithRetry({
            sql: 'INSERT INTO sync_logs (event, details) VALUES (?, ?)',
            args: ['Skip', 'Already syncing (active)']
          });
          return;
        }
      }

      // Set syncing state
      await dbExecuteWithRetry({
        sql: 'UPDATE sync_status SET is_syncing = 1, message = ? WHERE id = 1',
        args: ['Syncing...']
      });

      console.log('[BackgroundSync] Starting automated synchronization...');

      // Fetch latest config from DB
      const configResult = await dbExecuteWithRetry('SELECT * FROM sync_config WHERE id = 1');
      const config = configResult.rows[0];

      if (!config) {
        throw new Error('Sync configuration missing in database');
      }

      const { source_url, login_url, amember_login, amember_pass } = config;
      // Step A: Attempt direct extraction
      console.log(`[BackgroundSync] Step A: Checking session reuse at ${source_url}...`);
      let contentPageRes;
      try {
        contentPageRes = await client.get(source_url, { timeout: 20000, responseType: 'text' });
      } catch (err) {
        console.warn(`[BackgroundSync] Initial check timed out or failed: ${err.message}. Proceeding to login.`);
        contentPageRes = { data: '' }; // Force login flow
      }
      let tokenMatch = contentPageRes.data.match(/var copyText = ["'](brandseotools.*?)["']/);
      let token = tokenMatch ? tokenMatch[1] : null;

      if (!token) {
        console.log('[BackgroundSync] Session expired. Performing full login flow...');
        const loginPageRes = await client.get(login_url, { timeout: 10000, responseType: 'text' });
        const attemptIdMatch = loginPageRes.data.match(/name="login_attempt_id" value="(.*?)"/);
        const attemptId = attemptIdMatch ? attemptIdMatch[1] : null;

        if (!attemptId) throw new Error('Failed to find login_attempt_id');

        const formData = new URLSearchParams();
        formData.append('amember_login', amember_login);
        formData.append('amember_pass', amember_pass);
        formData.append('login_attempt_id', attemptId);

        const loginRes = await client.post(login_url, formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://members.freelancerservice.site',
            'Referer': login_url
          },
          maxRedirects: 5,
          timeout: 20000
        });

        console.log(`[BackgroundSync] Login POST status: ${loginRes.status}`);

        // --- Session Verification Step ---
        console.log('[BackgroundSync] Step B: Verifying session at /member...');
        const verifyRes = await client.get('https://members.freelancerservice.site/member', { timeout: 20000 });
        const isLogged = verifyRes.data.includes('logout') || verifyRes.data.includes('Logout');
        const pageTitle = (verifyRes.data.match(/<title>(.*?)<\/title>/i) || [])[1] || 'Unknown';

        console.log(`[BackgroundSync] Step C: Session active at /member: ${isLogged}`);

        // Log this state to DB for remote debugging
        await dbExecuteWithRetry({
          sql: 'INSERT INTO sync_logs (event, details) VALUES (?, ?)',
          args: ['Diagnostic', `Session @ /member: ${isLogged}, Title: ${pageTitle}`]
        });

        if (!isLogged) {
          console.error('[BackgroundSync] Login appeared successful but session is missing at /member.');
          // Don't throw yet, try the content page anyway in case /member is weird
        }

        // --- Final Extraction ---
        console.log(`[BackgroundSync] Step D: Fetching content with active session: ${source_url}`);
        contentPageRes = await client.get(source_url, {
          headers: { 'Referer': 'https://members.freelancerservice.site/member' },
          timeout: 20000,
          responseType: 'text'
        });

        // Even more permissive regex: handles whitespace, optional var, and any quotes
        tokenMatch = contentPageRes.data.match(/(?:var\s+)?copyText\s*=\s*["']\s*(brandseotools.*?)\s*["']/s);
        token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
          console.log('[BackgroundSync] First regex fail. Checking for raw token snippet...');
          const altMatch = contentPageRes.data.match(/brandseotools\(created-by-premiumtools\.shop\)[^"']+/);
          token = altMatch ? altMatch[0] : null;
        }
      }

      if (!token) {
        console.error('[BackgroundSync] Final extraction failed. Status:', contentPageRes.status);
        console.error('[BackgroundSync] Page Sample (1000 chars):', contentPageRes.data.substring(0, 1000));

        if (contentPageRes.data.includes('Cloudflare') || contentPageRes.data.includes('Access Denied')) {
          throw new Error('Blocked by security firewall (Cloudflare/Access Denied)');
        }

        throw new Error('Failed to extract token after login (Regex mismatch)');
      }

      // 4. Update Database
      const now = new Date().toISOString();
      await dbExecuteWithRetry({
        sql: `INSERT INTO helium10_session (id, session_json, updated_at) 
             VALUES (1, ?, ?) 
             ON CONFLICT(id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
        args: [token.trim(), now]
      });

      await dbExecuteWithRetry({
        sql: 'UPDATE sync_status SET last_success = ?, last_error = NULL, message = ?, is_syncing = 0 WHERE id = 1',
        args: [now, 'Success']
      });

      await dbExecuteWithRetry({
        sql: 'INSERT INTO sync_logs (event, details) VALUES (?, ?)',
        args: ['Success', `Synced at ${new Date().toLocaleString()}`]
      });

      console.log('[BackgroundSync] ✅ Successfully synced token');
    } catch (err) {
      console.error('[BackgroundSync] ❌ Sync error:', err.message);
      await dbExecuteWithRetry({
        sql: 'UPDATE sync_status SET last_error = ?, message = ?, is_syncing = 0 WHERE id = 1',
        args: [err.message, 'Error: ' + err.message]
      }).catch(e => console.error('[Fatal] Could not update sync_status with error:', e.message));

      await dbExecuteWithRetry({
        sql: 'INSERT INTO sync_logs (event, details) VALUES (?, ?)',
        args: ['Error', err.message]
      }).catch(() => { });
    } finally {
      // Ensure syncing flag is reset even on fatal database blowups if possible
      try {
        await db.execute('UPDATE sync_status SET is_syncing = 0 WHERE id = 1');
      } catch (e) { /* total db failure */ }
    }
  }

  global.triggerBackgroundSync = performSync;

  // Perform initial sync on startup
  setTimeout(performSync, 5000); // Wait 5s for server to settle

  // Schedule every 5 minutes
  console.log('[BackgroundSync] Worker scheduled for every 5 minutes');
  setInterval(performSync, 5 * 60 * 1000);
}

// --- Keep-Alive Pinger ---
function startPinger() {
  const RENDER_URL = 'https://dashboard-project-uzmg.onrender.com/api/health';
  console.log('[Pinger] Starting self-pinger to:', RENDER_URL);
  setInterval(async () => {
    try {
      await axios.get(RENDER_URL);
      console.log('[Pinger] ✅ Self-ping successful');
    } catch (err) {
      console.error('[Pinger] ❌ Self-ping failed:', err.message);
    }
  }, 1 * 60 * 1000); // Reduce to 1 minute for maximum wakefulness
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Default admin credentials:');
  console.log('  Username: admin');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin1239');

  // Start the background worker
  startBackgroundSync();

  // Start self-pinger to prevent Render sleep
  startPinger();
});


