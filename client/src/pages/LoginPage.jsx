import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const navigate = useNavigate();
  const { login } = useAuth();

  React.useEffect(() => {
    axios.get('/api/health')
      .then((res) => setBackendStatus(`Connected (${res.data.version || 'v1.0.6'})`))
      .catch((err) => setBackendStatus(`Offline (${err.message})`));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { emailOrUsername, password });
      login(res.data);
      navigate('/');
    } catch (err) {
      console.error('Login error details:', err);
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(`${msg} ${err.response ? `(Status: ${err.response.status})` : '(Network Error)'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-login-page">
      <div className="login-visual-side">
        <div className="visual-content">
          <div className="visual-logo">
            <ShieldCheck size={48} color="white" />
            <span>INDIA Toolsbuy</span>
          </div>
          <h1>Empower Your E-commerce Journey</h1>
          <p>Access premium tools and analytics to scale your business with ease.</p>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-card">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="input-group-v2">
              <label><User size={16} /> Username or Email</label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="input-group-v2">
              <label><Lock size={16} /> Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="login-error-v2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="#" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="login-submit-btn-v2" disabled={loading}>
              {loading ? 'Authenticating...' : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer-v2">
            Don't have an account? <Link to="#">Contact Support to enroll</Link>
          </div>
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 10, right: 10, fontSize: '10px', color: '#666', opacity: 0.5, textAlign: 'right' }}>
        Server: {backendStatus}<br />
        v1.0.6-sync-fix
      </div>
    </div>
  );
}
