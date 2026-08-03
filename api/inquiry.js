// =========================================================
// POST /api/inquiry  — public inquiry form submission
// =========================================================
const { kvGet, kvSet } = require('./_lib/kv');

const VALID_COURSES = ['Class 5–10', 'Class 11–12', 'JEE', 'NEET', 'CET', 'NDA', 'Merchant Navy'];

// Simple in-memory rate limiter (resets per cold-start, good enough for serverless)
const ipHits = {};
const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS  = 20;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipHits[ip] || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) { ipHits[ip] = { count: 1, start: now }; return false; }
  entry.count++;
  ipHits[ip] = entry;
  return entry.count > MAX_HITS;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function validate(body) {
  const errors = [];
  const studentName = (body.studentName || '').toString().trim();
  const parentName  = (body.parentName  || '').toString().trim();
  const mobile      = (body.mobile      || '').toString().trim();
  const email       = (body.email       || '').toString().trim();
  const course      = (body.course      || '').toString().trim();
  const message     = (body.message     || '').toString().trim();

  if (studentName.length < 2 || studentName.length > 100) errors.push('Please enter a valid student name.');
  if (parentName.length  < 2 || parentName.length  > 100) errors.push('Please enter a valid parent name.');
  if (!/^\d{10}$/.test(mobile))                           errors.push('Please enter a valid 10-digit mobile number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
  if (!VALID_COURSES.includes(course))                     errors.push('Please select a valid class or course.');
  if (message.length > 1000)                               errors.push('Message is too long.');

  return { errors, clean: { studentName, parentName, mobile, email, course, message } };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ success: false, message: 'Too many submissions. Please try again later.' });
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try { body = JSON.parse(await rawBody(req)); } catch { body = {}; }
  }

  const { errors, clean } = validate(body);
  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });

  const inquiries = (await kvGet('inquiries')) || [];
  const record = {
    id: genId(),
    ...clean,
    status: 'new',
    submittedAt: new Date().toISOString(),
    ip,
  };
  inquiries.push(record);
  await kvSet('inquiries', inquiries);

  console.log(`[inquiry] ${record.studentName} (${record.course}) — ${record.mobile}`);
  return res.status(201).json({ success: true, message: 'Inquiry received.' });
};
