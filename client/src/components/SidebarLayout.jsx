import React, { useState } from 'react';
import Sidebar from './Sidebar';
import UserProfileDropdown from './UserProfileDropdown';
import { useAuth } from '../auth';
import { Menu, X } from 'lucide-react';

const SidebarLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="layout-with-sidebar">
            <Sidebar
                logout={logout}
                user={user}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <div className="main-content">
                <header className="header-user">
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <UserProfileDropdown />
                </header>

                <main>{children}</main>
            </div>
        </div>
    );
};

export default SidebarLayout;
