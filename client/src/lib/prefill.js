// client/src/lib/prefill.js
export function getStep3Prefill() {
  const raw = JSON.parse(localStorage.getItem('resumeData') || 'null');
  const bag = raw?.prefill?.step3 || raw?.data?.prefill?.step3 || {};
  
  console.log('🔍 PREFILL DEBUG:', {
    hasRaw: !!raw,
    rawKeys: raw ? Object.keys(raw) : [],
    bag: bag,
    bagKeys: Object.keys(bag),
    linkedin_variants: {
      linkedin: bag.linkedin,
      linkedIn: bag.linkedIn, 
      linkedinUrl: bag.linkedinUrl
    }
  });
  
  const linkedIn =
    bag.linkedin || bag.linkedIn || bag.linkedinUrl || '';
  const currentJobTitle =
    bag.currentJobTitle || bag.currentTitle || '';
    
  console.log('🔍 EXTRACTED VALUES:', { linkedIn, currentJobTitle });
  
  return { ...bag, linkedIn, currentJobTitle };
}