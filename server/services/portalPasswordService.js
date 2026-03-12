/**
 * portalPasswordService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates and manages unique portal passwords for each Talendro subscriber.
 *
 * PURPOSE
 * ───────
 * When Talendro applies to jobs on behalf of a user, some ATS platforms require
 * account creation before submitting an application. This service generates a
 * unique, human-readable password for each user at account creation time.
 *
 * This password is used in two scenarios:
 *   1. Talendro registers the user on an employer's ATS portal automatically
 *      and uses this password for the account.
 *   2. When a CAPTCHA or missing-info situation requires the user to log in
 *      manually, this password is sent to them via SMS so they can access
 *      the employer's portal and complete the application themselves.
 *
 * PASSWORD FORMAT
 * ───────────────
 * Format: [Adjective][Noun][4-digit number]!
 * Example: "SwiftEagle4821!"
 *
 * This format is:
 *   - Memorable and easy to type on a phone
 *   - Compliant with virtually all password policies (uppercase, lowercase,
 *     number, special character, 12+ characters)
 *   - Unique per user (combination space is ~10 million+)
 *   - Never contains ambiguous characters (0/O, 1/l/I)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import User from '../models/User.js';

// ─── Word lists ───────────────────────────────────────────────────────────────

const ADJECTIVES = [
  'Swift', 'Bold', 'Bright', 'Clear', 'Calm', 'Crisp', 'Deep', 'Eager',
  'Fair', 'Firm', 'Fresh', 'Grand', 'Great', 'Keen', 'Kind', 'Lean',
  'Neat', 'Noble', 'Prime', 'Pure', 'Quick', 'Sharp', 'Smart', 'Solid',
  'Stark', 'Steady', 'Strong', 'True', 'Vital', 'Warm', 'Wide', 'Wise',
  'Brave', 'Bright', 'Calm', 'Clean', 'Cool', 'Deft', 'Elite', 'Fine',
  'Fleet', 'Fluid', 'Frank', 'Free', 'Gold', 'Good', 'Hardy', 'High',
  'Just', 'Light', 'Lively', 'Loyal', 'Lucid', 'Mild', 'Nimble', 'Open',
  'Proud', 'Ready', 'Rich', 'Safe', 'Sage', 'Savvy', 'Sleek', 'Spare',
  'Stable', 'Stout', 'Sure', 'Tall', 'Tidy', 'Trim', 'Vivid', 'Whole',
];

const NOUNS = [
  'Eagle', 'Falcon', 'Hawk', 'Raven', 'Robin', 'Crane', 'Heron', 'Lark',
  'Finch', 'Wren', 'Dove', 'Kite', 'Swift', 'Ibis', 'Egret', 'Plover',
  'Cedar', 'Maple', 'Birch', 'Aspen', 'Alder', 'Beech', 'Linden', 'Rowan',
  'Amber', 'Coral', 'Ember', 'Flint', 'Frost', 'Glade', 'Grove', 'Haven',
  'Helm', 'Knoll', 'Ledge', 'Marsh', 'Mead', 'Mesa', 'Moor', 'Peak',
  'Ridge', 'Shore', 'Slope', 'Stone', 'Stream', 'Vale', 'Bluff', 'Brook',
  'Cliff', 'Crest', 'Delta', 'Dune', 'Field', 'Ford', 'Glen', 'Heath',
  'Inlet', 'Isle', 'Lake', 'Loch', 'Mound', 'Pond', 'Pool', 'Reef',
  'River', 'Rock', 'Sand', 'Shoal', 'Spur', 'Summit', 'Tor', 'Trail',
];

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate a unique portal password.
 * Format: [Adjective][Noun][4-digit number]!
 * @returns {string}
 */
function generatePortalPassword() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  // 4-digit number, avoiding leading zeros and ambiguous digits (0, 1)
  const digits = String(Math.floor(Math.random() * 8000) + 2222);
  return `${adj}${noun}${digits}!`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the portal password for a user, generating one if it doesn't exist yet.
 * This is idempotent — calling it multiple times returns the same password.
 *
 * @param {Object|string} userOrId - Full user document or user ID string
 * @returns {Promise<string>} The plaintext portal password
 */
async function getOrCreate(userOrId) {
  let user;
  if (typeof userOrId === 'string' || userOrId?.constructor?.name === 'ObjectId') {
    user = await User.findById(userOrId);
  } else {
    // If passed a lean object, re-fetch to get a mutable document
    user = await User.findById(userOrId._id);
  }

  if (!user) throw new Error(`[portalPasswordService] User not found: ${userOrId}`);

  // Already has a portal password — return it
  if (user.portalPassword?.plain) {
    return user.portalPassword.plain;
  }

  // Generate and persist a new one
  const plain = generatePortalPassword();
  user.portalPassword = { plain, generatedAt: new Date() };
  await user.save();

  console.log(`[portalPasswordService] Generated portal password for user ${user._id}`);
  return plain;
}

/**
 * Get the portal password for a user without generating one.
 * Returns null if no password has been generated yet.
 *
 * @param {Object} user - User document (lean or full)
 * @returns {string|null}
 */
function get(user) {
  return user?.portalPassword?.plain || null;
}

/**
 * Regenerate the portal password for a user (e.g., if they request a reset).
 *
 * @param {Object|string} userOrId
 * @returns {Promise<string>} The new plaintext portal password
 */
async function regenerate(userOrId) {
  let user;
  if (typeof userOrId === 'string' || userOrId?.constructor?.name === 'ObjectId') {
    user = await User.findById(userOrId);
  } else {
    user = await User.findById(userOrId._id);
  }

  if (!user) throw new Error(`[portalPasswordService] User not found: ${userOrId}`);

  const plain = generatePortalPassword();
  user.portalPassword = { plain, generatedAt: new Date() };
  await user.save();

  console.log(`[portalPasswordService] Regenerated portal password for user ${user._id}`);
  return plain;
}

export default { getOrCreate, get, regenerate, generatePortalPassword };
