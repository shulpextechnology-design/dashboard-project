const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const SYNC_SECRET = process.env.SYNC_SECRET || 'helium_sync_default_secret_9988';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
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

// --- Database setup ---
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
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

  // Global Helium 10 session storage (admin-managed)
  db.run(`
    CREATE TABLE IF NOT EXISTS helium10_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      session_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Seed default admin
  const adminEmail = 'admin@example.com';
  const adminUsername = 'admin';
  const adminPassword = 'admin123';
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  db.run(
    `INSERT OR IGNORE INTO users (email, username, password_hash, role)
     VALUES (?, ?, ?, 'admin')`,
    [adminEmail, adminUsername, adminHash],
    function (err) {
      if (err) {
        console.error('Error creating admin user:', err);
      } else if (this.changes > 0) {
        console.log('Default admin user created:', adminUsername);
      } else {
        console.log('Admin user already exists');
      }
    }
  );
});

// Add mobile_number column if it doesn't exist
db.run(`ALTER TABLE users ADD COLUMN mobile_number TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding mobile_number column:', err.message);
  }
});

// Add is_logged_in column if it doesn't exist
db.run(`ALTER TABLE users ADD COLUMN is_logged_in INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding is_logged_in column:', err.message);
  } else {
    // Reset all login statuses on server restart to avoid lockouts
    db.run(`UPDATE users SET is_logged_in = 0`);
  }
});

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
app.post('/api/auth/login', (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  db.get(
    `SELECT * FROM users WHERE email = ? OR username = ?`,
    [emailOrUsername, emailOrUsername],
    (err, user) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ message: 'Database error. Please try again.' });
      }

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
      // Exempt administrators from this restriction as requested
      if (user.role !== 'admin' && user.is_logged_in === 1) {
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
      db.run(`UPDATE users SET is_logged_in = 1 WHERE id = ?`, [user.id], (updateErr) => {
        if (updateErr) {
          console.error('Error updating login status:', updateErr);
          return res.status(500).json({ message: 'Database error setting login status' });
        }

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
      });
    }
  );
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  db.run(`UPDATE users SET is_logged_in = 0 WHERE id = ?`, [req.user.id], (err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// --- Admin: manage users & access ---
app.get('/api/admin/users', authMiddleware, adminOnly, (req, res) => {
  db.all(
    `SELECT id, email, username, role, access_expires_at, mobile_number, is_logged_in FROM users WHERE role = 'user'`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    }
  );
});

app.get('/api/admin/sync-secret', authMiddleware, adminOnly, (req, res) => {
  res.json({ secret: SYNC_SECRET });
});

app.post('/api/admin/users', authMiddleware, adminOnly, (req, res) => {
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

  db.run(
    `INSERT INTO users (email, username, password_hash, role, access_expires_at, mobile_number)
     VALUES (?, ?, ?, 'user', ?, ?)`,
    [email, username, hash, access_expires_at, mobile_number || null],
    function (err) {
      if (err) {
        // SQLite error handling - check for UNIQUE constraint violations
        const errMsg = err.message.toLowerCase();
        const errCode = err.code;

        // Check for UNIQUE constraint violations
        if (errCode === 'SQLITE_CONSTRAINT' || errCode === 'SQLITE_CONSTRAINT_UNIQUE' ||
          errMsg.includes('unique constraint') || errMsg.includes('unique')) {
          if (errMsg.includes('email')) {
            return res.status(400).json({ message: 'Email already exists' });
          } else if (errMsg.includes('username')) {
            return res.status(400).json({ message: 'Username already exists' });
          }
          return res.status(400).json({ message: 'Email or username already exists' });
        }

        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error: ' + (err.message || 'Unknown error') });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/admin/users/:id/access', authMiddleware, adminOnly, (req, res) => {
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

  db.run(
    `UPDATE users SET access_expires_at = ? WHERE id = ? AND role = 'user'`,
    [access_expires_at, id],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/admin/users/:id', authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  db.run(
    `DELETE FROM users WHERE id = ? AND role = 'user'`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ deleted: this.changes });
    }
  );
});

// Admin Reset Session
app.post('/api/admin/users/:id/reset-session', authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  db.run(
    `UPDATE users SET is_logged_in = 0 WHERE id = ?`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ message: 'User session reset successfully', changes: this.changes });
    }
  );
});

// --- Admin: manage Helium 10 session/cookies ---
app.get('/api/admin/helium10-session', authMiddleware, adminOnly, (req, res) => {
  db.get(
    `SELECT session_json, updated_at FROM helium10_session WHERE id = 1`,
    (err, row) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (!row) {
        return res.json({ sessionJson: '', updatedAt: null });
      }
      res.json({
        sessionJson: row.session_json,
        updatedAt: row.updated_at
      });
    }
  );
});

app.put('/api/admin/helium10-session', authMiddleware, adminOnly, (req, res) => {
  const { sessionData } = req.body;

  if (!sessionData || typeof sessionData !== 'string') {
    return res.status(400).json({ message: 'sessionData (string) is required' });
  }

  const now = new Date().toISOString();

  // Store the raw string. It could be JSON or an already encrypted token.
  db.run(
    `INSERT INTO helium10_session (id, session_json, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
    [sessionData, now],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json({ saved: true, updatedAt: now });
    }
  );
});

// --- Public: Automated token sync ---
app.post('/api/helium10-sync', (req, res) => {
  const { sessionData, secret } = req.body;

  if (secret !== SYNC_SECRET) {
    return res.status(401).json({ message: 'Invalid sync secret' });
  }

  if (!sessionData || typeof sessionData !== 'string') {
    return res.status(400).json({ message: 'sessionData (string) is required' });
  }

  const now = new Date().toISOString();

  db.run(
    `INSERT INTO helium10_session (id, session_json, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET session_json = excluded.session_json, updated_at = excluded.updated_at`,
    [sessionData, now],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      console.log('Automated Helium 10 session sync successful');
      res.json({ saved: true, updatedAt: now });
    }
  );
});

// --- Admin: upload extension ---
app.post('/api/admin/upload-extension', authMiddleware, adminOnly, upload.single('extension'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ message: 'Extension uploaded successfully', filename: req.file.filename });
});

// --- User: fetch Helium 10 session for extension ---
app.get('/api/helium10-session', authMiddleware, (req, res) => {
  db.get(
    `SELECT session_json, updated_at FROM helium10_session WHERE id = 1`,
    (err, row) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (!row) {
        return res.status(404).json({ message: 'Helium 10 session not configured by admin' });
      }

      // Return the raw data. It might be JSON or a raw encrypted token.
      res.json({
        sessionData: row.session_json,
        updatedAt: row.updated_at
      });
    }
  );
});

// Example protected route for dashboard
app.get('/api/me', authMiddleware, (req, res) => {
  db.get(
    `SELECT id, email, username, role, access_expires_at, mobile_number FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(user);
    }
  );
});

app.put('/api/user/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  db.get(`SELECT password_hash FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(500).json({ message: 'User not found' });

    const ok = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Incorrect current password' });

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, req.user.id], function (err) {
      if (err) return res.status(500).json({ message: 'Failed to update password' });
      res.json({ message: 'Password updated successfully' });
    });
  });
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

// Verify admin user exists on startup
db.get(
  `SELECT * FROM users WHERE username = 'admin' OR email = 'admin@example.com'`,
  (err, admin) => {
    if (err) {
      console.error('Error checking admin user:', err);
    } else if (!admin) {
      console.warn('WARNING: Admin user not found! Creating now...');
      const adminEmail = 'admin@example.com';
      const adminUsername = 'admin';
      const adminPassword = 'admin123';
      const adminHash = bcrypt.hashSync(adminPassword, 10);
      db.run(
        `INSERT INTO users (email, username, password_hash, role)
         VALUES (?, ?, ?, 'admin')`,
        [adminEmail, adminUsername, adminHash],
        function (insertErr) {
          if (insertErr) {
            console.error('Failed to create admin user:', insertErr);
          } else {
            console.log('Admin user created successfully');
          }
        }
      );
    } else {
      console.log('Admin user verified:', admin.username);
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Default admin credentials:');
  console.log('  Username: admin');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
});


