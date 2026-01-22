import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users,
  UserPlus,
  Key,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Upload,
  UserCheck,
  UserX,
  Timer,
  Zap
} from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    mobile_number: '',
    months: 1,
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [heliumSessionJson, setHeliumSessionJson] = useState('');
  const [heliumSessionUpdatedAt, setHeliumSessionUpdatedAt] = useState('');
  const [heliumSaving, setHeliumSaving] = useState(false);
  const [extensionFile, setExtensionFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [syncSecret, setSyncSecret] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'expired', or 'today'

  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
      setError('');
    } catch (e) {
      setError('Failed to load users');
    }
  };

  const loadHeliumSession = async () => {
    try {
      const res = await axios.get('/api/admin/helium10-session');
      if (res.data) {
        setHeliumSessionJson(res.data.sessionJson || '');
        setHeliumSessionUpdatedAt(res.data.updatedAt || '');
      }
    } catch (e) {
      console.error('Failed to load Helium10 session', e);
    }
  };

  const loadSyncSecret = async () => {
    try {
      const res = await axios.get('/api/admin/sync-secret');
      setSyncSecret(res.data.secret);
    } catch (e) {
      console.error('Failed to load sync secret', e);
    }
  };

  useEffect(() => {
    loadUsers();
    loadHeliumSession();
    loadSyncSecret();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/admin/users', {
        email: form.email,
        username: form.username,
        password: form.password,
        mobile_number: form.mobile_number,
        months: Number(form.months),
        expiresAt: form.expiresAt || undefined
      });
      setForm({ email: '', username: '', password: '', mobile_number: '', months: 1, expiresAt: '' });
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const updateAccess = async (id, months) => {
    try {
      await axios.put(`/api/admin/users/${id}/access`, { months });
      loadUsers();
    } catch (e) {
      alert('Failed to update access');
    }
  };

  const updateAccessDate = async (id, current) => {
    const suggested = current ? new Date(current).toISOString().slice(0, 10) : '';
    const input = window.prompt('Enter expiry date (YYYY-MM-DD):', suggested);
    if (!input) return;
    try {
      await axios.put(`/api/admin/users/${id}/access`, { expiresAt: input });
      loadUsers();
    } catch (e) {
      alert('Failed to set custom date');
    }
  };

  const handleSaveHeliumSession = async (e) => {
    e.preventDefault();
    setHeliumSaving(true);
    try {
      let cleanedData = heliumSessionJson.trim();
      const OMNIBOX_KEYWORD = 'brandseotools(created-by-premiumtools.shop)';
      const AES_KEY = 'brandseotools(created-by-premiumtools.shop)iLFB0yJSdidhLStH6tNcfXMqo7L8qkdofk';

      if (cleanedData.startsWith(OMNIBOX_KEYWORD)) {
        const payload = cleanedData.split(/\s+/).slice(1).join('').replace(/\s/g, '');
        if (window.CryptoJS) {
          const bytes = window.CryptoJS.AES.decrypt(payload, AES_KEY);
          if (!bytes.toString(window.CryptoJS.enc.Utf8)) throw new Error('Decryption failed');
        }
        cleanedData = OMNIBOX_KEYWORD + ' ' + payload;
      }

      await axios.put('/api/admin/helium10-session', { sessionData: cleanedData });
      alert('Helium 10 session updated successfully!');
      loadHeliumSession();
    } catch (e) {
      alert('Error: ' + (e.message || 'Failed to update session'));
    } finally {
      setHeliumSaving(false);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm('Remove this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      loadUsers();
    } catch (e) {
      alert('Failed to remove user');
    }
  };

  const resetSession = async (id) => {
    if (!window.confirm('Reset this user session? This will allow them to login again if they were locked out.')) return;
    try {
      await axios.post(`/api/admin/users/${id}/reset-session`);
      alert('User session reset successfully.');
      loadUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reset session');
    }
  };

  const handleExtensionUpload = async (e) => {
    e.preventDefault();
    if (!extensionFile) return alert('Please select a file');

    const formData = new FormData();
    formData.append('extension', extensionFile);

    setUploading(true);
    try {
      const res = await axios.post('/api/admin/upload-extension', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      setExtensionFile(null);
      if (document.getElementById('extension-file-input')) {
        document.getElementById('extension-file-input').value = '';
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-page-v2">
      <div className="page-header-v2">
        <ShieldCheck size={32} color="#0b9d86" />
        <div>
          <h1>Admin Control Panel</h1>
          <p>Manage users and synchronize tool sessions.</p>
        </div>
      </div>

      <div className="admin-grid-v2">
        {/* User Creation Card */}
        <section className="admin-card-v2">
          <div className="card-header-v2">
            <UserPlus size={20} />
            <h2>Enroll New User</h2>
          </div>
          <form className="admin-form-v2" onSubmit={handleCreate}>
            <div className="form-row-v2">
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-row-v2">
              <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <input placeholder="Mobile Phone" type="tel" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} />
            </div>
            <div className="form-row-v2">
              <input type="number" min="0" placeholder="Initial Access Months" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} />
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? 'Processing...' : 'Create User Account'}
            </button>
            {error && <div className="error-msg-v2"><AlertCircle size={14} /> {error}</div>}
          </form>
        </section>

        {/* Helium 10 Session Card */}
        <section className="admin-card-v2">
          <div className="card-header-v2">
            <Key size={20} />
            <h2>Session Synchronization</h2>
          </div>
          <div className="helium-sync-v2">
            <p>Paste the latest Encrypted Token or Cookie JSON to sync with extensions.</p>
            <textarea
              rows={6}
              value={heliumSessionJson}
              onChange={(e) => setHeliumSessionJson(e.target.value)}
              placeholder='Paste token here...'
            />
            <div className="sync-footer-v2">
              <span className="last-updated-v2">
                <Clock size={14} />
                {heliumSessionUpdatedAt ? `Updated: ${new Date(heliumSessionUpdatedAt).toLocaleString()}` : 'Not configured'}
              </span>
              <button className="sync-btn-v2" onClick={handleSaveHeliumSession} disabled={heliumSaving}>
                {heliumSaving ? 'Saving...' : 'Sync Session'}
              </button>
            </div>
          </div>
        </section>

        {/* Extension Upload Card */}
        <section className="admin-card-v2">
          <div className="card-header-v2">
            <Upload size={20} />
            <h2>Extension Management</h2>
          </div>
          <div className="admin-form-v2">
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
              Upload the latest .zip file for users to download.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                id="extension-file-input"
                type="file"
                accept=".zip"
                onChange={(e) => setExtensionFile(e.target.files[0])}
                style={{ fontSize: '13px' }}
              />
              <button
                className="admin-submit-btn"
                onClick={handleExtensionUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Extension Zip'}
              </button>
            </div>
          </div>
        </section>

        {/* Auto-Sync Card */}
        <section className="admin-card-v2">
          <div className="card-header-v2">
            <Zap size={20} />
            <h2>Auto-Sync Setup</h2>
          </div>
          <div className="admin-form-v2">
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Automate Helium 10 updates from the original project. Use this script in <strong>Tampermonkey</strong> or as a <strong>Bookmarklet</strong> on the source page.
            </p>

            <div className="sync-info-box-v2">
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b9d86', marginBottom: '4px' }}>Sync Secret</div>
              <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'block' }}>
                {syncSecret || 'Loading...'}
              </code>
            </div>

            <button
              className="admin-submit-btn"
              style={{ background: '#1e293b', marginTop: '16px' }}
              onClick={() => {
                const script = `
// ==UserScript==
// @name         Helium 10 Auto-Sync (Freelancer Service)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Automatically sync Helium 10 session tokens to your dashboard.
// @author       Antigravity
// @match        https://members.freelancerservice.site/content/p/id/173/*
// @grant        GM_xmlhttpRequest
// @connect      ${window.location.hostname}
// ==/UserScript==

(function() {
    'use strict';

    const SYNC_URL = '${window.location.origin}/api/helium10-sync';
    const SECRET = '${syncSecret}';
    let lastSyncedToken = '';

    console.log('[Sync] Automatic synchronization started...');

    setInterval(async () => {
        try {
            // 1. Try to find the 'copyText' variable globally or in script tags
            let token = window.copyText;
            
            if (!token) {
                const scripts = Array.from(document.querySelectorAll('script'));
                const targetScript = scripts.find(s => s.textContent.includes('var copyText = "brandseotools'));
                if (targetScript) {
                    const match = targetScript.textContent.match(/var copyText = "(.*?)";/);
                    if (match) token = match[1];
                }
            }

            if (token && token !== lastSyncedToken) {
                console.log('[Sync] New token detected! Sending to dashboard...');
                
                GM_xmlhttpRequest({
                    method: "POST",
                    url: SYNC_URL,
                    data: JSON.stringify({ sessionData: token, secret: SECRET }),
                    headers: { "Content-Type": "application/json" },
                    onload: function(response) {
                        const res = JSON.parse(response.responseText);
                        if (res.saved) {
                            console.log('[Sync] ✅ Successfully synced with dashboard.');
                            lastSyncedToken = token;
                            showSyncStatus("Sync Success: " + new Date().toLocaleTimeString());
                        } else {
                            console.error('[Sync] ❌ Sync failed:', res.message);
                        }
                    },
                    onerror: function(err) {
                        console.error('[Sync] ❌ Network error during sync:', err);
                    }
                });
            }
        } catch (e) {
            console.error('[Sync] Error during check:', e);
        }
    }, 5000);

    function showSyncStatus(msg) {
        let el = document.getElementById('sync-status-indicator');
        if (!el) {
            el = document.createElement('div');
            el.id = 'sync-status-indicator';
            el.style = 'position:fixed;bottom:10px;left:10px;background:#0b9d86;color:white;padding:5px 10px;border-radius:5px;font-size:12px;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.2);font-family:sans-serif;';
            document.body.appendChild(el);
        }
        el.innerText = msg;
        setTimeout(() => { el.style.opacity = '0.5'; }, 3000);
        setTimeout(() => { el.style.opacity = '1'; }, 0);
    }
})();`.trim();
                navigator.clipboard.writeText(script);
                alert('Advanced Tampermonkey script copied to clipboard! Paste it into a new Tampermonkey script on the source project.');
              }}
            >
              Copy Advanced Auto-Sync Script
            </button>
          </div>
        </section>
      </div>

      {/* Users Table Card */}
      <section className="admin-card-v2 full-width-v2">
        <div className="card-header-v2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20} />
            <h2>User Management</h2>
          </div>

          <div className="admin-tabs-v2">
            <button
              className={`admin-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <UserCheck size={16} />
              Active Users
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
              onClick={() => setActiveTab('expired')}
            >
              <UserX size={16} />
              All Expired
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              <Timer size={16} />
              Expired Today
            </button>
          </div>
        </div>

        <div className="table-responsive-v2">
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Access Expiry</th>
                <th>Status</th>
                <th>Management Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => {
                  const now = new Date();
                  const isExpired = !u.access_expires_at || new Date(u.access_expires_at) < now;

                  if (activeTab === 'active') return !isExpired;

                  if (activeTab === 'today') {
                    if (!u.access_expires_at) return false;
                    const expiryDate = new Date(u.access_expires_at);
                    const isSameDay = expiryDate.toDateString() === now.toDateString();
                    return isExpired && isSameDay;
                  }

                  return isExpired;
                })
                .map((u) => (
                  <tr key={u.id}>
                    <td><div className="user-cell-v2">{u.username}</div></td>
                    <td>{u.email}</td>
                    <td>{u.mobile_number || 'N/A'}</td>
                    <td>
                      <div className="expiry-cell-v2">
                        <Calendar size={14} />
                        {u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString() : 'Inactive'}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: u.is_logged_in ? '#fee2e2' : '#dcfce7',
                        color: u.is_logged_in ? '#ef4444' : '#166534'
                      }}>
                        {u.is_logged_in ? 'Logged In' : 'Offline'}
                      </span>
                    </td>
                    <td className="action-cell-v2">
                      <button className="mgmt-btn extend-btn" onClick={() => updateAccess(u.id, 1)}>+1 mo</button>
                      <button className="mgmt-btn date-btn" onClick={() => updateAccessDate(u.id, u.access_expires_at)}>Set Date</button>
                      <button className="mgmt-btn" style={{ background: '#f59e0b', color: 'white' }} onClick={() => resetSession(u.id)}>Reset Session</button>
                      <button className="mgmt-btn revoke-btn" onClick={() => updateAccess(u.id, 0)}>Revoke</button>
                      <button className="mgmt-btn delete-btn" onClick={() => removeUser(u.id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
