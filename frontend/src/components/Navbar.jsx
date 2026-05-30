// ================================================================
// FILE: Navbar.jsx
// PATH: src/components/
// Work: Top navigation - username, role, logout
// ================================================================

export default function Navbar({ user, activePage, onNavigate, onLogout }) {
  return (
    <div style={s.navbar}>

      {/* Left - Logo + Title */}
      <div style={s.brand}>
        <span style={{ fontSize: 22 }}>🎓</span>
        <span style={s.brandText}>Marks Entry Portal</span>
      </div>

      {/* Center - Navigation links */}
      <div style={s.navLinks}>
        <button
          style={{
            ...s.navBtn,
            ...(activePage === 'marks' ? s.navBtnActive : {}),
          }}
          onClick={() => onNavigate('marks')}
        >
          📋 Marks Entry
        </button>
        <button
  style={{
    ...s.navBtn,
    ...(activePage === 'search' ? s.navBtnActive : {}),
  }}
  onClick={() => onNavigate('search')}
>
  🔍 Search Student
</button>

        {(user?.role === 'ADMIN' || user?.role === 'EXAMINER' || user?.role === 'VIEWER') && (
  <button
    style={{
      ...s.navBtn,
      ...(activePage === 'admin' ? s.navBtnActive : {}),
    }}
    onClick={() => onNavigate('admin')}>
    {user?.role === 'ADMIN' ? '⚙️ Admin Panel' : '📊 Statistics'}
  </button>
)}
{/* ── YAHAN SE NAYE BUTTONS ADD KIYE HAIN ── */}
        {(user?.role === 'ADMIN' || user?.role === 'EXAMINER' || user?.role === 'VIEWER') && (
          <button
            style={{
              ...s.navBtn,
              ...(activePage === 'marksDiff' ? s.navBtnActive : {}),
            }}
            onClick={() => onNavigate('marksDiff')}
          >
            🔍 Marks Diff
          </button>
        )}

        {(user?.role === 'ADMIN' || user?.role === 'EXAMINER' || user?.role === 'VIEWER') && (
          <button
            style={{
              ...s.navBtn,
              ...(activePage === 'validationReport' ? s.navBtnActive : {}),
            }}
            onClick={() => onNavigate('validationReport')}
          >
            📋 Validation
          </button>
        )}
      </div>

      {/* Right - User info + Logout */}
      <div style={s.userSection}>
        <div style={s.userInfo}>
          <div style={s.avatar}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={s.userText}>
            <div style={s.userName}>{user?.fullName || user?.username}</div>
            <div style={s.userRole}>{user?.role}</div>
          </div>
        </div>
        <button onClick={onLogout} style={s.logoutBtn}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

const s = {
  navbar: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff',
    padding: '0 24px',
    height: 60,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'sticky', top: 0, zIndex: 100,
    flexWrap: 'wrap', gap: 8,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  brandText: {
    fontWeight: 800, fontSize: 17, color: '#1a73e8',
  },
  navLinks: {
    display: 'flex', gap: 6,
  },
  navBtn: {
    padding: '8px 16px',
    border: 'none', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600,
    fontSize: 13, background: 'transparent',
    color: '#555',
  },
  navBtnActive: {
    background: '#e8f0fe', color: '#1a73e8',
  },
  userSection: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
    color: '#fff', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15,
  },
  userText: { lineHeight: 1.3 },
  userName: { fontWeight: 600, fontSize: 13, color: '#333' },
  userRole: {
    fontSize: 11, color: '#888',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  logoutBtn: {
    padding: '7px 14px',
    background: '#ffebee', color: '#c62828',
    border: '1px solid #ffcdd2',
    borderRadius: 8, cursor: 'pointer',
    fontWeight: 600, fontSize: 13,
  },
};