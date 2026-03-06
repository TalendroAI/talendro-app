import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('authToken');
}

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ label, before, after, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '100px' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(after / 100) * 201} 201`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '18px', fontWeight: '800', color: '#1f2937'
        }}>
          {after}
        </div>
      </div>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
        {label}
      </div>
      {before > 0 && (
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
          was {before}
        </div>
      )}
    </div>
  );
}

// ─── Editable Field ──────────────────────────────────────────────────────────
function EditableText({ value, onChange, multiline = false, placeholder = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (editing) {
    const props = {
      value: draft,
      onChange: e => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: e => { if (!multiline && e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } },
      autoFocus: true,
      ref,
      style: {
        width: '100%', padding: '6px 10px', border: '2px solid #2F6DF6', borderRadius: '6px',
        fontSize: 'inherit', fontFamily: 'inherit', color: '#1f2937', background: '#eff6ff',
        resize: multiline ? 'vertical' : 'none', outline: 'none', boxSizing: 'border-box',
        minHeight: multiline ? '80px' : undefined,
      }
    };
    return multiline ? <textarea {...props} /> : <input {...props} />;
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{ cursor: 'text', borderBottom: '1px dashed #d1d5db', paddingBottom: '1px', display: 'inline-block', minWidth: '40px' }}
    >
      {value || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
}

// ─── Resume Renderer ─────────────────────────────────────────────────────────
function ResumeRenderer({ resume, editable, onChange }) {
  if (!resume) return null;

  const update = (path, value) => {
    const parts = path.split('.');
    const next = JSON.parse(JSON.stringify(resume));
    let obj = next;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    onChange(next);
  };

  const updateWork = (idx, field, value) => {
    const next = JSON.parse(JSON.stringify(resume));
    next.work[idx][field] = value;
    onChange(next);
  };

  const updateBullet = (workIdx, bulletIdx, value) => {
    const next = JSON.parse(JSON.stringify(resume));
    next.work[workIdx].bullets[bulletIdx] = value;
    onChange(next);
  };

  const addBullet = (workIdx) => {
    const next = JSON.parse(JSON.stringify(resume));
    next.work[workIdx].bullets.push('');
    onChange(next);
  };

  const removeBullet = (workIdx, bulletIdx) => {
    const next = JSON.parse(JSON.stringify(resume));
    next.work[workIdx].bullets.splice(bulletIdx, 1);
    onChange(next);
  };

  const sectionHead = (title) => (
    <div style={{
      borderBottom: '2px solid #1f2937', paddingBottom: '3px', marginBottom: '10px', marginTop: '20px',
      fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#1f2937'
    }}>
      {title}
    </div>
  );

  return (
    <div style={{
      fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.5', color: '#1f2937',
      padding: '40px 48px', background: '#fff', maxWidth: '760px', margin: '0 auto',
      boxShadow: '0 2px 20px rgba(0,0,0,0.08)', borderRadius: '4px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1f2937' }}>
          {editable
            ? <EditableText value={resume.name} onChange={v => update('name', v)} placeholder="Your Name" />
            : resume.name}
        </h1>
        <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {editable ? (
            <>
              <EditableText value={resume.email} onChange={v => update('email', v)} placeholder="email" />
              <span>·</span>
              <EditableText value={resume.phone} onChange={v => update('phone', v)} placeholder="phone" />
              <span>·</span>
              <EditableText value={resume.location} onChange={v => update('location', v)} placeholder="location" />
              {resume.linkedin && <><span>·</span><EditableText value={resume.linkedin} onChange={v => update('linkedin', v)} placeholder="linkedin" /></>}
            </>
          ) : (
            <>
              {resume.email && <span>{resume.email}</span>}
              {resume.phone && <><span>·</span><span>{resume.phone}</span></>}
              {resume.location && <><span>·</span><span>{resume.location}</span></>}
              {resume.linkedin && <><span>·</span><span>{resume.linkedin}</span></>}
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <>
          {sectionHead('Professional Summary')}
          <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            {editable
              ? <EditableText value={resume.summary} onChange={v => update('summary', v)} multiline placeholder="Professional summary..." />
              : resume.summary}
          </p>
        </>
      )}

      {/* Work Experience */}
      {resume.work && resume.work.length > 0 && (
        <>
          {sectionHead('Work Experience')}
          {resume.work.map((job, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>
                    {editable ? <EditableText value={job.title} onChange={v => updateWork(i, 'title', v)} placeholder="Job Title" /> : job.title}
                  </span>
                  <span style={{ color: '#6b7280', margin: '0 6px' }}>—</span>
                  <span style={{ fontStyle: 'italic', color: '#374151' }}>
                    {editable ? <EditableText value={job.company} onChange={v => updateWork(i, 'company', v)} placeholder="Company" /> : job.company}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {editable ? (
                    <>
                      <EditableText value={job.startDate} onChange={v => updateWork(i, 'startDate', v)} placeholder="Start" />
                      {' – '}
                      <EditableText value={job.endDate} onChange={v => updateWork(i, 'endDate', v)} placeholder="End" />
                    </>
                  ) : `${job.startDate || ''} – ${job.endDate || ''}`}
                </span>
              </div>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                {(job.bullets || []).map((bullet, bi) => (
                  <li key={bi} style={{ marginBottom: '3px', fontSize: '13px', color: '#374151' }}>
                    {editable ? (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <EditableText value={bullet} onChange={v => updateBullet(i, bi, v)} multiline placeholder="Achievement or responsibility..." />
                        <button onClick={() => removeBullet(i, bi)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', flexShrink: 0, padding: '0 2px', lineHeight: 1 }}>×</button>
                      </span>
                    ) : bullet}
                  </li>
                ))}
                {editable && (
                  <li style={{ listStyle: 'none', marginTop: '4px' }}>
                    <button onClick={() => addBullet(i)} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '4px', color: '#6b7280', cursor: 'pointer', fontSize: '12px', padding: '2px 10px' }}>
                      + Add bullet
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <>
          {sectionHead('Education')}
          {resume.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <div>
                <span style={{ fontWeight: '700' }}>
                  {editable ? <EditableText value={edu.degree} onChange={v => { const n = JSON.parse(JSON.stringify(resume)); n.education[i].degree = v; onChange(n); }} placeholder="Degree" /> : edu.degree}
                </span>
                {edu.field && (
                  <span style={{ color: '#6b7280' }}>
                    {' in '}
                    {editable ? <EditableText value={edu.field} onChange={v => { const n = JSON.parse(JSON.stringify(resume)); n.education[i].field = v; onChange(n); }} placeholder="Field" /> : edu.field}
                  </span>
                )}
                {edu.school && (
                  <span style={{ fontStyle: 'italic', color: '#374151' }}>
                    {' — '}
                    {editable ? <EditableText value={edu.school} onChange={v => { const n = JSON.parse(JSON.stringify(resume)); n.education[i].school = v; onChange(n); }} placeholder="School" /> : edu.school}
                  </span>
                )}
              </div>
              {edu.gradYear && <span style={{ fontSize: '13px', color: '#6b7280' }}>{edu.gradYear}</span>}
            </div>
          ))}
        </>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <>
          {sectionHead('Skills')}
          <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
            {resume.skills.join(' · ')}
          </p>
        </>
      )}

      {/* Certifications */}
      {resume.certifications && resume.certifications.length > 0 && (
        <>
          {sectionHead('Certifications')}
          <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>
            {resume.certifications.join(' · ')}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ResumeReview() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [resumeData, setResumeData] = useState(null);
  const [resume, setResume]         = useState(null);
  const [scores, setScores]         = useState(null);
  const [approved, setApproved]     = useState(false);
  const [editable, setEditable]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [approving, setApproving]   = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [tab, setTab]               = useState('resume'); // resume | changes
  const [error, setError]           = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { logout(); navigate('/auth/sign-in'); return; }

    fetch(`${API_BASE}/resume/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { logout(); navigate('/auth/sign-in'); } return r.json(); })
      .then(data => {
        if (data.success && data.resumeData?.optimized) {
          setResumeData(data.resumeData);
          setResume(data.resumeData.optimized);
          setScores(data.resumeData.scores || null);
          setApproved(data.resumeData.approved || false);
        } else {
          setError('no_resume');
        }
      })
      .catch(() => setError('load_failed'))
      .finally(() => setLoading(false));
  }, [logout, navigate]);

  const handleSaveEdits = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/resume/update`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      if (res.ok) {
        setSaveMsg('Saved ✓');
        setTimeout(() => setSaveMsg(''), 2500);
      }
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const newApproved = !approved;
      const res = await fetch(`${API_BASE}/resume/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: newApproved }),
      });
      if (res.ok) setApproved(newApproved);
    } catch (e) { /* silent */ }
    setApproving(false);
  };

  const handleDownloadPDF = () => {
    // Build a printable HTML page and open in new tab for browser print-to-PDF
    const html = buildPrintHTML(resume);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) setTimeout(() => win.print(), 800);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading your resume...</p>
        </div>
      </div>
    );
  }

  if (error === 'no_resume') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📄</div>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '24px', fontWeight: '800', color: '#1f2937', marginBottom: '12px' }}>
            No resume on file yet
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
            You haven't completed the resume setup yet. Start by uploading your existing resume, updating an older one, or building one from scratch.
          </p>
          <button
            onClick={() => navigate('/app/resume-gate')}
            style={{ background: '#2F6DF6', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
          >
            Set Up My Resume →
          </button>
        </div>
      </div>
    );
  }

  if (error === 'load_failed') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>Failed to load resume. Please refresh.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const changes = resume?.changes || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/app/dashboard')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer', color: '#6b7280', fontWeight: '600' }}>
            ← Dashboard
          </button>
          <h1 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontSize: '18px', fontWeight: '800', color: '#1f2937' }}>
            My Resume
          </h1>
          {approved && (
            <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: '700', color: '#059669' }}>
              ✓ Active — Used for Applications
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {saveMsg && <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>{saveMsg}</span>}
          {editable && (
            <button onClick={handleSaveEdits} disabled={saving} style={{ background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Edits'}
            </button>
          )}
          <button
            onClick={() => setEditable(e => !e)}
            style={{ background: editable ? '#fef3c7' : '#fff', color: editable ? '#92400e' : '#6b7280', border: `1px solid ${editable ? '#fde68a' : '#e5e7eb'}`, borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            {editable ? '✏️ Editing' : '✏️ Edit'}
          </button>
          <button onClick={handleDownloadPDF} style={{ background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            ⬇ Download PDF
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            style={{
              background: approved ? '#fff' : '#2F6DF6',
              color: approved ? '#dc2626' : '#fff',
              border: approved ? '1px solid #fecaca' : 'none',
              borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: approving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {approving ? '...' : approved ? 'Revoke Approval' : '✓ Approve for Applications'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

        {/* Left panel — scores + changes */}
        <div style={{ width: '240px', flexShrink: 0 }}>

          {/* Scores */}
          {scores && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                Optimization Scores
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <ScoreRing label="ATS Score" before={scores.before?.ats} after={scores.after?.ats} color="#2F6DF6" />
                <ScoreRing label="Keywords" before={scores.before?.keywords} after={scores.after?.keywords} color="#059669" />
                <ScoreRing label="Format" before={scores.before?.format} after={scores.after?.format} color="#7c3aed" />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              {['changes', 'info'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '10px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                  background: tab === t ? '#eff6ff' : '#fff', color: tab === t ? '#2F6DF6' : '#6b7280',
                  border: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid #2F6DF6' : '2px solid transparent'
                }}>
                  {t === 'changes' ? 'Changes' : 'Info'}
                </button>
              ))}
            </div>
            <div style={{ padding: '16px' }}>
              {tab === 'changes' ? (
                changes.length > 0 ? (
                  <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
                    {changes.map((c, i) => <li key={i} style={{ marginBottom: '6px' }}>{c}</li>)}
                  </ul>
                ) : (
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>No change log available.</p>
                )
              ) : (
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7' }}>
                  <div><strong>Path:</strong> {resumeData?.path || 'upload'}</div>
                  <div><strong>Optimized:</strong> {resumeData?.optimizedAt ? new Date(resumeData.optimizedAt).toLocaleDateString() : '—'}</div>
                  {resumeData?.editedAt && <div><strong>Last edited:</strong> {new Date(resumeData.editedAt).toLocaleDateString()}</div>}
                  {resumeData?.approvedAt && <div><strong>Approved:</strong> {new Date(resumeData.approvedAt).toLocaleDateString()}</div>}
                  <div style={{ marginTop: '10px', padding: '8px', background: approved ? '#f0fdf4' : '#fffbeb', borderRadius: '6px', color: approved ? '#065f46' : '#92400e', fontWeight: '600' }}>
                    {approved ? '✓ Active base resume' : '⚠ Not yet approved'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Re-optimize */}
          <button
            onClick={() => navigate('/app/resume-gate')}
            style={{ marginTop: '16px', width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '600', color: '#6b7280', cursor: 'pointer' }}
          >
            🔄 Re-optimize Resume
          </button>
        </div>

        {/* Right panel — resume */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editable && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
              ✏️ Edit mode — click any text to edit it. Click "Save Edits" when done.
            </div>
          )}
          <ResumeRenderer resume={resume} editable={editable} onChange={setResume} />
        </div>
      </div>
    </div>
  );
}

// ─── Print HTML builder ──────────────────────────────────────────────────────
function buildPrintHTML(resume) {
  if (!resume) return '';
  const workHTML = (resume.work || []).map(job => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div><strong>${job.title || ''}</strong> — <em>${job.company || ''}</em></div>
        <span style="font-size:12px;color:#555">${job.startDate || ''} – ${job.endDate || ''}</span>
      </div>
      <ul style="margin:4px 0 0;padding-left:18px">
        ${(job.bullets || []).map(b => `<li style="font-size:13px;margin-bottom:2px">${b}</li>`).join('')}
      </ul>
    </div>`).join('');

  const eduHTML = (resume.education || []).map(e =>
    `<div style="margin-bottom:6px"><strong>${e.degree || ''}</strong>${e.field ? ' in ' + e.field : ''} — <em>${e.school || ''}</em>${e.gradYear ? ' (' + e.gradYear + ')' : ''}</div>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resume.name || 'Resume'}</title>
<style>body{font-family:Georgia,serif;font-size:14px;line-height:1.5;color:#1f2937;padding:40px 60px;max-width:800px;margin:0 auto}
h1{font-family:Arial,sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;text-align:center}
.contact{text-align:center;font-size:12px;color:#555;margin-bottom:16px}
.section-head{border-bottom:2px solid #1f2937;padding-bottom:2px;margin:16px 0 8px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px}
@media print{body{padding:20px 40px}}</style></head><body>
<h1>${resume.name || ''}</h1>
<div class="contact">${[resume.email,resume.phone,resume.location,resume.linkedin].filter(Boolean).join(' · ')}</div>
${resume.summary ? `<div class="section-head">Professional Summary</div><p style="font-size:13px;color:#374151">${resume.summary}</p>` : ''}
${resume.work?.length ? `<div class="section-head">Work Experience</div>${workHTML}` : ''}
${resume.education?.length ? `<div class="section-head">Education</div>${eduHTML}` : ''}
${resume.skills?.length ? `<div class="section-head">Skills</div><p style="font-size:13px">${resume.skills.join(' · ')}</p>` : ''}
${resume.certifications?.length ? `<div class="section-head">Certifications</div><p style="font-size:13px">${resume.certifications.join(' · ')}</p>` : ''}
</body></html>`;
}
