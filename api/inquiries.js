// =========================================================
// /api/inquiries — admin: list / update / delete inquiries
// =========================================================
const { kvGet, kvSet } = require('./_lib/kv');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me-admin-token';

function requireAdmin(req) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token === ADMIN_TOKEN;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const id = req.query.id;

  try {
    if (req.method === 'GET') {
      const inquiries = ((await kvGet('inquiries')) || [])
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return res.json({ success: true, count: inquiries.length, inquiries });
    }

    if (req.method === 'PATCH' && id) {
      const inquiries = (await kvGet('inquiries')) || [];
      const idx = inquiries.findIndex(i => i.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
      const body = req.body || {};
      ['status', 'notes'].forEach(k => { if (body[k] !== undefined) inquiries[idx][k] = body[k]; });
      inquiries[idx].updatedAt = new Date().toISOString();
      await kvSet('inquiries', inquiries);
      return res.json({ success: true, inquiry: inquiries[idx] });
    }

    if (req.method === 'DELETE' && id) {
      let inquiries = (await kvGet('inquiries')) || [];
      const before = inquiries.length;
      inquiries = inquiries.filter(i => i.id !== id);
      if (inquiries.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
      await kvSet('inquiries', inquiries);
      return res.json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  } catch (err) {
    console.error('[api/inquiries] error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
