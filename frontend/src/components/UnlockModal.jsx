// ================================================================
// FILE: UnlockModal.jsx
// PATH: src/components/
// Work: Unlock confirmation modal
//   - Student wise
//   - Course wise
//   - Programme wise
// ================================================================

import { useState } from 'react';

export default function UnlockModal({ info, onConfirm, onCancel }) {
  const [remarks,  setRemarks]  = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleConfirm = async () => {
    // Validation
    if (!remarks.trim()) {
      setError('Remarks is required'); return;
    }
    if (!password.trim()) {
      setError('Password is required'); return;
    }

    setLoading(true);
    setError('');
    try {
      await onConfirm(password, remarks);
    } catch (e) {
      setError(e.message || 'Something Wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ── Backdrop ──────────────────────────────────────────────
    <div style={s.backdrop}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <span style={{ fontSize: 22 }}>🔓</span>
          <h3 style={s.title}>Unlock Confirmation</h3>
        </div>

        {/* Info - unlock */}
        <div style={s.infoBox}>
          {info.type === 'single' && (
            <>
              <InfoRow label="Type"    value="Student Wise Unlock" />
              <InfoRow label="Student" value={info.studentName || '-'} />
              <InfoRow label="Enrolment" value={info.enrolmentNo} />
              <InfoRow label="Course"  value={info.courseCode} />
            </>
          )}
          {info.type === 'course' && (
            <>
              <InfoRow label="Type"          value="Course Wise Bulk Unlock" />
              <InfoRow label="Course Code"   value={info.courseCode} />
              <InfoRow label="Total Locked"  value={`${info.lockedCount} records`} />
            </>
          )}
          {info.type === 'programme' && (
            <>
              <InfoRow label="Type"         value="Programme Wise Bulk Unlock" />
              <InfoRow label="Programme"    value={info.programmeName} />
              <InfoRow label="Term"         value={info.term} />
              <InfoRow label="Course Code"  value={info.courseCode} />
              <InfoRow label="Total Locked" value={`${info.lockedCount} records`} />
            </>
          )}
        </div>

        {/* Remarks */}
        <div style={s.fieldGroup}>
          <label style={s.label}>
            Remarks <span style={{ color: 'red' }}>*</span>
            <span style={{ color: '#888', fontWeight: 400 }}>
              {' '}(Why unlock?)
            </span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Marks correction required, Data entry error..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            style={s.textarea}
          />
        </div>

        {/* Password */}
        <div style={s.fieldGroup}>
          <label style={s.label}>
            Admin Password <span style={{ color: 'red' }}>*</span>
          </label>
          <div style={s.passWrapper}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={s.passInput}
            />
            <span
              style={s.eyeIcon}
              onClick={() => setShowPass(v => !v)}
            >
              {showPass ? '🙈' : '👁️'}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        <div style={s.btnRow}>
          <button onClick={onCancel} style={s.btnCancel}>
            ❌ Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ ...s.btnConfirm, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Unlocking...' : '🔓 Confirm Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small helper component
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <span style={{ fontWeight: 600, color: '#555',
        minWidth: 120, fontSize: 13 }}>{label}:</span>
      <span style={{ color: '#222', fontSize: 13 }}>{value}</span>
    </div>
  );
}

const s = {
  backdrop: {
    position: 'fixed', top: 0, left: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999,
  },
  modal: {
    background: '#fff', borderRadius: 14,
    padding: '28px 32px', width: '100%',
    maxWidth: 480,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex', alignItems: 'center',
    gap: 10, marginBottom: 20,
    borderBottom: '2px solid #e3f2fd',
    paddingBottom: 14,
  },
  title: {
    margin: 0, fontSize: 20,
    color: '#1565c0', fontWeight: 700,
  },
  infoBox: {
    background: '#f0f7ff',
    border: '1px solid #b3d4f5',
    borderRadius: 8, padding: '12px 16px',
    marginBottom: 18,
  },
  fieldGroup: {
    display: 'flex', flexDirection: 'column',
    gap: 6, marginBottom: 16,
  },
  label: {
    fontSize: 13, fontWeight: 600, color: '#444',
  },
  textarea: {
    padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #ccc', fontSize: 14,
    resize: 'vertical', fontFamily: 'inherit',
    outline: 'none',
  },
  passWrapper: {
    display: 'flex', alignItems: 'center',
    border: '1.5px solid #ccc', borderRadius: 8,
    overflow: 'hidden',
  },
  passInput: {
    flex: 1, padding: '10px 12px',
    border: 'none', outline: 'none',
    fontSize: 14,
  },
  eyeIcon: {
    padding: '0 12px', cursor: 'pointer',
    fontSize: 18, userSelect: 'none',
  },
  errorBox: {
    background: '#fff0f0',
    border: '1px solid #ffcccc',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#c0392b',
    marginBottom: 16,
  },
  btnRow: {
    display: 'flex', gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnCancel: {
    padding: '10px 20px',
    background: '#f5f5f5', color: '#555',
    border: '1px solid #ccc', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600,
  },
  btnConfirm: {
    padding: '10px 24px',
    background: '#1565c0', color: '#fff',
    border: 'none', borderRadius: 8,
    cursor: 'pointer', fontWeight: 700,
    fontSize: 14,
  },
};