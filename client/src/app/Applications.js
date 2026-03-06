import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const STATUS_CONFIG = {
  saved:        { label: 'Saved',         color: '#6B7280', bg: '#F3F4F6' },
  applied:      { label: 'Applied',       color: '#3B82F6', bg: '#EFF6FF' },
  phone_screen: { label: 'Phone Screen',  color: '#8B5CF6', bg: '#F5F3FF' },
  interview:    { label: 'Interview',     color: '#F59E0B', bg: '#FFFBEB' },
  technical:    { label: 'Technical',     color: '#EC4899', bg: '#FDF2F8' },
  offer:        { label: 'Offer',         color: '#10B981', bg: '#ECFDF5' },
  rejected:     { label: 'Rejected',      color: '#EF4444', bg: '#FEF2F2' },
  withdrawn:    { label: 'Withdrawn',     color: '#9CA3AF', bg: '#F9FAFB' },
};

const ACTIVITY_ICONS = {
  applied: '📤', viewed: '👁️', phone_screen: '📞', interview: '🤝',
  technical: '💻', offer: '🎉', rejected: '❌', withdrawn: '↩️',
  note: '📝', follow_up: '🔔',
};

function timeAgo(date) {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AddApplicationModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    jobTitle: '', company: '', location: '', remote: false,
    employmentType: 'full-time', applyUrl: '', source: 'manual',
    status: 'applied', appliedAt: new Date().toISOString().split('T')[0], notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobTitle.trim() || !form.company.trim()) { setError('Job title and company are required.'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onSave(data.application);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <h2 style={S.modalTitle}>Log New Application</h2>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Job Title *</label>
              <input style={S.input} value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Company *</label>
              <input style={S.input} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="e.g. Acme Corp" />
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Location</label>
              <input style={S.input} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. New York, NY" />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Status</label>
              <select style={S.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Date Applied</label>
              <input style={S.input} type="date" value={form.appliedAt} onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Employment Type</label>
              <select style={S.input} value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Job Posting URL</label>
            <input style={S.input} value={form.applyUrl} onChange={e => setForm(f => ({ ...f, applyUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Notes</label>
            <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this application..." />
          </div>
          {error && <p style={{ color: '#EF4444', fontSize: 13, margin: '4px 0' }}>{error}</p>}
          <div style={S.modalFooter}>
            <button type="button" style={S.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" style={S.btnPrimary} disabled={saving}>{saving ? 'Saving...' : 'Log Application'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationDetail({ app, onClose, onUpdate }) {
  const [status, setStatus] = useState(app.status);
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState('note');
  const [saving, setSaving] = useState(false);

  const updateStatus = async (newStatus) => {
    setStatus(newStatus);
    const token = localStorage.getItem('authToken');
    const res = await fetch(`/api/applications/${app._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (res.ok) onUpdate(data.application);
  };

  const addActivity = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const token = localStorage.getItem('authToken');
    const res = await fetch(`/api/applications/${app._id}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: activityType, note })
    });
    const data = await res.json();
    if (res.ok) { onUpdate(data.application); setNote(''); }
    setSaving(false);
  };

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.applied;

  return (
    <div style={S.detailPanel}>
      <div style={S.detailHeader}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{app.jobTitle}</h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>{app.company}{app.location ? ` · ${app.location}` : ''}</p>
        </div>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        <p style={S.sectionLabel}>Status</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => updateStatus(k)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${k === status ? v.color : '#E5E7EB'}`, background: k === status ? v.bg : '#fff', color: k === status ? v.color : '#6B7280', fontWeight: k === status ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={S.infoBox}><span style={S.infoLabel}>Applied</span><span style={S.infoValue}>{formatDate(app.appliedAt)}</span></div>
        <div style={S.infoBox}><span style={S.infoLabel}>Source</span><span style={S.infoValue}>{app.source || 'Manual'}</span></div>
        <div style={S.infoBox}><span style={S.infoLabel}>Type</span><span style={S.infoValue}>{app.employmentType || '—'}</span></div>
        <div style={S.infoBox}><span style={S.infoLabel}>Match Score</span><span style={S.infoValue}>{app.matchScore ? `${app.matchScore}%` : '—'}</span></div>
      </div>
      {app.applyUrl && (
        <a href={app.applyUrl} target="_blank" rel="noopener noreferrer"
          style={{ ...S.btnPrimary, display: 'inline-block', textDecoration: 'none', marginBottom: 20, textAlign: 'center' }}>
          View Job Posting ↗
        </a>
      )}
      {app.notes && (
        <div style={{ marginBottom: 20 }}>
          <p style={S.sectionLabel}>Notes</p>
          <p style={{ background: '#F9FAFB', padding: 12, borderRadius: 8, fontSize: 14, color: '#374151', margin: 0 }}>{app.notes}</p>
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <p style={S.sectionLabel}>Log Activity</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <select style={{ ...S.input, flex: '0 0 160px' }} value={activityType} onChange={e => setActivityType(e.target.value)}>
            <option value="note">Note</option>
            <option value="follow_up">Follow-up</option>
            <option value="phone_screen">Phone Screen</option>
            <option value="interview">Interview</option>
            <option value="technical">Technical</option>
            <option value="offer">Offer</option>
          </select>
          <input style={{ ...S.input, flex: 1 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." onKeyDown={e => e.key === 'Enter' && addActivity()} />
          <button style={S.btnPrimary} onClick={addActivity} disabled={saving || !note.trim()}>{saving ? '...' : 'Add'}</button>
        </div>
      </div>
      <div>
        <p style={S.sectionLabel}>Activity Log</p>
        {(!app.activities || app.activities.length === 0) ? (
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>No activity yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...app.activities].reverse().map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{ACTIVITY_ICONS[act.type] || '📌'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>{act.note || act.type.replace(/_/g, ' ')}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{timeAgo(act.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/auth/sign-in'); return; }
      const params = new URLSearchParams({ sort, page, limit: 15 });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (search) params.set('search', search);
      const res = await fetch(`/api/applications?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { logout(); navigate('/auth/sign-in'); return; }
      const data = await res.json();
      setApplications(data.applications || []);
      setSummary(data.summary || {});
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError('Failed to load applications. Please refresh.');
    } finally { setLoading(false); }
  }, [filterStatus, search, sort, page, navigate, logout]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleAddSave = (newApp) => {
    setApplications(prev => [newApp, ...prev]);
    setSummary(prev => ({ ...prev, all: (prev.all || 0) + 1, applied: (prev.applied || 0) + 1 }));
    setShowAddModal(false);
  };

  const handleUpdate = (updatedApp) => {
    setApplications(prev => prev.map(a => a._id === updatedApp._id ? updatedApp : a));
    setSelectedApp(updatedApp);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    const token = localStorage.getItem('authToken');
    await fetch(`/api/applications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setApplications(prev => prev.filter(a => a._id !== id));
    if (selectedApp?._id === id) setSelectedApp(null);
  };

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Applications & Tracking</h1>
          <p style={S.pageSubtitle}>Track every job application in one place</p>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowAddModal(true)}>+ Log Application</button>
      </div>
      <div style={S.filterTabs}>
        {[
          { key: 'all', label: `All (${summary.all || 0})` },
          { key: 'applied', label: `Applied (${summary.applied || 0})` },
          { key: 'phone_screen', label: `Phone Screen (${summary.phone_screen || 0})` },
          { key: 'interview', label: `Interview (${summary.interview || 0})` },
          { key: 'offer', label: `Offer (${summary.offer || 0})` },
          { key: 'rejected', label: `Rejected (${summary.rejected || 0})` },
        ].map(tab => (
          <button key={tab.key}
            style={{ ...S.filterTab, ...(filterStatus === tab.key ? S.filterTabActive : {}) }}
            onClick={() => { setFilterStatus(tab.key); setPage(1); }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={S.searchBar}>
        <input style={{ ...S.input, flex: 1, maxWidth: 360 }} value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by title or company..." />
        <select style={{ ...S.input, width: 160 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="recent">Most Recent</option>
          <option value="activity">Last Activity</option>
          <option value="company">Company A–Z</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {error && <p style={{ color: '#EF4444', padding: 16 }}>{error}</p>}
          {loading ? (
            <div style={S.emptyState}>
              <p style={{ color: '#6B7280' }}>Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div style={S.emptyState}>
              <span style={{ fontSize: 48 }}>📋</span>
              <h3 style={{ margin: '16px 0 8px', color: '#374151' }}>No applications yet</h3>
              <p style={{ color: '#6B7280', margin: '0 0 20px' }}>
                {filterStatus !== 'all' ? 'No applications with this status.' : 'Start tracking your job applications.'}
              </p>
              <button style={S.btnPrimary} onClick={() => setShowAddModal(true)}>Log Your First Application</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {applications.map(app => {
                const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                const isSelected = selectedApp?._id === app._id;
                return (
                  <div key={app._id}
                    style={{ ...S.appCard, border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB', cursor: 'pointer' }}
                    onClick={() => setSelectedApp(isSelected ? null : app)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{app.jobTitle}</h3>
                          <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                          {app.matchScore && <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: '#F0FDF4', color: '#16A34A', fontWeight: 600 }}>{app.matchScore}% match</span>}
                        </div>
                        <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>
                          {app.company}{app.location ? ` · ${app.location}` : ''}{app.remote ? ' · Remote' : app.hybrid ? ' · Hybrid' : ''}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: 12 }}>
                          Applied {formatDate(app.appliedAt)}{app.activities?.length > 1 && ` · ${app.activities.length} activities`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {app.applyUrl && (
                          <a href={app.applyUrl} target="_blank" rel="noopener noreferrer"
                            style={{ ...S.btnSecondary, textDecoration: 'none', fontSize: 13, padding: '6px 12px' }}
                            onClick={e => e.stopPropagation()}>View ↗</a>
                        )}
                        <button style={{ ...S.btnSecondary, fontSize: 13, padding: '6px 12px', color: '#EF4444', borderColor: '#FCA5A5' }}
                          onClick={e => { e.stopPropagation(); handleDelete(app._id); }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <button style={S.btnSecondary} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <span style={{ padding: '8px 16px', color: '#6B7280', fontSize: 14 }}>Page {page} of {totalPages}</span>
                  <button style={S.btnSecondary} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </div>
          )}
        </div>
        {selectedApp && (
          <div style={{ width: 380, flexShrink: 0, position: 'sticky', top: 24 }}>
            <ApplicationDetail app={selectedApp} onClose={() => setSelectedApp(null)} onUpdate={handleUpdate} />
          </div>
        )}
      </div>
      {showAddModal && <AddApplicationModal onClose={() => setShowAddModal(false)} onSave={handleAddSave} />}
    </div>
  );
}

const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: '#111827' },
  pageSubtitle: { margin: '4px 0 0', color: '#6B7280', fontSize: 15 },
  filterTabs: { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid #E5E7EB' },
  filterTab: { padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#6B7280', borderBottom: '2px solid transparent', marginBottom: -1 },
  filterTabActive: { color: '#3B82F6', borderBottomColor: '#3B82F6', fontWeight: 600 },
  searchBar: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' },
  appCard: { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', textAlign: 'center' },
  detailPanel: { background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sectionLabel: { margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoBox: { background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoValue: { fontSize: 14, color: '#374151', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #E5E7EB' },
  form: { padding: '20px 24px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, color: '#111827', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF', padding: 4, lineHeight: 1 },
  btnPrimary: { padding: '10px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer' },
};
