import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

function Button({ children, onClick, className = "", variant = "primary" }) {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700"
  };
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const colors = {
    trialing: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    past_due: "bg-yellow-100 text-yellow-800",
    canceled: "bg-red-100 text-red-800",
    canceling: "bg-orange-100 text-orange-800"
  };
  const labels = {
    trialing: "Trial Active",
    active: "Active",
    past_due: "Payment Due",
    canceled: "Canceled",
    canceling: "Canceling"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function Dashboard() {
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState({});
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const customerId = sessionStorage.getItem("customerId");
    const cid = sessionStorage.getItem("currentCid") || "demo";

    async function load() {
      // Fetch real subscription data from Stripe if we have a customerId
      if (customerId) {
        try {
          const res = await fetch(`/api/stripe/subscription/${customerId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) setSubscription(data.subscription);
          }
        } catch (err) {
          console.error("Failed to fetch subscription", err);
        }
      } else {
        // Fallback: use sessionStorage data set during sign-in
        const status = sessionStorage.getItem("subscriptionStatus");
        const plan = sessionStorage.getItem("plan");
        if (status && plan) {
          setSubscription({ status, plan, planName: plan });
        }
      }

      // Load dashboard mock data
      const endpoints = [
        { key: "stats", url: `/api/dashboard/stats/${cid}` },
        { key: "jobs", url: `/api/dashboard/initial-search/${cid}` },
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

  const planDisplayName = subscription?.planName
    ? subscription.planName.charAt(0).toUpperCase() + subscription.planName.slice(1)
    : subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Starter';

  const trialEndDate = subscription?.trialEnd
    ? new Date(subscription.trialEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="h1">Welcome Back!</h1>
            <p className="body mt-1">Here's your job search activity and progress</p>
          </div>
          {subscription && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">{planDisplayName} Plan</p>
                {trialEndDate && subscription.status === 'trialing' && (
                  <p className="text-xs text-gray-500">Trial ends {trialEndDate}</p>
                )}
              </div>
              <StatusBadge status={subscription.status} />
            </div>
          )}
        </div>

        {/* Subscription Alert for Trial */}
        {subscription?.status === 'trialing' && trialEndDate && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <strong>7-day money-back guarantee active.</strong> Your subscription began on {trialEndDate}. No action needed — you're all set.
            </p>
            <a href="/app/billing" className="text-blue-700 text-sm font-medium hover:underline ml-4 whitespace-nowrap">
              Manage billing →
            </a>
          </div>
        )}

        {/* Subscription Alert for Past Due */}
        {subscription?.status === 'past_due' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-4 flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              <strong>Payment issue detected.</strong> Please update your payment method to keep your subscription active.
            </p>
            <a href="/app/billing" className="text-yellow-700 text-sm font-medium hover:underline ml-4 whitespace-nowrap">
              Update payment →
            </a>
          </div>
        )}

        {/* Overview Stats */}
        <section className="mb-8">
          <h2 className="h2 mb-4">Overview</h2>
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
                  <p className="h2">{stats.jobsSearched || 0}</p>
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
                  <p className="h2">{stats.resumes || 0}</p>
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
                  <p className="h2">{stats.applications || 0}</p>
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
                  <p className="h2">{stats.agents || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Matched Jobs */}
        {jobs.length > 0 && (
          <section className="mb-8">
            <h2 className="h2 mb-4">Matched Jobs</h2>
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
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{keyword}</span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Posted {job.postedDate}</span>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Job →
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Applications */}
        {applications.length > 0 && (
          <section className="mb-8">
            <h2 className="h2 mb-4">Submitted Applications</h2>
            <div className="space-y-4">
              {applications.map(app => (
                <Card key={app.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{app.title}</h3>
                      <p className="text-gray-600">{app.company}</p>
                      <p className="text-sm text-gray-500 mt-1">Submitted {app.date}</p>
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
        )}

        {/* Analytics */}
        {(stats.history?.length > 0 || activities.length > 0) && (
          <section className="mb-8">
            <h2 className="h2 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stats.history?.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">Applications Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.history}>
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="applications" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
              {activities.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {activities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                          activity.type === 'application' ? 'bg-green-500' :
                          activity.type === 'resume' ? 'bg-blue-500' :
                          activity.type === 'search' ? 'bg-purple-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Empty state for new users */}
        {jobs.length === 0 && applications.length === 0 && (
          <section className="mb-8">
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your agents are warming up</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Talendro is analyzing your profile and searching for matching opportunities. 
                Check back soon — your first matches will appear here.
              </p>
              {!sessionStorage.getItem('onboardingComplete') && (
                <a href="/app/onboarding/welcome">
                  <button className="btn btn-primary">Complete Your Profile →</button>
                </a>
              )}
            </Card>
          </section>
        )}

      </div>
    </div>
  );
}
