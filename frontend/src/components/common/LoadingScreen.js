import React from 'react';

const LoadingScreen = ({ inline, small, text }) => {
  if (small) {
    return <span style={{ display: 'inline-block', width: 30, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden', verticalAlign: 'middle' }}>
      <span style={{ display: 'block', width: '40%', height: '100%', background: 'currentColor', borderRadius: 2, animation: 'loadbar 1.2s ease-in-out infinite' }} />
    </span>;
  }

  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', gap: 10 }}>
        <div style={{ width: 60, height: 3, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: '40%', height: '100%', background: '#34C759', borderRadius: 3, animation: 'loadbar 1.2s ease-in-out infinite' }} />
        </div>
        {text && <span style={{ color: '#9ca3af', fontSize: 12 }}>{text}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#34C759', letterSpacing: 1 }}>Welogx</div>
      <div style={{ width: 100, height: 3, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: '40%', height: '100%', background: '#34C759', borderRadius: 3, animation: 'loadbar 1.2s ease-in-out infinite' }} />
      </div>
      {text && <span style={{ color: '#9ca3af', fontSize: 13 }}>{text}</span>}
    </div>
  );
};

export default LoadingScreen;
