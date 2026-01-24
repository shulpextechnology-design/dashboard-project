import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
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
  Zap,
  Download,
  LayoutDashboard,
  Settings,
  Activity,
  RefreshCw
} from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    mobile_number: '',
    months: 1,
    is_demo: false,
    expiresAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [heliumSessionJson, setHeliumSessionJson] = useState('');
  const [heliumSessionUpdatedAt, setHeliumSessionUpdatedAt] = useState('');
  const [heliumSaving, setHeliumSaving] = useState(false);
  const [extensionFile, setExtensionFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lastUploaded, setLastUploaded] = useState(null);
  const [syncSecret, setSyncSecret] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'expired', 'today', or 'demo'
  const [syncStatus, setSyncStatus] = useState({ message: 'Loading...', lastSuccess: null, lastError: null, isSyncing: false });
  const [syncConfig, setSyncConfig] = useState({
    source_url: '',
    login_url: '',
    amember_login: '',
    amember_pass: ''
  });
  const [syncConfigLoading, setSyncConfigLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard', 'users', 'sync', 'settings'

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

  const loadSyncStatus = async () => {
    try {
      const res = await axios.get('/api/admin/sync-debug');
      setSyncStatus(res.data);
    } catch (e) {
      console.error('Failed to load sync status', e);
    }
  };

  const loadSyncConfig = async () => {
    try {
      const res = await axios.get('/api/admin/sync-config');
      setSyncConfig(res.data);
    } catch (e) {
      console.error('Failed to load sync config', e);
    }
  };

  const loadExtensionMeta = async () => {
    try {
      const res = await axios.get('/api/admin/extension-meta');
      setLastUploaded(res.data.updated_at);
    } catch (e) {
      console.error('Failed to load extension meta', e);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, message: 'Syncing...' }));
      await axios.post('/api/admin/sync-trigger');

      // Fast Polling
      let attempts = 0;
      const poll = setInterval(async () => {
        const res = await axios.get('/api/admin/sync-debug');
        setSyncStatus(res.data);
        attempts++;
        if (!res.data.isSyncing || attempts > 10) {
          clearInterval(poll);
        }
      }, 500);
    } catch (e) {
      alert('Failed to trigger sync: ' + (e.response?.data?.message || e.message));
    }
  };

  useEffect(() => {
    loadUsers();
    loadHeliumSession();
    loadSyncSecret();
    loadSyncStatus();
    loadSyncConfig();
    loadExtensionMeta();
    const interval = setInterval(() => {
      loadSyncStatus();
      loadHeliumSession();
    }, 30000);
    return () => clearInterval(interval);
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
        is_demo: form.is_demo,
        expiresAt: form.expiresAt || undefined
      });
      setForm({ email: '', username: '', password: '', mobile_number: '', months: 1, is_demo: false, expiresAt: '' });
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

  const handleGrantDemo = async (id) => {
    if (!window.confirm('Grant 15 minutes of demo access to this user?')) return;
    try {
      const demoExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await axios.put(`/api/admin/users/${id}/access`, { expiresAt: demoExpiry, is_demo: true });
      alert('15-minute demo access granted!');
      loadUsers();
    } catch (e) {
      alert('Failed to grant demo access');
    }
  };

  const handleSaveHeliumSession = async (e) => {
    e.preventDefault();
    setHeliumSaving(true);
    try {
      let cleanedData = heliumSessionJson.trim();
      await axios.put('/api/admin/helium10-session', { sessionData: cleanedData });
      alert('Helium 10 session updated!');
      loadHeliumSession();
    } catch (e) {
      alert('Failed to update session');
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
    if (!window.confirm('Reset this user session?')) return;
    try {
      await axios.post(`/api/admin/users/${id}/reset-session`);
      alert('Session reset.');
      loadUsers();
    } catch (e) {
      alert('Failed to reset session');
    }
  };

  const handleSaveSyncConfig = async (e) => {
    e.preventDefault();
    setSyncConfigLoading(true);
    try {
      await axios.put('/api/admin/sync-config', syncConfig);
      alert('Config updated!');
    } catch (e) {
      alert('Failed to update config');
    } finally {
      setSyncConfigLoading(false);
    }
  };

  const handleExtensionUpload = async (e) => {
    e.preventDefault();
    if (!extensionFile) return alert('Select a file');
    const formData = new FormData();
    formData.append('extension', extensionFile);
    setUploading(true);
    try {
      const res = await axios.post('/api/admin/upload-extension', formData);
      alert(res.data.message);
      setLastUploaded(res.data.updatedAt);
      setExtensionFile(null);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadExcel = () => {
    const excelData = users.map(u => ({
      'Username': u.username,
      'Email': u.email,
      'Mobile': u.mobile_number || 'N/A',
      'Expiry': u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString() : 'Inactive',
      'Status': u.is_logged_in ? 'Online' : 'Offline'
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, `Users_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="admin-page-v2 unified-dashboard-v2">
      {/* Sidebar Navigation */}
      <div className="admin-sidebar-v2">
        <div className="sidebar-header-v2">
          <ShieldCheck size={28} color="#0b9d86" />
          <div>
            <h3>Bharat Tools</h3>
            <span>Control Center</span>
          </div>
        </div>
        <nav className="admin-sub-nav">
          <button className={`nav-item-v2 ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button className={`nav-item-v2 ${activeSection === 'users' ? 'active' : ''}`} onClick={() => setActiveSection('users')}>
            <Users size={18} /> Users
          </button>
          <button className={`nav-item-v2 ${activeSection === 'sync' ? 'active' : ''}`} onClick={() => setActiveSection('sync')}>
            <Zap size={18} /> Tool Sync
          </button>
          <button className={`nav-item-v2 ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => setActiveSection('settings')}>
            <Settings size={18} /> Config
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="admin-main-content-v2">
        <header className="admin-header-v2">
          <div className="header-info-v2">
            <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
            <p>Bharat Tools Hub Administrative Suite</p>
          </div>
          <div className="header-meta-v2">
            <div className="status-pill-v2 online">
              <Activity size={12} /> Live
            </div>
          </div>
        </header>

        <div className="admin-view-container-v2 pulse-in">
          {activeSection === 'dashboard' && (
            <div className="dashboard-grid-v2">
              <div className="admin-v1-stats-grid">
                <StatCard title="Total Users" value={users.length} trend="Live" icon={<Users color="#3b82f6" />} />
                <StatCard title="Active Now" value={users.filter(u => u.is_logged_in).length} trend="Realtime" icon={<Activity color="#10b981" />} />
                <StatCard title="Sync Health" value={syncStatus.message} trend="Healthy" icon={<Zap color="#f59e0b" />} />
                <StatCard title="Last Pulse" value={syncStatus.lastSuccess ? new Date(syncStatus.lastSuccess).toLocaleTimeString() : 'N/A'} trend="Auto" icon={<Clock color="#6366f1" />} />
              </div>

              <div className="quick-actions-view-v2">
                <h3>Priority Actions</h3>
                <div className="quick-actions-grid-v2">
                  <div className="action-card-v2" onClick={() => setActiveSection('users')}>
                    <UserPlus size={24} /> <span>Add User</span>
                  </div>
                  <div className="action-card-v2" onClick={() => setActiveSection('sync')}>
                    <RefreshCw size={24} /> <span>Sync Tools</span>
                  </div>
                  <div className="action-card-v2" onClick={handleManualSync}>
                    <Zap size={24} /> <span>Global Sync</span>
                  </div>
                  <div className="action-card-v2" onClick={handleDownloadExcel}>
                    <Download size={24} /> <span>Export XLSX</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="users-vertical-layout-v2">
              <section className="admin-card-v2">
                <div className="card-header-v2"><UserPlus size={20} /> <h2>Account Enrollment</h2></div>
                <form className="admin-form-v2" onSubmit={handleCreate}>
                  <div className="form-row-v2">
                    <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                  </div>
                  <div className="form-row-v2">
                    <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    <input placeholder="Phone" type="tel" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} />
                  </div>
                  <div className="form-row-v2">
                    <input type="number" placeholder="Months" value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} />
                    <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="admin-submit-btn" disabled={loading} style={{ flex: 2 }}>{loading ? '...' : 'Create'}</button>
                    <button type="button" className="admin-submit-btn demo-btn-v2" style={{ flex: 1 }} onClick={() => {
                      const dt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                      setForm({ ...form, months: 0, expiresAt: dt.slice(0, 16), is_demo: true });
                    }}>15m Demo</button>
                  </div>
                </form>
              </section>

              <section className="admin-card-v2 full-width-v2">
                <div className="card-header-v2" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} /> <h2>Database</h2></div>
                  <div className="admin-tabs-v2">
                    {['active', 'expired', 'demo'].map(t => (
                      <button key={t} className={`admin-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div className="table-responsive-v2">
                  <table className="admin-table-v2">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Mobile</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => {
                        const isExp = !u.access_expires_at || new Date(u.access_expires_at) < new Date();
                        if (activeTab === 'active') return !isExp;
                        if (activeTab === 'demo') return u.is_demo;
                        return isExp;
                      }).map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="user-info-v2">
                              <strong>{u.username}</strong>
                              <span>{u.email}</span>
                            </div>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '13px' }}>{u.mobile_number || 'N/A'}</td>
                          <td>
                            <div className="expiry-cell-v2">
                              <Clock size={12} style={{ opacity: 0.6 }} />
                              {u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge-v2 ${u.is_logged_in ? 'online' : 'offline'}`}>
                              {u.is_logged_in ? 'On' : 'Off'}
                            </span>
                          </td>
                          <td className="action-cell-v2">
                            <button className="mgmt-btn" onClick={() => updateAccess(u.id, 1)} title="Add 1 Month">+1m</button>
                            <button className="mgmt-btn" style={{ background: '#6366f1', color: 'white' }} onClick={() => updateAccessDate(u.id, u.access_expires_at)} title="Set Custom Date">
                              <Calendar size={14} />
                            </button>
                            <button className="mgmt-btn-reset" onClick={() => resetSession(u.id)} title="Reset Session">Reset</button>
                            <button className="mgmt-btn-del" onClick={() => removeUser(u.id)} title="Delete User">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'sync' && (
            <div className="sync-horizontal-layout-v2">
              <section className="admin-card-v2">
                <div className="card-header-v2"><Key size={20} /> <h2>Manual Helium Sync</h2></div>
                <textarea rows={8} value={heliumSessionJson} onChange={(e) => setHeliumSessionJson(e.target.value)} placeholder="Paste session..." />
                <button className="sync-btn-v2" onClick={handleSaveHeliumSession} disabled={heliumSaving}>Sync Now</button>
              </section>
              <section className="admin-card-v2">
                <div className="card-header-v2"><Zap size={20} /> <h2>Worker Status</h2></div>
                <div className="status-grid-v2">
                  <div className="status-item-v2"><label>Last Sync:</label> <span>{syncStatus.lastSuccess ? new Date(syncStatus.lastSuccess).toLocaleString() : 'Never'}</span></div>
                  <div className="status-item-v2"><label>Result:</label> <span className={syncStatus.message === 'Success' ? 'healthy' : 'error'}>{syncStatus.message}</span></div>
                </div>
                <button className="admin-submit-btn" onClick={handleManualSync} disabled={syncStatus.isSyncing}>Force Update</button>
              </section>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="settings-modular-layout-v2">
              <section className="admin-card-v2">
                <div className="card-header-v2"><ShieldCheck size={20} /> <h2>Gateway Config</h2></div>
                <form onSubmit={handleSaveSyncConfig} className="admin-form-v2">
                  <input placeholder="Source URL" value={syncConfig.source_url} onChange={e => setSyncConfig({ ...syncConfig, source_url: e.target.value })} />
                  <input placeholder="Login URL" value={syncConfig.login_url} onChange={e => setSyncConfig({ ...syncConfig, login_url: e.target.value })} />
                  <button type="submit" className="admin-submit-btn">Save Config</button>
                </form>
              </section>
              <section className="admin-card-v2">
                <div className="card-header-v2"><Upload size={20} /> <h2>Extension Deploy</h2></div>
                <input type="file" onChange={e => setExtensionFile(e.target.files[0])} />
                <button className="admin-submit-btn" onClick={handleExtensionUpload} disabled={uploading}>Upload Zip</button>
                {lastUploaded && <p className="last-uploaded-meta-v2">Last: {new Date(lastUploaded).toLocaleString()}</p>}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon }) {
  return (
    <div className="admin-v1-card stat-card-v1">
      <div className="stat-icon-v1">{icon}</div>
      <div className="stat-content-v1">
        <span className="stat-title-v1">{title}</span>
        <div className="stat-value-v1">{value}</div>
        <div className="stat-trend-v1">{trend}</div>
      </div>
    </div>
  );
}
