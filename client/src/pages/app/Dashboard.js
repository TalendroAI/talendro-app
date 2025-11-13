import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Card component
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

// Button component
function Button({ children, onClick, className = "", variant = "primary" }) {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = sessionStorage.getItem("currentCid") || "demo";
    async function load() {
      const endpoints = [
        { key: "stats", url: `/api/dashboard/stats/${cid}` },
        { key: "jobs", url: `/api/dashboard/initial-search/${cid}` },
        { key: "resumes", url: `/api/dashboard/resumes/${cid}` },
        { key: "applications", url: `/api/dashboard/applications/${cid}` },
        { key: "activities", url: `/api/dashboard/activities/${cid}` },
      ];
      
      for (let e of endpoints) {
        try {
          const resp = await fetch(e.url);
          if (resp.ok) {
            const json = await resp.json();
            if (e.key === "jobs") setJobs(json.results || []);
            else if (e.key === "stats") setStats(json);
            else if (e.key === "resumes") setResumes(json);
            else if (e.key === "applications") setApplications(json);
            else if (e.key === "activities") setActivities(json);
          }
        } catch (err) {
          console.error(`Failed to fetch ${e.key}`, err);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleGenerateBoolean = async () => {
    const cid = sessionStorage.getItem("currentCid") || "demo";
    try {
      const response = await fetch(`/api/dashboard/boolean-generator/${cid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: ["Python", "Java", "React", "Node.js"],
          jobTitles: ["Software Engineer", "Developer", "Full Stack"],
          locations: ["Remote", "Hybrid", "San Francisco"],
          industries: ["Technology", "Software", "Fintech"]
        })
      });
      const result = await response.json();
      console.log("Boolean search generated:", result.booleanString);
      alert(`Boolean Search Generated:\n${result.booleanString}`);
    } catch (error) {
      console.error("Failed to generate boolean search:", error);
    }
  };

  const handleExecuteSearch = async () => {
    const cid = sessionStorage.getItem("currentCid") || "demo";
    try {
      const response = await fetch(`/api/dashboard/execute-search/${cid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booleanString: '("software engineer" OR "developer") AND ("Python" OR "Java") AND ("remote" OR "hybrid")'
        })
      });
      const result = await response.json();
      console.log("Search executed:", result);
      alert(`Search executed! Found ${result.totalFound} new jobs.`);
    } catch (error) {
      console.error("Failed to execute search:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-600 mt-2">Here's your job search activity and progress</p>
        </div>

        {/* Overview Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Jobs Searched</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.jobsSearched || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resumes || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.applications || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.agents || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Boolean Search Tools */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Tools</h2>
          <Card>
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleGenerateBoolean}>
                Generate Boolean Search
              </Button>
              <Button onClick={handleExecuteSearch} variant="secondary">
                Execute Job Search
              </Button>
              <Button variant="success">
                Create New Agent
              </Button>
            </div>
          </Card>
        </section>

        {/* Matched Jobs */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Matched Jobs</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map(job => (
              <Card key={job.id}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {job.matchScore}% match
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{job.company} — {job.location}</p>
                <p className="text-sm text-gray-500 mb-3">{job.salary}</p>
                <p className="text-sm text-gray-700 mb-4">{job.snippet}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.keywords?.map((keyword, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Posted {job.postedDate}</span>
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Job →
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Applications */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submitted Applications</h2>
          <div className="space-y-4">
            {applications.map(app => (
              <Card key={app.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.title}</h3>
                    <p className="text-gray-600">{app.company}</p>
                    <p className="text-sm text-gray-500 mt-1">Submitted {app.date}</p>
                    <p className="text-sm text-gray-500">Resume: {app.resumeUsed}</p>
                    {app.notes && <p className="text-sm text-gray-600 mt-2">{app.notes}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'Interview Scheduled' ? 'bg-green-100 text-green-800' :
                    app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Resumes */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customized Resumes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map(resume => (
              <Card key={resume.id}>
                <h3 className="font-semibold text-gray-900 mb-2">{resume.job}</h3>
                <p className="text-sm text-gray-600 mb-3">Created {resume.date}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resume.keywords?.map((keyword, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    resume.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {resume.status}
                  </span>
                  {resume.downloadUrl && (
                    <Button variant="secondary" className="text-xs">
                      Download
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Analytics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Applications Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.history || []}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activities.slice(0, 5).map(activity => (
                  <div key={activity.id} className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      activity.type === 'application' ? 'bg-green-500' :
                      activity.type === 'resume' ? 'bg-blue-500' :
                      activity.type === 'search' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
