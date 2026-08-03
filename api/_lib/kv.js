// =========================================================
// Redis helper — wraps @upstash/redis with seed-data fallback.
//
// Environment variables required (set in Vercel dashboard):
//   UPSTASH_REDIS_REST_URL   — Redis REST endpoint URL
//   UPSTASH_REDIS_REST_TOKEN — Redis REST auth token
//
// If those vars are absent (local dev without Redis), the
// module falls back to the bundled JSON seed data so the
// site is fully functional right after first deploy.
// =========================================================

const SEED = {
  programs:     require('../_seed/programs.json'),
  stats:        require('../_seed/stats.json'),
  contact:      require('../_seed/contact.json'),
  toppers:      require('../_seed/toppers.json'),
  testimonials: require('../_seed/testimonials.json'),
  notices:      require('../_seed/notices.json'),
  faculty:      require('../_seed/faculty.json'),
  gallery:      require('../_seed/gallery.json'),
  inquiries:    require('../_seed/inquiries.json'),
};

let redis = null;

function getRedis() {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
  } catch (err) {
    console.error('[redis] init failed:', err.message);
    return null;
  }
}

async function kvGet(key) {
  const r = getRedis();
  if (!r) return SEED[key] ?? null;
  try {
    const val = await r.get(key);
    // Auto-seed on first access if key is empty
    if (val === null && SEED[key] !== undefined) {
      await r.set(key, JSON.stringify(SEED[key]));
      return SEED[key];
    }
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch (err) {
    console.error(`[redis] get(${key}) failed:`, err.message);
    return SEED[key] ?? null;
  }
}

async function kvSet(key, value) {
  const r = getRedis();
  if (!r) return; // no-op in fallback mode
  await r.set(key, JSON.stringify(value));
}

module.exports = { kvGet, kvSet };
