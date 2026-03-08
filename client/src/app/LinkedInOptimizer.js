/**
 * LinkedInOptimizer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * LinkedIn Profile Optimization — Concierge feature.
 *
 * The user pastes their full LinkedIn profile text (exported from LinkedIn)
 * and receives a detailed AI analysis with:
 *   - Overall profile score (0-100)
 *   - Section-by-section scores and recommendations
 *   - Keyword gap analysis
 *   - Priority action list
 *   - Suggested rewrites for headline and about section
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 3.1):
 *   - The backend route POST /api/linkedin/analyze is wired and ready.
 *   - Implement linkedinService.js on the backend to activate it.
 *   - The UI below is complete and ready to use once the backend is live.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function LinkedInOptimizer() {
  const [profileText, setProfileText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Load previous analysis on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/linkedin/last-analysis`, {
      headers: getAuthHeader(),
    })
      .then(r => r.json())
      .then(data => {
        if (data.analysis) {
          setAnalysis(data.analysis);
          setLastAnalyzedAt(data.analyzedAt);
        }
      })
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!profileText.trim() || profileText.trim().length < 100) {
      setError('Please paste your full LinkedIn profile text (at least 100 characters).');
      return;
    }
    setError('');
    setAnalysis(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/linkedin/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ profileText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      setLastAnalyzedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ScoreBar = ({ score, label }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {score}/100
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Profile Optimizer</h1>
          <p className="text-gray-500 mt-1">
            Get a detailed AI analysis of your LinkedIn profile with specific, actionable improvements.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Paste Your LinkedIn Profile</h2>
            <p className="text-sm text-gray-500 mb-4">
              On LinkedIn, go to your profile → More → Save to PDF, then copy and paste the text content here.
            </p>
            <textarea
              value={profileText}
              onChange={e => setProfileText(e.target.value)}
              placeholder="Paste your full LinkedIn profile text here..."
              rows={16}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">{profileText.length} characters</span>
              <button
                onClick={handleAnalyze}
                disabled={loading || profileText.length < 100}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze Profile'}
              </button>
            </div>
            {lastAnalyzedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Last analyzed: {new Date(lastAnalyzedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {!analysis && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 text-sm">
                  Paste your LinkedIn profile on the left and click Analyze to see your optimization report.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-4xl mb-3 animate-pulse">⚡</div>
                <p className="text-gray-500 text-sm">Analyzing your profile...</p>
              </div>
            )}

            {analysis && (
              <>
                {/* Overall Score */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Overall Profile Score</h3>
                    <span className={`text-3xl font-bold ${
                      analysis.overallScore >= 80 ? 'text-green-600' : analysis.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {analysis.overallScore}
                    </span>
                  </div>
                  <ScoreBar score={analysis.headline?.score || 0} label="Headline" />
                  <ScoreBar score={analysis.about?.score || 0} label="About Section" />
                  <ScoreBar score={analysis.experience?.score || 0} label="Experience" />
                  <ScoreBar score={analysis.skills?.score || 0} label="Skills" />
                </div>

                {/* Headline */}
                {analysis.headline?.suggestedHeadline && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-2">Headline Rewrite</h3>
                    <p className="text-xs text-gray-400 mb-1">Current</p>
                    <p className="text-sm text-gray-600 mb-3 italic">"{analysis.headline.current}"</p>
                    <p className="text-xs text-gray-400 mb-1">Suggested</p>
                    <p className="text-sm text-blue-700 font-medium">"{analysis.headline.suggestedHeadline}"</p>
                  </div>
                )}

                {/* Priority Actions */}
                {analysis.priorityActions?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">Priority Actions</h3>
                    <ol className="space-y-2">
                      {analysis.priorityActions.map((action, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Keyword Gaps */}
                {analysis.keywordGaps?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordGaps.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
