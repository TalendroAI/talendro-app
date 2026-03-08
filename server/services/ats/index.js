/**
 * ats/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ATS Adapter Registry.
 * Routes each job to the correct ATS-specific adapter based on the atsType
 * field stored on the Job document.
 *
 * Supported ATS types (expand as new adapters are built):
 *   - 'greenhouse'
 *   - 'lever'
 *   - 'workday'     (TODO: Task 1.3 — future)
 *   - 'icims'       (TODO: Task 1.3 — future)
 *   - 'ashby'       (TODO: Task 1.3 — future)
 *   - 'generic'     (fallback — generic form filler)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import greenhouseAdapter from './greenhouseAdapter.js';
import leverAdapter from './leverAdapter.js';
import genericAdapter from './genericAdapter.js';

const ADAPTERS = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  generic: genericAdapter,
};

/**
 * Returns the correct ATS adapter for the given type.
 * Falls back to the generic adapter if the type is unknown.
 * @param {string} atsType
 * @returns {Object} adapter with an apply() method
 */
export function getAdapterForAts(atsType) {
  const adapter = ADAPTERS[atsType?.toLowerCase()];
  if (!adapter) {
    console.warn(`[ats/index] Unknown ATS type "${atsType}" — falling back to generic adapter.`);
    return genericAdapter;
  }
  return adapter;
}

export default { getAdapterForAts };
