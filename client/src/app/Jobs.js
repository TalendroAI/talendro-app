import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Dashboard.css';

const API_BASE = '/api';

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diffMs    = Date.now() - new Date(dateStr).getTime();
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);
  if (diffMins < 2)   return 'Just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function freshnessLabel(dateStr) {
  if (!dateStr) return null;
  const hoursOld = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (hoursOld <= 2)  return { label: 'Just Posted', color: '#dc2626', bg: '#fef2f2' };
  if (hoursOld <= 6)  return { label: 'New Today',   color: '#d97706', bg: '#fffbeb' };
  if (hoursOld <= 24) return { label: 'Today',        color: '#059669', bg: '#f0fdf4' };
  if (hoursOld <= 48) return { label: 'Yesterday',    color: '#6b7280', bg: '#f9fafb' };
  return { label: '2+ days ago', color: '#9ca3af', bg: '#f9fafb' };
}

function matchBadge(score) {
  if (score == null) return null;
  if (score >= 90) return { label: `${score}% Match`, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' };
  if (score >= 75) return { label: `${score}% Match`, color: '#2F6DF6', bg: '#eff6ff', border: '#bfdbfe' };
  return { label: `${score}% Match`, color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' };
}

function BreakdownTooltip({ breakdown }) {
  if (!breakdown) return null;
  const rows = [
    { label: 'Title',       key: 'title',       max: 35 },
    { label: 'Seniority',   key: 'seniority',   max: 20 },
    { label: 'Arrangement', key: 'arrangement', max: 15 },
    { label: 'Emp. Type',   key: 'empType',     max: 10 },
    { label: 'Skills',      key: 'skills',      max: 10 },
    { label: 'Location',    key: 'location',    max: 5  },
    { label: 'Recency',     key: 'recency',     max: 5  },
  ];
  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 100,
      background: '#1f2937', color: '#fff', borderRadius: '10px',
      padding: '12px 16px', minWidth: '210px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      fontSize: '12px', marginTop: '4px', pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af' }}>
        Score Breakdown
      </div>
      {rows.map(({ label, key, max }) => {
        const val = breakdown[key] != null ? breakdown[key] : 0;
        const pct = Math.round((val / max) * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <span style={{ width: '80px', color: '#d1d5db', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, background: '#374151', borderRadius: '3px', height: '4px' }}>
              <div style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#6b7280',
                height: '100%', borderRadius: '3px'
              }} />
            </div>
            <span style={{ width: '36px', textAlign: 'right', color: '#e5e7eb', flexShrink: 0 }}>{val}/{max}</span>
          </div>
        );
      })}
    </div>
  );
}

function JobCard({ job, onApply, onSave, savedIds }) {
  const freshness = freshnessLabel(job.firstSeenAt);
  const badge     = matchBadge(job.matchScore);
  const isSaved   = savedIds.has(job._id);
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div
      style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
        padding: '20px 24px', marginBottom: '12px', transition: 'box-shadow 0.2s',
        cursor: 'default', position: 'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
            {job.company}
          </span>
          {freshness && (
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
              color: freshness.color, background: freshness.bg, letterSpacing: '0.3px'
            }}>
              {freshness.label}
            </span>
          )}
          {badge && (
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                  color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                  cursor: 'help', userSelect: 'none'
                }}
                onMouseEnter={() => setShowBreakdown(true)}
                onMouseLeave={() => setShowBreakdown(false)}
              >
                {badge.label} ▾
              </span>
              {showBreakdown && <BreakdownTooltip breakdown={job.scoreBreakdown} />}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => onSave(job)}
            title={isSaved ? 'Saved' : 'Save job'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
              color: isSaved ? '#2F6DF6' : '#d1d5db', padding: '2px 4px', transition: 'color 0.2s'
            }}
          >
            {isSaved ? '★' : '☆'}
          </button>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{timeAgo(job.firstSeenAt)}</span>
        </div>
      </div>

      {/* Job title */}
      <h3 style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: '17px', fontWeight: '700',
        color: '#1f2937', margin: '0 0 8px 0', lineHeight: '1.3'
      }}>
        {job.title}
      </h3>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {job.location && (
          <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📍 {job.location}
          </span>
        )}
        {job.remote && <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>🌐 Remote</span>}
        {job.hybrid && !job.remote && <span style={{ fontSize: '13px', color: '#7c3aed', fontWeight: '600' }}>🏢 Hybrid</span>}
        {job.employmentType && <span style={{ fontSize: '13px', color: '#6b7280' }}>⏱ {job.employmentType}</span>}
        {job.salary && (job.salary.min || job.salary.max) && (
          <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>
            💰 {job.salary.min ? `$${(job.salary.min / 1000).toFixed(0)}k` : ''}
            {job.salary.min && job.salary.max ? ' – ' : ''}
            {job.salary.max ? `$${(job.salary.max / 1000).toFixed(0)}k` : ''}
          </span>
        )}
        <span style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
          background: job.source === 'greenhouse' ? '#eff6ff' : '#f5f3ff',
          color: job.source === 'greenhouse' ? '#2F6DF6' : '#7c3aed',
          fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {job.source}
        </span>
      </div>

      {/* Description snippet */}
      {job.descriptionText && (
        <p style={{
          fontSize: '13px', color: '#6b7280', lineHeight: '1.5', margin: '0 0 14px 0',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {job.descriptionText}
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => onApply(job)}
          style={{
            background: '#2F6DF6', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
          onMouseLeave={e => e.currentTarget.style.background = '#2F6DF6'}
        >
          Apply Now →
        </button>
      </div>
    </div>
  );
}

function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div style={{
      display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '14px 20px',
      background: '#f8faff', border: '1px solid #dbeafe', borderRadius: '10px',
      marginBottom: '20px', alignItems: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#2F6DF6' }}>
          {stats.totalActiveJobs != null ? stats.totalActiveJobs.toLocaleString() : '—'}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Total Jobs</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626' }}>
          {stats.newLast24h != null ? stats.newLast24h.toLocaleString() : '—'}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>New Today</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>
          {stats.remoteJobs != null ? stats.remoteJobs.toLocaleString() : '—'}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Remote</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#7c3aed' }}>
          {stats.companiesTracked != null ? stats.companiesTracked.toLocaleString() : '—'}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Companies</div>
      </div>
      {stats.crawler && stats.crawler.lastCrawlAt && (
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
          Last crawl: {timeAgo(stats.crawler.lastCrawlAt)}
        </div>
      )}
    </div>
  );
}

function OnboardingBanner({ navigate }) {
  return (
    <div style={{
      background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px',
      padding: '16px 20px', marginBottom: '20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      flexWrap: 'wrap'
    }}>
      <div>
        <div style={{ fontWeight: '700', color: '#92400e', fontSize: '14px', marginBottom: '4px' }}>
          ⚠️ Complete your job preferences to unlock personalized matching
        </div>
        <div style={{ color: '#78350f', fontSize: '13px' }}>
          Your feed is showing all jobs. Set your target titles, seniority, and work arrangement
          to activate the 75% match threshold and see only relevant jobs.
        </div>
      </div>
      <button
        onClick={() => navigate('/app/onboarding')}
        style={{
          background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0
        }}
      >
        Complete Profile →
      </button>
    </div>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [jobs, setJobs]               = useState([]);
  const [stats, setStats]             = useState(null);
  const [feedMeta, setFeedMeta]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [savedIds, setSavedIds]       = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters]         = useState({
    remote: false, hybrid: false, onsite: false,
    fullTime: false, partTime: false, contract: false,
    postedWithin: '48',
  });
  const [activeTab, setActiveTab] = useState('feed');
  const searchTimeout = useRef(null);

  const getToken = () => localStorage.getItem('authToken');

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/stats/overview`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) { /* silent */ }
  };

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({ page: pageNum, limit: 25, postedWithin: filters.postedWithin });
      if (filters.remote)   params.set('remote', 'true');
      if (filters.hybrid)   params.set('hybrid', 'true');
      if (filters.onsite)   params.set('onsite', 'true');
      if (filters.fullTime) params.set('empType', 'full');
      else if (filters.partTime)  params.set('empType', 'part');
      else if (filters.contract)  params.set('empType', 'contract');

      const res = await fetch(`${API_BASE}/jobs/feed?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.status === 401) { logout(); navigate('/auth/sign-in'); return; }
      if (!res.ok) throw new Error('Failed to load jobs');

      const data = await res.json();
      const newJobs = data.jobs || [];
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
      setHasMore(data.pagination ? data.pagination.hasMore : false);
      setFeedMeta(data.meta || null);
      setError('');
    } catch (e) {
      setError('Unable to load jobs. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, logout, navigate]);

  const fetchSearch = useCallback(async (query, pageNum = 1, append = false) => {
    if (!query.trim()) { fetchFeed(1); return; }
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({ q: query, page: pageNum, limit: 25, postedWithin: filters.postedWithin });
      if (filters.remote) params.set('remote', 'true');

      const res = await fetch(`${API_BASE}/jobs/search?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.status === 401) { logout(); navigate('/auth/sign-in'); return; }
      if (!res.ok) throw new Error('Failed to search jobs');

      const data = await res.json();
      const newJobs = data.jobs || [];
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
      setHasMore(data.pagination ? data.pagination.hasMore : false);
      setFeedMeta(null);
      setError('');
    } catch (e) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, logout, navigate]);

  useEffect(() => {
    fetchStats();
    fetchFeed(1);
  }, []);

  useEffect(() => {
    setPage(1);
    if (activeTab === 'search' && searchQuery) fetchSearch(searchQuery, 1);
    else fetchFeed(1);
  }, [filters]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(val);
      setPage(1);
      setActiveTab(val.trim() ? 'search' : 'feed');
      if (val.trim()) fetchSearch(val, 1);
      else fetchFeed(1);
    }, 400);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    if (activeTab === 'search' && searchQuery) fetchSearch(searchQuery, nextPage, true);
    else fetchFeed(nextPage, true);
  };

  const handleApply = (job) => {
    const url = job.applyUrl || job.jobUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async (job) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/jobs/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job._id })
      });
      if (res.ok) {
        setSavedIds(prev => {
          const next = new Set(prev);
          if (next.has(job._id)) next.delete(job._id);
          else next.add(job._id);
          return next;
        });
      }
    } catch (e) { /* silent */ }
  };

  const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

  const filterBtn = (key, label) => (
    <button
      key={key}
      onClick={() => toggleFilter(key)}
      style={{
        padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
        cursor: 'pointer', transition: 'all 0.2s',
        background: filters[key] ? '#2F6DF6' : '#fff',
        color: filters[key] ? '#fff' : '#6b7280',
        border: filters[key] ? '1px solid #2F6DF6' : '1px solid #e5e7eb',
      }}
    >
      {label}
    </button>
  );

  const showOnboardingBanner = feedMeta && !feedMeta.userHasPrefs && activeTab === 'feed';

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '28px', fontWeight: '800', color: '#2C2F38', margin: 0 }}>
            Job Feed
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
            {feedMeta && feedMeta.userHasPrefs
              ? 'Showing jobs with 75%+ match to your profile — updated every 30 minutes'
              : 'Fresh jobs from Greenhouse & Lever — updated every 30 minutes'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/app/dashboard')}
            style={{
              background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#6b7280'
            }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar stats={stats} />

      {/* Onboarding incomplete banner */}
      {showOnboardingBanner && <OnboardingBanner navigate={navigate} />}

      {/* Threshold info bar */}
      {feedMeta && feedMeta.userHasPrefs && feedMeta.passedThreshold != null && activeTab === 'feed' && !loading && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
          padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#065f46',
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: '700' }}>✓ 75% threshold active</span>
          <span style={{ color: '#6b7280' }}>—</span>
          <span>
            {feedMeta.passedThreshold} of {feedMeta.candidatesEvaluated} evaluated jobs matched your profile
          </span>
        </div>
      )}

      {/* Search bar */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search job titles, companies, keywords..."
          value={searchInput}
          onChange={handleSearchInput}
          style={{
            width: '100%', padding: '12px 16px', fontSize: '15px', borderRadius: '10px',
            border: '1px solid #e5e7eb', outline: 'none', fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
          onFocus={e => e.target.style.borderColor = '#2F6DF6'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginRight: '4px' }}>FILTERS:</span>
        {filterBtn('remote',   '🌐 Remote')}
        {filterBtn('hybrid',   '🏢 Hybrid')}
        {filterBtn('onsite',   '🏙 On-site')}
        {filterBtn('fullTime', '⏱ Full-time')}
        {filterBtn('partTime', '⏰ Part-time')}
        {filterBtn('contract', '📋 Contract')}
        <select
          value={filters.postedWithin}
          onChange={e => setFilters(prev => ({ ...prev, postedWithin: e.target.value }))}
          style={{
            padding: '7px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
            border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer'
          }}
        >
          <option value="6">Last 6 hours</option>
          <option value="24">Last 24 hours</option>
          <option value="48">Last 48 hours</option>
          <option value="72">Last 3 days</option>
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>
          {jobs.length > 0
            ? `Showing ${jobs.length} job${jobs.length !== 1 ? 's' : ''}${activeTab === 'search' ? ` for "${searchQuery}"` : ' — sorted by newest first, then match score'}`
            : activeTab === 'search' ? `No results for "${searchQuery}"` : 'No matching jobs found'
          }
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>Loading fresh jobs...</p>
        </div>
      ) : error ? (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
          padding: '20px', textAlign: 'center', color: '#dc2626'
        }}>
          <p style={{ margin: 0, fontWeight: '600' }}>{error}</p>
          <button
            onClick={() => fetchFeed(1)}
            style={{
              marginTop: '12px', background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px'
            }}
          >
            Try Again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px',
          padding: '48px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          {feedMeta && feedMeta.userHasPrefs ? (
            <>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', color: '#1f2937', marginBottom: '8px' }}>
                No jobs matched your profile yet
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px' }}>
                The 75% threshold is active. {feedMeta.candidatesEvaluated > 0
                  ? `${feedMeta.candidatesEvaluated} jobs were evaluated but none scored high enough against your target titles, seniority, and preferences.`
                  : 'No jobs were found in this time window.'}
                {' '}Try expanding the time window or updating your profile.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setFilters(f => ({ ...f, postedWithin: '72' })); fetchFeed(1); }}
                  style={{
                    background: '#2F6DF6', color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                  }}
                >
                  Expand to 3 Days
                </button>
                <button
                  onClick={() => navigate('/app/profile')}
                  style={{
                    background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                  }}
                >
                  Update Profile
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', color: '#1f2937', marginBottom: '8px' }}>
                No jobs found yet
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
                The crawler is actively discovering companies and fetching fresh jobs. Check back in a few minutes, or try adjusting your filters.
              </p>
              <button
                onClick={() => { setFilters(f => ({ ...f, postedWithin: '72' })); fetchFeed(1); }}
                style={{
                  background: '#2F6DF6', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                }}
              >
                Expand to 3 Days
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {jobs.map(job => (
            <JobCard
              key={job._id}
              job={job}
              onApply={handleApply}
              onSave={handleSave}
              savedIds={savedIds}
            />
          ))}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  background: loadingMore ? '#e5e7eb' : '#fff',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '14px', fontWeight: '600',
                  cursor: loadingMore ? 'not-allowed' : 'pointer', color: '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {loadingMore ? 'Loading...' : 'Load More Jobs'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
