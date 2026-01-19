import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../auth';

const UserProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    
    const isAccountSettingsActive = location.pathname === '/account-settings' || location.pathname === '/settings';
    
    // Debug log
    console.log('Current path:', location.pathname, 'Active:', isAccountSettingsActive);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMyProfileClick = () => {
        setIsOpen(false);
        navigate('/account-settings');
    };

    const handleLogoutClick = () => {
        setIsOpen(false);
        logout();
        navigate('/login');
    };

    return (
        <div className="user-profile-dropdown" ref={dropdownRef}>
            <div 
                className="user-profile-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="user-info-wrapper">
                    <div className="user-avatar" style={{ background: '#003366' }}>
                        {(user?.name || user?.username || 'U')[0].toUpperCase()}
                    </div>
                    <div className="user-info-text">
                        <span>Hello, <strong>{user?.name || user?.username || 'User'}</strong></span>
                    </div>
                    <ChevronDown 
                        size={16} 
                        className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="user-dropdown-menu">
                    <div 
                        className={`dropdown-item account-settings ${isAccountSettingsActive ? 'active' : ''}`} 
                        onClick={handleMyProfileClick}
                    >
                        <Settings size={16} />
                        <span>Account Settings</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item logout" onClick={handleLogoutClick}>
                        <LogOut size={16} />
                        <span>Logout</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileDropdown;