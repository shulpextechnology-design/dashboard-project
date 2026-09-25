import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Zap,
    CheckCircle2,
    AlertCircle,
    Clock,
    ExternalLink,
    Download,
    RefreshCw
} from 'lucide-react';

// Extension constants
const OMNIBOX_KEYWORD = 'brandseotools(created-by-premiumtools.shop)';
const AES_KEY = 'aZ9fG3kLpQ8rT5vN2sW4yH1uX0cB7eMx';
const HELIUM10_URL = 'https://members.helium10.com/dashboard?accountId=1547787221';

// Encrypt data with AES-GCM (matches extension's bg.js decryptAESGCM)
async function encryptAESGCM(dataObj) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(AES_KEY),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(dataObj));

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        encoded
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    let binary = '';
    for (let i = 0; i < combined.length; i++) binary += String.fromCharCode(combined[i]);
    return btoa(binary);
}

export default function Helium10Page() {
    const { id } = useParams();
    const [clicked, setClicked] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [sessionError, setSessionError] = useState('');
    
    // Extension status detection: null = checking, true = active, false = missing
    const [isExtensionActive, setIsExtensionActive] = useState(null);
    const [checkingCount, setCheckingCount] = useState(0);

    // Check extension detection attributes on body
    const checkExtension = useCallback(() => {
        const body = document.body;
        const status = body.getAttribute('data-extension');
        if (status === 'active') {
            setIsExtensionActive(true);
            return true;
        }
        return false;
    }, []);

    useEffect(() => {
        setClicked(false);
        localStorage.removeItem('helium10_encrypted_session');
        localStorage.removeItem('helium10_auto_trigger');
    }, [id]);

    // Periodically poll for extension status on page mount
    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 10; // check for up to 2 seconds (10 * 200ms)

        if (checkExtension()) return;

        const interval = setInterval(() => {
            attempts++;
            if (checkExtension()) {
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                setIsExtensionActive(false);
            }
        }, 200);

        // Also listen for extension message
        const handleMsg = (e) => {
            if (e.data && (e.data.type === 'EXTENSION_ACTIVE' || e.data.status === 'active')) {
                setIsExtensionActive(true);
            }
        };
        window.addEventListener('message', handleMsg);

        return () => {
            clearInterval(interval);
            window.removeEventListener('message', handleMsg);
        };
    }, [checkExtension, checkingCount]);

    // Fetch session data
    useEffect(() => {
        async function loadSession() {
            setLoadingSession(true);
            setSessionError('');
            try {
                const res = await axios.get(`/api/helium10-session/${id || 1}`);
                setSessionData(res.data);
            } catch (e) {
                console.error(`Failed to load Helium 10 session ${id}`, e);
                setSessionError(`Helium 10 session ${id || 1} is not configured yet. Please check Admin Sync.`);
            } finally {
                setLoadingSession(false);
            }
        }
        loadSession();
    }, [id]);

    const fallbackCopyToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        if (textArea.setSelectionRange) {
            textArea.setSelectionRange(0, 999999);
        }

        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }

        document.body.removeChild(textArea);
        return success;
    };

    const handleButtonClick = async () => {
        try {
            if (!sessionData || !sessionData.sessionData) {
                alert('Helium 10 session is not configured yet. Please contact support.');
                return;
            }

            let rawData = String(sessionData.sessionData || '').trim();
            if ((rawData.startsWith('"') && rawData.endsWith('"')) || (rawData.startsWith("'") && rawData.endsWith("'"))) {
                rawData = rawData.slice(1, -1).trim();
            }
            rawData = rawData.replace(/\\"/g, '"').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');

            if (!rawData) {
                alert('Helium 10 session data is empty. Please contact support.');
                return;
            }

            let finalToken = '';

            const keywordIndex = rawData.indexOf(OMNIBOX_KEYWORD);
            if (keywordIndex !== -1) {
                const payloadPart = rawData.substring(keywordIndex + OMNIBOX_KEYWORD.length).trim();
                const cleanPayload = payloadPart.replace(/\s+/g, '').replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
                finalToken = OMNIBOX_KEYWORD + ' ' + cleanPayload;
            } else {
                try {
                    const cookiesObj = JSON.parse(rawData);
                    if (!cookiesObj.url) cookiesObj.url = HELIUM10_URL;
                    const encrypted = await encryptAESGCM(cookiesObj);
                    finalToken = OMNIBOX_KEYWORD + ' ' + encrypted;
                } catch (e) {
                    const cleanPayload = rawData.replace(/\s+/g, '');
                    finalToken = OMNIBOX_KEYWORD + ' ' + cleanPayload;
                }
            }

            finalToken = finalToken.trim();

            // Set localStorage for extension auto-trigger
            localStorage.setItem('helium10_encrypted_session', finalToken);
            localStorage.setItem('helium10_auto_trigger', 'true');

            // Dispatch postMessage for content scripts
            window.postMessage({
                type: 'HELIUM10_DIRECT_ACCESS',
                token: finalToken,
                timestamp: Date.now()
            }, '*');

            // Also copy to clipboard for omnibox / fallback
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(finalToken).catch(() => fallbackCopyToClipboard(finalToken));
            } else {
                fallbackCopyToClipboard(finalToken);
            }

            setClicked(true);

            // If extension doesn't auto-redirect within 2.5 seconds, navigate tab to Helium 10
            setTimeout(() => {
                window.open(HELIUM10_URL, '_blank');
            }, 1800);

        } catch (e) {
            console.error('Session access error:', e);
            alert('Error accessing session: ' + (e.message || 'Unknown error'));
        }
    };

    return (
        <div className="helium-direct-page-container">
            {/* Direct Access Header */}
            <div className="tool-title-row">
                <h1 className="tool-heading">Helium10 {id ? `(Instance ${id})` : ''}</h1>
            </div>

            {/* Direct Access Center Card */}
            <div className="direct-access-card">
                {isExtensionActive === false ? (
                    // Extension NOT Installed / Not Detected Notice
                    <div className="extension-notice-box">
                        <div className="notice-icon-circle">
                            <AlertCircle size={44} color="#f97316" />
                        </div>
                        <h2 className="notice-title">Extension is Not Installed!</h2>
                        <p className="notice-description">
                            The Bharat Tools browser extension is required to automatically authenticate and provide 1-click direct access to Helium 10.
                        </p>
                        <div className="notice-btn-row">
                            <Link to="/extension" className="btn-install-ext">
                                <Download size={18} />
                                Install Extension Properly
                            </Link>
                            <button
                                className="btn-recheck-ext"
                                onClick={() => {
                                    setIsExtensionActive(null);
                                    setCheckingCount(c => c + 1);
                                }}
                            >
                                <RefreshCw size={16} />
                                Recheck Extension
                            </button>
                        </div>
                    </div>
                ) : (
                    // Extension Detected -> Direct Access Button
                    <div className="direct-access-action-box">
                        <div className="extension-badge-active">
                            <span className="pulse-dot"></span>
                            {isExtensionActive === true ? 'Extension Ready & Active' : 'Checking Extension...'}
                        </div>

                        <div className="action-button-wrapper">
                            <button
                                id="helium10-direct-access-button"
                                className={`helium10-orange-btn ${clicked ? 'redirecting' : ''}`}
                                onClick={handleButtonClick}
                                disabled={loadingSession || !sessionData}
                            >
                                {clicked ? (
                                    <>
                                        <CheckCircle2 size={22} className="spin-icon" />
                                        Redirecting to Helium 10...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={22} />
                                        Helium10 Access
                                    </>
                                )}
                            </button>
                        </div>

                        {sessionError && (
                            <div className="error-banner-inline">
                                <AlertCircle size={16} />
                                {sessionError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Guidance Section */}
            <div className="guidance-grid">
                <div className="guidance-card">
                    <Clock size={20} color="#64748b" />
                    <h4>Direct 1-Click Access</h4>
                    <p>When the extension is loaded, clicking "Helium10 Access" automatically logs you in and redirects you to the dashboard.</p>
                </div>
                <div className="guidance-card">
                    <ExternalLink size={20} color="#64748b" />
                    <h4>Support & Tips</h4>
                    <p>If you see a logout screen on Helium 10, clear your Helium 10 cookies and click the access button again.</p>
                </div>
            </div>

            <footer className="helium-page-footer">
                Bharat Tools Hub Premium Access &copy; {new Date().getFullYear()}
            </footer>

            {/* Direct Access & Extension styles */}
            <style>{`
                .helium-direct-page-container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 40px 24px;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .tool-title-row {
                    margin-bottom: 28px;
                }
                .tool-heading {
                    font-size: 32px;
                    font-weight: 800;
                    color: #581c87;
                    letter-spacing: -0.02em;
                    margin: 0;
                }
                .direct-access-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
                    padding: 50px 32px;
                    text-align: center;
                    margin-bottom: 36px;
                    min-height: 260px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .direct-access-action-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    width: 100%;
                }
                .extension-badge-active {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #047857;
                    background: #ecfdf5;
                    border: 1px solid #a7f3d0;
                    padding: 6px 14px;
                    border-radius: 9999px;
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                .action-button-wrapper {
                    margin: 12px 0;
                }
                /* Prominent Orange Access Button matching the reference screenshot */
                .helium10-orange-btn {
                    background: #ff5a00;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    padding: 16px 48px;
                    font-size: 20px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    box-shadow: 0 4px 14px rgba(255, 90, 0, 0.35);
                    transition: all 0.2s ease-in-out;
                    letter-spacing: 0.01em;
                }
                .helium10-orange-btn:hover:not(:disabled) {
                    background: #e65100;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 90, 0, 0.45);
                }
                .helium10-orange-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .helium10-orange-btn:disabled {
                    background: #fdba74;
                    cursor: not-allowed;
                    opacity: 0.8;
                }
                .helium10-orange-btn.redirecting {
                    background: #047857;
                    box-shadow: 0 4px 14px rgba(4, 120, 87, 0.35);
                }
                /* Extension Notice Box */
                .extension-notice-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    max-width: 520px;
                    margin: 0 auto;
                }
                .notice-icon-circle {
                    width: 72px;
                    height: 72px;
                    background: #fff7ed;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                }
                .notice-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 10px 0;
                }
                .notice-description {
                    font-size: 14px;
                    color: #64748b;
                    line-height: 1.6;
                    margin: 0 0 24px 0;
                }
                .notice-btn-row {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .btn-install-ext {
                    background: #ff5a00;
                    color: #ffffff;
                    padding: 11px 22px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .btn-install-ext:hover {
                    background: #e65100;
                    text-decoration: none;
                }
                .btn-recheck-ext {
                    background: #f1f5f9;
                    color: #334155;
                    border: 1px solid #cbd5e1;
                    padding: 11px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-recheck-ext:hover {
                    background: #e2e8f0;
                }
                .guidance-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .guidance-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                }
                .guidance-card h4 {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 10px 0 6px 0;
                }
                .guidance-card p {
                    font-size: 13px;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.5;
                }
                .error-banner-inline {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #b91c1c;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                }
                .helium-page-footer {
                    text-align: center;
                    font-size: 13px;
                    color: #94a3b8;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 24px;
                }
            `}</style>
        </div>
    );
}