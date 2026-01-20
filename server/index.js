const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');
const path = require('path');
const https = require('https');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const SYNC_SECRET = process.env.SYNC_SECRET || 'helium_sync_default_secret_9988';
const BACKEND_VERSION = 'v1.1.2-cloud-sync';

// Database setup (Turso Cloud SQLite)
const db = createClient({
  url: 'libsql://dashboard-db-shulpextechnology-design.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg4OTAwODUsImlkIjoiMWJjYTk0ZjctY2M4MS00OGI5LWEyNTQtNmVhOGJlNTRhN2YzIiwicmlkIjoiMGI0YTc4NmUtNjlmOS00OWJiLWIxOTYtZDljZjllMWQzY2YyIn0.o8tpPd4pxTCjMLR6i4jAG3DXb6AEZ986E9StxKNfMOO-EHrecuA89E2BsC0sHMkxd7eAA3Dohw_UOZG_Ic5KAQ'
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', version: BACKEND_VERSION });
});

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

// --- Database Initialization ---
async function initDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        access_expires_at TEXT,
        mobile_number TEXT,
        is_logged_in INTEGER DEFAULT 0
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS helium10_session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        session_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Reset login status on restart
    await db.execute('UPDATE users SET is_logged_in = 0');

    // Seed default admin
    const adminEmail = 'admin@example.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const adminHash = bcrypt.hashSync(adminPassword, 10);

    const checkAdmin = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [adminUsername]
    });

    if (checkAdmin.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, 'admin')`,
        args: [adminEmail, adminUsername, adminHash]
      });
      console.log('Default admin user created');
    }

    // Seed default Helium 10 session token
    const defaultHeliumToken = `brandseotools(created-by-premiumtools.shop) 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_-18rSAZTA==`;
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT OR IGNORE INTO helium10_session (id, session_json, updated_at) VALUES (1, ?, ?)`,
      args: [defaultHeliumToken, now]
    });
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error during DB initialization:', err);
  }
}
initDb();

// --- Helpers ---
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
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
    // Robust exemption: Check role OR hardcoded 'admin' username to be safe
    const dbUsername = String(user.username || '').toLowerCase().trim();
    const dbRole = String(user.role || '').toLowerCase().trim();
    const isAdmin = dbUsername === 'admin' || dbRole === 'admin';

    console.log(`Login debug: ${dbUsername} | role: ${dbRole} | isAdmin: ${isAdmin} | is_logged_in: ${user.is_logged_in}`);

    if (!isAdmin && Number(user.is_logged_in) === 1) {
      console.log(`Blocking login for ${user.username} - already logged in`);
      return res.status(403).json({ message: 'Authentication error. User already logged in on another device. Contact administrator.' });
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

    // Set is_logged_in = 1
    await db.execute({
      sql: `UPDATE users SET is_logged_in = 1 WHERE id = ?`,
      args: [user.id]
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
      `SELECT id, email, username, role, access_expires_at, mobile_number, is_logged_in FROM users WHERE role = 'user'`
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
  const { email, username, password, months, expiresAt, mobile_number } = req.body;
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
      sql: `INSERT INTO users (email, username, password_hash, role, access_expires_at, mobile_number)
            VALUES (?, ?, ?, 'user', ?, ?)`,
      args: [email, username, hash, access_expires_at, mobile_number || null]
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
  const { months, expiresAt } = req.body;
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
    const result = await db.execute({
      sql: `UPDATE users SET access_expires_at = ? WHERE id = ? AND role = 'user'`,
      args: [access_expires_at, id]
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
app.post('/api/admin/upload-extension', authMiddleware, adminOnly, upload.single('extension'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ message: 'Extension uploaded successfully', filename: req.file.filename });
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Default admin credentials:');
  console.log('  Username: admin');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
});


