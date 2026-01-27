import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import {
    Puzzle,
    ExternalLink,
    Zap,
    Search,
    LayoutDashboard
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const [me, setMe] = useState(user);
    const [filter, setFilter] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                const res = await axios.get('/api/me');
                setMe(res.data);
            } catch (e) {
                // ignore for now
            }
        }
        load();
    }, []);

    const accessLabel =
        me?.access_expires_at && new Date(me.access_expires_at).toLocaleDateString();

    const handleExtensionDownload = async () => {
        navigate('/extension');
    };

    const tools = [
        { name: 'Bharat Tools Hub Extensions', icon: <Puzzle size={24} color="#0b9d86" />, action: handleExtensionDownload },
        { name: 'Helium 10 (Instance 1)', icon: <Zap size={24} color="#0b9d86" />, action: () => navigate('/helium10/1') },
        { name: 'Helium 10 (Instance 2)', icon: <Zap size={24} color="#0b9d86" />, action: () => navigate('/helium10/2') },
    ];

    const filteredTools = tools.filter(tool =>
        tool.name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="dashboard-page-v2">
            <section className="welcome-banner-v2">
                <div className="welcome-text">
                    <h1>Dashboard</h1>
                    <p>Welcome back, <strong>{me?.username || me?.name}</strong>! <span style={{ fontSize: '10px', opacity: 0.5 }}>v1.3.2-auto</span></p>
                </div>
                {accessLabel && (
                    <div className="status-badge">
                        <Zap size={16} fill="white" />
                        Helium 10 Active – Exp: {accessLabel}
                    </div>
                )}
            </section>

            <div className="dashboard-content">
                <div className="section-header">
                    <h2>Active Resources</h2>
                    <div className="search-box">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Type to Filter..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="tool-grid">
                    {filteredTools.map((tool, index) => (
                        <div className="premium-tool-card" key={index}>
                            <div className="tool-icon-wrapper">
                                {tool.icon}
                            </div>
                            <div className="tool-name">{tool.name}</div>
                            <button className="tool-action-btn" onClick={tool.action}>
                                Access
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}