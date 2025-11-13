import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // State management
  const [stats, setStats] = useState({
    activeAgents: 0,
    jobsDiscovered: 0,
    jobsMatched: 0,
    applicationsSubmitted: 0,
    avgInitialMatch: 0,
    avgTailoredMatch: 0,
    avgImprovement: 0
  });
  
  const [recentApplications, setRecentApplications] = useState([]);
  const [searchAgents, setSearchAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      // For now, using mock data
      
      setStats({
        activeAgents: 3,
        jobsDiscovered: 1247,
        jobsMatched: 234,
        applicationsSubmitted: 156,
        avgInitialMatch: 76,
        avgTailoredMatch: 88,
        avgImprovement: 12
      });
      
      setRecentApplications([
        {
          id: 1,
          jobTitle: 'Senior Marketing Manager',
          company: 'Apex Group',
          location: 'Orlando, FL',
          salary: '$120-150K',
          initialMatch: 78,
          tailoredMatch: 89,
          improvement: 11,
          appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          jobUrl: '#',
          resumeUrl: '#'
        },
        {
          id: 2,
          jobTitle: 'VP of Marketing',
          company: 'United Marketing Inc',
          location: 'Remote',
          salary: '$140-180K',
          initialMatch: 81,
          tailoredMatch: 87,
          improvement: 6,
          appliedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          jobUrl: '#',
          resumeUrl: '#'
        },
        {
          id: 3,
          jobTitle: 'Marketing Manager',
          company: 'Silver Health Corp',
          location: 'Tampa, FL',
          salary: '$90-110K',
          initialMatch: 82,
          tailoredMatch: 91,
          improvement: 9,
          appliedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
          jobUrl: '#',
          resumeUrl: '#'
        }
      ]);
      
      setSearchAgents([
        {
          id: 1,
          name: 'Senior Marketing Leadership',
          status: 'active',
          frequency: 'every 30 minutes',
          jobsDiscovered: 423,
          jobsMatched: 87,
          applicationsSubmitted: 54,
          lastRun: new Date(Date.now() - 12 * 60 * 1000), // 12 min ago
          nextRun: new Date(Date.now() + 18 * 60 * 1000) // in 18 min
        },
        {
          id: 2,
          name: 'Marketing Director | Remote Only',
          status: 'active',
          frequency: 'hourly',
          jobsDiscovered: 618,
          jobsMatched: 102,
          applicationsSubmitted: 71,
          lastRun: new Date(Date.now() - 34 * 60 * 1000), // 34 min ago
          nextRun: new Date(Date.now() + 26 * 60 * 1000) // in 26 min
        },
        {
          id: 3,
          name: 'CMO Opportunities',
          status: 'active',
          frequency: 'daily',
          jobsDiscovered: 206,
          jobsMatched: 45,
          applicationsSubmitted: 31,
          lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          nextRun: new Date(Date.now() + 21 * 60 * 60 * 1000) // in 21 hours
        }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };
  
  // Helper functions
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };
  
  const formatTimeUntil = (date) => {
    const seconds = Math.floor((date - new Date()) / 1000);
    
    if (seconds < 60) return `in ${seconds} seconds`;
    if (seconds < 3600) return `in ${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `in ${Math.floor(seconds / 3600)} hours`;
    return `in ${Math.floor(seconds / 86400)} days`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-talBlue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Your AI is working around the clock to advance your career
              </p>
            </div>
            <button
              onClick={() => navigate('/app/agents/create')}
              className="px-6 py-3 bg-talBlue text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
            >
              + Create New Agent
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Agents */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Search Agents</h3>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeAgents}</p>
            <p className="text-xs text-gray-500 mt-1">Working 24/7 on your behalf</p>
          </div>
          
          {/* Jobs Discovered */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Jobs Discovered</h3>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.jobsDiscovered.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Across millions of sources</p>
          </div>
          
          {/* Jobs Matched */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-green-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Jobs Matched (75%+)</h3>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.jobsMatched}</p>
            <p className="text-xs text-gray-500 mt-1">Strong fits for your profile</p>
          </div>
          
          {/* Applications Submitted */}
          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-cyan-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Applications Submitted</h3>
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📤</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.applicationsSubmitted}</p>
            <p className="text-xs text-gray-500 mt-1">While you worked, slept, and played</p>
          </div>
        </div>
        
        {/* Match Score Improvement */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-8 border-2 border-talBlue">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Resume Tailoring Impact
              </h3>
              <p className="text-sm text-gray-700">
                Our AI improves your match scores by an average of{' '}
                <strong className="text-talBlue text-lg">+{stats.avgImprovement}%</strong> through intelligent resume tailoring
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Initial Match</p>
                <p className="text-3xl font-bold text-gray-700">{stats.avgInitialMatch}%</p>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Tailored Match</p>
                <p className="text-3xl font-bold text-talBlue">{stats.avgTailoredMatch}%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Applications</h2>
            <button
              onClick={() => navigate('/app/applications')}
              className="text-talBlue hover:text-blue-700 font-semibold text-sm"
            >
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-talBlue transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {app.jobTitle}
                    </h3>
                    <p className="text-gray-700 mb-2">
                      {app.company} • {app.location} • {app.salary}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Applied</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatTimeAgo(app.appliedAt)}
                    </p>
                  </div>
                </div>
                
                {/* Match Score Visualization */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Initial Match</p>
                        <p className="text-2xl font-bold text-gray-700">{app.initialMatch}%</p>
                      </div>
                      <div className="text-xl text-gray-400">→</div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tailored Match</p>
                        <p className="text-2xl font-bold text-green-600">{app.tailoredMatch}%</p>
                      </div>
                      <div className="ml-4 px-3 py-1 bg-green-100 rounded-full">
                        <p className="text-sm font-bold text-green-700">+{app.improvement}%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-white border-2 border-talBlue text-talBlue rounded-lg font-semibold hover:bg-blue-50 transition text-center"
                  >
                    View Job Posting
                  </a>
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-talBlue text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
                  >
                    View Tailored Resume
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Search Agents */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Search Agents</h2>
              <p className="text-sm text-gray-600 mt-1">
                {searchAgents.length} active agent{searchAgents.length !== 1 ? 's' : ''} working 24/7
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {searchAgents.map((agent) => (
              <div
                key={agent.id}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-talBlue transition"
              >
                {/* Agent Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        ● Active
                      </span>
                      <span className="text-sm text-gray-600">
                        Running {agent.frequency}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Agent Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {agent.jobsDiscovered}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Jobs Discovered</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {agent.jobsMatched}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Matched (75%+)</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {agent.applicationsSubmitted}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Applied</p>
                  </div>
                </div>
                
                {/* Timing */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                  <p>Last run: {formatTimeAgo(agent.lastRun)}</p>
                  <p>Next run: {formatTimeUntil(agent.nextRun)}</p>
                </div>
                
                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/app/agents/${agent.id}/edit`)}
                    className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center text-sm"
                  >
                    ✏️ Edit Agent
                  </button>
                  <button
                    onClick={() => {/* TODO: Pause agent */}}
                    className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center text-sm"
                  >
                    ⏸️ Pause
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Section Footer with CTAs */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={() => navigate('/app/agents/create')}
              className="w-full sm:w-auto px-6 py-3 bg-talBlue text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
            >
              + Create New Agent
            </button>
            <button
              onClick={() => navigate('/app/agents')}
              className="w-full sm:w-auto text-talBlue hover:text-blue-700 font-semibold text-sm transition"
            >
              View & Manage All Agents →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

