/**
 * pages/app/Dashboard.js
 * Production-ready Talendro Subscriber Dashboard — wired to live backend.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

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
  aqua:     '#00C4CC',
};

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(d);
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

function StatCard({ icon, label, value, subLabel, color, loading }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      </div>
      {loading ? (
        <div style={{ height: 40, background: C.border, borderRadius: 6 }} />
      ) : (
        <div style={{ fontSize: 36, fontWeight: 800, color: color || C.blue, fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>
          {value != null ? value : '—'}
        </div>
      )}
      {subLabel && <div style={{ fontSize: 12, color: C.grayLight }}>{subLabel}</div>}
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>{title}</h2>
      {action && (
        <button onClick={onAction} style={{ fontSize: 13, color: C.blue, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {action} →
        </button>
      )}
    </div>
  );
}

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
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.text }}>{label}</span>
  );
}

function MatchScoreBadge({ score }) {
  if (!score) return <span style={{ color: C.grayLight, fontSize: 13 }}>—</span>;
  return (
    <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(score), background: score >= 70 ? C.blueLight : '#F3F4F6', padding: '2px 8px', borderRadius: 20 }}>
      {score}%
    </span>
  );
}

function JobMatchRow({ job, isBelow }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.slate }}>{job.title}</span>
          {job.tags && job.tags.map((t, i) => <Tag key={i} label={t.label} color={t.color} />)}
          {isBelow && <Tag label="Location Hold" color="amber" />}
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
          {job.company}{job.location ? ` · ${job.location}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
        <MatchScoreBadge score={job.score} />
        <span style={{ fontSize: 11, color: C.grayLight }}>{timeAgo(job.firstSeenAt)}</span>
      </div>
    </div>
  );
}

function ApplicationRow({ app }) {
  const statusColors = {
    applied:   { bg: C.blueLight, text: C.blue },
    saved:     { bg: '#F3F4F6',   text: C.gray },
    rejected:  { bg: C.redBg,     text: C.red },
    withdrawn: { bg: '#F3F4F6',   text: C.gray },
  };
  const sc = statusColors[app.status] || statusColors.applied;
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: '12px 8px', fontSize: 14, fontWeight: 600, color: C.slate }}>{app.title}</td>
      <td style={{ padding: '12px 8px', fontSize: 13, color: C.gray }}>{app.company}</td>
      <td style={{ padding: '12px 8px', fontSize: 12, color: C.gray }}>{formatDate(app.date)}</td>
      <td style={{ padding: '12px 8px' }}><MatchScoreBadge score={app.matchScore} /></td>
      <td style={{ padding: '12px 8px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>
          {app.status === 'applied' ? 'Submitted' : app.status}
        </span>
      </td>
      <td style={{ padding: '12px 8px', fontSize: 12, color: C.grayLight }}>{app.resumeUsed || 'Base Resume'}</td>
    </tr>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const [stats, setStats]               = useState(null);
  const [jobMatches, setJobMatches]     = useState(null);
  const [applications, setApplications] = useState([]);
  const [searchStatus, setSearchStatus] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [userName, setUserName]         = useState('');

  const cid = sessionStorage.getItem('currentCid') || 'me';

  const fetchAll = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      navigate('/auth/sign-in');
      return;
    }
    try {
      const [statsRes, matchesRes, appsRes, statusRes, meRes] = await Promise.all([
        fetch(`/api/dashboard/stats/${cid}`,         { headers }),
        fetch(`/api/dashboard/job-matches/${cid}`,   { headers }),
        fetch(`/api/dashboard/applications/${cid}`,  { headers }),
        fetch(`/api/dashboard/search-status/${cid}`, { headers }),
        fetch('/api/auth/me',                         { headers }),
      ]);
      if (statsRes.status === 401 || meRes.status === 401) {
        logout();
        navigate('/auth/sign-in');
        return;
      }
      if (statsRes.ok)   setStats(await statsRes.json());
      if (matchesRes.ok) setJobMatches(await matchesRes.json());
      if (appsRes.ok)    setApplications(await appsRes.json());
      if (statusRes.ok)  setSearchStatus(await statusRes.json());
      if (meRes.ok) {
        const me = await meRes.json();
        setUserName((me.user || me).name || '');
      }
    } catch (err) {
      console.error('[Dashboard] Load error:', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [cid, navigate, logout]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleLogout = () => { logout(); navigate('/auth/sign-in'); };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: C.gray, fontSize: 14 }}>Loading your dashboard…</p>
        </div>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  const plan = stats?.plan || authUser?.plan || 'starter';
  const searchActive = searchStatus?.status === 'active';
  const rarityAlerts = jobMatches?.rarityAlerts || [];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{"* { box-sizing: border-box; } table { border-collapse: collapse; width: 100%; } a { text-decoration: none; } @keyframes spin { to { transform: rotate(360deg); } }"}</style>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: searchActive ? C.green : C.amber, boxShadow: searchActive ? `0 0 0 3px ${C.greenBg}` : `0 0 0 3px ${C.amberBg}` }} />
            <span style={{ fontSize: 12, color: C.gray }}>{searchActive ? 'Search Active' : 'Search Paused'}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: C.blueLight, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.5 }}>{planLabel(plan)}</span>
          <button onClick={handleLogout} style={{ fontSize: 13, color: C.gray, background: 'none', border: 'none', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px' }}>
        {error && (
          <div style={{ background: C.redBg, border: `1px solid ${C.red}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: C.red, fontSize: 14 }}>{error}</div>
        )}

        {/* Rarity Alert */}
        {rarityAlerts.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)', border: `1px solid ${C.amber}`, borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.slate }}>Exceptionally Rare Role Detected</div>
              <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>
                {(rarityAlerts[0].job || rarityAlerts[0]).title} at {(rarityAlerts[0].job || rarityAlerts[0]).company} — fewer than 3–5 roles like this appear nationally each year.
              </div>
            </div>
            <button onClick={() => navigate('/app/job-matches')} style={{ padding: '8px 20px', background: C.amber, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View Now →</button>
          </div>
        )}

        {/* Welcome bar */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
            {userName ? `Welcome back, ${userName.split(' ')[0]}.` : 'Welcome back.'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: C.gray }}>
            Here is everything Talendro has done for you.
            {searchStatus && searchStatus.lastSearchRun && (
              <span> Last search: <strong>{timeAgo(searchStatus.lastSearchRun)}</strong>.</span>
            )}
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          <StatCard icon="🔍" label="Jobs Searched" value={stats ? stats.jobsSearched.toLocaleString() : '0'} subLabel={`Last 24h: ${searchStatus ? searchStatus.jobsDiscoveredLast24h : 0} new`} color={C.blue} loading={!stats} />
          <StatCard icon="📄" label="Resumes Tailored" value={stats ? stats.resumesTailored.toLocaleString() : '0'} subLabel="AI-customized per job" color={C.purple} loading={!stats} />
          <StatCard icon="✅" label="Applications Submitted" value={stats ? stats.applicationsSubmitted.toLocaleString() : '0'} subLabel="Completed by Talendro" color={C.green} loading={!stats} />
          <StatCard icon="🎯" label="Avg Match Score" value={stats && stats.avgMatchScore ? `${stats.avgMatchScore}%` : '—'} subLabel="Across submitted applications" color={stats && stats.avgMatchScore >= 80 ? C.green : C.blue} loading={!stats} />
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 32 }}>
          {/* Left: Job Matches Summary */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
            <SectionHeader title="Job Matches Summary" action="View Full Report" onAction={() => navigate('/app/job-matches')} />
            {jobMatches && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'Applied', count: jobMatches.stats ? jobMatches.stats.aboveLineCount : 0, color: C.green },
                  { label: 'Location Hold', count: jobMatches.stats ? jobMatches.stats.belowLineCount : 0, color: C.amber },
                  { label: 'Filtered Out', count: jobMatches.stats ? jobMatches.stats.filteredCount : 0, color: C.grayLight },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color }}>{count}</span>
                    <span style={{ fontSize: 12, color: C.gray }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
            {jobMatches && jobMatches.aboveLine && jobMatches.aboveLine.length > 0 ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Applied (Above the Line)</div>
                {jobMatches.aboveLine.map((j, i) => <JobMatchRow key={j.id || i} job={j} isBelow={false} />)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: C.grayLight, fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                No matches yet — Talendro is searching now.
              </div>
            )}
            {jobMatches && jobMatches.belowLine && jobMatches.belowLine.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px' }}>
                  Strong Matches on Location Hold ({jobMatches.stats ? jobMatches.stats.belowLineCount : 0})
                </div>
                {jobMatches.belowLine.slice(0, 3).map((j, i) => <JobMatchRow key={j.id || i} job={j} isBelow={true} />)}
                <button onClick={() => navigate('/app/job-matches')} style={{ marginTop: 12, width: '100%', padding: '10px', background: C.amberBg, border: `1px solid ${C.amber}`, borderRadius: 8, color: C.amber, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Review Location Hold Jobs →
                </button>
              </div>
            )}
          </div>

          {/* Right: Search Status + Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Search Engine Status */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <SectionHeader title="Search Engine" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: searchActive ? C.green : C.amber, boxShadow: searchActive ? `0 0 0 4px ${C.greenBg}` : `0 0 0 4px ${C.amberBg}` }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: searchActive ? C.green : C.amber }}>{searchActive ? 'Active — Searching Now' : 'Paused'}</span>
              </div>
              {searchStatus && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Plan', planLabel(plan)],
                    ['Search Frequency', `Every ${searchStatus.searchIntervalMinutes} min`],
                    ['Max Job Age', `${searchStatus.maxJobAgeMinutes} min`],
                    ['Last Run', searchStatus.lastSearchRun ? timeAgo(searchStatus.lastSearchRun) : 'Not yet'],
                    ['Next Run', searchStatus.nextSearchAt ? timeAgo(searchStatus.nextSearchAt) : '—'],
                    ['Sources', (searchStatus.sources || []).join(', ')],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: C.gray }}>{k}</span>
                      <span style={{ fontWeight: 600, color: C.slate, textAlign: 'right', maxWidth: 180 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <SectionHeader title="Quick Actions" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '📊', label: 'View Full Job Matches Report', path: '/app/job-matches' },
                  { icon: '🎛️', label: 'Adjust Search Criteria', path: '/app/profile' },
                  { icon: '📄', label: 'Download Optimized Resume', path: '/app/resume-review' },
                  { icon: '💼', label: 'LinkedIn Optimizer', path: '/app/linkedin-optimizer' },
                  { icon: '📈', label: 'Weekly Strategy Session', path: '/app/weekly-strategy' },
                  { icon: '🎙️', label: 'Interview Prep', path: '/app/interview' },
                ].map(({ icon, label, path }) => (
                  <button key={path} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.slate }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <SectionHeader title="Recent Applications" action="View All" onAction={() => navigate('/app/applications')} />
          {applications.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {['Role', 'Company', 'Date Applied', 'Match Score', 'Status', 'Resume Used'].map(h => (
                      <th key={h} style={{ padding: '8px 8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.grayLight, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 10).map((app, i) => <ApplicationRow key={app.id || i} app={app} />)}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.grayLight }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.slate, marginBottom: 4 }}>No applications yet</div>
              <div style={{ fontSize: 13 }}>Talendro will start applying once your profile is complete and matching jobs are found.</div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        {stats && stats.recentActivity && stats.recentActivity.length > 0 && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
            <SectionHeader title="Recent Activity" />
            <div>
              {stats.recentActivity.map((activity, i) => (
                <div key={activity.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < stats.recentActivity.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: activity.status === 'applied' ? C.green : C.gray }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.slate }}>{activity.action}</div>
                    <div style={{ fontSize: 11, color: C.grayLight, marginTop: 2 }}>{timeAgo(activity.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: C.grayLight }}>
          Talendro shows only what it has done on your behalf. Post-submission tracking (interviews, offers) is outside our scope.
        </div>
      </main>
    </div>
  );
}
