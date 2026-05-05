import React from 'react';

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#dc3545' }}>Service Discontinued</h2>
        <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '20px' }}>
          <strong>Note:-</strong> Hi mam/Sir Sorry to say Unfortunately our vendor will not provide service because of personal issue and we are in loss so service is stop now. Please understand and support us. 
        </p>
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '5px', marginBottom: '20px', borderLeft: '5px solid #ffeeba', textAlign: 'left' }}>
          <p style={{ fontSize: '18px', lineHeight: '1.6', fontWeight: 'bold', margin: 0 }}>
            <span style={{ color: '#d39e00', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>⚠️ Important Action Required:</span>
            We kindly request you to please remove our installed extension from your device at your earliest convenience.
          </p>
        </div>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          If you have any query please ask 🙏
        </p>
      </div>
    </div>
  );
}