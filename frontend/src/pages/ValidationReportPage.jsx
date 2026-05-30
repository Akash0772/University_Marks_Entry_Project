// ================================================================
// FILE: ValidationReportPage.jsx
// FIXES:
//   1. Print blank issue - Portal remove, simple window.print() approach
//   2. Print borders - inline style borders use (CSS class not depend)
//   3. Blank columns screen + print both
//   4. Marking logic correct
// ================================================================

import { useState, useEffect, useCallback } from 'react';
import { getProgrammes, getTerms, getValidationReport } from '../api';
import { toast } from 'react-toastify';

export default function ValidationReportPage() {
  const [programmes, setProgrammes] = useState([]);
  const [terms,      setTerms]      = useState([]);
  const [selProg,    setSelProg]    = useState('');
  const [selSem,     setSelSem]     = useState('');
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [fetched,    setFetched]    = useState(false);

  useEffect(() => {
    getProgrammes()
      .then(r => setProgrammes(r.data))
      .catch(() => toast.error('Programmes load failed'));
  }, []);

  const handleProgChange = async (e) => {
    const val = e.target.value;
    setSelProg(val); setSelSem(''); setTerms([]); setData([]); setFetched(false);
    if (val) {
      try { const r = await getTerms(val); setTerms(r.data); } catch { /**/ }
    }
  };

  const handleFetch = useCallback(async () => {
    if (!selProg || !selSem) {
      toast.warning('Programme And Semester Required');
      return;
    }
    setLoading(true); setData([]); setFetched(false);
    try {
      const r = await getValidationReport(selProg, selSem);
      // setData(r.data);
      const sorted = [...r.data].sort((a, b) => {
  // Pehle Roll No. sort
  const rollCmp = (a.enrolmentNo || '').localeCompare(b.enrolmentNo || '', undefined, { numeric: true });
  if (rollCmp !== 0) return rollCmp;
  // Same Roll No. Course Code sort
  return (a.courseCode || '').localeCompare(b.courseCode || '', undefined, { numeric: true });
});
setData(sorted);
      setFetched(true);
      if (r.data.length === 0) toast.success('No flagged records found!');
    } catch {
      toast.error('Report fetch failed');
    } finally {
      setLoading(false);
    }
  }, [selProg, selSem]);

  // - Print handler - multi-page popup -
  //  page: Header + Table (25 rows max) + Footer
  const handlePrint = () => {
    if (!data || data.length === 0) return;

    const ROWS_PER_PAGE = 25;
    const todayStr = today;
    const progCode = data.length > 0 && data[0].programmeCode ? data[0].programmeCode : '';

    const thS  = 'border:1px solid #000;padding:5px 6px;text-align:center;font-weight:bold;font-size:10pt;background:#fff;font-family:Times New Roman,Times,serif;';
    const tdS  = 'border:1px solid #000;padding:5px 6px;font-size:10pt;font-family:Times New Roman,Times,serif;vertical-align:middle;';
    const tdCS = tdS + 'text-align:center;';

    const chunks = [];
    for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
      chunks.push(data.slice(i, i + ROWS_PER_PAGE));
    }

    const headerHTML = `
      <div style="text-align:center;margin-bottom:4px;font-family:Times New Roman,Times,serif;">
        <p style="margin:0;font-size:10pt;">Doctor Harisingh Gour Vishwavidyalaya, Sagar (M.P.)</p>
        <p style="margin:0;font-size:9pt;">(A Central University)</p>
      </div>
      <div style="text-align:center;border-top:1px solid #000;border-bottom:1px solid #000;padding:6px 0;margin-bottom:10px;">
        <h2 style="margin:0;font-size:15pt;font-weight:bold;text-decoration:underline;font-family:Times New Roman,Times,serif;">Validation Sheet</h2>
      </div>
      <div style="text-align:center;margin-bottom:12px;font-family:Times New Roman,Times,serif;">
        <p style="margin:2px 0;font-weight:bold;font-style:italic;font-size:11pt;">${selProg}</p>
        <p style="margin:2px 0;font-weight:bold;font-style:italic;font-size:11pt;">Semester : ${selSem} &nbsp;&nbsp;&nbsp;&nbsp; Session : 2025-26</p>
        ${progCode ? '<p style="margin:2px 0;font-weight:bold;font-style:italic;font-size:11pt;">Programme Code : ' + progCode + '</p>' : ''}
        <p style="margin:8px 0 0;font-size:10pt;text-decoration:underline;">To be checked with Attendance Sheet / Answer book</p>
      </div>`;

      // <th style="${thS}width:65px">Exam Type</th>
    const tableHead = `<thead><tr>
      <th style="${thS}width:28px">#</th>
      <th style="${thS}width:95px">Roll No.</th>
      <th style="${thS}width:95px">Course Code</th>
      <th style="${thS}width:45px">Marking</th>
     
      <th style="${thS}width:55px">Present (P)<br/>Absent (A)</th>
      <th style="${thS}width:40px">Marks</th>
      <th style="${thS}width:100px">Answer Book<br/>Number</th>
      <th style="${thS}">Remark</th>
    </tr></thead>`;

    const footerHTML = `
      <table style="width:100%;border-collapse:collapse;margin-top:40px;font-family:Times New Roman,Times,serif;font-size:11pt;">
        <tbody><tr>
          <td style="border:none;padding:0;width:50%;vertical-align:top;">Date:&nbsp;${todayStr}</td>
          <td style="border:none;padding:0;width:50%;text-align:right;vertical-align:top;">
            <span style="font-weight:bold;text-decoration:underline;">Signature &amp; Date</span>
            <br/><br/>
            <span style="font-weight:bold;text-decoration:underline;">Dealing Assistant</span>
          </td>
        </tr></tbody>
      </table>`;
  // <td style="${tdCS}">${row.examType || '-'}</td>
    const pagesHTML = chunks.map((chunk, pageIdx) => {
      const startIdx = pageIdx * ROWS_PER_PAGE;
      const rowsHTML = chunk.map((row, i) => {
        const n = startIdx + i + 1;
        const marking = row.marking && row.marking !== '-' && row.marking !== '-' ? row.marking : '';
        return `<tr>
          <td style="${tdCS}">${n}</td>
          <td style="${tdS}">${row.enrolmentNo || ''}</td>
          <td style="${tdS}">${row.courseCode || ''}</td>
          <td style="${tdCS}"><b>${marking}</b></td>
        
          <td style="${tdS}">&nbsp;</td>
          <td style="${tdS}">&nbsp;</td>
          <td style="${tdS}">&nbsp;</td>
          <td style="${tdS}">&nbsp;</td>
        </tr>`;
      }).join('');
      const pb = pageIdx < chunks.length - 1 ? 'page-break-after:always;' : '';
      return `<div style="${pb}">
        ${headerHTML}
        <table style="width:100%;border-collapse:collapse;font-family:Times New Roman,Times,serif;font-size:10pt;">
          ${tableHead}<tbody>${rowsHTML}</tbody>
        </table>
        ${footerHTML}
      </div>`;
    }).join('');

    const popup = window.open('', '_blank', 'width=900,height=700');
    popup.document.write('<!DOCTYPE html><html><head><title>Validation Report</title><style>body{font-family:Times New Roman,Times,serif;font-size:10pt;margin:0;padding:0;background:white;}p{margin:0;padding:0;}@page{size:A4 portrait;margin:15mm 12mm 18mm 12mm;}@media print{body{margin:0;}}</style></head><body>' + pagesHTML + '</body></html>');
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 500);
  };

  const markingStyle = (m) => {
    if (m === 'D')   return { background: '#fff3e0', color: '#e65100', fontWeight: 700, border: '1px solid #ffcc80' };
    if (m === 'A')   return { background: '#ffebee', color: '#c62828', fontWeight: 700 };
    if (m === 'W')   return { background: '#e8eaf6', color: '#3949ab', fontWeight: 700 };
    if (m === 'UFM') return { background: '#fce4ec', color: '#880e4f', fontWeight: 700 };
    return {};
  };

  const hasMarking = (m) => m && m !== '-' && m !== '-' && m !== '';

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // - Print table cell style - inline so always visible in print -
  const pTh = {
    border: '1px solid #000',
    padding: '5px 6px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '10pt',
    background: '#fff',
    fontFamily: "'Times New Roman', Times, serif",
  };
  const pTd = {
    border: '1px solid #000',
    padding: '5px 6px',
    fontSize: '10pt',
    fontFamily: "'Times New Roman', Times, serif",
    verticalAlign: 'middle',
  };
  const pTdCenter = { ...pTd, textAlign: 'center' };

  return (
    <>
      {/* - Print CSS - screen print area hide, popup handle print - */}
      <style>{`
        @media screen {
          #validation-print-area { display: none; }
        }
      `}</style>

      <div id="validation-screen-ui">
        {/* Page Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>📋 Validation Report</h2>
            <p style={s.subtitle}>Zero / absent / D-flagged marks - programme-wise printable report</p>
          </div>
        </div>

        {/* Filter Card */}
        <div style={s.card}>
          <div style={s.filterRow}>
            <div style={s.field}>
              <label style={s.label}>Programme *</label>
              <select style={s.select} value={selProg} onChange={handleProgChange}>
                <option value="">-- Choose Programme --</option>
                {programmes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Semester *</label>
              <select
                style={s.select}
                value={selSem}
                onChange={e => { setSelSem(e.target.value); setData([]); setFetched(false); }}
                disabled={!selProg}
              >
                <option value="">-- Choose Semester --</option>
                {terms.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={handleFetch} disabled={loading} style={s.btnFetch}>
              {loading ? '⟳ Generating...' : '📥 Generate Report'}
            </button>
            {fetched && data.length > 0 && (
              <button onClick={handlePrint} style={s.btnPrint}>
                🖨️ Print
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ ...s.card, textAlign: 'center', padding: 40, color: '#888' }}>
            ⏳ Generating report...
          </div>
        )}

        {/* Legend */}
        {fetched && data.length > 0 && (
          <div style={s.legendCard}>
            <b>Marking:</b>
            {[
              { key: 'D',   label: 'D = Excel vs Manual Mismatch', bg: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80' },
              { key: 'A',   label: 'A = Absent',                   bg: '#ffebee', color: '#c62828' },
              { key: 'W',   label: 'W = Withheld',                 bg: '#e8eaf6', color: '#3949ab' },
              { key: 'UFM', label: 'UFM = Unfair Means',           bg: '#fce4ec', color: '#880e4f' },
            ].map(item => (
              <span key={item.key} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: item.bg, color: item.color, border: item.border || 'none'
              }}>
                {item.label}
              </span>
            ))}
            <span style={{ marginLeft: 'auto', color: '#888', fontSize: 12 }}>
              Total: <b style={{ color: '#c62828' }}>{data.length}</b> records
            </span>
          </div>
        )}

        {/* Screen Preview Table */}
        {fetched && data.length > 0 && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#444', fontWeight: 600 }}>
                📌 {selProg} - Semester {selSem}
              </span>
              <span style={{ fontSize: 12, color: '#888' }}>
                Blank columns will be filled manually on paper after printing.
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Enrollment No.</th>
                    <th style={s.th}>Course Code</th>
                    <th style={s.th}>Marking</th>
                    {/* <th style={{ ...s.th, textAlign: 'center' }}>Exam Type</th> */}
                    <th style={{ ...s.th, color: 'rgba(255,255,255,0.5)' }}>Present (P)<br/>Absent (A)</th>
                    <th style={{ ...s.th, color: 'rgba(255,255,255,0.5)' }}>Marks</th>
                    <th style={{ ...s.th, color: 'rgba(255,255,255,0.5)' }}>Answer Book No.</th>
                    <th style={{ ...s.th, color: 'rgba(255,255,255,0.5)' }}>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fbff' }}>
                      <td style={{ ...s.td, color: '#aaa', width: 36, textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ ...s.td, fontWeight: 700 }}>{row.enrolmentNo}</td>
                      <td style={s.td}>
                        <span style={s.courseBadge}>{row.courseCode}</span>
                      </td>
                      <td style={s.td}>
                        {hasMarking(row.marking) ? (
                          <span style={{ ...s.markingBadge, ...markingStyle(row.marking) }}>
                            {row.marking}
                          </span>
                        ) : (
                          <span style={{ color: '#ccc', fontSize: 12 }}>-</span>
                        )}
                      </td>
                      {/* <td style={{ ...s.td, textAlign: 'center', color: '#aaa' }}>
                        {row.examType || '-'}
                      </td> */}
                      {/* Blank columns - filled on paper */}
                      <td style={{ ...s.td, background: '#f5f5f5', borderLeft: '1px dashed #ddd' }}>&nbsp;</td>
                      <td style={{ ...s.td, background: '#f5f5f5' }}>&nbsp;</td>
                      <td style={{ ...s.td, background: '#f5f5f5', minWidth: 120 }}>&nbsp;</td>
                      <td style={{ ...s.td, background: '#f5f5f5', minWidth: 140 }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {fetched && data.length === 0 && (
          <div style={{ ...s.card, textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <p style={{ color: '#2e7d32', fontWeight: 600, margin: '8px 0 4px' }}>All Clear!</p>
            <p style={{ color: '#888', fontSize: 13 }}>No zero/absent/D-flagged records for this selection.</p>
          </div>
        )}
      </div>

      {/* 
          PRINT AREA
          id="validation-print-area" - CSS visible print
          All styles INLINE - CSS class not depend
          Borders inline - guaranteed print
       */}
      <div id="validation-print-area">

        {/* University Header */}
        <div style={{ textAlign: 'center', marginBottom: 4, fontFamily: "'Times New Roman', Times, serif" }}>
          <p style={{ margin: 0, fontSize: '10pt' }}>(A Central University)</p>
          <p style={{ margin: 0, fontSize: '9pt' }}>CBCS System for Academic Management</p>
        </div>

        {/* Validation Title */}
        <div style={{
          textAlign: 'center',
          borderTop: '1px solid #000',
          borderBottom: '1px solid #000',
          padding: '6px 0',
          marginBottom: 10,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '15pt',
            fontWeight: 'bold',
            textDecoration: 'underline',
            fontFamily: "'Times New Roman', Times, serif",
          }}>
            Validation
          </h2>
        </div>

        {/* Programme Info */}
        <div style={{ textAlign: 'center', marginBottom: 12, fontFamily: "'Times New Roman', Times, serif" }}>
          <p style={{ margin: '2px 0', fontWeight: 'bold', fontStyle: 'italic', fontSize: '11pt' }}>
            {selProg}
          </p>
          <p style={{ margin: '2px 0', fontWeight: 'bold', fontStyle: 'italic', fontSize: '11pt' }}>
            Semester : {selSem}
          </p>
          {data.length > 0 && data[0].programmeCode && (
            <p style={{ margin: '2px 0', fontWeight: 'bold', fontStyle: 'italic', fontSize: '11pt' }}>
              Programme Code : {data[0].programmeCode}
            </p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: '10pt', textDecoration: 'underline' }}>
            To be checked with Attendance Sheet / Answer book
          </p>
        </div>

        {/* - Main Print Table - ALL borders inline - */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '10pt',
        }}>
          <thead>
            <tr>
              <th style={{ ...pTh, width: 28 }}>#</th>
              <th style={{ ...pTh, width: 95 }}>Roll No.</th>
              <th style={{ ...pTh, width: 95 }}>Course Code</th>
              <th style={{ ...pTh, width: 55 }}>Marking</th>
              {/* <th style={{ ...pTh, width: 65 }}>Exam Type</th> */}
              <th style={{ ...pTh, width: 55 }}>Present (P)<br />Absent (A)</th>
              <th style={{ ...pTh, width: 40 }}>Marks</th>
              <th style={{ ...pTh, width: 100 }}>Answer Book<br/> Number</th>
              <th style={pTh}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td style={pTdCenter}>{i + 1}</td>
                <td style={pTd}>{row.enrolmentNo}</td>
                <td style={pTd}>{row.courseCode}</td>
                <td style={pTdCenter}>
                  {/* Plain text in print - no colors */}
                  <span style={{ fontWeight: 'bold' }}>
                    {hasMarking(row.marking) ? row.marking : ''}
                  </span>
                </td>
                {/* <td style={pTdCenter}>{row.examType || '-'}</td> */}
                {/* Blank - operator fills on paper */}
                <td style={pTd}>&nbsp;</td>
                <td style={pTd}>&nbsp;</td>
                <td style={pTd}>&nbsp;</td>
                <td style={pTd}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer - table layout for reliable popup/print rendering */}
        <table className="footer-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '40px',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '11pt',
          border: 'none',
          pageBreakInside: 'avoid',
        }}>
          <tbody>
            <tr>
              <td style={{ border: 'none', padding: '0', width: '50%', verticalAlign: 'top' }}>
                <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '11pt' }}>
                  Date:&nbsp;{today}
                </span>
              </td>
              <td style={{ border: 'none', padding: '0', width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                <span style={{ fontWeight: 'bold', textDecoration: 'underline', fontFamily: "'Times New Roman', Times, serif", fontSize: '11pt' }}>
                  Signature &amp; Date
                </span>
                <br /><br />
                <span style={{ fontWeight: 'bold', textDecoration: 'underline', fontFamily: "'Times New Roman', Times, serif", fontSize: '11pt' }}>
                  Dealing Assistant
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// - Styles ----------------------------
const s = {
  header:       { marginBottom: 16 },
  title:        { margin: '0 0 4px', fontSize: 22, color: '#3949ab', fontWeight: 800 },
  subtitle:     { margin: 0, fontSize: 13, color: '#888' },
  card:         { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '20px', marginBottom: 20 },
  filterRow:    { display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' },
  field:        { display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 220px' },
  label:        { fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase' },
  select:       { padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d9e0', fontSize: 14 },
  btnFetch:     { padding: '10px 22px', background: '#3949ab', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, alignSelf: 'flex-end' },
  btnPrint:     { padding: '10px 22px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, alignSelf: 'flex-end' },
  legendCard:   { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: '#fff', borderRadius: 10, padding: '10px 16px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', fontSize: 13 },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead:        { background: '#3949ab' },
  th:           { padding: '11px 12px', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' },
  td:           { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
  courseBadge:  { background: '#eef2ff', color: '#3730a3', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 },
  markingBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, display: 'inline-block' },
};