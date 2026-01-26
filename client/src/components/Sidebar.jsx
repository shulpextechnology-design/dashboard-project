import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    History,
    RefreshCw,
    Settings,
    LifeBuoy,
    HelpCircle,
    Download,
    LogOut,
    ChevronRight,
    Activity
} from 'lucide-react';

const Sidebar = ({ logout, user }) => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { name: 'Transaction History', icon: <History size={20} />, path: '/transactions' },
        { name: 'Subscribe/Renew', icon: <RefreshCw size={20} />, path: '/subscribe' },
        { name: 'Account Settings', icon: <Settings size={20} />, path: '/account-settings' },
        { name: 'Help Desk', icon: <LifeBuoy size={20} />, path: '/help' },
        { name: 'FAQs', icon: <HelpCircle size={20} />, path: '/faqs' },
        { name: 'Download Extension', icon: <Download size={20} />, path: '/extension' },
    ];

    if (user?.role === 'admin') {
        navItems.splice(1, 0, { name: 'Admin Panel', icon: <Settings size={20} />, path: '/admin' });
        navItems.splice(2, 0, { name: 'Admin Panel 1', icon: <Activity size={20} />, path: '/admin-1' });
    }

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon" style={{ background: '#0b9d86', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    T
                </div>
                Bharat Tools Hub
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    // Special handling for Account Settings to be active on both /settings and /account-settings
                    const isActive = item.name === 'Account Settings'
                        ? (location.pathname === '/settings' || location.pathname === '/account-settings')
                        : location.pathname === item.path;

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    );
                })}

                <Link to="/extension" className={`sidebar-link download-btn ${location.pathname === '/extension' ? 'active' : ''}`}>
                    <Download size={20} />
                    Download Extension
                    <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                </Link>
            </nav>

            <div className="sidebar-footer">
                <button
                    onClick={async () => {
                        try {
                            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
                            const token = auth.token;
                            if (token) {
                                await fetch('/api/auth/logout', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                });
                            }
                        } catch (e) {
                            console.error("Logout API failed", e);
                        }
                        logout();
                    }}
                    className="sidebar-link"
                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
