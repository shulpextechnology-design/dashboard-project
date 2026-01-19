import React, { useState } from 'react';
import axios from 'axios';
import {
    Settings,
    Lock,
    ShieldCheck,
    User,
    KeyRound,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../auth';

export default function SettingsPage() {
    const { user, token } = useAuth();
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (passwords.new !== passwords.confirm) {
            return setStatus({ type: 'error', message: 'New passwords do not match' });
        }

        if (passwords.new.length < 6) {
            return setStatus({ type: 'error', message: 'New password must be at least 6 characters' });
        }

        setLoading(true);
        try {
            await axios.put(
                '/api/user/change-password',
                {
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStatus({ type: 'success', message: 'Password updated successfully!' });
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to update password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page-v2">
            <div className="page-header-v2">
                <Settings size={32} color="#0b9d86" />
                <div>
                    <h1>Account Settings</h1>
                    <p>Manage your profile and security preferences.</p>
                </div>
            </div>

            <div className="settings-grid-v2">
                {/* Profile Info Card */}
                <section className="admin-card-v2">
                    <div className="card-header-v2">
                        <User size={20} />
                        <h2>Profile Overview</h2>
                    </div>
                    <div className="admin-form-v2">
                        <div className="profile-detail-v2">
                            <label>Username</label>
                            <div className="detail-value-v2">{user?.username}</div>
                        </div>
                        <div className="profile-detail-v2">
                            <label>Email Address</label>
                            <div className="detail-value-v2">{user?.email}</div>
                        </div>
                        <div className="profile-detail-v2">
                            <label>Mobile Number</label>
                            <div className="detail-value-v2">{user?.mobile_number || 'Not provided'}</div>
                        </div>
                        <div className="profile-detail-v2">
                            <label>Role</label>
                            <div className="detail-badge-v2">{user?.role?.toUpperCase()}</div>
                        </div>
                    </div>
                </section>

                {/* Change Password Card */}
                <section className="admin-card-v2">
                    <div className="card-header-v2">
                        <ShieldCheck size={20} />
                        <h2>Security & Password</h2>
                    </div>
                    <form className="admin-form-v2" onSubmit={handlePasswordChange}>
                        <div className="input-with-icon-v2">
                            <KeyRound size={16} />
                            <input
                                type="password"
                                name="current"
                                placeholder="Current Password"
                                value={passwords.current}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-with-icon-v2">
                            <Lock size={16} />
                            <input
                                type="password"
                                name="new"
                                placeholder="New Password"
                                value={passwords.new}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-with-icon-v2">
                            <Lock size={16} />
                            <input
                                type="password"
                                name="confirm"
                                placeholder="Confirm New Password"
                                value={passwords.confirm}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {status.message && (
                            <div className={`status-banner-v2 ${status.type}`}>
                                {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {status.message}
                            </div>
                        )}

                        <button type="submit" className="admin-submit-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
