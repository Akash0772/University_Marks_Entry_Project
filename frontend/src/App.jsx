// cspell:disable

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route,
  Navigate, useNavigate, useLocation,
} from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { toast, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import LoginPage   from './pages/LoginPage';
import AdminPanel  from './pages/AdminPanel';
import SearchStudent from './pages/SearchStudent';
import Navbar      from './components/Navbar';
import UnlockModal from './components/UnlockModal';
import MarksDiffPage from './pages/MarksDiffPage';
import ValidationReportPage from './pages/ValidationReportPage';

import {
  getProgrammes, getTerms, getCourseCodes,
  getAllAvailableCourses, searchMarks, saveMarks, addNewRecord,
  unlockSingle, unlockByCourse, unlockByProgramme,
} from './api';

ModuleRegistry.registerModules([AllCommunityModule]);

// -- LOCK STATUS RENDERER ----------------------------------
const LockStatusRenderer = (params) => {
  const locked = params.data?.isLocked;
  return (
    <span style={{ fontWeight: 'bold', color: locked ? '#c62828' : '#2e7d32', fontSize: '13px' }}>
      {locked ? '🔒 Locked' : '🔓 Open'}
    </span>
  );
};

// -- UNLOCK BUTTON RENDERER --------------------------------
const UnlockButtonRenderer = (params) => {
  if (!params.data?.isLocked) return <span style={{ color: '#aaa' }}>—</span>;
  return (
    <button
      onClick={() => window.__openUnlockModal?.(params.data)}
      style={{ padding: '3px 10px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
    >
      Unlock
    </button>
  );
};



// -- URL ↔ PAGE NAME MAPPING -----------------------------------
const PAGE_TO_PATH = {
  marks:            '/',
  search:           '/search',
  admin:            '/admin',
  marksDiff:        '/marks-diff',
  validationReport: '/validation',
};

// export default function App() {
//   const [user, setUser] = useState(() => {
//     const s = localStorage.getItem('user');
//     return s ? JSON.parse(s) : null;
//   });

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AppShell />
//     </BrowserRouter>
//   );
// }
  // const [activePage, setActivePage] = useState('marks');
  // const activePage = PATH_TO_PAGE[location.pathname] || 'marks';
  const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([k, v]) => [v, k])
);

// -- PROTECTED ROUTE WRAPPER -----------------------------------
function ProtectedRoute({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// -- MAIN APP SHELL (inside Router) ---------------------------
function AppShell() {
  const navigate   = useNavigate();
  const location   = useLocation();

  // Derive activePage from current URL
  const activePage = PATH_TO_PAGE[location.pathname] || 'marks';

  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });

  const [programmes,       setProgrammes]       = useState([]);
  const [terms,            setTerms]            = useState([]);
  const [courseCodes,      setCourseCodes]      = useState([]);
  const [masterCourseList, setMasterCourseList] = useState([]);

  const [selProgramme,    setSelProgramme]    = useState('');
  const [selTerm,         setSelTerm]         = useState('');
  const [selCourseCode,   setSelCourseCode]   = useState('');
  const [jumpCourseCode,  setJumpCourseCode]  = useState('');
  const [allProgramme,    setAllProgramme]    = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');

  const [rowData,  setRowData]  = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [modalInfo,      setModalInfo]      = useState(null);
  const [bulkUnlockType, setBulkUnlockType] = useState('course');

  const [courseInfo, setCourseInfo] = useState({
    programme: '-', courseCode: '-', maximumMarks: '-', credit: '-',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    enrolmentNo: '', studentName: '', programmeName: '',
    semester: '', courseCode: '', marks: '', status: 'Present',
    courseName: '-', maximumMarks: 100,
  });

  const gridRef = useRef();

  const isAdmin    = user?.role === 'ADMIN';
  const isEditable = user?.role !== 'VIEWER' && user !== null;

   // Navigation helper - URL change
  const handleNavigate = useCallback((page) => {
    const path = PAGE_TO_PATH[page] || '/';
    navigate(path);
  }, [navigate]);

  useEffect(() => {
    window.__openUnlockModal = (data) => {
      setModalInfo({
        type:        'single',
        enrolmentNo: data.enrolmentNo,
        studentName: data.studentName,
        courseCode:  data.courseCode,
        lockedCount: 1,
      });
    };
    return () => { delete window.__openUnlockModal; };
  }, []);

  // -- HANDLERS --
   const handleLogin = useCallback((u) => {
    setUser(u);
    navigate('/', { replace: true });
  }, [navigate]);

 const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRowData([]);
    setSearched(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleProgrammeChange = async (e) => {
    const val = e.target.value;
    setSelProgramme(val); setSelTerm(''); setSelCourseCode('');
    setTerms([]); setCourseCodes([]);
    if (val) { const r = await getTerms(val); setTerms(r.data); }
  };

  const handleTermChange = async (e) => {
    const val = e.target.value;
    setSelTerm(val); setSelCourseCode(''); setCourseCodes([]);
    if (val) {
      const r = await getCourseCodes(selProgramme, val);
      setCourseCodes(r.data);
    }
  };

  // Wrap in useCallback to fix ESLint set-state-in-effect and exhaustive-deps
  const handleSearch = useCallback(async () => {
    if (allProgramme && !selCourseCode) {
      toast.warning('Select Course Code'); return;
    }
    if (!allProgramme && !selCourseCode) {
      toast.warning('Programme > Term > Select Course Code'); return;
    }
    setLoading(true); setRowData([]);
    try {
      const r = await searchMarks({
        programme:    allProgramme ? '' : selProgramme,
        term:         allProgramme ? '' : selTerm,
        courseCode:   selCourseCode || '',
        allProgramme,
      });
      setRowData(r.data); setSearched(true);
      if (r.data.length > 0) {
        const f = r.data[0];
        setCourseInfo({
          programme:    f.programmeName || '-',
          courseCode:   f.courseCode    || '-',
          maximumMarks: f.maximumMarks  || '-',
          credit:       f.credit        || '-',
        });
      } else {
        setCourseInfo({ programme: '-', courseCode: '-', maximumMarks: '-' });
        toast.info('Not Found Any Record');
      }
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  }, [allProgramme, selCourseCode, selProgramme, selTerm]);

  const handleSave = async () => {
    if (!gridRef.current?.api) return;
    const rows = [];
    gridRef.current.api.forEachNode(n =>
      rows.push({ ...n.data, entryBy: user.username })
    );
    setSaving(true);
    try {
      await saveMarks(rows);
      toast.success('Saved Successfully!');
      handleSearch();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleAddNew = async () => {
    if (!newEntry.enrolmentNo || !newEntry.courseCode) {
      toast.error('Enrolment and Course Code Required'); return;
    }
    try {
      const r = await addNewRecord({ ...newEntry, entryBy: user.username });
      toast.success(r.data.message || 'Saved!');
      setShowAddForm(false);
      setNewEntry({
        enrolmentNo: '', studentName: '', programmeName: '',
        semester: '', courseCode: '', marks: '', status: 'Present',
        courseName: '-', maximumMarks: 100,
      });
      if (searched) handleSearch();
    } catch { toast.error('Error! Backend check'); }
  };

  const openBulkUnlockModal = () => {
    if (!selCourseCode) {
      toast.warning('Course Code select'); return;
    }
    const lockedCount = rowData.filter(r => r.isLocked).length;
    if (lockedCount === 0) {
      toast.info('Koi locked record nahi hai'); return;
    }
    if (bulkUnlockType === 'course') {
      setModalInfo({ type: 'course', courseCode: selCourseCode, lockedCount });
    } else {
      if (!selProgramme || !selTerm) {
        toast.warning('Programme and Term Select'); return;
      }
      setModalInfo({
        type: 'programme', programmeName: selProgramme,
        term: selTerm, courseCode: selCourseCode, lockedCount,
      });
    }
  };

  const handleModalConfirm = async (password, remarks) => {
    try {
      let r;
      if (modalInfo.type === 'single') {
        r = await unlockSingle(modalInfo.enrolmentNo, modalInfo.courseCode, password, remarks);
      } else if (modalInfo.type === 'course') {
        r = await unlockByCourse(modalInfo.courseCode, password, remarks);
      } else {
        r = await unlockByProgramme(modalInfo.programmeName, modalInfo.term, modalInfo.courseCode, password, remarks);
      }
      toast.success(r.data.message || "Unlocked successfully!");
      setModalInfo(null);
      handleSearch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unlock failed');
    }
  };

  const onCellValueChanged = (params) => {
    const field    = params.colDef.field;
    const data     = params.data;
    const maxMarks = Number(data.maximumMarks) || 100;
    if (field === 'status') {
      if (data.status === 'Absent' || data.status === 'Withheld') {
        params.node.setDataValue('marks', 0);
        toast.info(`"${data.status}" - Marks 0 set`);
      }
    }
    if (field === 'marks') {
      const val = Number(data.marks);
      if (!isNaN(val) && val > maxMarks) {
        params.node.setDataValue('marks', 0);
        toast.warning(`Max ${maxMarks}! 0 set.`);
      }
      if (!isNaN(val) && val < 0) params.node.setDataValue('marks', 0);
    }
  };

  // -- HOOKS --
  useEffect(() => {
    if (!user) return;
    getProgrammes()
      .then(r => setProgrammes(r.data))
      .catch(() => toast.error('Programme load error'));
    getAllAvailableCourses()
      .then(r => setMasterCourseList(r.data))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (jumpCourseCode && activePage === 'marks') {
      handleSearch(); 
      setJumpCourseCode('');
    }
  }, [jumpCourseCode, activePage, handleSearch]); // Added handleSearch dependency safely

  const columnDefs = useMemo(() => [
    { headerName: 'S.No.', valueGetter: 'node.rowIndex + 1', width: 70, sortable: false, filter: false },
    { headerName: 'Enrolment No', field: 'enrolmentNo', width: 155, cellStyle: { fontWeight: 'bold' }, sort: 'asc', sortIndex: 0 },
    {
      headerName: 'Marks', field: 'marks', width: 110, editable: (params) => {
      //   if(isAdmin) return true;
      //   return isEditable && !params.data?.isLocked && params.data?.entryBy === user?.username;
      // }, 
      if (isAdmin) return true;
        if (params.data?.marks == null || params.data?.marks === "") {
          return isEditable && !params.data?.isLocked;
        }
        return isEditable && !params.data?.isLocked && params.data?.entryBy === user?.username;
      },
      valueParser: (params) => {
        const val  = parseFloat(params.newValue);
        const maxM = Number(params.data.maximumMarks) || 100;
        if (isNaN(val) || val < 0 || val > maxM) {
          toast.error(`Marks should be between 0 and ${maxM}!`);
          return params.oldValue;
        }
        const dynamicValue = Math.round(val * 100) / 100; 
        return dynamicValue;
      },
      // cellStyle: (params) => {
      //   const isOwner = isAdmin || params.data?.entryBy === user?.username;
      //   const isLocked = params.data?.isLocked;
      //   return {
      //     backgroundColor: isLocked ? '#e0e0e0' : (isOwner && isEditable ? '#fffde7' : '#f5f5f5'),
      //     border: isLocked ? '1px solid #ccc' : (isOwner ? '1px solid #1a73e8' : '1px solid #ddd'), 
      //     textAlign: 'center', 
      //     fontWeight: 'bold', 
      //     color: isOwner && !isLocked ? '#333' : '#777'
      //   };
      // }
      valueFormatter: (params) => {
    if (params.value == null || params.value === "") return "";

    return params.value % 1 === 0 ? params.value.toString() : params.value;
  },
      cellStyle: (params) => {
        const isLocked = params.data?.isLocked;
        const hasMarks = params.data?.marks != null && params.data?.marks !== "";
        const isOwner = isAdmin || params.data?.entryBy === user?.username;
        const canEdit = isAdmin || !hasMarks || (isOwner && isEditable);

        return {
          backgroundColor: isLocked ? '#e0e0e0' : (canEdit ? '#fffde7' : '#f5f5f5'), 
          border: isLocked ? '1px solid #ccc' : (canEdit ? '1px solid #1a73e8' : '1px solid #ddd'), 
          textAlign: 'center', 
          fontWeight: 'bold', 
          color: isLocked ? '#777' : '#333'
        };
      }
    },
    { headerName: 'Status', field: 'status', editable: (params) => {
    //   if (isAdmin) return true;
    //   return isEditable && !params.data?.isLocked && params.data?.entryBy === user?.username;
    // }, 
    if (isAdmin) return true;
        if (params.data?.marks == null || params.data?.marks === "") {
          return isEditable && !params.data?.isLocked;
        }
        return isEditable && !params.data?.isLocked && params.data?.entryBy === user?.username;
      },
    width: 130, cellEditor: 'agSelectCellEditor', cellEditorParams: { values: ['Present', 'Absent', 'UFM', 'Withheld'] } },
    {
      headerName: 'Lock Status', field: 'isLocked', 
      width: 130, editable: false, cellRenderer: LockStatusRenderer,
    },
    {
      headerName: 'Unlock', field: 'unlockAction',
      width: 120, editable: false, hide: !isAdmin, cellRenderer: UnlockButtonRenderer,
    },
    { headerName: 'Entry By', field: 'entryBy', width: 120, editable: false, cellStyle: { color: '#555', fontStyle: 'italic', fontSize: '12px' } },
    { headerName: 'Last Updated', field: 'updatedAt', width: 170, editable: false, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString('en-IN') : '-', cellStyle: { fontSize: '12px', color: '#444' } },
    { headerName: 'Entry Type', field: 'entrySource', width: 110, editable: false, cellStyle: (p) => ({ color: p.value === 'MANUAL' ? '#e65100' : '#1b5e20', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }) }
  ], [isEditable, isAdmin, user]);

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), []);
  const getRowStyle = useCallback((params) => {
    if(params.data?.isLocked){
      return { background: '#f5f5f5', color: '#888'};
    }
    return null;
  }, []);

  // if (!user) return (
  //   <>
  //     <ToastContainer position="top-center" autoClose={2000}/>
  //     <LoginPage onLogin={(u) => { setUser(u); setActivePage('marks'); }}/>
  //   </>
  // );

//   return (
//     <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
//       <ToastContainer position="top-center" autoClose={2000}/>

//       {modalInfo && (
//         <UnlockModal
//           info={modalInfo}
//           onConfirm={handleModalConfirm}
//           onCancel={() => setModalInfo(null)}
//         />
//       )}
//       <Navbar user={user} activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} />
//       <Routes>
//   <Route path="/"           element={MarksEntryPage} />
//   <Route path="/search"     element={<SearchStudent />} />
//   <Route path="/marks-diff" element={<MarksDiffPage />} />
//   <Route path="/validation" element={<ValidationReportPage />} />
//   <Route path="/admin"      element={<AdminPanel ... />} />
//   <Route path="*"           element={<Navigate to="/" />} />
// </Routes>
//       <div style={{ padding: '20px' }}>
//         {/* {activePage === 'search' && <SearchStudent/>} */}
//         {/* YAHAN YE DONO LINES ADD KARO */}
//         {/* {activePage === 'marksDiff' && <MarksDiffPage />}
//         {activePage === 'validationReport' && <ValidationReportPage />} */}
//         {activePage === 'admin' && (isAdmin || user?.role === 'EXAMINER' || user?.role === 'VIEWER') && (
//           <AdminPanel
//             user={user}
//             onNavigateToMarks={(courseCode) => {
//               setAllProgramme(true);
//               setSelCourseCode(courseCode);
//               setActivePage('marks');
//               setJumpCourseCode(courseCode);
//             }}
//           />
//         )}
       const MarksEntryPage = (
          <>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={{ color: '#1a73e8', margin: 0 }}>Marks Entry Portal</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Bulk Unlock Controller Panel */}
                  {isAdmin && searched && selCourseCode && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff3e0', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ffe0b2' }}>
                      <select
                        value={bulkUnlockType}
                        onChange={e => setBulkUnlockType(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="course">Course Wise</option>
                        <option value="programme">Programme Wise</option>
                      </select>
                      <button onClick={openBulkUnlockModal} style={{ padding: '6px 12px', background: '#e65100', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        Bulk Unlock
                      </button>
                    </div>
                  )}

                  {isEditable && (
                    <button onClick={() => setShowAddForm(v => !v)} style={s.btnOrange}>
                      {showAddForm ? 'Close' : 'Add New Student'}
                    </button>
                  )}
                </div>

                {/* {isEditable && (
                  <button onClick={() => setShowAddForm(v => !v)} style={s.btnOrange}>
                    {showAddForm ? 'Close' : 'Add New Student'}
                  </button>
                )} */}
              </div>
              {showAddForm && isEditable && (
                <div style={s.addFormCard}>
                  <h4 style={{ marginTop: 0 }}>Add New / Update Entry</h4>
                  <div style={s.formGrid}>
                    <input placeholder="Enrolment No *" value={newEntry.enrolmentNo} onChange={e => setNewEntry({ ...newEntry, enrolmentNo: e.target.value })} style={s.input}/>
                    <input placeholder="Student Name *" value={newEntry.studentName} onChange={e => setNewEntry({ ...newEntry, studentName: e.target.value })} style={s.input}/>
                    <select value={newEntry.programmeName} onChange={e => setNewEntry({ ...newEntry, programmeName: e.target.value })} style={s.input}>
                      <option value="">-- Programme --</option>
                      {programmes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={newEntry.semester} onChange={e => setNewEntry({ ...newEntry, semester: e.target.value })} style={s.input}>
                      <option value="">-- Choose Semester --</option>
                      {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>
                    <input 
                      placeholder="Course Code *" value={newEntry.courseCode}
                      onChange={e => {
                        const enteredCode = e.target.value.toUpperCase().trim();
                        const matchedCourse = masterCourseList.find(c => c && typeof c === 'object' ? c.courseCode === enteredCode : c === enteredCode);
                        if (matchedCourse && typeof matchedCourse === 'object') {
                          setNewEntry({ ...newEntry, courseCode: enteredCode, courseName: matchedCourse.courseName || '-', maximumMarks: matchedCourse.maximumMarks || 100 });
                        } else {
                          setNewEntry({ ...newEntry, courseCode: enteredCode, courseName: '-', maximumMarks: 100 });
                        }
                      }}
                      style={s.input}
                    />
                    <input placeholder="Marks" type="number" min="0" value={newEntry.marks} onChange={e => setNewEntry({ ...newEntry, marks: e.target.value })} style={s.input}/>
                    <select value={newEntry.status} onChange={e => {
                      const st = e.target.value;
                      setNewEntry({ ...newEntry, status: st, marks: (st === 'Absent' || st === 'Withheld') ? '0' : newEntry.marks });
                    }} style={s.input}>
                      <option>Present</option><option>Absent</option><option>UFM</option><option>Withheld</option>
                    </select>
                    <button onClick={handleAddNew} style={s.btnSaveForm}>Save Record</button>
                    <div style={{ fontSize: '13px', color: '#555', padding: '10px', flex: '1 1 100%', background: '#e8f4fd', borderRadius: '6px', marginTop: '10px', border: '1px solid #b3d9f7' }}>
                      📢 Detected Course: <b style={{ color: '#1a73e8' }}>{newEntry.courseName}</b> &nbsp;|&nbsp; Max Marks: <b>{newEntry.maximumMarks}</b>
                    </div>
                  </div>
                </div>
              )}
              <div style={s.dropdownGrid}>
                {!allProgramme && (
                  <div style={s.field}>
                    <label style={s.miniLabel}>Programme</label>
                    <select style={s.select} value={selProgramme} onChange={handleProgrammeChange}>
                      <option value="">-- Choose --</option>
                      {programmes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}
                {!allProgramme && (
                  <div style={s.field}>
                    <label style={s.miniLabel}>Semester</label>
                    <select style={s.select} value={selTerm} onChange={handleTermChange} disabled={!selProgramme}>
                      <option value="">-- Choose --</option>
                      {terms.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
                <div style={s.field}>
                  <label style={s.miniLabel}>Course Code {allProgramme && <span style={{ color: 'red' }}>* required</span>}</label>
                  <select style={s.select} value={selCourseCode} onChange={e => setSelCourseCode(e.target.value)} disabled={!allProgramme && !selTerm}>
                    <option value="">-- Choose --</option>
                    {(allProgramme ? masterCourseList : courseCodes).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={s.checkboxContainer}>
                  <input type="checkbox" id="allCheck" style={{ transform: 'scale(1.3)', cursor: 'pointer' }} checked={allProgramme} onChange={e => {
                    setAllProgramme(e.target.checked); setSelProgramme(''); setSelTerm(''); setSelCourseCode(''); setTerms([]); setCourseCodes([]); setSearched(false); setRowData([]);
                  }}/>
                  <label htmlFor="allCheck" style={s.boldLabel}>Show All Programmes</label>
                </div>
                <button onClick={handleSearch} disabled={loading} style={{ ...s.searchBtn, opacity: loading ? 0.7 : 1 }}>{loading ? 'Loading...' : 'Fetch List'}</button>
              </div>
            </div>
            {searched && (
              <div style={s.card}>
                <div style={s.tableHeader}>
                  <div><span style={{ fontSize: 14 }}>Total Students: &nbsp;&nbsp;<b style={{ color: '#1a73e8' }}>{rowData.length}</b>&nbsp;&nbsp;</span>
                  <input type="text" placeholder="Search in table..." style={s.quickFilter} value={quickFilterText} onChange={e => setQuickFilterText(e.target.value)}/></div>
                  {isEditable && <button onClick={handleSave} disabled={saving} style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : '💾 Save'}</button>}
                </div>
                <div style={s.courseInfoBar}>
                  <span><b>Programme:</b> {courseInfo.programme}</span><span><b>Course Code:</b> {courseInfo.courseCode}</span><span><b>Maximum Marks:</b> {courseInfo.maximumMarks}</span>
                  <span><b>Credit:</b> <b style={{ color: '#e65100' }}>{courseInfo.credit}</b></span>
                  <span style={{ marginLeft: 'auto', color: '#888', fontSize: 12 }}>{user.fullName} ({user.role})</span>
                </div>
                <div style={s.legend}>
  <span>ℹ️ Cells are directly editable. Click on a row under "Marks" or "Status" to update.</span>
  <span style={{ color: '#c62828', fontWeight: 'bold', marginLeft: '10px' }}>
    🔒 Warning: All entries will freeze and automatically lock at 12:00 AM Midnight.
  </span>
</div>
                <div style={{ height: 550, width: '100%' }}>
                  <AgGridReact ref={gridRef} rowData={rowData} columnDefs={columnDefs} defaultColDef={defaultColDef} quickFilterText={quickFilterText} singleClickEdit={true} stopEditingWhenCellsLoseFocus={true} onCellValueChanged={onCellValueChanged} getRowStyle={getRowStyle} modules={[AllCommunityModule]} theme="legacy" className="ag-theme-alpine" />
                </div>
              </div>
            )}
          </>
        );


      // -- ROUTES ------------------------------------------------
  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
      <ToastContainer position="top-center" autoClose={2000}/>

      {modalInfo && (
        <UnlockModal
          info={modalInfo}
          onConfirm={handleModalConfirm}
          onCancel={() => setModalInfo(null)}
        />
      )}

      <Routes>
        {/* -- Public: Login -- */}
        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* -- Protected Pages (with Navbar) -- */}
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user}>
              <>
                <Navbar
                  user={user}
                  activePage={activePage}
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                />
                <div style={{ padding: '20px' }}>
                  <Routes>
                    <Route path="/"            element={MarksEntryPage} />
                    <Route path="/search"      element={<SearchStudent />} />
                    <Route path="/marks-diff"  element={<MarksDiffPage />} />
                    <Route path="/validation"  element={<ValidationReportPage />} />
                    <Route
                      path="/admin"
                      element={
                        (isAdmin || user?.role === 'EXAMINER' || user?.role === 'VIEWER')
                          ? <AdminPanel
                              user={user}
                              onNavigateToMarks={(courseCode) => {
                                setAllProgramme(true);
                                setSelCourseCode(courseCode);
                                setJumpCourseCode(courseCode);
                                navigate('/');
                              }}
                            />
                          : <Navigate to="/" replace />
                      }
                    />
                    {/* unknown URL → home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

// -- ROOT EXPORT (BrowserRouter wrap) -------------------------
export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

const s = {
  card: { background:'#fff', padding:'25px', borderRadius:'12px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:'20px' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' },
  dropdownGrid: { display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'flex-end' },
  field: { display:'flex', flexDirection:'column', gap:'6px', flex:1, minWidth:'175px' },
  boldLabel: { fontWeight:'700', fontSize:'14px', color:'#333', cursor:'pointer', whiteSpace:'nowrap' },
  miniLabel: { fontSize:'11px', fontWeight:'600', color:'#666', textTransform:'uppercase', letterSpacing:'0.5px' },
  select: { padding:'11px', borderRadius:'8px', border:'1px solid #d1d9e0', fontSize:'14px' },
  checkboxContainer: { display:'flex', gap:'10px', alignItems:'center', padding:'10px 14px', background:'#eef2f7', borderRadius:'8px', whiteSpace:'nowrap', alignSelf:'flex-end' },
  searchBtn: { padding:'11px 28px', backgroundColor:'#1a73e8', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'14px', alignSelf:'flex-end' },
  saveBtn: { padding:'11px 28px', backgroundColor:'#28a745', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'15px' },
  tableHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', borderBottom:'1px solid #eee', paddingBottom:'12px' },
  courseInfoBar: { display:'flex', gap:'20px', padding:'10px 16px', background:'#e8f4fd', borderRadius:'8px', marginBottom:'10px', fontSize:'14px', flexWrap:'wrap', border:'1px solid #b3d9f7', alignItems:'center' },
  legend: { display:'flex', gap:'16px', padding:'8px 16px', background:'#fff8e1', borderRadius:'8px', marginBottom:'14px', fontSize:'12px', flexWrap:'wrap', border:'1px solid #ffe082', color:'#666' },
  btnOrange: { padding:'10px 20px', background:'#ff9800', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' },
  addFormCard: { background:'#f9f9f9', padding:'20px', borderRadius:'10px', border:'1px dashed #bbb', marginBottom:'20px' },
  formGrid: { display:'flex', gap:'10px', flexWrap:'wrap' },
  input: { padding:'10px', borderRadius:'6px', border:'1px solid #ccc', flex:'1 1 180px', fontSize:'14px' },
  btnSaveForm: { padding:'10px 22px', background:'#4caf50', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', alignSelf:'flex-end' },
  quickFilter: { padding:'8px 15px', borderRadius:'20px', border:'1px solid #1a73e8', width:'260px', outline:'none', fontSize:'13px' },
};