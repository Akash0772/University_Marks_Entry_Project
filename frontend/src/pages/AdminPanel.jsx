// ================================================================
// FILE: AdminPanel.jsx
// PATH: src/pages/
// Work: User management + course-wise stats table (FIXED ALL ESLINT)
// ================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getUsersApi, createUserApi, updateUserApi, toggleUserApi,
  getStatsOverview, getStatsCourse, getStatsSource, getStatsEntryByUser,
  getStatsCourseFiltered,
} from '../api';
import { toast } from 'react-toastify';

export default function AdminPanel({ user, onNavigateToMarks }) {
  const [activeTab, setActiveTab] = useState(() => {
  return user?.role === 'ADMIN' ? 'users' : 'stats';
});

  const [users,       setUsers]       = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [editUser,    setEditUser]    = useState(null); 
  const [formData,    setFormData]    = useState({ username: '', fullName: '', email: '', role: 'EXAMINER', password: '' });
  const [userLoading, setUserLoading] = useState(false);

  const [overview,    setOverview]    = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [sourceStats, setSourceStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState('');
const [programmeList,     setProgrammeList]     = useState([]);
  const [entryByUser, setEntryByUser] = useState([]);
  

  // ── USER FUNCTIONS (Shifted Up Before UseEffect) ──
  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const res = await getUsersApi();
      setUsers(res.data);
    } catch { toast.error('Users load error'); }
    finally { setUserLoading(false); }
  }, []);

  const loadStats = useCallback(async (programme = '') => {
  setStatsLoading(true);
  try {
    const [ov, filtered, ss, eu, allCourses] = await Promise.all([
      getStatsOverview(),
      getStatsCourseFiltered(programme),
      getStatsSource(),
      getStatsEntryByUser(),
      programme === '' ? Promise.resolve(null) : getStatsCourse(), // list
    ]);
    setOverview(ov.data);
    setCourseStats(filtered.data);
    setSourceStats(ss.data);
    setEntryByUser(eu.data || []);
    // Programme list sirf pehli baar set karo
    if (programmeList.length === 0) {
      const base = allCourses ? allCourses.data : filtered.data;
      const progs = [...new Set(base.map(c => c.programmeName).filter(Boolean))].sort();
      setProgrammeList(progs);
    }
  } catch { toast.error('Stats load error'); }
  finally { setStatsLoading(false); }
}, [programmeList.length]);

  // ── HOOKS ──
  useEffect(() => {
  if (user?.role !== 'ADMIN' && activeTab === 'users') {
    setActiveTab('stats');
  }
  if (activeTab === 'users' && user?.role === 'ADMIN') loadUsers();
  // if (activeTab === 'stats') loadStats();
  if (activeTab === 'stats') loadStats('');
}, [activeTab, user?.role, loadUsers, loadStats]);

  const openCreateForm = () => {
    setEditUser(null);
    setFormData({ username: '', fullName: '', email: '', role: 'EXAMINER', password: '' });
    setShowForm(true);
  };

  const handleProgrammeChange = (e) => {
  const val = e.target.value;
  setSelectedProgramme(val);
  loadStats(val);
};

  const openEditForm = (u) => {
    setEditUser(u);
    setFormData({
      username: u.username,
      fullName: u.fullName,
      email:    u.email || '',
      role:     u.role,
      password: '', 
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.fullName) {
      toast.error('Username And Full Name Required');
      return;
    }
    if (!editUser && !formData.password) {
      toast.error('New User And Password Required');
      return;
    }
    try {
      if (editUser) {
        await updateUserApi(editUser.id, formData);
        toast.success('User updated!');
      } else {
        await createUserApi(formData);
        toast.success('User created!');
      }
      setShowForm(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error!');
    }
  };

  const handleToggle = async (u) => {
    const confirm = window.confirm(`Are you sure you want to ${u.isActive ? 'disable' : 'enable'} ${u.fullName}?`);
    if (!confirm) return;
    try {
      const res = await toggleUserApi(u.id);
      toast.success(res.data.message);
      loadUsers();
    } catch { toast.error('Toggle failed'); }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.headerTitle}>⚙️ Admin Panel</h2>
        <div style={s.tabs}>
          {user?.role === 'ADMIN' && (
            <button style={{ ...s.tab, ...(activeTab === 'users' ? s.tabActive : {}) }} onClick={() => setActiveTab('users')}>👥 User Management</button>
          )}
          <button style={{ ...s.tab, ...(activeTab === 'stats' ? s.tabActive : {}) }} onClick={() => setActiveTab('stats')}>📊 Statistics</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>👥 Users ({users.length})</span>
            <button onClick={openCreateForm} style={s.btnAdd}>➕ Add New User</button>
          </div>

          {showForm && (
            <div style={s.formBox}>
              <h4 style={{ margin: '0 0 16px', color: '#333' }}>{editUser ? '✏️ Edit User' : '➕ Create New User'}</h4>
              <div style={s.formGrid}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Username *</label>
                  <input style={s.input} placeholder="e.g. user01" value={formData.username} disabled={!!editUser} onChange={e => setFormData({ ...formData, username: e.target.value })}/>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Full Name *</label>
                  <input style={s.input} placeholder="e.g. Kumar" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}/>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Email</label>
                  <input style={s.input} placeholder="e.g. a@college.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}/>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Role *</label>
                  <select style={s.input} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="EXAMINER">EXAMINER - Marks Entry</option>
                    <option value="VIEWER">VIEWER - Only View</option>
                    <option value="ADMIN">ADMIN - All</option>
                  </select>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Password {editUser && <span style={{ color: '#999', fontWeight: 400 }}>(blank = No Change)</span>}</label>
                  <input style={s.input} type="password" placeholder={editUser ? 'New password (optional)' : 'password *'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleSubmit} style={s.btnSave}>💾 {editUser ? 'Update' : 'Create'} User</button>
                <button onClick={() => setShowForm(false)} style={s.btnCancel}>❌ Cancel</button>
              </div>
            </div>
          )}

          {userLoading ? <div style={s.loading}>⏳ Loading...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>S.No.</th><th style={s.th}>Username</th><th style={s.th}>Full Name</th><th style={s.th}>Email</th><th style={s.th}>Role</th><th style={s.th}>Status</th><th style={s.th}>Created</th><th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id || i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={s.td}>{i + 1}</td>
                      <td style={{ ...s.td, fontWeight: 'bold' }}>{u.username}</td>
                      <td style={s.td}>{u.fullName}</td>
                      <td style={s.td}>{u.email || '-'}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: u.role === 'ADMIN' ? '#e3f2fd' : u.role === 'EXAMINER' ? '#e8f5e9' : '#fff3e0', color: u.role === 'ADMIN' ? '#1565c0' : u.role === 'EXAMINER' ? '#2e7d32' : '#e65100' }}>{u.role}</span></td>
                      <td style={s.td}><span style={{ ...s.badge, background: u.isActive ? '#e8f5e9' : '#ffebee', color: u.isActive ? '#2e7d32' : '#c62828' }}>{u.isActive ? '✅ Active' : '🚫 Disabled'}</span></td>
                      <td style={s.td}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEditForm(u)} style={s.btnEdit}>✏️</button>
                          <button onClick={() => handleToggle(u)} style={{ ...s.btnToggle, background: u.isActive ? '#ffebee' : '#e8f5e9', color: u.isActive ? '#c62828' : '#2e7d32' }}>{u.isActive ? '🚫' : '✅'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div style={s.empty}>Not Found User</div>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div>
          {statsLoading ? <div style={{ ...s.loading, ...s.card }}>⏳ Loading stats...</div> : (
            <>
              {overview && (
                <div style={s.overviewGrid}>
                  <StatCard icon="👨‍🎓" label="Total Records" value={overview.totalStudents} color="#1a73e8" />
                  <StatCard icon="✅" label="Marks Entered" value={overview.marksEntered} color="#28a745" />
                  <StatCard icon="⏳" label="Marks Pending" value={overview.marksPending} color="#ff9800" />
                  <StatCard icon="🚫" label="Total Absent" value={overview.totalAbsent} color="#c62828" />
                  <StatCard icon="📂" label="Excel Records" value={overview.excelRecords} color="#6c757d" />
                  <StatCard icon="✍️" label="Manual Records" value={overview.manualRecords} color="#e83e8c" />
                </div>
              )}

              <div style={s.card}>
                <div style={s.cardHeader}>
  <span style={s.cardTitle}>📚 Course-wise Statistics</span>
  <select
    value={selectedProgramme}
    onChange={handleProgrammeChange}
    style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #ccc', fontSize: 13, cursor: 'pointer', minWidth: 180 }}
  >
    <option value="">📋 All Programmes</option>
    {programmeList.map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.thead}>
                        <th style={s.th}>S.No.</th><th style={s.th}>Course Code</th><th style={s.th}>Course Name</th><th style={s.th}>Max Marks</th><th style={s.th}>Total Students</th><th style={s.th}>Marks Entered</th><th style={s.th}>Pending</th><th style={s.th}>Avg Marks</th><th style={s.th}>Remaining</th><th style={s.th}>Filled By (Users)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStats.map((c, i) => {
                        const avg = c.averageMarks;
                        const remaining = avg != null ? (c.maximumMarks - avg).toFixed(1) : '-';
                        return (
                          <tr key={`${c.courseCode}-${i}`} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                            <td style={s.td}>{i + 1}</td>
                            <td onClick={() => onNavigateToMarks && onNavigateToMarks(c.courseCode)} style={{ ...s.td, color: '#1a73e8', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }} title="Click to filter in Marks Entry">{c.courseCode}</td>
                            <td style={s.td}>{c.courseName || '-'}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>{c.maximumMarks}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>{c.totalStudents}</td>
                            <td style={{ ...s.td, textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>{c.entered}</td>
                            <td style={{ ...s.td, textAlign: 'center', color: c.pending > 0 ? '#ff9800' : '#28a745', fontWeight: 'bold' }}>{c.pending}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>{avg != null ? avg : '-'}</td>
                            <td style={{ ...s.td, textAlign: 'center', color: '#e83e8c' }}>{remaining}</td>
                            <td style={s.td}>
                              {entryByUser.filter(e => e.courseCode === c.courseCode).map(e => `${e.username} (${e.filled})`).join(', ') || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardHeader}><span style={s.cardTitle}>📁 Entry Source Summary</span></div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {sourceStats.map((src, i) => (
                    <div key={src.source || i} style={{ flex: 1, minWidth: 150, padding: '20px', borderRadius: 10, background: src.source === 'MANUAL' ? '#fff3e0' : '#e8f5e9', border: `1px solid ${src.source === 'MANUAL' ? '#ffcc80' : '#a5d6a7'}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 32 }}>{src.source === 'MANUAL' ? '✍️' : '📂'}</div>
                      <div style={{ fontWeight: 'bold', fontSize: 22, color: src.source === 'MANUAL' ? '#e65100' : '#2e7d32' }}>{src.count}</div>
                      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{src.source} Records</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}`, display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color }}>{value ?? '-'}</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

const s = {
  page:       { padding: '0' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  headerTitle:{ margin: 0, fontSize: 22, color: '#1a73e8' },
  tabs:       { display: 'flex', gap: 8 },
  tab:        { padding: '9px 22px', border: '2px solid #dde3ee', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, background: '#fff', color: '#555' },
  tabActive:  { background: '#1a73e8', color: '#fff', border: '2px solid #1a73e8' },
  card:       { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '20px', marginBottom: 20 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:  { fontWeight: 700, fontSize: 16, color: '#333' },
  overviewGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 16, marginBottom: 20 },
  formBox:    { background: '#f9f9f9', border: '1px dashed #bbb', borderRadius: 10, padding: 20, marginBottom: 20 },
  formGrid:   { display: 'flex', flexWrap: 'wrap', gap: 14 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 200px' },
  label:      { fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase' },
  input:      { padding: '10px 12px', borderRadius: 7, border: '1px solid #ccc', fontSize: 14 },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead:      { background: '#1a73e8' },
  th:         { padding: '11px 12px', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' },
  td:         { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' },
  trEven:     { background: '#fff' },
  trOdd:      { background: '#f9fbff' },
  badge:      { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnAdd:     { padding: '9px 18px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 },
  btnSave:    { padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 'bold' },
  btnCancel:  { padding: '10px 20px', background: '#f5f5f5', color: '#555', border: '1px solid #ccc', borderRadius: 7, cursor: 'pointer' },
  btnEdit:    { padding: '5px 10px', background: '#e3f2fd', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15 },
  btnToggle:  { padding: '5px 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 15 },
  loading:    { textAlign: 'center', padding: 40, color: '#888' },
  empty:      { textAlign: 'center', padding: 30, color: '#aaa' },
};