// =========================================================
// /api/data/[resource] — public read endpoints
// /api/data/[resource] — admin write endpoints (POST/PUT/PATCH/DELETE)
// Handled by a single dynamic route file.
// =========================================================
const { kvGet, kvSet } = require('../_lib/kv');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me-admin-token';

function requireAdmin(req) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token === ADMIN_TOKEN;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ---- Route handlers ----

async function handleToppers(req, res) {
  if (req.method === 'GET') {
    const toppers = (await kvGet('toppers')) || [];
    return res.json({ success: true, toppers });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const body = req.body || {};
  const id   = req.query.id;

  if (req.method === 'POST') {
    const { name, rank, score, scoreUnit, subject, quote, image, featured } = body;
    if (!name || !score) return res.status(400).json({ success: false, message: 'name and score required.' });
    const toppers = (await kvGet('toppers')) || [];
    const entry = { id: genId(), name: name.trim(), rank: (rank||'').trim(), score: score.toString().trim(),
      scoreUnit: (scoreUnit||'%').trim(), subject: (subject||'').trim(), quote: (quote||'').trim(),
      image: (image||'').trim(), featured: Boolean(featured), createdAt: new Date().toISOString() };
    toppers.push(entry);
    await kvSet('toppers', toppers);
    return res.status(201).json({ success: true, topper: entry });
  }
  if (req.method === 'PUT' && id) {
    const toppers = (await kvGet('toppers')) || [];
    const idx = toppers.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
    ['name','rank','score','scoreUnit','subject','quote','image','featured'].forEach(k => {
      if (body[k] !== undefined) toppers[idx][k] = body[k];
    });
    toppers[idx].updatedAt = new Date().toISOString();
    await kvSet('toppers', toppers);
    return res.json({ success: true, topper: toppers[idx] });
  }
  if (req.method === 'DELETE' && id) {
    let toppers = (await kvGet('toppers')) || [];
    const before = toppers.length;
    toppers = toppers.filter(t => t.id !== id);
    if (toppers.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
    await kvSet('toppers', toppers);
    return res.json({ success: true });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

async function handleTestimonials(req, res) {
  if (req.method === 'GET') {
    const testimonials = (await kvGet('testimonials')) || [];
    return res.json({ success: true, testimonials });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const body = req.body || {};
  const id   = req.query.id;

  if (req.method === 'POST') {
    const { author, text, stars } = body;
    if (!author || !text) return res.status(400).json({ success: false, message: 'author and text required.' });
    const testimonials = (await kvGet('testimonials')) || [];
    const entry = { id: genId(), author: author.trim(), text: text.trim(),
      stars: Math.min(5, Math.max(1, parseInt(stars) || 5)), createdAt: new Date().toISOString() };
    testimonials.push(entry);
    await kvSet('testimonials', testimonials);
    return res.status(201).json({ success: true, testimonial: entry });
  }
  if (req.method === 'DELETE' && id) {
    let testimonials = (await kvGet('testimonials')) || [];
    const before = testimonials.length;
    testimonials = testimonials.filter(t => t.id !== id);
    if (testimonials.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
    await kvSet('testimonials', testimonials);
    return res.json({ success: true });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

async function handlePrograms(req, res) {
  if (req.method === 'GET') {
    const programs = (await kvGet('programs')) || [];
    return res.json({ success: true, programs });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const body = req.body || {};
  const id   = req.query.id;

  if (req.method === 'PUT' && id) {
    const programs = (await kvGet('programs')) || [];
    const idx = programs.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
    ['title','description','features','duration','icon','iconGold','defence'].forEach(k => {
      if (body[k] !== undefined) programs[idx][k] = body[k];
    });
    programs[idx].updatedAt = new Date().toISOString();
    await kvSet('programs', programs);
    return res.json({ success: true, program: programs[idx] });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

async function handleStats(req, res) {
  if (req.method === 'GET') {
    const stats = (await kvGet('stats')) || { students: 1200, successRate: 96, years: 8, tracks: 6 };
    return res.json({ success: true, stats });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  if (req.method === 'PUT') {
    const current = (await kvGet('stats')) || {};
    const body = req.body || {};
    ['students','successRate','years','tracks'].forEach(k => {
      if (body[k] !== undefined) current[k] = parseInt(body[k]) || current[k];
    });
    await kvSet('stats', current);
    return res.json({ success: true, stats: current });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

async function handleNotices(req, res) {
  // Special: GET /api/data/notices/all  (admin) vs GET /api/data/notices (public)
  const wantAll = req.query.all === '1';
  if (req.method === 'GET') {
    const notices = (await kvGet('notices')) || [];
    if (wantAll) {
      if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
      return res.json({ success: true, notices });
    }
    return res.json({ success: true, notices: notices.filter(n => n.active) });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const body = req.body || {};
  const id   = req.query.id;

  if (req.method === 'POST') {
    const { text, active } = body;
    if (!text) return res.status(400).json({ success: false, message: 'text required.' });
    const notices = (await kvGet('notices')) || [];
    const entry = { id: genId(), text: text.trim(), active: active !== false, createdAt: new Date().toISOString() };
    notices.push(entry);
    await kvSet('notices', notices);
    return res.status(201).json({ success: true, notice: entry });
  }
  if (req.method === 'PATCH' && id) {
    const notices = (await kvGet('notices')) || [];
    const idx = notices.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
    if (body.text   !== undefined) notices[idx].text   = body.text.trim();
    if (body.active !== undefined) notices[idx].active = Boolean(body.active);
    await kvSet('notices', notices);
    return res.json({ success: true, notice: notices[idx] });
  }
  if (req.method === 'DELETE' && id) {
    let notices = (await kvGet('notices')) || [];
    const before = notices.length;
    notices = notices.filter(n => n.id !== id);
    if (notices.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
    await kvSet('notices', notices);
    return res.json({ success: true });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

async function handleFaculty(req, res) {
  if (req.method === 'GET') {
    const faculty = (await kvGet('faculty')) || [];
    return res.json({ success: true, faculty });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const body = req.body || {};
  const id   = req.query.id;

  if (req.method === 'POST') {
    const { name, role, meta, avatar, image } = body;
    if (!name || !role) return res.status(400).json({ success: false, message: 'name and role required.' });
    const faculty = (await kvGet('faculty')) || [];
    const entry = { id: genId(), name: name.trim(), role: role.trim(), meta: (meta||'').trim(),
      avatar: (avatar||'').trim(), image: (image||'').trim(), createdAt: new Date().toISOString() };
    faculty.push(entry);
    await kvSet('faculty', faculty);
    return res.status(201).json({ success: true, faculty: entry });
  }
  if (req.method === 'PUT' && id) {
    const faculty = (await kvGet('faculty')) || [];
    const idx = faculty.findIndex(f => f.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
    ['name','role','meta','avatar','image'].forEach(k => {
      if (body[k] !== undefined) faculty[idx][k] = body[k];
    });
    faculty[idx].updatedAt = new Date().toISOString();
    await kvSet('faculty', faculty);
    return res.json({ success: true, faculty: faculty[idx] });
  }
  if (req.method === 'DELETE' && id) {
    let faculty = (await kvGet('faculty')) || [];
    const before = faculty.length;
    faculty = faculty.filter(f => f.id !== id);
    if (faculty.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
    await kvSet('faculty', faculty);
    return res.json({ success: true });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

async function handleGallery(req, res) {
  if (req.method === 'GET') {
    const gallery = (await kvGet('gallery')) || [];
    return res.json({ success: true, gallery });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const body = req.body || {};
  const id   = req.query.id;

  if (req.method === 'POST') {
    const { image, alt, tall } = body;
    if (!image) return res.status(400).json({ success: false, message: 'image path/url required.' });
    const gallery = (await kvGet('gallery')) || [];
    const entry = { id: genId(), image: image.trim(), alt: (alt||'Gallery photo').trim(),
      tall: Boolean(tall), createdAt: new Date().toISOString() };
    gallery.push(entry);
    await kvSet('gallery', gallery);
    return res.status(201).json({ success: true, item: entry });
  }
  if (req.method === 'DELETE' && id) {
    let gallery = (await kvGet('gallery')) || [];
    const before = gallery.length;
    gallery = gallery.filter(g => g.id !== id);
    if (gallery.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
    await kvSet('gallery', gallery);
    return res.json({ success: true });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

async function handleContact(req, res) {
  if (req.method === 'GET') {
    const contact = (await kvGet('contact')) || {};
    return res.json({ success: true, contact });
  }
  if (!requireAdmin(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  if (req.method === 'PUT') {
    const current = (await kvGet('contact')) || {};
    const body = req.body || {};
    ['address','phoneMain','phoneDetails','email','hours','whatsappNumber','mapUrl'].forEach(k => {
      if (body[k] !== undefined) current[k] = body[k].toString().trim();
    });
    await kvSet('contact', current);
    return res.json({ success: true, contact: current });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}

// ---- Router ----

const HANDLERS = {
  toppers:      handleToppers,
  testimonials: handleTestimonials,
  programs:     handlePrograms,
  stats:        handleStats,
  notices:      handleNotices,
  faculty:      handleFaculty,
  gallery:      handleGallery,
  contact:      handleContact,
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // resource = last path segment, e.g. "toppers" from /api/data/toppers
  const parts    = req.url.split('?')[0].split('/').filter(Boolean);
  const resource = parts[parts.length - 1];

  const handler = HANDLERS[resource];
  if (!handler) return res.status(404).json({ success: false, message: `Unknown resource: ${resource}` });

  try {
    await handler(req, res);
  } catch (err) {
    console.error(`[api/data] error for ${resource}:`, err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
