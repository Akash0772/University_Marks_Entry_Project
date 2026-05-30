// ================================================================
// FILE: MarksDiffPage.jsx
// FIX: React.Fragment → <> </> (React import)
// ================================================================

import { useState, useEffect, useCallback, Fragment } from 'react';
import { getMarksDiff } from '../api';
import { toast } from 'react-toastify';

export default function MarksDiffPage() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState('');

  const fetchDiff = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getMarksDiff('');
      // ── Filter exactly as MySQL query:
      //    WHERE ManualEntryM <> ''
      //    AND   comp7_marks  <> ''
      //    AND   IFNULL(comp7_marks,0) <> IFNULL(ManualEntryM,0)
      const filtered = (r.data || []).filter(row => {
        const c = row.comp7Marks;
        const m = row.manualEntryM;
        // Both must be non-empty / non-null
        if (c === null || c === undefined || String(c).trim() === '') return false;
        if (m === null || m === undefined || String(m).trim() === '') return false;
        // Values must differ (numeric comparison like IFNULL(...,0))
        const cNum = parseFloat(c) || 0;
        const mNum = parseFloat(m) || 0;
        return cNum !== mNum;
      });
      setData(filtered);
      if (filtered.length === 0) toast.info('No mark differences found!');
    } catch {
      toast.error('Failed to load marks difference data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDiff(); }, [fetchDiff]);

  const filtered = data.filter(row => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      (row.programmeName || '').toLowerCase().includes(q) ||
      (row.enrolmentNo   || '').toLowerCase().includes(q) ||
      (row.courseCode    || '').toLowerCase().includes(q)
    );
  });

  const programmeGroups = data.reduce((acc, row) => {
    acc[row.programmeName] = (acc[row.programmeName] || 0) + 1;
    return acc;
  }, {});

  const diffColor = (comp7, manual) => {
    const diff = (comp7 ?? 0) - (manual ?? 0);
    if (diff > 0) return { bg: '#fff5f0', text: '#c0392b', val: `+${diff % 1 === 0 ? diff : diff.toFixed(1)}` };
    if (diff < 0) return { bg: '#f0fff4', text: '#1a7340', val: diff % 1 === 0 ? String(diff) : diff.toFixed(1) };
    return { bg: '#f5f5f5', text: '#666', val: '0' };
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>🔍 Marks Difference Viewer</h2>
          <p style={s.subtitle}>
            Records where <code style={s.code}>comp7_marks</code> ≠ <code style={s.code}>ManualEntryM</code> - both fields must be filled
          </p>
        </div>
        <button onClick={fetchDiff} disabled={loading} style={s.btnRefresh}>
          {loading ? '⟳ Loading...' : '↻ Refresh'}
        </button>
      </div>

      {/* Summary chips */}
      {!loading && data.length > 0 && (
        <div style={s.summaryBar}>
          <div style={s.summaryChip}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#666' }}>Total Mismatches</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#c0392b' }}>{data.length}</span>
          </div>
          <div style={s.summaryChip}>
            <span>🏫</span>
            <span style={{ fontSize: 12, color: '#666' }}>Programmes Affected</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1a73e8' }}>
              {Object.keys(programmeGroups).length}
            </span>
          </div>
          {Object.entries(programmeGroups).map(([prog, cnt]) => (
            <div key={prog} style={s.progChip} title={prog}>
              <span style={s.progChipName}>{prog.length > 32 ? prog.slice(0, 30) + '…' : prog}</span>
              <span style={s.progChipCount}>{cnt}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card */}
      <div style={s.card}>

        {/* Search */}
        <div style={s.filterBar}>
          <div style={s.searchWrap}>
            <span>🔎</span>
            <input
              type="text"
              placeholder="Search by Programme, Enrolment No, or Course Code..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={s.searchInput}
            />
            {filter && (
              <button onClick={() => setFilter('')} style={s.clearBtn}>✕</button>
            )}
          </div>
          {filter && (
            <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>
              Showing <b>{filtered.length}</b> of {data.length}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={s.spinner} />
            <p style={{ color: '#888', marginTop: 12 }}>Fetching mismatch records...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <p style={{ color: '#2e7d32', fontWeight: 600, margin: '8px 0 4px' }}>No Differences Found</p>
            <p style={{ color: '#888', fontSize: 13 }}>
              All records where both comp7_marks and ManualEntryM are filled have matching values.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Programme</th>
                  <th style={s.th}>Enrolment No.</th>
                  <th style={s.th}>Course Code</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>
                    Excel Marks<br />
                    <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>(comp7_marks)</span>
                  </th>
                  <th style={{ ...s.th, textAlign: 'center' }}>
                    Manual Entry Marks<br />
                    <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>(ManualEntryM)</span>
                  </th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const dc        = diffColor(row.comp7Marks, row.manualEntryM);
                  const prevProg  = i > 0 ? filtered[i - 1].programmeName : null;
                  const isNewProg = row.programmeName !== prevProg;

                  // Fragment import se - React.Fragment
                  return (
                    <Fragment key={`frag-${i}`}>
                      {isNewProg && (
                        <tr>
                          <td colSpan={7} style={s.groupHeader}>
                            📚 {row.programmeName}
                            <span style={s.groupCount}>
                              {programmeGroups[row.programmeName]} record(s)
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ ...s.td, color: '#aaa', width: 40 }}>{i + 1}</td>
                        <td style={{ ...s.td, fontSize: 12, color: '#666', maxWidth: 200 }}>
                          {row.programmeName}
                        </td>
                        <td style={{ ...s.td, fontWeight: 700 }}>{row.enrolmentNo}</td>
                        <td style={s.td}>
                          <span style={s.courseBadge}>{row.courseCode}</span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <span style={{ ...s.markBadge, background: '#e8f5e9', color: '#1b5e20' }}>
                            {row.comp7Marks ?? '-'}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <span style={{ ...s.markBadge, background: '#e3f2fd', color: '#0d47a1' }}>
                            {row.manualEntryM ?? '-'}
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <span style={{ ...s.diffBadge, background: dc.bg, color: dc.text }}>
                            {dc.val}
                          </span>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* No filter match */}
        {!loading && data.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#888' }}>No records match "<b>{filter}</b>"</p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:         { padding: 0 },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  title:        { margin: '0 0 4px', fontSize: 22, color: '#1a73e8', fontWeight: 800 },
  subtitle:     { margin: 0, fontSize: 13, color: '#888' },
  code:         { background: '#f0f4ff', color: '#1a73e8', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' },
  btnRefresh:   { padding: '8px 18px', background: '#f0f4ff', color: '#1a73e8', border: '1.5px solid #b3cef7', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' },
  summaryBar:   { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' },
  summaryChip:  { display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e8ecf4', borderRadius: 10, padding: '7px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  progChip:     { display: 'flex', alignItems: 'center', gap: 6, background: '#fef9f0', border: '1px solid #fcd49a', borderRadius: 10, padding: '5px 12px', maxWidth: 300 },
  progChipName: { fontSize: 12, color: '#8a5c00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  progChipCount:{ background: '#f59e0b', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  card:         { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '20px', marginBottom: 20 },
  filterBar:    { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' },
  searchWrap:   { display: 'flex', alignItems: 'center', flex: 1, minWidth: 260, background: '#f8f9fc', border: '1.5px solid #dde3ee', borderRadius: 10, padding: '0 12px', gap: 8 },
  searchInput:  { flex: 1, border: 'none', background: 'transparent', padding: '10px 0', fontSize: 14, outline: 'none', color: '#222' },
  clearBtn:     { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, padding: '0 2px' },
  spinner:      { width: 36, height: 36, border: '3px solid #e8ecf4', borderTop: '3px solid #1a73e8', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead:        { background: '#1a1a2e' },
  th:           { padding: '12px 14px', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', lineHeight: 1.4 },
  td:           { padding: '10px 14px', borderBottom: '1px solid #f0f2f8', verticalAlign: 'middle' },
  groupHeader:  { padding: '8px 14px', background: '#f0f4ff', borderLeft: '4px solid #1a73e8', fontSize: 13, fontWeight: 700, color: '#1a73e8' },
  groupCount:   { marginLeft: 10, background: '#1a73e8', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 400 },
  courseBadge:  { background: '#eef2ff', color: '#3730a3', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px' },
  markBadge:    { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'inline-block', minWidth: 44, textAlign: 'center' },
  diffBadge:    { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800, display: 'inline-block', minWidth: 44, textAlign: 'center', border: '1.5px solid currentColor' },
};