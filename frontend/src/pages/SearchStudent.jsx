// FILE: SearchStudent.jsx
// PATH: src/pages/
import { useState } from 'react';
import { searchMarks } from '../api';

export default function SearchStudent() {
  const [enrolmentNo, setEnrolmentNo] = useState('');
  const [results,     setResults]     = useState([]);
  const [searched,    setSearched]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSearch = async () => {
    const val = enrolmentNo.trim();
    if (!val) { setError('Enrolment No. required'); return; }
    setError(''); setLoading(true); setResults([]);
    try {
      // allProgramme=true, courseCode blank → all records fetch
      const r = await searchMarks({ allProgramme: true, courseCode: '' });
      const filtered = r.data.filter(row =>
        row.enrolmentNo?.toLowerCase().includes(val.toLowerCase())
      );
      setResults(filtered);
      setSearched(true);
      if (filtered.length === 0) setError('No records found for this enrolment.');
    } catch { setError('Search failed. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>🔍 Search Student</h2>
        <p style={s.subtitle}>
          Student Enrolment No. Details (read-only)
        </p>
        <div style={s.searchRow}>
          <input
            placeholder="Enrolment No. e.g. 12345678"
            value={enrolmentNo}
            onChange={e => setEnrolmentNo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={s.input}
          />
          <button onClick={handleSearch} disabled={loading} style={s.btn}>
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>
        {error && <div style={s.error}>⚠️ {error}</div>}
      </div>

      {searched && results.length > 0 && (
        <div style={s.card}>
          <div style={s.resultHeader}>
            <b>{results[0].studentName}</b>
            <span style={{ color: '#888', fontSize: 13 }}>
              {' '} | Enrolment: {results[0].enrolmentNo}
              {' '} | Programme: {results[0].programmeName}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>S.No.</th>
                  <th style={s.th}>Course Code</th>
                  <th style={s.th}>Course Name</th>
                  <th style={s.th}>Term</th>
                  <th style={s.th}>Max Marks</th>
                  <th style={s.th}>Marks</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Entry By</th>
                  <th style={s.th}>Entry Type</th>
                  <th style={s.th}>Last Updated</th>
                  <th style={s.th}>Lock Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={row.courseCode + i}
                    style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={{ ...s.td, fontWeight: 'bold' }}>{row.courseCode}</td>
                    <td style={s.td}>{row.courseName || '-'}</td>
                    <td style={{ ...s.td, textAlign: 'center' }}>{row.term}</td>
                    <td style={{ ...s.td, textAlign: 'center' }}>{row.maximumMarks}</td>
                    <td style={{ ...s.td, textAlign: 'center',
                      fontWeight: 'bold',
                      color: row.marks != null ? '#1565c0' : '#aaa' }}>
                      {row.marks != null ? row.marks : '-'}
                    </td>
                    <td style={s.td}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 12, fontSize: 12,
                        fontWeight: 600,
                        background: row.status === 'Absent' ? '#ffebee'
                          : row.status === 'Present' ? '#e8f5e9' : '#fff3e0',
                        color: row.status === 'Absent' ? '#c62828'
                          : row.status === 'Present' ? '#2e7d32' : '#e65100',
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontStyle: 'italic', color: '#555' }}>
                      {row.entryBy !== '-' ? row.entryBy : '-'}
                    </td>
                    <td style={{ ...s.td, textAlign: 'center',
                      color: row.entrySource === 'MANUAL' ? '#e65100' : '#2e7d32',
                      fontWeight: 'bold', fontSize: 12 }}>
                      {row.entrySource}
                    </td>
                    <td style={{ ...s.td, fontSize: 12, color: '#555' }}>
                      {row.updatedAt
                        ? new Date(row.updatedAt).toLocaleString('en-IN')
                        : '-'}
                    </td>
                    <td style={s.td}>
                      <span style={{
                        fontWeight: 'bold',
                        color: row.isLocked ? '#c62828' : '#2e7d32',
                      }}>
                        {row.isLocked ? '🔒 Locked' : '🔓 Open'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:        { fontFamily: "'Segoe UI', sans-serif" },
  card:        { background: '#fff', borderRadius: 12, padding: '24px',
                 boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 20 },
  title:       { margin: '0 0 6px', color: '#1a73e8', fontSize: 22 },
  subtitle:    { margin: '0 0 20px', color: '#888', fontSize: 14 },
  searchRow:   { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  input:       { padding: '12px 16px', borderRadius: 8, border: '1.5px solid #d1d9e0',
                 fontSize: 15, width: 320, outline: 'none' },
  btn:         { padding: '12px 28px', background: '#1a73e8', color: '#fff',
                 border: 'none', borderRadius: 8, cursor: 'pointer',
                 fontWeight: 700, fontSize: 15 },
  error:       { marginTop: 14, color: '#c62828', background: '#fff0f0',
                 border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px',
                 fontSize: 13 },
  resultHeader:{ background: '#e8f4fd', borderRadius: 8, padding: '12px 16px',
                 marginBottom: 16, fontSize: 15, border: '1px solid #b3d9f7' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead:       { background: '#1a73e8' },
  th:          { padding: '10px 12px', color: '#fff', fontWeight: 600,
                 textAlign: 'left', whiteSpace: 'nowrap' },
  td:          { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' },
  trEven:      { background: '#fff' },
  trOdd:       { background: '#f9fbff' },
};