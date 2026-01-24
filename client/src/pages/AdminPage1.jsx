import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Users,
    UserPlus,
    Key,
    ShieldCheck,
    Zap,
    TrendingUp,
    Activity,
    Clock,
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    XCircle,
    Download,
    Mail,
    Phone
} from 'lucide-react';

export default function AdminPage1() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSessons: 0,
        syncStatus: 'Healthy',
        revenue: '₹45,250'
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [extensionFile, setExtensionFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [lastUploaded, setLastUploaded] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/admin/users');
                setUsers(res.data);
                setStats(prev => ({
                    ...prev,
                    totalUsers: res.data.length,
                    activeSessons: res.data.filter(u => u.is_logged_in).length
                }));

                // Load extension meta
                const metaRes = await axios.get('/api/admin/extension-meta');
                setLastUploaded(metaRes.data.updated_at);
            } catch (e) {
                console.error("Failed to load admin data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            setLastUploaded(res.data.updatedAt);
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

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="admin-v1-container">
            {/* Header Area */}
            <div className="admin-v1-header">
                <div>
                    <h1>Admin Panel <span className="badge-v1">BETA 1.0</span></h1>
                    <p>Experimental Management Dashboard with Modern UI</p>
                </div>
                <div className="admin-v1-actions">
                    <button className="btn-v1 btn-v1-outline">
                        <Download size={18} />
                        Export Data
                    </button>
                    <button className="btn-v1 btn-v1-primary">
                        <UserPlus size={18} />
                        Add New User
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="admin-v1-stats-grid">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    trend="+12%"
                    isUp={true}
                    icon={<Users className="icon-v1-blue" />}
                />
                <StatCard
                    title="Active Sessions"
                    value={stats.activeSessons}
                    trend="Stable"
                    isUp={true}
                    icon={<Activity className="icon-v1-green" />}
                />
                <StatCard
                    title="System Sync"
                    value={stats.syncStatus}
                    trend="99.9%"
                    isUp={true}
                    icon={<Zap className="icon-v1-amber" />}
                />
                <StatCard
                    title="Est. Revenue"
                    value={stats.revenue}
                    trend="-2.4%"
                    isUp={false}
                    icon={<TrendingUp className="icon-v1-purple" />}
                />
            </div>

            {/* Main Content Area */}
            <div className="admin-v1-content-layout">
                {/* Users Table */}
                <div className="admin-v1-card table-container-v1">
                    <div className="card-header-v1">
                        <h2>User Management</h2>
                        <div className="search-box-v1">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-responsive-v1">
                        <table className="table-v1">
                            <thead>
                                <tr>
                                    <th>User Profile</th>
                                    <th>Access Status</th>
                                    <th>Session</th>
                                    <th>Expiry</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="loading-row">
                                            <div className="skeleton-v1"></div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-row">No users found matching your search.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-profile-v1">
                                                    <div className="avatar-v1">{u.username.charAt(0).toUpperCase()}</div>
                                                    <div>
                                                        <div className="username-v1">{u.username}</div>
                                                        <div className="email-v1">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge status={!u.access_expires_at || new Date(u.access_expires_at) < new Date() ? 'Expired' : 'Active'} />
                                            </td>
                                            <td>
                                                <div className={`session-dot-v1 ${u.is_logged_in ? 'online' : 'offline'}`}>
                                                    {u.is_logged_in ? 'Live' : 'Offline'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="expiry-v1">
                                                    <Clock size={14} />
                                                    {u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString() : 'Inactive'}
                                                </div>
                                            </td>
                                            <td>
                                                <button className="icon-button-v1">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Side Panels */}
                <div className="admin-v1-side-panels">
                    <div className="admin-v1-card sync-card-v1">
                        <div className="card-header-v1">
                            <h3>Background Sync</h3>
                            <button className="sync-trigger-v1">Sync Now</button>
                        </div>
                        <div className="sync-details-v1">
                            <div className="sync-item-v1">
                                <span>Helium10 Status</span>
                                <span className="status-ok">Online</span>
                            </div>
                            <div className="sync-item-v1">
                                <span>Worker Interval</span>
                                <span>5 Minutes</span>
                            </div>
                            <div className="sync-item-v1">
                                <span>Last Update</span>
                                <span>Just Now</span>
                            </div>
                        </div>
                        <div className="progress-bar-v1">
                            <div className="progress-fill-v1" style={{ width: '85%' }}></div>
                        </div>
                        <p className="sync-note-v1">Next automated sync in 2:45 minutes</p>
                    </div>

                    <div className="admin-v1-card quick-links-v1">
                        <h3>Quick Actions</h3>
                        <div className="actions-grid-v1">
                            <button className="action-tile-v1">
                                <ShieldCheck />
                                Reset Permissions
                            </button>
                            <button className="action-tile-v1">
                                <Mail />
                                Blast Email
                            </button>
                            <button className="action-tile-v1">
                                <Phone />
                                Support Logs
                            </button>
                            <button className="action-tile-v1">
                                <div className="dot-notification-v1"></div>
                                <Activity />
                                Server Stats
                            </button>
                        </div>
                    </div>

                    <div className="admin-v1-card extension-card-v1">
                        <div className="card-header-v1">
                            <h3>Extension Management</h3>
                            <Upload size={18} color="#0b9d86" />
                        </div>
                        <div className="extension-upload-v1">
                            <p className="side-panel-note-v1">Upload latest .zip for users</p>
                            <input
                                id="extension-file-input"
                                type="file"
                                accept=".zip"
                                className="file-input-v1"
                                onChange={(e) => setExtensionFile(e.target.files[0])}
                            />
                            <button
                                className="btn-v1 btn-v1-primary full-width-v1"
                                onClick={handleExtensionUpload}
                                disabled={uploading || !extensionFile}
                                style={{ marginTop: '12px' }}
                            >
                                {uploading ? 'Uploading...' : 'Upload Zip'}
                            </button>
                            {lastUploaded && (
                                <div className="last-uploaded-v1">
                                    <Clock size={12} />
                                    Last update: {new Date(lastUploaded).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, trend, isUp, icon }) {
    return (
        <div className="stat-card-v1">
            <div className="stat-icon-v1">{icon}</div>
            <div className="stat-content-v1">
                <span className="stat-title-v1">{title}</span>
                <div className="stat-value-v1">{value}</div>
                <div className={`stat-trend-v1 ${isUp ? 'trend-up' : 'trend-down'}`}>
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const isActive = status === 'Active';
    return (
        <span className={`badge-v1 ${isActive ? 'badge-v1-success' : 'badge-v1-danger'}`}>
            {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {status}
        </span>
    );
}
