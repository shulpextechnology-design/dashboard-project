import React from 'react';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title }) => {
    return (
        <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <Construction size={48} color="#0b9d86" style={{ marginBottom: '20px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>{title}</h1>
            <p style={{ color: '#64748b' }}>This page is currently under development. Please check back later!</p>
        </div>
    );
};

export default PlaceholderPage;
