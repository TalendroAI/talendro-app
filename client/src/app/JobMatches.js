/**
 * app/JobMatches.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Talendro Job Matches Report — production-ready, wired to live backend.
 *
 * Three-section layout (matches job_matches_v3.html prototype):
 *   1. Above the Line  — jobs Talendro has applied to (or will apply to)
 *   2. Below the Line  — strong matches held due to location preference
 *   3. Domain Filtered — jobs outside TA/Recruiting domain
 *
 * Action buttons:
 *   Above: View Posting
 *   Below: Apply Anyway, No Thanks, View Posting
 *   Filtered: View Posting (read-only)
 *
 * Rarity alert banner shown at top when EXCEPTIONALLY_RARE roles are present.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:     '#2F6DF6',
  blueLight:'#EBF2FF',
  slate:    '#2C2F38',
  gray:     '#6B7280',
  grayLight:'#9CA3AF',
  border:   '#E5E7EB',
  bg:       '#F9FAFB',
  white:    '#FFFFFF',
  green:    '#10B981',
  greenBg:  '#D1FAE5',
  amber:    '#F59E0B',
  amberBg:  '#FEF3C7',
  red:      '#EF4444',
  redBg:    '#FEE2E2',
  purple:   '#8B5CF6',
};

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

function timeAgo(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return null;
  const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  if (salary.min && salary.max) return `${fmt(salary.min)} – ${fmt(salary.max)}`;
  if (salary.min) return `${fmt(salary.min)}+`;
  return fmt(salary.max);
}

function scoreColor(score) {
  if (!score) return C.grayLight;
  if (score >= 85) return C.green;
  if (score >= 70) return C.blue;
  if (score >= 55) return C.amber;
  return C.red;
}

function planLabel(plan) {
  if (!plan) return 'Starter';
  const p = plan.toLowerCase();
  if (p === 'premium' || p === 'concierge') return 'Concierge';
  if (p === 'pro') return 'Pro';
  return 'Starter';
}

// ─── Tag component ────────────────────────────────────────────────────────────
function Tag({ label, color }) {
  const colorMap = {
    green:  { bg: C.greenBg,  text: C.green },
    amber:  { bg: C.amberBg,  text: C.amber },
    red:    { bg: C.redBg,    text: C.red },
    blue:   { bg: C.blueLight, text: C.blue },
    gray:   { bg: '#F3F4F6',  text: C.gray },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ─── Score breakdown tooltip ──────────────────────────────────────────────────
function ScoreBreakdown({ breakdown, strengths, concerns }) {
  const [open, setOpen] = useState(false);
  if (!breakdown) return null;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ fontSize: 11, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
      >
        Why this score?
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 200,
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: 16, width: 280, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.slate, marginBottom: 10 }}>Score Breakdown</div>
          {[
            ['Hard Skills', breakdown.hardSkills, 40],
            ['Recency & Seniority', breakdown.recencySeniority, 30],
            ['Quantifiable Impact', breakdown.quantifiableImpact, 20],
            ['Contextual Fit', breakdown.contextualFit, 10],
          ].map(([label, val, max]) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: C.gray }}>{label}</span>
                <span style={{ fontWeight: 600, color: C.slate }}>{val || 0}/{max}</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                <div style={{ height: 4, background: C.blue, borderRadius: 2, width: `${((val || 0) / max) * 100}%` }} />
              </div>
            </div>
          ))}
          {strengths && strengths.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 4 }}>Strengths</div>
              {strengths.map((s, i) => <div key={i} style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>✓ {s}</div>)}
            </div>
          )}
          {concerns && concerns.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 4 }}>Considerations</div>
              {concerns.map((c, i) => <div key={i} style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>⚠ {c}</div>)}
            </div>
          )}
          <button onClick={() => setOpen(false)} style={{ marginTop: 10, fontSize: 11, color: C.grayLight, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Close</button>
        </div>
      )}
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, section, onAction }) {
  const salary = formatSalary(job.salary);

  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: '20px 24px', marginBottom: 16,
      borderLeft: section === 'above' ? `4px solid ${C.green}` : section === 'below' ? `4px solid ${C.amber}` : `4px solid ${C.border}`,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.slate }}>{job.title}</h3>
            {job.tags && job.tags.map((t, i) => <Tag key={i} label={t.label} color={t.color} />)}
          </div>
          {/* Company + location */}
          <div style={{ fontSize: 14, color: C.gray }}>
            {job.company}
            {job.location && <span> · {job.location}</span>}
            {job.remote && <span style={{ color: C.green }}> · Remote</span>}
            {job.hybrid && !job.remote && <span style={{ color: C.amber }}> · Hybrid</span>}
          </div>
          {/* Salary + source + age */}
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            {salary && <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{salary}</span>}
            {job.source && <span style={{ fontSize: 12, color: C.grayLight, textTransform: 'capitalize' }}>{job.source}</span>}
            <span style={{ fontSize: 12, color: C.grayLight }}>Found {timeAgo(job.firstSeenAt)}</span>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            border: `3px solid ${scoreColor(job.score)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(job.score), lineHeight: 1 }}>
              {job.score || '—'}
            </span>
            {job.score && <span style={{ fontSize: 9, color: C.grayLight }}>match</span>}
          </div>
          <div style={{ marginTop: 4 }}>
            <ScoreBreakdown breakdown={job.breakdown} strengths={job.strengths} concerns={job.concerns} />
          </div>
        </div>
      </div>

      {/* Strengths/Concerns summary */}
      {job.strengths && job.strengths.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {job.strengths.slice(0, 2).map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: C.green, background: C.greenBg, padding: '2px 8px', borderRadius: 20 }}>✓ {s}</span>
          ))}
          {job.concerns && job.concerns.slice(0, 1).map((c, i) => (
            <span key={i} style={{ fontSize: 11, color: C.amber, background: C.amberBg, padding: '2px 8px', borderRadius: 20 }}>⚠ {c}</span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {section === 'above' && (
          <>
            <button
              onClick={() => window.open(job.jobUrl || job.applyUrl, '_blank')}
              style={{ padding: '8px 16px', background: C.blueLight, color: C.blue, border: `1px solid ${C.blue}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              View Posting →
            </button>
            <span style={{ fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
              ✓ Applied by Talendro
            </span>
          </>
        )}
        {section === 'below' && (
          <>
            <button
              onClick={() => onAction('apply_anyway', job)}
              style={{ padding: '8px 16px', background: C.amber, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Apply Anyway
            </button>
            <button
              onClick={() => window.open(job.jobUrl || job.applyUrl, '_blank')}
              style={{ padding: '8px 16px', background: C.blueLight, color: C.blue, border: `1px solid ${C.blue}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              View Posting
            </button>
            <button
              onClick={() => onAction('no_thanks', job)}
              style={{ padding: '8px 16px', background: C.bg, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
            >
              No Thanks
            </button>
          </>
        )}
        {section === 'filtered' && (
          <button
            onClick={() => window.open(job.jobUrl || job.applyUrl, '_blank')}
            style={{ padding: '8px 16px', background: C.bg, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
          >
            View Posting
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionDivider({ title, count, color, description }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
          {title}
        </h2>
        <span style={{
          fontSize: 13, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
          background: color === 'green' ? C.greenBg : color === 'amber' ? C.amberBg : '#F3F4F6',
          color: color === 'green' ? C.green : color === 'amber' ? C.amber : C.gray,
        }}>
          {count} {count === 1 ? 'job' : 'jobs'}
        </span>
      </div>
      {description && (
        <p style={{ margin: '6px 0 0', fontSize: 13, color: C.gray }}>{description}</p>
      )}
      <div style={{ height: 2, background: color === 'green' ? C.green : color === 'amber' ? C.amber : C.border, borderRadius: 1, marginTop: 12 }} />
    </div>
  );
}

// ─── Main JobMatches Component ────────────────────────────────────────────────
export default function JobMatches() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('above');
  const [dismissed, setDismissed] = useState(new Set());
  const [page, setPage]         = useState(1);

  const cid = sessionStorage.getItem('currentCid') || 'me';

  const fetchMatches = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      navigate('/auth/sign-in');
      return;
    }
    try {
      const res = await fetch(`/api/jobs/matches?page=${page}&limit=50`, { headers });
      if (res.status === 401) {
        logout();
        navigate('/auth/sign-in');
        return;
      }
      if (res.ok) {
        setData(await res.json());
      } else {
        setError('Failed to load job matches.');
      }
    } catch (err) {
      console.error('[JobMatches] Error:', err);
      setError('Failed to load job matches. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [page, navigate, logout]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleAction = async (action, job) => {
    const headers = getAuthHeaders();
    if (action === 'no_thanks') {
      setDismissed(prev => new Set([...prev, job.id]));
    } else if (action === 'apply_anyway') {
      try {
        await fetch('/api/applications/apply-anyway', {
          method: 'POST',
          headers,
          body: JSON.stringify({ jobId: job.id }),
        });
        // Refresh data
        fetchMatches();
      } catch (err) {
        console.error('[JobMatches] Apply anyway error:', err);
      }
    }
  };

  const handleLogout = () => { logout(); navigate('/auth/sign-in'); };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: C.gray, fontSize: 14 }}>Loading job matches…</p>
        </div>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  const aboveLine  = (data?.aboveLine  || []).filter(j => !dismissed.has(j.id));
  const belowLine  = (data?.belowLine  || []).filter(j => !dismissed.has(j.id));
  const filtered   = (data?.filtered   || []);
  const rarityAlerts = data?.rarityAlerts || [];
  const stats      = data?.stats || {};

  const tabs = [
    { id: 'above',    label: 'Applied',         count: aboveLine.length,  color: C.green },
    { id: 'below',    label: 'Location Hold',   count: belowLine.length,  color: C.amber },
    { id: 'filtered', label: 'Filtered Out',    count: filtered.length,   color: C.grayLight },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{"* { box-sizing: border-box; } a { text-decoration: none; } @keyframes spin { to { transform: rotate(360deg); } }"}</style>

      {/* Top Nav */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", letterSpacing: -0.5 }}>Talendro™</h1>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[['Dashboard', '/app/dashboard'], ['Job Matches', '/app/job-matches'], ['Applications', '/app/applications'], ['Resume', '/app/resume-review'], ['Profile', '/app/profile']].map(([label, path]) => (
              <Link key={path} to={path} style={{ fontSize: 14, fontWeight: 500, color: window.location.pathname === path ? C.blue : C.gray, borderBottom: window.location.pathname === path ? `2px solid ${C.blue}` : '2px solid transparent', paddingBottom: 4 }}>{label}</Link>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={fetchMatches} style={{ fontSize: 13, color: C.blue, background: C.blueLight, border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
            ↻ Refresh
          </button>
          <button onClick={handleLogout} style={{ fontSize: 13, color: C.gray, background: 'none', border: 'none', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>Job Matches Report</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: C.gray }}>
            {stats.total ? `Talendro evaluated ${stats.total} jobs in the last search cycle.` : 'Your personalized job matches, updated continuously.'}
          </p>
        </div>

        {error && (
          <div style={{ background: C.redBg, border: `1px solid ${C.red}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: C.red, fontSize: 14 }}>{error}</div>
        )}

        {/* Rarity Alert Banner */}
        {rarityAlerts.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)', border: `2px solid ${C.amber}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ fontSize: 32 }}>⚡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.slate, marginBottom: 4 }}>
                  Exceptionally Rare Role Alert
                </div>
                <div style={{ fontSize: 14, color: C.gray, marginBottom: 12 }}>
                  Fewer than 3–5 roles like this appear nationally each year. These are career-defining opportunities.
                </div>
                {rarityAlerts.map((alert, i) => {
                  const job = alert.job || alert;
                  return (
                    <div key={i} style={{ background: C.white, border: `1px solid ${C.amber}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>{job.company}{job.location ? ` · ${job.location}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => window.open(job.jobUrl || job.applyUrl, '_blank')}
                          style={{ padding: '6px 14px', background: C.amber, color: C.white, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          View Posting →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Summary stats bar */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Jobs Evaluated', value: stats.total || 0, color: C.blue },
            { label: 'Applied (Above Line)', value: stats.aboveLineCount || 0, color: C.green },
            { label: 'Location Hold', value: stats.belowLineCount || 0, color: C.amber },
            { label: 'Filtered Out', value: stats.filteredCount || 0, color: C.grayLight },
            { label: 'Rarity Alerts', value: stats.rarityAlertCount || 0, color: C.red },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 20px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: "'Montserrat', sans-serif" }}>{value}</div>
              <div style={{ fontSize: 11, color: C.grayLight, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 28 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px', fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? C.blue : C.gray,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab.id ? `3px solid ${C.blue}` : '3px solid transparent',
                marginBottom: -2, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                background: activeTab === tab.id ? C.blueLight : '#F3F4F6',
                color: activeTab === tab.id ? C.blue : C.grayLight,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Above the Line */}
        {activeTab === 'above' && (
          <div>
            <SectionDivider
              title="Applied — Above the Line"
              count={aboveLine.length}
              color="green"
              description="These jobs passed all filters and Talendro has applied (or will apply) on your behalf with your tailored resume."
            />
            {aboveLine.length > 0 ? (
              aboveLine.map((job, i) => (
                <JobCard key={job.id || i} job={job} section="above" onAction={handleAction} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.grayLight }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.slate, marginBottom: 8 }}>No matches yet</div>
                <div style={{ fontSize: 14 }}>Talendro is actively searching. Check back soon — matches appear here as they are found.</div>
              </div>
            )}
          </div>
        )}

        {/* Below the Line */}
        {activeTab === 'below' && (
          <div>
            <SectionDivider
              title="Location Hold — Below the Line"
              count={belowLine.length}
              color="amber"
              description="These are strong matches that Talendro held because they are outside your location preference. You can override and apply anyway."
            />
            {belowLine.length > 0 ? (
              belowLine.map((job, i) => (
                <JobCard key={job.id || i} job={job} section="below" onAction={handleAction} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.grayLight }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.slate, marginBottom: 8 }}>No location holds</div>
                <div style={{ fontSize: 14 }}>All strong matches are within your location preference.</div>
              </div>
            )}
          </div>
        )}

        {/* Filtered Out */}
        {activeTab === 'filtered' && (
          <div>
            <SectionDivider
              title="Filtered Out"
              count={filtered.length}
              color="gray"
              description="These jobs were removed before scoring. Domain-filtered roles are outside TA/Recruiting. Freshness-filtered roles are too old for your tier."
            />
            {filtered.length > 0 ? (
              filtered.map((job, i) => (
                <div key={job.id || i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 12, opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.slate }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: C.gray }}>{job.company}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F3F4F6', color: C.gray }}>
                      {job.filterLabel || job.filterReason}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.grayLight }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.slate, marginBottom: 8 }}>Nothing filtered out</div>
                <div style={{ fontSize: 14 }}>All discovered jobs passed the domain and freshness filters.</div>
              </div>
            )}
          </div>
        )}

        {/* Back to dashboard */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button
            onClick={() => navigate('/app/dashboard')}
            style={{ padding: '10px 24px', background: C.blueLight, color: C.blue, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: C.grayLight }}>
          Talendro shows only what it has done on your behalf. Post-submission tracking (interviews, offers) is outside our scope.
        </div>
      </main>
    </div>
  );
}
