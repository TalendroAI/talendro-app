import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onb2() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const jumped = useRef(false);

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

      // Persist for Steps 3–6
      localStorage.setItem('resumeData', JSON.stringify(payload));
      localStorage.setItem('resumeParsed', 'true');

      console.log('✅ Resume data saved, navigating to step-1...');

      // Jump immediately to Step 1 (Basic Registration) after resume upload
      jumped.current = true;
      try { 
        navigate('/app/onboarding/step-1', { replace: true }); 
        console.log('🎯 Navigation successful');
      }
      catch (e) { 
        console.log('⚠️ Navigation failed, using window.location:', e);
        window.location.replace('/app/onboarding/step-1'); 
      }

      // Safety: if Router fails silently, hard jump
      setTimeout(() => {
        if (location.pathname !== '/app/onboarding/step-1') {
          console.log('🔄 Safety navigation triggered');
          window.location.assign('/app/onboarding/step-1');
        }
      }, 100);
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
          <button type="submit" className="btn btn-primary" disabled={!file || busy}>
            {busy ? 'Parsing…' : 'Create Profile'}
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </form>
    </section>
  );
}