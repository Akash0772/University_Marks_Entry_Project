// ================================================================
// FILE: LoginPage.jsx
// PATH: src/pages/
// Design login - college name + logo
// FIX: Added window.location.replace for seamless redirection
// ================================================================

import { useState } from 'react';
import { loginApi } from '../api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username aur Password Required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await loginApi({ username, password });
      const { token, ...user } = res.data;
      
      // Data save karo
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // App.jsx state update
      onLogin(user); 

     
      window.location.replace('/'); 

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>

      {/* Left Panel - Branding */}
      <div style={s.leftPanel}>
        <div style={s.brandBox}>
          <div style={s.logoCircle}>
            <span style={{ fontSize: 40 }}>🎓</span>
          </div>
          <h1 style={s.collegeName}>Marks Entry Portal</h1>
          <p style={s.collegeSubtitle}>
            University Examination Management System
          </p>
          <div style={s.divider} />
          <div style={s.featureList}>
            <div style={s.featureItem}>✅ Secure Login</div>
            <div style={s.featureItem}>📊 Real-time Statistics</div>
            <div style={s.featureItem}>📋 Marks Entry & Management</div>
            <div style={s.featureItem}>👥 Role-based Access</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={s.rightPanel}>
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Welcome Back</h2>
          <p style={s.formSubtitle}>Sign in to your account</p>

          <form onSubmit={handleLogin} style={s.form}>

            {/* Username */}
            <div style={s.inputGroup}>
              <label style={s.label}>Username</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>👤</span>
                <input
                  type="text"
                  placeholder="your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={s.input}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div style={s.inputGroup}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={s.input}
                  autoComplete="current-password"
                />
                <span
                  style={s.eyeIcon}
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={s.errorBox}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ ...s.loginBtn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ Logging in...' : '🔐 Login'}
            </button>
          </form>

          <p style={s.hint}>
            Don't have an account? Please contact the Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', sans-serif",
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  brandBox: {
    textAlign: 'center',
    color: '#fff',
    maxWidth: 360,
  },
  logoCircle: {
    width: 90, height: 90,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255,255,255,0.3)',
  },
  collegeName: {
    fontSize: 28, fontWeight: 800,
    margin: '0 0 8px', letterSpacing: '0.5px',
  },
  collegeSubtitle: {
    fontSize: 14, opacity: 0.85, margin: '0 0 30px',
  },
  divider: {
    height: 1, background: 'rgba(255,255,255,0.3)',
    margin: '0 auto 25px', width: '80%',
  },
  featureList: {
    display: 'flex', flexDirection: 'column', gap: 12,
    textAlign: 'left',
  },
  featureItem: {
    fontSize: 14, opacity: 0.9,
    background: 'rgba(255,255,255,0.1)',
    padding: '8px 16px', borderRadius: 8,
  },
  rightPanel: {
    flex: 1,
    background: '#f5f7fb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  formCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    width: '100%',
    maxWidth: 400,
  },
  formTitle: {
    fontSize: 26, fontWeight: 700,
    color: '#1a1a2e', margin: '0 0 6px',
  },
  formSubtitle: {
    fontSize: 14, color: '#888',
    margin: '0 0 28px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#444' },
  inputWrapper: {
    display: 'flex', alignItems: 'center',
    border: '1.5px solid #dde3ee',
    borderRadius: 10, overflow: 'hidden',
    background: '#f9fafc',
    transition: 'border 0.2s',
  },
  inputIcon: {
    padding: '0 12px', fontSize: 18,
    background: '#f0f4ff',
    borderRight: '1px solid #dde3ee',
    height: 46, display: 'flex', alignItems: 'center',
  },
  input: {
    flex: 1, border: 'none', outline: 'none',
    padding: '12px 14px', fontSize: 14,
    background: 'transparent', color: '#333',
  },
  eyeIcon: {
    padding: '0 14px', cursor: 'pointer',
    fontSize: 18, userSelect: 'none',
  },
  errorBox: {
    background: '#fff0f0',
    border: '1px solid #ffcccc',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13, color: '#c0392b',
  },
  loginBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
    color: '#fff', border: 'none',
    borderRadius: 10, cursor: 'pointer',
    fontSize: 15, fontWeight: 700,
    letterSpacing: '0.5px',
    boxShadow: '0 4px 15px rgba(26,115,232,0.4)',
  },
  hint: {
    textAlign: 'center', fontSize: 12,
    color: '#aaa', marginTop: 20,
  },
};