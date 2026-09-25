import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Zap,
    Copy,
    CheckCircle2,
    AlertCircle,
    Clock,
    ExternalLink
} from 'lucide-react';

// These must match the extension's constants exactly
const OMNIBOX_KEYWORD = 'brandseotools(created-by-premiumtools.shop)';
const AES_KEY = 'aZ9fG3kLpQ8rT5vN2sW4yH1uX0cB7eMx';
const HELIUM10_URL = 'https://members.helium10.com/black-box/niche?accountId=1543300528';

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
    const [copyStatus, setCopyStatus] = useState('');
    const [sessionData, setSessionData] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [sessionError, setSessionError] = useState('');

    useEffect(() => {
        setClicked(false);
        setCopyStatus('');
        localStorage.removeItem('helium10_encrypted_session');
        localStorage.removeItem('helium10_auto_trigger');
    }, [id]);

    useEffect(() => {
        async function loadSession() {
            setLoadingSession(true);
            setSessionError('');
            try {
                const res = await axios.get(`/api/helium10-session/${id || 1}`);
                setSessionData(res.data);
            } catch (e) {
                console.error(`Failed to load Helium 10 session ${id}`, e);
                setSessionError(`Helium 10 session ${id} is not configured yet. Please contact support.`);
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
                setCopyStatus('failed');
                alert('Helium 10 session is not configured yet. Please contact support.');
                return;
            }

            let rawData = String(sessionData.sessionData || '').trim();
            // Remove wrapping double or single quotes if present
            if ((rawData.startsWith('"') && rawData.endsWith('"')) || (rawData.startsWith("'") && rawData.endsWith("'"))) {
                rawData = rawData.slice(1, -1).trim();
            }
            // Replace escaped quotes or html entities if present
            rawData = rawData.replace(/\\"/g, '"').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');

            if (!rawData) {
                setCopyStatus('failed');
                alert('Helium 10 session data is empty. Please contact support.');
                return;
            }

            let finalToken = '';

            // Check if rawData already contains the OMNIBOX_KEYWORD anywhere
            const keywordIndex = rawData.indexOf(OMNIBOX_KEYWORD);
            if (keywordIndex !== -1) {
                // Extract everything starting after OMNIBOX_KEYWORD
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

            let copySuccess = false;
            if (navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(finalToken);
                    copySuccess = true;
                } catch (e) {
                    copySuccess = fallbackCopyToClipboard(finalToken);
                }
            } else {
                copySuccess = fallbackCopyToClipboard(finalToken);
            }

            if (copySuccess) {
                setCopyStatus('success');
                setClicked(true);
                localStorage.setItem('helium10_encrypted_session', finalToken);
                localStorage.setItem('helium10_auto_trigger', 'true');

                window.postMessage({
                    type: 'HELIUM10_BUTTON_CLICKED',
                    timestamp: Date.now()
                }, '*');
            } else {
                setCopyStatus('failed');
                alert('Failed to copy to clipboard. Please check browser permissions.');
            }
        } catch (e) {
            console.error('Session access error:', e);
            setCopyStatus('failed');
            alert('Error fetching session: ' + (e.message || 'Unknown error'));
        }
    };

    return (
        <div className="helium-page-container">
            <div className="page-header-simple">
                <h1>Helium 10 Action Center {id ? `(Instance ${id})` : ''}</h1>
                <p>Follow the steps below to access the premium Helium 10 dashboard.</p>
            </div>

            <div className="helium-card">
                <div className="helium-card-icon">
                    <Zap size={40} color="#0b9d86" fill="#0b9d8633" />
                </div>

                <div className="helium-card-content">
                    <h3>Activate Premium Session</h3>
                    <p>
                        Click the button below to copy the encrypted session token.
                        The extension will automatically detect it and redirect you to Helium 10.
                    </p>

                    <button
                        id="helium10-click-me-button"
                        className={`premium-action-btn ${clicked ? 'clicked' : ''}`}
                        onClick={handleButtonClick}
                        disabled={loadingSession || (!sessionData)}
                    >
                        {clicked ? (
                            <>
                                <CheckCircle2 size={20} />
                                Redirecting to Helium 10...
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                {loadingSession ? 'Initializing...' : 'Click On Me to Start'}
                            </>
                        )}
                    </button>

                    {sessionError && (
                        <div className="error-banner-inline">
                            <AlertCircle size={16} />
                            {sessionError}
                        </div>
                    )}
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