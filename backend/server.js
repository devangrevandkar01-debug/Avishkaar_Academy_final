// =========================================================
// AVISHKAAR ACADEMY — backend API
// Serves the inquiry form endpoint, stores leads to local
// JSON files, serves static frontend & dynamic APIs.
// =========================================================
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me-admin-token';
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'inquiries.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// ---------- ensure data dir and files exist ----------
fs.mkdirSync(DATA_DIR, { recursive: true });

function ensureFile(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
  }
}

ensureFile(DATA_FILE, []);
ensureFile(path.join(DATA_DIR, 'toppers.json'), []);
ensureFile(path.join(DATA_DIR, 'testimonials.json'), []);
ensureFile(path.join(DATA_DIR, 'programs.json'), []);
ensureFile(path.join(DATA_DIR, 'stats.json'), { students: 1200, successRate: 96, years: 8, tracks: 6 });
ensureFile(path.join(DATA_DIR, 'notices.json'), []);
ensureFile(path.join(DATA_DIR, 'faculty.json'), []);
ensureFile(path.join(DATA_DIR, 'gallery.json'), []);
ensureFile(path.join(DATA_DIR, 'contact.json'), {
  address: "Road No. 5, Near Chhatrapati Shivaji Maharaj Maidan, Parksite, Vikhroli (W), Mumbai – 400079",
  phoneMain: "9702928223",
  phoneDetails: "Suraj Sir — 9702928223\nRane Sir — 7021390635\nDnyaneshwar Sir — 8291766491",
  email: "admissions@avishkaaracademy.com",
  hours: "Monday – Saturday, 9:00 AM – 8:00 PM",
  whatsappNumber: "917021390635",
  mapUrl: "https://www.google.com/maps?q=Parksite%2C%20Vikhroli%20West%2C%20Mumbai%20400079&output=embed"
});

// ---------- generic JSON file helpers ----------
function readJSON(filename) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(raw || 'null');
  } catch (err) {
    console.error(`Failed to read ${filename}:`, err);
    return null;
  }
}

function writeJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- backward compat ----------
function readInquiries() { return readJSON('inquiries.json') || []; }
function writeInquiries(list) { writeJSON('inquiries.json', list); }

// ---------- middleware ----------
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// ---------- auth middleware ----------
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  next();
}

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

// ---------- validation helpers ----------
const VALID_COURSES = ['Class 5–10', 'Class 11–12', 'JEE', 'NEET', 'CET', 'NDA', 'Merchant Navy'];

function validateInquiry(body) {
  const errors = [];
  const studentName = (body.studentName || '').toString().trim();
  const parentName = (body.parentName || '').toString().trim();
  const mobile = (body.mobile || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const course = (body.course || '').toString().trim();
  const message = (body.message || '').toString().trim();

  if (studentName.length < 2 || studentName.length > 100) errors.push('Please enter a valid student name.');
  if (parentName.length < 2 || parentName.length > 100) errors.push('Please enter a valid parent name.');
  if (!/^\d{10}$/.test(mobile)) errors.push('Please enter a valid 10-digit mobile number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
  if (!VALID_COURSES.includes(course)) errors.push('Please select a valid class or course.');
  if (message.length > 1000) errors.push('Message is too long.');

  return {
    errors,
    clean: { studentName, parentName, mobile, email, course, message },
  };
}

// ==========================================================
// ==================== PUBLIC ROUTES =======================
// ==========================================================

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// --- Inquiry form submission ---
app.post('/api/inquiry', inquiryLimiter, (req, res) => {
  const { errors, clean } = validateInquiry(req.body || {});

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  const inquiries = readInquiries();
  const record = {
    id: genId(),
    ...clean,
    status: 'new',
    submittedAt: new Date().toISOString(),
    ip: req.ip,
  };
  inquiries.push(record);
  writeInquiries(inquiries);

  console.log(`[inquiry] ${record.studentName} (${record.course}) — ${record.mobile}`);
  res.status(201).json({ success: true, message: 'Inquiry received.' });
});

// --- Public content endpoints ---
app.get('/api/data/toppers', (req, res) => {
  const toppers = readJSON('toppers.json') || [];
  res.json({ success: true, toppers });
});

app.get('/api/data/testimonials', (req, res) => {
  const testimonials = readJSON('testimonials.json') || [];
  res.json({ success: true, testimonials });
});

app.get('/api/data/programs', (req, res) => {
  const programs = readJSON('programs.json') || [];
  res.json({ success: true, programs });
});

app.get('/api/data/stats', (req, res) => {
  const stats = readJSON('stats.json') || { students: 1200, successRate: 96, years: 8, tracks: 6 };
  res.json({ success: true, stats });
});

app.get('/api/data/notices', (req, res) => {
  const notices = (readJSON('notices.json') || []).filter(n => n.active);
  res.json({ success: true, notices });
});

app.get('/api/data/faculty', (req, res) => {
  const faculty = readJSON('faculty.json') || [];
  res.json({ success: true, faculty });
});

app.get('/api/data/gallery', (req, res) => {
  const gallery = readJSON('gallery.json') || [];
  res.json({ success: true, gallery });
});

app.get('/api/data/contact', (req, res) => {
  const contact = readJSON('contact.json') || {};
  res.json({ success: true, contact });
});

// ==========================================================
// ==================== ADMIN ROUTES ========================
// ==========================================================

// --- Inquiries ---
app.get('/api/inquiries', requireAdmin, (req, res) => {
  const inquiries = readInquiries().sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );
  res.json({ success: true, count: inquiries.length, inquiries });
});

app.patch('/api/inquiries/:id', requireAdmin, (req, res) => {
  const inquiries = readInquiries();
  const idx = inquiries.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
  const allowed = ['status', 'notes'];
  allowed.forEach(k => { if (req.body[k] !== undefined) inquiries[idx][k] = req.body[k]; });
  inquiries[idx].updatedAt = new Date().toISOString();
  writeInquiries(inquiries);
  res.json({ success: true, inquiry: inquiries[idx] });
});

app.delete('/api/inquiries/:id', requireAdmin, (req, res) => {
  let inquiries = readInquiries();
  const before = inquiries.length;
  inquiries = inquiries.filter(i => i.id !== req.params.id);
  if (inquiries.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
  writeInquiries(inquiries);
  res.json({ success: true });
});

// --- Toppers ---
app.post('/api/data/toppers', requireAdmin, (req, res) => {
  const toppers = readJSON('toppers.json') || [];
  const { name, rank, score, scoreUnit, subject, quote, image, featured } = req.body;
  if (!name || !score) return res.status(400).json({ success: false, message: 'name and score required.' });
  const entry = {
    id: genId(),
    name: name.trim(),
    rank: (rank || '').trim(),
    score: (score || '').toString().trim(),
    scoreUnit: (scoreUnit || '%').trim(),
    subject: (subject || '').trim(),
    quote: (quote || '').trim(),
    image: (image || '').trim(),
    featured: Boolean(featured),
    createdAt: new Date().toISOString(),
  };
  toppers.push(entry);
  writeJSON('toppers.json', toppers);
  res.status(201).json({ success: true, topper: entry });
});

app.put('/api/data/toppers/:id', requireAdmin, (req, res) => {
  const toppers = readJSON('toppers.json') || [];
  const idx = toppers.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
  const fields = ['name', 'rank', 'score', 'scoreUnit', 'subject', 'quote', 'image', 'featured'];
  fields.forEach(k => { if (req.body[k] !== undefined) toppers[idx][k] = req.body[k]; });
  toppers[idx].updatedAt = new Date().toISOString();
  writeJSON('toppers.json', toppers);
  res.json({ success: true, topper: toppers[idx] });
});

app.delete('/api/data/toppers/:id', requireAdmin, (req, res) => {
  let toppers = readJSON('toppers.json') || [];
  const before = toppers.length;
  toppers = toppers.filter(t => t.id !== req.params.id);
  if (toppers.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
  writeJSON('toppers.json', toppers);
  res.json({ success: true });
});

// --- Testimonials ---
app.post('/api/data/testimonials', requireAdmin, (req, res) => {
  const testimonials = readJSON('testimonials.json') || [];
  const { author, text, stars } = req.body;
  if (!author || !text) return res.status(400).json({ success: false, message: 'author and text required.' });
  const entry = {
    id: genId(),
    author: author.trim(),
    text: text.trim(),
    stars: Math.min(5, Math.max(1, parseInt(stars) || 5)),
    createdAt: new Date().toISOString(),
  };
  testimonials.push(entry);
  writeJSON('testimonials.json', testimonials);
  res.status(201).json({ success: true, testimonial: entry });
});

app.delete('/api/data/testimonials/:id', requireAdmin, (req, res) => {
  let testimonials = readJSON('testimonials.json') || [];
  const before = testimonials.length;
  testimonials = testimonials.filter(t => t.id !== req.params.id);
  if (testimonials.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
  writeJSON('testimonials.json', testimonials);
  res.json({ success: true });
});

// --- Programs ---
app.put('/api/data/programs/:id', requireAdmin, (req, res) => {
  const programs = readJSON('programs.json') || [];
  const idx = programs.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
  const fields = ['title', 'description', 'features', 'duration', 'icon', 'iconGold', 'defence'];
  fields.forEach(k => { if (req.body[k] !== undefined) programs[idx][k] = req.body[k]; });
  programs[idx].updatedAt = new Date().toISOString();
  writeJSON('programs.json', programs);
  res.json({ success: true, program: programs[idx] });
});

// --- Stats ---
app.put('/api/data/stats', requireAdmin, (req, res) => {
  const current = readJSON('stats.json') || {};
  const fields = ['students', 'successRate', 'years', 'tracks'];
  fields.forEach(k => { if (req.body[k] !== undefined) current[k] = parseInt(req.body[k]) || current[k]; });
  writeJSON('stats.json', current);
  res.json({ success: true, stats: current });
});

// --- Faculty ---
app.post('/api/data/faculty', requireAdmin, (req, res) => {
  const faculty = readJSON('faculty.json') || [];
  const { name, role, meta, avatar, image } = req.body;
  if (!name || !role) return res.status(400).json({ success: false, message: 'name and role required.' });
  const entry = {
    id: genId(),
    name: name.trim(),
    role: role.trim(),
    meta: (meta || '').trim(),
    avatar: (avatar || '').trim(),
    image: (image || '').trim(),
    createdAt: new Date().toISOString(),
  };
  faculty.push(entry);
  writeJSON('faculty.json', faculty);
  res.status(201).json({ success: true, faculty: entry });
});

app.put('/api/data/faculty/:id', requireAdmin, (req, res) => {
  const faculty = readJSON('faculty.json') || [];
  const idx = faculty.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
  const fields = ['name', 'role', 'meta', 'avatar', 'image'];
  fields.forEach(k => { if (req.body[k] !== undefined) faculty[idx][k] = req.body[k]; });
  writeJSON('faculty.json', faculty);
  res.json({ success: true, faculty: faculty[idx] });
});

app.delete('/api/data/faculty/:id', requireAdmin, (req, res) => {
  let faculty = readJSON('faculty.json') || [];
  const before = faculty.length;
  faculty = faculty.filter(f => f.id !== req.params.id);
  if (faculty.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
  writeJSON('faculty.json', faculty);
  res.json({ success: true });
});

// --- Gallery ---
app.post('/api/data/gallery', requireAdmin, (req, res) => {
  const gallery = readJSON('gallery.json') || [];
  const { image, alt, tall } = req.body;
  if (!image) return res.status(400).json({ success: false, message: 'image path/url required.' });
  const entry = {
    id: genId(),
    image: image.trim(),
    alt: (alt || 'Gallery photo').trim(),
    tall: Boolean(tall),
    createdAt: new Date().toISOString(),
  };
  gallery.push(entry);
  writeJSON('gallery.json', gallery);
  res.status(201).json({ success: true, item: entry });
});

app.delete('/api/data/gallery/:id', requireAdmin, (req, res) => {
  let gallery = readJSON('gallery.json') || [];
  const before = gallery.length;
  gallery = gallery.filter(g => g.id !== req.params.id);
  if (gallery.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
  writeJSON('gallery.json', gallery);
  res.json({ success: true });
});

// --- Contact Info ---
app.put('/api/data/contact', requireAdmin, (req, res) => {
  const current = readJSON('contact.json') || {};
  const fields = ['address', 'phoneMain', 'phoneDetails', 'email', 'hours', 'whatsappNumber', 'mapUrl'];
  fields.forEach(k => { if (req.body[k] !== undefined) current[k] = req.body[k].toString().trim(); });
  writeJSON('contact.json', current);
  res.json({ success: true, contact: current });
});

// --- Notices ---
app.get('/api/data/notices/all', requireAdmin, (req, res) => {
  const notices = readJSON('notices.json') || [];
  res.json({ success: true, notices });
});

app.post('/api/data/notices', requireAdmin, (req, res) => {
  const notices = readJSON('notices.json') || [];
  const { text, active } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'text required.' });
  const entry = {
    id: genId(),
    text: text.trim(),
    active: active !== false,
    createdAt: new Date().toISOString(),
  };
  notices.push(entry);
  writeJSON('notices.json', notices);
  res.status(201).json({ success: true, notice: entry });
});

app.patch('/api/data/notices/:id', requireAdmin, (req, res) => {
  const notices = readJSON('notices.json') || [];
  const idx = notices.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found.' });
  if (req.body.text !== undefined) notices[idx].text = req.body.text.trim();
  if (req.body.active !== undefined) notices[idx].active = Boolean(req.body.active);
  writeJSON('notices.json', notices);
  res.json({ success: true, notice: notices[idx] });
});

app.delete('/api/data/notices/:id', requireAdmin, (req, res) => {
  let notices = readJSON('notices.json') || [];
  const before = notices.length;
  notices = notices.filter(n => n.id !== req.params.id);
  if (notices.length === before) return res.status(404).json({ success: false, message: 'Not found.' });
  writeJSON('notices.json', notices);
  res.json({ success: true });
});

// ==========================================================
// ========== serve frontend (single deployable app) ========
// ==========================================================
app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  // For admin sub-routes, serve admin/index.html
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(FRONTEND_DIR, 'admin', 'index.html'));
  }
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ---------- error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Avishkaar Academy server running → http://localhost:${PORT}`);
  console.log(`Admin panel → http://localhost:${PORT}/admin/`);
  console.log(`Admin token → ${ADMIN_TOKEN}`);
});
