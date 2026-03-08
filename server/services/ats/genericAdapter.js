/**
 * ats/genericAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generic ATS Adapter — Fallback for unknown or unsupported ATS platforms.
 *
 * This adapter uses a best-effort approach to fill in application forms by
 * targeting common field name patterns that appear across most ATS platforms.
 * It will not be as reliable as a purpose-built adapter but will handle a
 * significant percentage of simple application forms.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 1.4 — Playwright Implementation):
 *
 *   Implement using common field selectors that appear across most ATS forms:
 *
 *   Common first name selectors:
 *     input[name*="first"], input[id*="first"], input[placeholder*="First"]
 *
 *   Common last name selectors:
 *     input[name*="last"], input[id*="last"], input[placeholder*="Last"]
 *
 *   Common email selectors:
 *     input[type="email"], input[name*="email"], input[id*="email"]
 *
 *   Common phone selectors:
 *     input[type="tel"], input[name*="phone"], input[id*="phone"]
 *
 *   Common resume upload selectors:
 *     input[type="file"], input[accept*=".pdf"], input[accept*=".doc"]
 *
 *   Common submit selectors:
 *     button[type="submit"], input[type="submit"], button:has-text("Submit")
 *
 *   Strategy: Try each selector pattern in order, fill if found, skip if not.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Apply to a job posting using generic form-filling heuristics.
 * @param {Object} params
 * @param {Object} params.user           - Full user document from MongoDB
 * @param {Object} params.jobDoc         - Full job document from MongoDB
 * @param {string} params.applyUrl       - Direct URL to the application form
 * @param {string} params.tailoredResume - AI-tailored resume text for this job
 * @param {string} params.coverLetter    - AI-generated cover letter for this job
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function apply({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[genericAdapter] Attempting generic apply to: ${applyUrl}`);

  // ── TODO (Task 1.4): Replace this stub with Playwright implementation ─────
  // See the detailed instructions in the file header above.
  console.warn('[genericAdapter] STUB — Generic Playwright automation not yet implemented.');
  return {
    success: false,
    error: 'Generic adapter not yet implemented. See TODO in genericAdapter.js.',
  };
}

export default { apply };
