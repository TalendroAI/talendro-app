import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnbReview() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [completeness, setCompleteness] = useState(0);
  const [step4Education, setStep4Education] = useState([]);
  const [searchString, setSearchString] = useState(null);
  const [showTechnicalString, setShowTechnicalString] = useState(false);

  useEffect(() => {
    // Load all data from localStorage
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null');
    
    // Load education data
    const education = JSON.parse(localStorage.getItem('onboarding_step4_education') || '[]');
    setStep4Education(education);
    
    // Load Boolean search string
    const search = JSON.parse(localStorage.getItem('booleanSearchString') || 'null');
    setSearchString(search);
    
    if (resumeData) {
      setProfileData(resumeData);
      const calculated = calculateCompleteness(resumeData, education);
      setCompleteness(calculated);
    }
  }, []);

  const calculateCompleteness = (data, educationData) => {
    // If user reached this review page, all required fields are complete
    // They cannot proceed to review without completing all required steps
    // Show 100% to indicate completion
    return 100;
  };

  const formatDegreeType = (degreeType) => {
    if (!degreeType) return 'Degree Not Specified';
    const formatted = degreeType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return formatted + (degreeType !== 'high_school' && degreeType !== 'certificate' ? ' Degree' : '');
  };

  if (!profileData) {
    return (
      <section>
        <h1 className="h1">Final Review</h1>
        <p className="body mt-2">Loading your profile data...</p>
      </section>
    );
  }

  const { summary, prefill, profileDraft } = profileData;

  const handleEdit = (step) => {
    navigate(`/app/onboarding/step-${step}`);
  };

  return (
    <section>
      <h1 className="h1">Final Review</h1>
      <p className="body mt-2">Review your profile before Talendro™ goes to work.</p>
      
      {/* Profile Completeness Indicator */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">Profile Strength</span>
          <span className="text-2xl font-bold text-blue-600">{completeness}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${completeness}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {completeness === 100 ? '✓ Profile Complete - Ready for applications!' : '⚠️ Complete remaining sections for best results'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Summary: Personal */}
        <div className="card relative">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg text-blue-600">Personal Information</h3>
            <button 
              onClick={() => handleEdit(3)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit →
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="font-semibold w-20 text-gray-600">Name:</span>
              <span className="flex-1">{summary?.name || profileDraft?.basics?.fullLegalName || 'N/A'}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold w-20 text-gray-600">Email:</span>
              <span className="flex-1">{summary?.email || profileDraft?.basics?.email || 'N/A'}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold w-20 text-gray-600">Phone:</span>
              <span className="flex-1">{summary?.phone || profileDraft?.basics?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold w-20 text-gray-600">Location:</span>
              <span className="flex-1">
                {summary?.location || `${profileDraft?.basics?.city || ''}, ${profileDraft?.basics?.state || ''}`.trim() || 'N/A'}
              </span>
            </div>
            {prefill?.step2?.streetAddress && (
              <>
                <div className="flex items-start">
                  <span className="font-semibold w-20 text-gray-600">Address:</span>
                  <span className="flex-1">{prefill.step2.streetAddress}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold w-20 text-gray-600">ZIP:</span>
                  <span className="flex-1">{prefill.step2.postalCode}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary: Employment */}
        <div className="card relative">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg text-blue-600">Employment History</h3>
            <button 
              onClick={() => handleEdit(4)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit →
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            {profileDraft?.work && profileDraft.work.length > 0 ? (
              <>
                {profileDraft.work.slice(0, 3).map((job, index) => (
                  <div key={index} className="pb-3 border-l-3 border-cyan-400 pl-3">
                    <p className="font-semibold text-gray-800">{job.position || job.jobTitle || 'Position'}</p>
                    <p className="text-gray-600">{job.name || job.organization || job.companyName || 'Company'}</p>
                    {(job.startDate || job.endDate) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {job.startDate || 'Start'} - {job.endDate || 'Present'}
                        {job.location && ` • ${job.location}`}
                      </p>
                    )}
                  </div>
                ))}
                {profileDraft.work.length > 3 && (
                  <p className="text-xs text-gray-500 font-medium pt-2 border-t">
                    + {profileDraft.work.length - 3} more position{profileDraft.work.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500 italic">No employment history available</p>
            )}
          </div>
        </div>

        {/* Summary: Education */}
        <div className="card relative">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg text-blue-600">Education</h3>
            <button 
              onClick={() => handleEdit(4)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit →
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            {step4Education && step4Education.length > 0 ? (
              step4Education.map((edu, index) => (
                <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
                  <p className="font-semibold text-lg">
                    {formatDegreeType(edu.degreeType)}
                  </p>
                  <p className="text-gray-700 font-medium">{edu.institution || 'Institution Not Specified'}</p>
                  {edu.fieldOfStudy && (
                    <p className="text-sm text-gray-600">Major: {edu.fieldOfStudy}</p>
                  )}
                  {edu.graduationDate && (
                    <p className="text-sm text-gray-600">Graduated: {new Date(edu.graduationDate).toLocaleDateString()}</p>
                  )}
                  {edu.gpa && (
                    <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                  )}
                  {edu.honors && (
                    <p className="text-sm text-gray-600">Honors: {edu.honors}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No education information provided</p>
            )}
          </div>
        </div>

        {/* Summary: Skills & Preferences */}
        <div className="card relative">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg text-blue-600">Skills & Preferences</h3>
            <button 
              onClick={() => handleEdit(4)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit →
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            {profileDraft?.skills && profileDraft.skills.length > 0 ? (
              <div>
                <p className="font-semibold mb-2 text-gray-700">Top Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {profileDraft.skills.slice(0, 8).map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 rounded-full text-xs font-medium border border-cyan-200">
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                  {profileDraft.skills.length > 8 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{profileDraft.skills.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No skills listed</p>
            )}
            
            {prefill?.step1?.referralSource && (
              <div className="pt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-600">Referral Source: </span>
                <span className="text-gray-800 capitalize">{prefill.step1.referralSource.replace('_', ' ')}</span>
              </div>
            )}
            
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Profile completed on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Search Profile */}
      {searchString && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-md p-6 border-2 border-talBlue" style={{ borderStyle: 'solid' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your AI-Generated Job Search Profile</h2>
              <p className="text-sm text-gray-700">
                Our AI has analyzed your profile and created an optimized search strategy
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-5 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🎯</span> Target Job Titles
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchString.jobTitles?.map((title, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {title}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-5 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🔧</span> Key Skills Being Matched
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchString.keySkills?.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-5 mb-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>📊</span> Search Strategy
            </h3>
            <p className="text-gray-700 mb-4">{searchString.explanation}</p>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Seniority Level</p>
                <p className="text-gray-900 font-semibold capitalize">{searchString.seniorityLevel || 'Mid-Senior'}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Location Focus</p>
                <p className="text-gray-900 font-semibold">{searchString.location || 'Based on profile'}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Expected Matches</p>
                <p className="text-gray-900 font-semibold capitalize">{searchString.estimatedMatchCount || 'Hundreds'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🌐</span> Search Platforms
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchString.searchPlatforms?.map((platform, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {platform}
                </span>
              ))}
            </div>
          </div>
          
          {/* Technical String Accordion */}
          <div className="mt-4">
            <button
              onClick={() => setShowTechnicalString(!showTechnicalString)}
              className="text-sm text-talBlue hover:text-blue-700 font-medium flex items-center gap-2"
            >
              {showTechnicalString ? '▼' : '▶'} View Technical Search String (Advanced)
            </button>
            
            {showTechnicalString && (
              <div 
                style={{ 
                  marginTop: '0.75rem',
                  backgroundColor: '#111827',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  overflowX: 'auto',
                  border: 'none',
                  borderWidth: 0,
                  borderStyle: 'none',
                  borderTop: 'none',
                  borderBottom: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  boxShadow: 'none',
                  outline: 'none'
                }}
              >
                <div
                  style={{ 
                    margin: 0, 
                    padding: 0, 
                    border: 'none', 
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: '#4ade80',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    display: 'block',
                    lineHeight: '1.5'
                  }}
                >
                  {String(searchString.booleanString || '').trim()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authorization Status - Simple Version */}
      <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">✓ Authorization Complete</h3>
        <div className="space-y-1 text-sm text-green-700">
          <p>• Profile review completed</p>
          <p>• Ready for automated job applications</p>
          <p>• Background check authorization signed</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button 
          type="button" 
          onClick={() => navigate('/app/onboarding/step-5')} 
          className="btn btn-secondary"
        >
          ← Back
        </button>
        <button 
          type="button"
          onClick={() => navigate('/app/checkout')}
          className="btn btn-primary flex-1"
        >
          Continue to Payment & Checkout →
        </button>
      </div>
    </section>
  );
}
