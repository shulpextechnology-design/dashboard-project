import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Zap,
    CheckCircle2,
    AlertCircle,
    Clock,
    ExternalLink
} from 'lucide-react';

export default function JungleScoutPage() {
    const { id } = useParams();
    const [idCopyStatus, setIdCopyStatus] = useState('');
    const [passCopyStatus, setPassCopyStatus] = useState('');
    const [credentials, setCredentials] = useState({ login_id: 'Loading...', password: 'Loading...' });

    useEffect(() => {
        setIdCopyStatus('');
        setPassCopyStatus('');

        const fetchCredentials = async () => {
            try {
                // Get token from localStorage (assuming it's stored there, which is standard for this app)
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('/api/junglescout-credentials', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setCredentials({
                        login_id: data.login_id,
                        password: data.password
                    });
                }
            } catch (err) {
                console.error('Failed to fetch credentials:', err);
            }
        };

        fetchCredentials();
    }, [id]);

    const copyToClipboard = async (text, setter) => {
        if (!text || text === 'Loading...') return;
        try {
            await navigator.clipboard.writeText(text);
            setter('success');
            setTimeout(() => setter(''), 2000);
        } catch (err) {
            setter('failed');
            setTimeout(() => setter(''), 2000);
        }
    };

    const jungleScoutID = "premiumtools@junglescout.com"; // Example placeholder
    const jungleScoutPass = "P@ssw0rd123!";         // Example placeholder

    return (
        <div className="helium-page-container">
            <div className="page-header-simple">
                <h1>Jungle Scout Action Center</h1>
                <p>Follow the steps below to access the premium Jungle Scout dashboard.</p>
            </div>

            <div className="helium-card">
                <div className="helium-card-icon">
                    <img
                        src="/jungle-scout-logo.jpg"
                        alt="Jungle Scout"
                        style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                    />
                </div>

                <div className="helium-card-content">
                    <div style={{
                        padding: '24px',
                        background: '#f8fafc',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        width: '100%',
                        textAlign: 'left'
                    }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>Login Credentials</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* ID Row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: '#64748b' }}><ExternalLink size={18} /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Login ID</span>
                                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{credentials.login_id}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(credentials.login_id, setIdCopyStatus)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: idCopyStatus === 'success' ? '#0b9d86' : '#64748b' }}
                                >
                                    {idCopyStatus === 'success' ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                                </button>
                            </div>

                            {/* Password Row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: '#64748b' }}><Zap size={18} /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Password</span>
                                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{credentials.password}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(credentials.password, setPassCopyStatus)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: passCopyStatus === 'success' ? '#0b9d86' : '#64748b' }}
                                >
                                    {passCopyStatus === 'success' ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="guidance-grid">
                <div className="guidance-card">
                    <Clock size={20} color="#64748b" />
                    <h4>Pro Tip</h4>
                    <p>If the logout option is displayed on the tool, try clearing your cookies or cache for better performance.</p>
                </div>
                <div className="guidance-card">
                    <ExternalLink size={20} color="#64748b" />
                    <h4>Support</h4>
                    <p>Immediately contact the support team for assistance if you face any issues with the session synchronization.</p>
                </div>
            </div>

            <footer className="helium-page-footer">
                Bharat Tools Hub Premium Access &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
}
