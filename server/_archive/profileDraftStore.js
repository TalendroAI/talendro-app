// server/profileDraftStore.js (ES modules)

import { v4 as uuid } from 'uuid';

const _jobs = new Map();         // jobId -> { status, error, userId, fileMeta, createdAt, completedAt }
const _drafts = new Map();       // userId -> profileDraft (canonical JSON for Steps 3–6)

/**
 * ProfileDraft shape (example):
 * {
 *   basics: { name:{value,source,confidence}, email:{...}, phone:{...},
 *             location:{ address, city, region, postalCode, countryCode } },
 *   work: [{ company:{...}, position:{...}, startDate:{...}, endDate:{...}, highlights:[...] }],
 *   education: [{ institution, area, studyType, startDate, endDate, score }],
 *   skills: [{ name, level, keywords:[] }],
 *   meta: { last_update, last_source }
 * }
 */

export const confidence = {
  high: v => Math.min(1, Math.max(0.8, v ?? 0.9)),
  med:  v => Math.min(0.79, Math.max(0.5, v ?? 0.65)),
  low:  v => Math.min(0.49, Math.max(0.1, v ?? 0.3))
};

// Merge policy: only overwrite user-entered values if we're filling blanks
// or the existing confidence is lower than the incoming confidence.
export function mergeField(dst, incoming) {
  if (!incoming) return dst;
  if (!dst || dst.value == null || dst.value === '') return incoming;
  if ((dst.source === 'user') && incoming.source !== 'user') return dst;
  if ((dst.confidence ?? 0) >= (incoming.confidence ?? 0)) return dst;
  return incoming;
}

export function mergeArrays(dstArr = [], incArr = [], mergeItem) {
  if (!incArr.length) return dstArr;
  const result = [...dstArr];
  incArr.forEach((inc, idx) => {
    if (!result[idx]) result[idx] = inc;
    else result[idx] = mergeItem(result[idx], inc);
  });
  return result;
}

export function emptyDraft() {
  return {
    basics: {
      name: null, email: null, phone: null,
      location: { address: null, city: null, region: null, postalCode: null, countryCode: null }
    },
    work: [],
    education: [],
    skills: [],
    meta: { last_update: new Date().toISOString(), last_source: 'init' }
  };
}

export function createJob({ userId, fileMeta }) {
  const jobId = uuid();
  _jobs.set(jobId, { status: 'queued', error: null, userId, fileMeta, createdAt: Date.now() });
  return jobId;
}

export function setJobStatus(jobId, patch) {
  const cur = _jobs.get(jobId);
  if (!cur) return;
  _jobs.set(jobId, { ...cur, ...patch, completedAt: patch.status === 'complete' || patch.status === 'failed' ? Date.now() : cur.completedAt });
}

export function getJob(jobId) { return _jobs.get(jobId); }

export function getDraft(userId) {
  if (!_drafts.has(userId)) _drafts.set(userId, emptyDraft());
  return _drafts.get(userId);
}

export function saveDraft(userId, draft) {
  _drafts.set(userId, { ...draft, meta: { last_update: new Date().toISOString(), last_source: draft.meta?.last_source || 'parser' } });
  return _drafts.get(userId);
}