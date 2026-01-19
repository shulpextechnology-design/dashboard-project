import React from 'react';
import Sidebar from './Sidebar';
import UserProfileDropdown from './UserProfileDropdown';
import { useAuth } from '../auth';

const SidebarLayout = ({ children }) => {
    const { user, logout } = useAuth();

    return (
        <div className="layout-with-sidebar">
            <Sidebar logout={logout} user={user} />

            <div className="main-content">
                <header className="header-user">
                    <UserProfileDropdown />
                </header>

                <main>{children}</main>
            </div>
        </div>
    );
};

export default SidebarLayout;
