import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onb2() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const jumped = useRef(false);

  const handleCreateProfileClick = () => {
    if (!file) {
      setShowWarning(true);
      return;
    }
    parseAndGo();
  };

  const parseAndGo = useCallback(async () => {
    console.log('🔥 parseAndGo called!', { file: !!file, jumped: jumped.current });
    if (!file || jumped.current) {
      console.log('⚠️ parseAndGo early return:', { hasFile: !!file, alreadyJumped: jumped.current });
      return;
    }
    try {
      setBusy(true); setError('');
      console.log('🚀 Starting resume parsing...', { fileName: file.name, fileSize: file.size });

      const fd = new FormData();
      fd.append('file', file, file.name);

      const resp = await fetch('/api/resume/parse', { method: 'POST', body: fd });
      console.log('📡 Parse response status:', resp.status);
      
      if (!resp.ok) {
        const t = await resp.text().catch(()=>'');
        throw new Error(`Parse failed: ${resp.status} ${t}`);
      }
      const result = await resp.json();
      console.log('📄 Parse result:', result);

      // Accept either { success:true, data:{...} } or the flat shape we used earlier
      const successLike = result?.success === true || result?.status === 'complete';
      if (!successLike) throw new Error('Parser did not report success/complete');

      const payload = result?.data?.prefill
        ? result.data
        : {
            jobId: result.jobId ?? result.data?.jobId,
            status: result.status ?? result.data?.status,
            prefill: result.prefill ?? result.data?.prefill ?? {},
            profileDraft: result.profileDraft ?? result.data?.profileDraft ?? {},
            confidence: result.confidence ?? result.data?.confidence ?? {}
          };

      console.log('💾 Saving payload to localStorage:', payload);

      // FORCE CLEAR bad education data before storing
      if (payload?.prefill?.step3) {
        payload.prefill.step3.majorFieldOfStudy = ''
        payload.prefill.step3.highestDegree = ''
        payload.prefill.step3.gpa = ''
        payload.prefill.step3.institutionName = ''
        payload.prefill.step3.institutionAddress = ''
        payload.prefill.step3.institutionCity = ''
        payload.prefill.step3.institutionState = ''
        payload.prefill.step3.attendanceStartDate = ''
        payload.prefill.step3.graduationDate = ''
        payload.prefill.step3.country = 'US'
        console.log('🔍 Onb2 - FORCED CLEAR of bad education data')
      }
      
      // NUCLEAR OPTION: Clear ALL localStorage first
      localStorage.clear()
      console.log('🔍 Onb2 - NUCLEAR OPTION: Cleared ALL localStorage')

      // Persist for Steps 3–6
      localStorage.setItem('resumeData', JSON.stringify(payload));
      localStorage.setItem('resumeParsed', 'true');

      console.log('✅ Resume data saved, navigating to step-1...');

      // Add a small delay to ensure the user can see the Create Profile page
      setTimeout(() => {
        // Jump to Step 1 (Basic Registration) after resume upload
        jumped.current = true;
        try { 
          navigate('/app/onboarding/step-2', { replace: true }); 
          console.log('🎯 Navigation successful');
        }
        catch (e) { 
          console.log('⚠️ Navigation failed, using window.location:', e);
          window.location.replace('/app/onboarding/step-2'); 
        }

        // Safety: if Router fails silently, hard jump
        setTimeout(() => {
          if (location.pathname !== '/app/onboarding/step-2') {
            console.log('🔄 Safety navigation triggered');
            window.location.assign('/app/onboarding/step-2');
          }
        }, 100);
      }, 500); // 500ms delay to ensure user sees the Create Profile page
    } catch (e) {
      console.error('❌ Parse error:', e);
      setError('We had trouble parsing your résumé. You can continue manually—Talendro will backfill as parsing completes.');
    } finally {
      setBusy(false);
    }
  }, [file, navigate]);

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/welcome" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Welcome
        </a>
      </div>
      <h1 className="h1">Upload Résumé</h1>
      <p className="body mt-2">We'll parse your résumé to pre-fill your profile.</p>

      <form className="card mt-6 max-w-xl" onSubmit={(e)=>{ 
        console.log('📝 Form submitted!'); 
        e.preventDefault(); 
        parseAndGo(); 
      }}>
        <input type="file" accept=".pdf,.docx" onChange={e => {
          const selectedFile = e.target.files?.[0] || null;
          console.log('📁 File selected:', selectedFile?.name, selectedFile?.size);
          setFile(selectedFile);
        }} />
        <div className="mt-4 flex gap-3">
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleCreateProfileClick}
            disabled={busy}
          >
            {busy ? 'Parsing…' : 'Create Profile'}
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </form>
      
      {/* Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Complete Required Information</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm" style={{color: '#dc2626'}}>
                You must complete all required fields before proceeding to the next step. Please fill out the missing information and try again.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="btn btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}