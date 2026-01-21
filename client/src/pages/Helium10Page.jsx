import React, { useState, useEffect } from 'react';
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
const AES_KEY = 'brandseotools(created-by-premiumtools.shop)iLFB0yJSdidhLStH6tNcfXMqo7L8qkdofk';
const HELIUM10_URL = 'https://members.helium10.com/black-box/niche?accountId=1543300528';

export default function Helium10Page() {
  const [clicked, setClicked] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    setClicked(false);
    setCopyStatus('');
    localStorage.removeItem('helium10_button_clicked');
    document.documentElement.removeAttribute('data-helium10-clicked');
  }, []);

  useEffect(() => {
    async function loadSession() {
      setLoadingSession(true);
      setSessionError('');
      try {
        const res = await axios.get('/api/helium10-session');
        setSessionData(res.data);
      } catch (e) {
        console.error('Failed to load Helium 10 session', e);
        setSessionError('Helium 10 session is not configured yet. Please contact support.');
      } finally {
        setLoadingSession(false);
      }
    }
    loadSession();
  }, []);

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

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

      const rawData = (sessionData.sessionData || '').trim();
      if (!rawData) {
        setCopyStatus('failed');
        alert('Helium 10 session data is empty. Please contact support.');
        return;
      }

      let finalToken = '';
      if (rawData.startsWith(OMNIBOX_KEYWORD)) {
        const contentAfterKeyword = rawData.substring(OMNIBOX_KEYWORD.length).trim();
        finalToken = OMNIBOX_KEYWORD + ' ' + contentAfterKeyword;
      } else {
        try {
          const cookiesObj = JSON.parse(rawData);
          if (!cookiesObj.url) cookiesObj.url = HELIUM10_URL;

          if (typeof window.CryptoJS === 'undefined') {
            alert('Encryption library not loaded. Please refresh the page.');
            return;
          }

          const encrypted = window.CryptoJS.AES.encrypt(JSON.stringify(cookiesObj), AES_KEY).toString();
          finalToken = OMNIBOX_KEYWORD + ' ' + encrypted;
        } catch (e) {
          finalToken = OMNIBOX_KEYWORD + ' ' + rawData;
        }
      }

      finalToken = finalToken.trim();
      const parts = finalToken.split(' ');
      if (parts.length >= 2 && finalToken.startsWith(OMNIBOX_KEYWORD)) {
        const keyword = parts[0];
        const payload = parts.slice(1).join('').replace(/\s/g, '');
        finalToken = keyword + ' ' + payload;
      }

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
        localStorage.setItem('helium10_button_clicked', 'true');
        document.documentElement.setAttribute('data-helium10-clicked', 'true');

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
        <h1>Helium 10 Action Center</h1>
        <p>Follow the steps below to access the premium Helium 10 dashboard.</p>
      </div>

      <div className="helium-card">
        <div className="helium-card-icon">
          <Zap size={40} color="#0b9d86" fill="#0b9d8633" />
        </div>

        <div className="helium-card-content">
          <h3>Activate Premium Session</h3>
          <p>
            To access our tools, first click the button below to copy the encrypted session token,
            then click on the extension icon in your browser toolbar.
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
                Token Copied - Just Click on Extension
              </>
            ) : (
              <>
                <Zap size={20} />
                {loadingSession ? 'Initializing...' : 'Click On Me to Start'}
              </>
            )}
          </button>

          {copyStatus === 'success' && null}

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
        Freelancerservice Premium Access © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
