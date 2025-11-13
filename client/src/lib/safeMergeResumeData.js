// Safe merge helper - never erase truthy values with "", null, or undefined
export function safeMergeResumeData(incoming) {
  const key = 'resumeData';
  const existing = JSON.parse(localStorage.getItem(key) || 'null') || {};
  // Deep-ish merge but never erase truthy values with "", null, or undefined
  const merged = structuredClone(existing);

  function merge(dst, src) {
    Object.entries(src || {}).forEach(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        dst[k] = dst[k] && typeof dst[k] === 'object' ? dst[k] : {};
        merge(dst[k], v);
      } else {
        const keep = dst[k];
        const incomingEmpty = v === '' || v == null;
        dst[k] = incomingEmpty ? keep ?? v : v;
      }
    });
  }
  merge(merged, incoming);
  localStorage.setItem(key, JSON.stringify(merged));
}