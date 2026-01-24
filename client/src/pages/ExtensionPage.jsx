import {
    Download,
    AlertTriangle,
    PcCase,
    Smartphone,
    Zap,
    CheckCircle2,
    ExternalLink,
    BookOpen,
    BarChart3
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../auth';

const ExtensionPage = () => {
    const { token } = useAuth();

    const isEdge = /Edg/.test(window.navigator.userAgent);

    const handleDownload = async () => {
        try {
            const response = await axios.get('/api/download/extension', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'freelance_extension.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download error:', err);
            alert('Download failed. Admin may not have uploaded the extension yet.');
        }
    };

    return (
        <div className="extension-page-wrapper">
            <div className="edge-optimization-banner">
                <div className="edge-banner-content">
                    <div className="edge-badge">
                        <Zap size={14} fill="currentColor" />
                        Best Service
                    </div>
                    <h2>Experience Bharat Tools Hub at its Best</h2>
                    <p>We recommend using <strong>Microsoft Edge</strong> for the most stable and high-performance experience with our premium tools.</p>

                    {isEdge ? (
                        <div className="edge-status-chip verified">
                            <CheckCircle2 size={16} />
                            <span>Optimized for your Edge Browser</span>
                        </div>
                    ) : (
                        <div className="edge-status-chip suggestion">
                            <AlertTriangle size={16} />
                            <span>Switch to Edge for 2x faster performance</span>
                        </div>
                    )}
                </div>
                <div className="edge-banner-visual">
                    <div className="glow-orb"></div>
                </div>
            </div>

            <div className="alert-box warning">
                <h3><AlertTriangle size={20} /> Extension Required</h3>
                <p>Please install the extension to unlock premium tools</p>
            </div>

            <div className="download-section">
                <div className="download-title">
                    <Download size={24} color="#3b82f6" />
                    Download Extension
                </div>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Get instant access to all premium features</p>
                <button className="btn-download" onClick={handleDownload}>
                    <Download size={20} />
                    Download Extension
                </button>
            </div>

            <div className="info-banner">
                <AlertTriangle size={20} color="#f59e0b" />
                <span><strong>Important:</strong> Our extension won't work with other extensions. Please remove them or use a fresh browser profile.</span>
            </div>

            <div className="installation-grid">
                {/* PC Installation */}
                <div className="install-card">
                    <div className="install-card-header">
                        <PcCase size={20} />
                        PC Installation
                    </div>
                    <div className="install-steps">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📂 Download & extract the extension
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🌐 Open edge://extensions/
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🔧 Enable Developer Mode
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📥 Click Load Unpacked
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">5</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📂 Select the extraction folder
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">6</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    ✅ Done! <a href="#">Watch Tutorial</a>
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">7</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🚀 Download the official helium 10 extraction <a href="https://chromewebstore.google.com/detail/helium-10-for-amazon-sell/njmehopjdpcckochcggncklnlmikcbnb?refid=bingshortanswer" target="_blank" rel="noopener noreferrer">click here</a>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Installation */}
                <div className="install-card">
                    <div className="install-card-header">
                        <Smartphone size={20} />
                        Mobile Installation
                    </div>
                    <div className="install-steps">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📱 Download Mises Browser
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🔗 <a href="#">Get Mises Browser</a>
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🔧 Enable Developer Mode
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📥 Load the extension
                                </span>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">5</div>
                            <div className="step-content">
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🎉 Enjoy! <a href="#">Watch Mobile Guide</a>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Helium 10 Promotion Banner */}
            <div className="h10-promo-banner">
                <div className="h10-promo-left">
                    <div className="h10-logo-group">
                        <BarChart3 className="h10-main-icon" size={24} />
                        <span className="h10-plus">+</span>
                        <div className="chrome-mini-icon">
                            <div className="chrome-dot"></div>
                        </div>
                    </div>
                    <div className="h10-text-content">
                        <div className="h10-headline">
                            <h3>Add the Free Helium 10 Chrome Extension</h3>
                            <span className="h10-user-count">Used by Over 1.2 Million+ Amazon Sellers</span>
                        </div>
                        <p>Analyze Helium 10's marketplace data while browsing Amazon</p>
                    </div>
                </div>
                <div className="h10-promo-right">
                    <button className="btn-h10-learn">
                        <BookOpen size={16} />
                        Learn
                    </button>
                    <a
                        href="https://chromewebstore.google.com/detail/helium-10-for-amazon-sell/njmehopjdpcckochcggncklnlmikcbnb?refid=bingshortanswer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-h10-install"
                    >
                        <ExternalLink size={16} />
                        Install Now
                    </a>
                </div>
            </div>
        </div >
    );
};

export default ExtensionPage;
