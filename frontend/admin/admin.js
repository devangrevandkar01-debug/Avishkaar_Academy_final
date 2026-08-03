// ==========================================================
// AVISHKAAR ACADEMY — Admin Panel JavaScript
// ==========================================================

// ---- Config ----
const API_BASE = window.location.origin;
let ADMIN_TOKEN = sessionStorage.getItem('avishkaar_admin_token') || '';

// ---- State ----
let allInquiries = [];
let allToppers = [];
let allFaculty = [];
let allGallery = [];
let allTestimonials = [];
let allPrograms = [];
let allNotices = [];
let contactData = {};

// ==========================================================
// AUTH
// ==========================================================
const loginScreen = document.getElementById('loginScreen');
const appShell = document.getElementById('appShell');

async function tryLogin() {
  const tokenInput = document.getElementById('adminToken');
  const errorEl = document.getElementById('loginError');
  const token = tokenInput.value.trim();
  if (!token) { errorEl.textContent = 'Please enter your admin token.'; return; }

  errorEl.textContent = '';
  document.getElementById('loginBtn').textContent = 'Verifying…';

  try {
    const res = await fetch(`${API_BASE}/api/inquiries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      errorEl.textContent = '❌ Invalid token. Please try again.';
      document.getElementById('loginBtn').textContent = 'Sign In →';
      return;
    }
    ADMIN_TOKEN = token;
    sessionStorage.setItem('avishkaar_admin_token', token);
    document.getElementById('loginBtn').textContent = 'Sign In →';
    showApp();
  } catch (e) {
    errorEl.textContent = '⚠️ Cannot reach server. Is the backend running?';
    document.getElementById('loginBtn').textContent = 'Sign In →';
  }
}

function showApp() {
  loginScreen.style.display = 'none';
  appShell.classList.add('is-active');
  document.getElementById('serverUrl').textContent = API_BASE;
  const masked = ADMIN_TOKEN.slice(0, 4) + '•'.repeat(Math.max(0, ADMIN_TOKEN.length - 4));
  document.getElementById('maskedToken').textContent = masked;
  loadDashboard();
}

function logout() {
  sessionStorage.removeItem('avishkaar_admin_token');
  ADMIN_TOKEN = '';
  appShell.classList.remove('is-active');
  loginScreen.style.display = 'flex';
}

if (ADMIN_TOKEN) {
  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inquiries`, { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
      if (res.ok) { showApp(); return; }
    } catch (_) {}
    ADMIN_TOKEN = '';
    sessionStorage.removeItem('avishkaar_admin_token');
  })();
}

document.getElementById('loginBtn').addEventListener('click', tryLogin);
document.getElementById('adminToken').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
document.getElementById('logoutBtn').addEventListener('click', logout);

// ==========================================================
// NAVIGATION
// ==========================================================
const pageMap = {
  dashboard:    { title: 'Dashboard',         sub: 'Overview & quick actions',    load: loadDashboard },
  inquiries:    { title: 'Inquiries',          sub: 'Manage form submissions',     load: loadInquiries },
  toppers:      { title: 'Toppers',            sub: 'Wall of Fame entries',        load: loadToppers },
  faculty:      { title: 'Faculty',            sub: 'Manage teaching team',        load: loadFacultyAdmin },
  testimonials: { title: 'Testimonials',       sub: 'Student & parent reviews',    load: loadTestimonials },
  programs:     { title: 'Programs',           sub: 'Edit course information',     load: loadPrograms },
  gallery:      { title: 'Gallery',            sub: 'Manage academy photos',       load: loadGalleryAdmin },
  notices:      { title: 'Notices',            sub: 'Marquee announcements',       load: loadNotices },
  contact:      { title: 'Contact Info',       sub: 'Address, phones & details',   load: loadContactAdmin },
  stats:        { title: 'Hero Stats',         sub: 'Homepage counter numbers',    load: loadStats },
  settings:     { title: 'Settings',           sub: 'Session & configuration',     load: null },
};

function navigate(pageId) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('is-active', el.dataset.page === pageId);
  });
  document.querySelectorAll('.page').forEach(el => {
    el.classList.toggle('is-active', el.id === `page-${pageId}`);
  });
  const p = pageMap[pageId];
  if (p) {
    document.getElementById('topbarTitle').textContent = p.title;
    document.getElementById('topbarSub').textContent = p.sub;
    if (p.load) p.load();
  }
  document.getElementById('sidebar').classList.remove('is-open');
}

document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.page));
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('is-open');
});

// ==========================================================
// API HELPERS
// ==========================================================
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ==========================================================
// TOAST NOTIFICATIONS
// ==========================================================
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${escape(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ==========================================================
// MODAL HELPERS
// ==========================================================
function openModal(id) {
  document.getElementById(id).classList.add('is-open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('is-open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('is-open');
  });
});

// ==========================================================
// UTILS
// ==========================================================
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) + ' ' +
         d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}
function initials(name) {
  return (name || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}
function starsHtml(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}
function statusBadge(status) {
  const map = { new: 'badge--new', contacted: 'badge--contacted', followup: 'badge--followup' };
  return `<span class="badge ${map[status] || 'badge--new'}">${status || 'new'}</span>`;
}
function escape(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ==========================================================
// DASHBOARD
// ==========================================================
async function loadDashboard() {
  try {
    const [iqRes, tpRes, tmRes] = await Promise.all([
      apiFetch('/api/inquiries'),
      apiFetch('/api/data/toppers'),
      apiFetch('/api/data/testimonials'),
    ]);
    allInquiries = iqRes.inquiries || [];
    allToppers   = tpRes.toppers   || [];
    allTestimonials = tmRes.testimonials || [];

    const newLeads = allInquiries.filter(i => i.status === 'new' || !i.status).length;
    document.getElementById('dash-totalInquiries').textContent = allInquiries.length;
    document.getElementById('dash-newLeads').textContent = newLeads;
    document.getElementById('dash-toppers').textContent = allToppers.length;
    document.getElementById('dash-testimonials').textContent = allTestimonials.length;

    const badge = document.getElementById('newInquiriesBadge');
    if (newLeads > 0) {
      badge.textContent = newLeads;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }

    const recent = allInquiries.slice(0, 5);
    const tbody = document.getElementById('recentInquiriesTable');
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px">No inquiries yet</td></tr>`;
    } else {
      tbody.innerHTML = recent.map(i => `
        <tr>
          <td class="td-primary">${escape(i.studentName)}</td>
          <td><span class="badge badge--new" style="background:var(--blue-dim);color:var(--blue)">${escape(i.course)}</span></td>
          <td class="td-mono">${escape(i.mobile)}</td>
          <td>${statusBadge(i.status)}</td>
          <td class="td-mono" style="font-size:.75rem">${fmtDate(i.submittedAt)}</td>
        </tr>`).join('');
    }
  } catch (e) {
    toast('Failed to load dashboard: ' + e.message, 'error');
  }
}

// ==========================================================
// INQUIRIES
// ==========================================================
async function loadInquiries() {
  try {
    const data = await apiFetch('/api/inquiries');
    allInquiries = data.inquiries || [];
    renderInquiries();
  } catch (e) {
    toast('Failed to load inquiries: ' + e.message, 'error');
  }
}

function renderInquiries() {
  const search = (document.getElementById('inquirySearch').value || '').toLowerCase();
  const statusF = document.getElementById('inquiryStatusFilter').value;
  const courseF = document.getElementById('inquiryCourseFilter').value;

  let filtered = allInquiries.filter(i => {
    const matchSearch = !search ||
      i.studentName.toLowerCase().includes(search) ||
      i.parentName.toLowerCase().includes(search) ||
      i.mobile.includes(search);
    const matchStatus = !statusF || (i.status || 'new') === statusF;
    const matchCourse = !courseF || i.course === courseF;
    return matchSearch && matchStatus && matchCourse;
  });

  const tbody = document.getElementById('inquiriesTable');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">No inquiries match your filters</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(i => `
    <tr>
      <td class="td-primary">${escape(i.studentName)}</td>
      <td>${escape(i.parentName)}</td>
      <td class="td-mono">${escape(i.mobile)}</td>
      <td style="font-size:.82rem">${escape(i.email) || '—'}</td>
      <td><span class="badge badge--new" style="background:var(--blue-dim);color:var(--blue)">${escape(i.course)}</span></td>
      <td>
        <select class="filter-select" style="padding:5px 8px;font-size:.78rem;"
          onchange="updateInquiryStatus('${i.id}', this.value)">
          <option value="new"      ${(i.status||'new')==='new'      ? 'selected' : ''}>New</option>
          <option value="contacted" ${i.status==='contacted' ? 'selected' : ''}>Contacted</option>
          <option value="followup"  ${i.status==='followup'  ? 'selected' : ''}>Follow-up</option>
        </select>
      </td>
      <td class="td-mono" style="font-size:.75rem">${fmtDateTime(i.submittedAt)}</td>
      <td class="td-actions">
        <button class="btn-icon" title="View Details" onclick="viewInquiry('${i.id}')">👁</button>
        <button class="btn-icon btn-icon--danger" title="Delete" onclick="deleteInquiry('${i.id}')">🗑</button>
      </td>
    </tr>`).join('');
}

document.getElementById('inquirySearch').addEventListener('input', renderInquiries);
document.getElementById('inquiryStatusFilter').addEventListener('change', renderInquiries);
document.getElementById('inquiryCourseFilter').addEventListener('change', renderInquiries);

async function updateInquiryStatus(id, status) {
  try {
    await apiFetch(`/api/inquiries/${id}`, { method: 'PATCH', body: { status } });
    const idx = allInquiries.findIndex(i => i.id === id);
    if (idx !== -1) allInquiries[idx].status = status;
    toast('Status updated', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

function viewInquiry(id) {
  const i = allInquiries.find(q => q.id === id);
  if (!i) return;
  document.getElementById('inquiryModalBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="field-row">
        <div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Student Name</div>
             <div style="font-weight:700;color:var(--text-primary)">${escape(i.studentName)}</div></div>
        <div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Parent Name</div>
             <div style="font-weight:600;color:var(--text-primary)">${escape(i.parentName)}</div></div>
      </div>
      <div class="field-row">
        <div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Mobile</div>
             <div class="td-mono">${escape(i.mobile)}</div></div>
        <div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Email</div>
             <div class="td-mono">${escape(i.email) || '—'}</div></div>
      </div>
      <div class="field-row">
        <div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Course</div>
             <div><span class="badge badge--new" style="background:var(--blue-dim);color:var(--blue)">${escape(i.course)}</span></div></div>
        <div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Status</div>
             <div>${statusBadge(i.status)}</div></div>
      </div>
      ${i.message ? `<div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Message</div>
        <div style="color:var(--text-secondary);font-size:.9rem;line-height:1.5;background:rgba(255,255,255,.04);padding:12px;border-radius:8px">${escape(i.message)}</div></div>` : ''}
      <div><div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Submitted</div>
           <div class="td-mono" style="font-size:.82rem">${new Date(i.submittedAt).toLocaleString('en-IN')}</div></div>
    </div>`;
  openModal('inquiryModal');
}

async function deleteInquiry(id) {
  if (!confirm('Delete this inquiry permanently?')) return;
  try {
    await apiFetch(`/api/inquiries/${id}`, { method: 'DELETE' });
    allInquiries = allInquiries.filter(i => i.id !== id);
    renderInquiries();
    toast('Inquiry deleted', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

function exportInquiriesCSV() {
  if (allInquiries.length === 0) { toast('No inquiries to export', 'info'); return; }
  const headers = ['Student Name', 'Parent Name', 'Mobile', 'Email', 'Course', 'Status', 'Message', 'Submitted At'];
  const rows = allInquiries.map(i => [
    i.studentName, i.parentName, i.mobile, i.email,
    i.course, i.status || 'new', i.message, i.submittedAt
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `avishkaar-inquiries-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast('CSV exported!', 'success');
}

// ==========================================================
// TOPPERS
// ==========================================================
async function loadToppers() {
  try {
    const data = await apiFetch('/api/data/toppers');
    allToppers = data.toppers || [];
    renderToppers();
  } catch (e) {
    toast('Failed to load toppers: ' + e.message, 'error');
  }
}

function renderToppers() {
  const grid = document.getElementById('toppersGrid');
  if (allToppers.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon">🏆</div>
      <h4>No toppers yet</h4>
      <p>Click "Add Topper" to add the first Wall of Fame entry.</p>
    </div>`;
    return;
  }
  grid.innerHTML = allToppers.map(t => `
    <div class="data-card">
      <div class="data-card__header">
        <div style="display:flex;align-items:center;gap:12px">
          ${t.image ? `<img src="../${escape(t.image)}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:1.5px solid var(--border-gold)">` : `<div class="data-card__avatar">${initials(t.name)}</div>`}
          <div>
            <div class="data-card__name">${escape(t.name)}</div>
            <div class="data-card__sub">${escape(t.rank)}</div>
          </div>
        </div>
        <div class="data-card__actions">
          ${t.featured ? '<span class="badge badge--featured">Featured</span>' : ''}
          <button class="btn-icon" onclick="editTopper('${t.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-icon--danger" onclick="deleteTopper('${t.id}')" title="Delete">🗑</button>
        </div>
      </div>
      <div class="data-card__score">${escape(t.score)}<span style="font-size:1rem;color:var(--text-muted)">${escape(t.scoreUnit)}</span></div>
      <div class="data-card__body">${escape(t.subject)}</div>
      ${t.quote ? `<div class="data-card__quote">${escape(t.quote)}</div>` : ''}
    </div>`).join('');
}

function openAddTopperModal() {
  document.getElementById('topperModalTitle').textContent = 'Add Topper';
  document.getElementById('topperEditId').value = '';
  document.getElementById('topper-name').value = '';
  document.getElementById('topper-rank').value = '';
  document.getElementById('topper-score').value = '';
  document.getElementById('topper-scoreUnit').value = '%';
  document.getElementById('topper-image').value = '';
  document.getElementById('topper-subject').value = '';
  document.getElementById('topper-quote').value = '';
  document.getElementById('topper-featured').checked = false;
  openModal('topperModal');
}

function editTopper(id) {
  const t = allToppers.find(x => x.id === id);
  if (!t) return;
  document.getElementById('topperModalTitle').textContent = 'Edit Topper';
  document.getElementById('topperEditId').value = t.id;
  document.getElementById('topper-name').value = t.name;
  document.getElementById('topper-rank').value = t.rank;
  document.getElementById('topper-score').value = t.score;
  document.getElementById('topper-scoreUnit').value = t.scoreUnit;
  document.getElementById('topper-image').value = t.image || '';
  document.getElementById('topper-subject').value = t.subject;
  document.getElementById('topper-quote').value = t.quote;
  document.getElementById('topper-featured').checked = t.featured;
  openModal('topperModal');
}

async function saveTopper() {
  const editId = document.getElementById('topperEditId').value;
  const body = {
    name: document.getElementById('topper-name').value.trim(),
    rank: document.getElementById('topper-rank').value.trim(),
    score: document.getElementById('topper-score').value.trim(),
    scoreUnit: document.getElementById('topper-scoreUnit').value.trim(),
    image: document.getElementById('topper-image').value.trim(),
    subject: document.getElementById('topper-subject').value.trim(),
    quote: document.getElementById('topper-quote').value.trim(),
    featured: document.getElementById('topper-featured').checked,
  };
  if (!body.name || !body.score) { toast('Name and score are required', 'error'); return; }
  try {
    if (editId) {
      await apiFetch(`/api/data/toppers/${editId}`, { method: 'PUT', body });
      toast('Topper updated!', 'success');
    } else {
      await apiFetch('/api/data/toppers', { method: 'POST', body });
      toast('Topper added!', 'success');
    }
    closeModal('topperModal');
    loadToppers();
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function deleteTopper(id) {
  if (!confirm('Remove this topper from the Wall of Fame?')) return;
  try {
    await apiFetch(`/api/data/toppers/${id}`, { method: 'DELETE' });
    allToppers = allToppers.filter(t => t.id !== id);
    renderToppers();
    toast('Topper removed', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ==========================================================
// FACULTY ADMIN
// ==========================================================
async function loadFacultyAdmin() {
  try {
    const data = await apiFetch('/api/data/faculty');
    allFaculty = data.faculty || [];
    renderFacultyAdmin();
  } catch (e) {
    toast('Failed to load faculty: ' + e.message, 'error');
  }
}

function renderFacultyAdmin() {
  const grid = document.getElementById('facultyGridAdmin');
  if (allFaculty.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon">👨‍🏫</div>
      <h4>No faculty members</h4>
      <p>Click "Add Faculty" to add team members.</p>
    </div>`;
    return;
  }
  grid.innerHTML = allFaculty.map(f => `
    <div class="data-card">
      <div class="data-card__header">
        <div style="display:flex;align-items:center;gap:12px">
          ${f.image ? `<img src="../${escape(f.image)}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:1.5px solid var(--border-gold)">` : `<div class="data-card__avatar">${escape(f.avatar || initials(f.name))}</div>`}
          <div>
            <div class="data-card__name">${escape(f.name)}</div>
            <div class="data-card__sub">${escape(f.role)}</div>
          </div>
        </div>
        <div class="data-card__actions">
          <button class="btn-icon" onclick="editFaculty('${f.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-icon--danger" onclick="deleteFaculty('${f.id}')" title="Delete">🗑</button>
        </div>
      </div>
      <div class="data-card__body">${escape(f.meta)}</div>
    </div>`).join('');
}

function openAddFacultyModal() {
  document.getElementById('facultyModalTitle').textContent = 'Add Faculty Member';
  document.getElementById('facultyEditId').value = '';
  document.getElementById('fac-name').value = '';
  document.getElementById('fac-avatar').value = '';
  document.getElementById('fac-role').value = '';
  document.getElementById('fac-meta').value = '';
  document.getElementById('fac-image').value = '';
  openModal('facultyModal');
}

function editFaculty(id) {
  const f = allFaculty.find(x => x.id === id);
  if (!f) return;
  document.getElementById('facultyModalTitle').textContent = 'Edit Faculty Member';
  document.getElementById('facultyEditId').value = f.id;
  document.getElementById('fac-name').value = f.name;
  document.getElementById('fac-avatar').value = f.avatar || '';
  document.getElementById('fac-role').value = f.role;
  document.getElementById('fac-meta').value = f.meta || '';
  document.getElementById('fac-image').value = f.image || '';
  openModal('facultyModal');
}

async function saveFaculty() {
  const editId = document.getElementById('facultyEditId').value;
  const body = {
    name: document.getElementById('fac-name').value.trim(),
    avatar: document.getElementById('fac-avatar').value.trim(),
    role: document.getElementById('fac-role').value.trim(),
    meta: document.getElementById('fac-meta').value.trim(),
    image: document.getElementById('fac-image').value.trim(),
  };
  if (!body.name || !body.role) { toast('Name and Role are required', 'error'); return; }
  try {
    if (editId) {
      await apiFetch(`/api/data/faculty/${editId}`, { method: 'PUT', body });
      toast('Faculty member updated!', 'success');
    } else {
      await apiFetch('/api/data/faculty', { method: 'POST', body });
      toast('Faculty member added!', 'success');
    }
    closeModal('facultyModal');
    loadFacultyAdmin();
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function deleteFaculty(id) {
  if (!confirm('Delete this faculty member?')) return;
  try {
    await apiFetch(`/api/data/faculty/${id}`, { method: 'DELETE' });
    allFaculty = allFaculty.filter(f => f.id !== id);
    renderFacultyAdmin();
    toast('Faculty member removed', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ==========================================================
// GALLERY ADMIN
// ==========================================================
async function loadGalleryAdmin() {
  try {
    const data = await apiFetch('/api/data/gallery');
    allGallery = data.gallery || [];
    renderGalleryAdmin();
  } catch (e) {
    toast('Failed to load gallery: ' + e.message, 'error');
  }
}

function renderGalleryAdmin() {
  const grid = document.getElementById('galleryGridAdmin');
  if (allGallery.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon">🖼️</div>
      <h4>No gallery images</h4>
      <p>Click "Add Gallery Image" to add photos.</p>
    </div>`;
    return;
  }
  grid.innerHTML = allGallery.map(g => `
    <div class="data-card">
      <div class="data-card__header">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="../${escape(g.image)}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;border:1px solid var(--border)">
          <div>
            <div class="data-card__name" style="font-size:.85rem">${escape(g.alt || 'Gallery photo')}</div>
            <div class="data-card__sub">${g.tall ? 'Tall format (3:4)' : 'Standard format'}</div>
          </div>
        </div>
        <div class="data-card__actions">
          <button class="btn-icon btn-icon--danger" onclick="deleteGalleryItem('${g.id}')" title="Delete">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

function openAddGalleryModal() {
  document.getElementById('gal-image').value = '';
  document.getElementById('gal-alt').value = '';
  document.getElementById('gal-tall').checked = false;
  openModal('galleryModal');
}

async function saveGalleryItem() {
  const body = {
    image: document.getElementById('gal-image').value.trim(),
    alt: document.getElementById('gal-alt').value.trim(),
    tall: document.getElementById('gal-tall').checked,
  };
  if (!body.image) { toast('Image path or URL is required', 'error'); return; }
  try {
    await apiFetch('/api/data/gallery', { method: 'POST', body });
    toast('Gallery image added!', 'success');
    closeModal('galleryModal');
    loadGalleryAdmin();
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function deleteGalleryItem(id) {
  if (!confirm('Remove this image from gallery?')) return;
  try {
    await apiFetch(`/api/data/gallery/${id}`, { method: 'DELETE' });
    allGallery = allGallery.filter(g => g.id !== id);
    renderGalleryAdmin();
    toast('Gallery image removed', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ==========================================================
// CONTACT ADMIN
// ==========================================================
async function loadContactAdmin() {
  try {
    const data = await apiFetch('/api/data/contact');
    contactData = data.contact || {};
    document.getElementById('contact-address').value = contactData.address || '';
    document.getElementById('contact-phoneDetails').value = contactData.phoneDetails || '';
    document.getElementById('contact-email').value = contactData.email || '';
    document.getElementById('contact-whatsapp').value = contactData.whatsappNumber || '';
    document.getElementById('contact-hours').value = contactData.hours || '';
    document.getElementById('contact-mapUrl').value = contactData.mapUrl || '';
  } catch (e) {
    toast('Failed to load contact info: ' + e.message, 'error');
  }
}

async function saveContactInfo() {
  const body = {
    address: document.getElementById('contact-address').value.trim(),
    phoneDetails: document.getElementById('contact-phoneDetails').value.trim(),
    email: document.getElementById('contact-email').value.trim(),
    whatsappNumber: document.getElementById('contact-whatsapp').value.trim(),
    hours: document.getElementById('contact-hours').value.trim(),
    mapUrl: document.getElementById('contact-mapUrl').value.trim(),
  };
  try {
    await apiFetch('/api/data/contact', { method: 'PUT', body });
    toast('Contact details saved!', 'success');
  } catch (e) {
    toast('Failed to save contact info: ' + e.message, 'error');
  }
}

// ==========================================================
// TESTIMONIALS
// ==========================================================
async function loadTestimonials() {
  try {
    const data = await apiFetch('/api/data/testimonials');
    allTestimonials = data.testimonials || [];
    renderTestimonials();
  } catch (e) {
    toast('Failed to load testimonials: ' + e.message, 'error');
  }
}

function renderTestimonials() {
  const grid = document.getElementById('testimonialsGrid');
  if (allTestimonials.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon">💬</div>
      <h4>No testimonials yet</h4>
      <p>Add the first student or parent review.</p>
    </div>`;
    return;
  }
  grid.innerHTML = allTestimonials.map(t => `
    <div class="data-card">
      <div class="data-card__header">
        <div class="data-card__avatar">${initials(t.author)}</div>
        <div class="data-card__actions">
          <button class="btn-icon btn-icon--danger" onclick="deleteTestimonial('${t.id}')" title="Delete">🗑</button>
        </div>
      </div>
      <div class="data-card__stars">${starsHtml(t.stars)}</div>
      <div class="data-card__body" style="font-style:italic;">"${escape(t.text)}"</div>
      <div class="data-card__quote" style="font-style:normal;color:var(--gold-light);font-size:.8rem;">— ${escape(t.author)}</div>
    </div>`).join('');
}

function openAddTestimonialModal() {
  document.getElementById('testi-author').value = '';
  document.getElementById('testi-text').value = '';
  document.getElementById('testi-stars').value = '5';
  openModal('testimonialModal');
}

async function saveTestimonial() {
  const body = {
    author: document.getElementById('testi-author').value.trim(),
    text: document.getElementById('testi-text').value.trim(),
    stars: parseInt(document.getElementById('testi-stars').value),
  };
  if (!body.author || !body.text) { toast('Author and text are required', 'error'); return; }
  try {
    await apiFetch('/api/data/testimonials', { method: 'POST', body });
    toast('Testimonial added!', 'success');
    closeModal('testimonialModal');
    loadTestimonials();
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await apiFetch(`/api/data/testimonials/${id}`, { method: 'DELETE' });
    allTestimonials = allTestimonials.filter(t => t.id !== id);
    renderTestimonials();
    toast('Testimonial deleted', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ==========================================================
// PROGRAMS
// ==========================================================
async function loadPrograms() {
  try {
    const data = await apiFetch('/api/data/programs');
    allPrograms = data.programs || [];
    renderPrograms();
  } catch (e) {
    toast('Failed to load programs: ' + e.message, 'error');
  }
}

function renderPrograms() {
  const list = document.getElementById('programsList');
  if (allPrograms.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📚</div><h4>No programs found</h4></div>`;
    return;
  }
  list.innerHTML = allPrograms.map(p => `
    <div class="program-edit-card">
      <div class="program-edit-card__icon">${escape(p.icon)}</div>
      <div class="program-edit-card__body">
        <div class="program-edit-card__title">${escape(p.title)}
          ${p.defence ? '<span class="badge badge--featured" style="margin-left:8px">Defence</span>' : ''}
        </div>
        <div class="program-edit-card__desc">${escape(p.description)}</div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
          ${(p.features || []).map(f => `<span style="font-size:.75rem;background:rgba(255,255,255,.05);padding:3px 10px;border-radius:999px;color:var(--text-muted)">${escape(f)}</span>`).join('')}
        </div>
        <div style="margin-top:6px;font-size:.78rem;color:var(--text-muted);font-family:var(--font-mono)">${escape(p.duration)}</div>
      </div>
      <button class="btn-ghost" style="flex-shrink:0" onclick="editProgram('${p.id}')">✏️ Edit</button>
    </div>`).join('');
}

function editProgram(id) {
  const p = allPrograms.find(x => x.id === id);
  if (!p) return;
  document.getElementById('programModalTitle').textContent = `Edit: ${p.title}`;
  document.getElementById('programEditId').value = p.id;
  document.getElementById('prog-title').value = p.title;
  document.getElementById('prog-description').value = p.description;
  document.getElementById('prog-features').value = (p.features || []).join('\n');
  document.getElementById('prog-duration').value = p.duration;
  openModal('programModal');
}

async function saveProgram() {
  const id = document.getElementById('programEditId').value;
  const featuresRaw = document.getElementById('prog-features').value;
  const body = {
    title: document.getElementById('prog-title').value.trim(),
    description: document.getElementById('prog-description').value.trim(),
    features: featuresRaw.split('\n').map(f => f.trim()).filter(Boolean),
    duration: document.getElementById('prog-duration').value.trim(),
  };
  try {
    await apiFetch(`/api/data/programs/${id}`, { method: 'PUT', body });
    toast('Program updated!', 'success');
    closeModal('programModal');
    loadPrograms();
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ==========================================================
// NOTICES
// ==========================================================
async function loadNotices() {
  try {
    const data = await apiFetch('/api/data/notices/all');
    allNotices = data.notices || [];
    renderNotices();
  } catch (e) {
    toast('Failed to load notices: ' + e.message, 'error');
  }
}

function renderNotices() {
  const list = document.getElementById('noticesList');
  if (allNotices.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">📢</div>
      <h4>No notices posted</h4>
      <p>Add announcements that will scroll in the marquee on the homepage.</p>
    </div>`;
    return;
  }
  list.innerHTML = allNotices.map(n => `
    <div class="notice-item">
      <div class="notice-item__text">${escape(n.text)}</div>
      <div class="notice-item__actions">
        <span class="badge ${n.active ? 'badge--active' : 'badge--inactive'}">${n.active ? 'Active' : 'Inactive'}</span>
        <button class="btn-icon" title="${n.active ? 'Deactivate' : 'Activate'}"
          onclick="toggleNotice('${n.id}', ${!n.active})">${n.active ? '⏸' : '▶'}</button>
        <button class="btn-icon btn-icon--danger" title="Delete" onclick="deleteNotice('${n.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function openAddNoticeModal() {
  document.getElementById('notice-text').value = '';
  document.getElementById('notice-active').checked = true;
  openModal('noticeModal');
}

async function saveNotice() {
  const body = {
    text: document.getElementById('notice-text').value.trim(),
    active: document.getElementById('notice-active').checked,
  };
  if (!body.text) { toast('Notice text is required', 'error'); return; }
  try {
    await apiFetch('/api/data/notices', { method: 'POST', body });
    toast('Notice posted!', 'success');
    closeModal('noticeModal');
    loadNotices();
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function toggleNotice(id, active) {
  try {
    await apiFetch(`/api/data/notices/${id}`, { method: 'PATCH', body: { active } });
    const idx = allNotices.findIndex(n => n.id === id);
    if (idx !== -1) allNotices[idx].active = active;
    renderNotices();
    toast(active ? 'Notice activated' : 'Notice deactivated', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  try {
    await apiFetch(`/api/data/notices/${id}`, { method: 'DELETE' });
    allNotices = allNotices.filter(n => n.id !== id);
    renderNotices();
    toast('Notice deleted', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ==========================================================
// STATS
// ==========================================================
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/data/stats`);
    const data = await res.json();
    const s = data.stats || {};
    document.getElementById('stat-students').value = s.students || '';
    document.getElementById('stat-successRate').value = s.successRate || '';
    document.getElementById('stat-years').value = s.years || '';
    document.getElementById('stat-tracks').value = s.tracks || '';
  } catch (e) {
    toast('Failed to load stats: ' + e.message, 'error');
  }
}

async function saveStats() {
  const body = {
    students:    parseInt(document.getElementById('stat-students').value),
    successRate: parseInt(document.getElementById('stat-successRate').value),
    years:       parseInt(document.getElementById('stat-years').value),
    tracks:      parseInt(document.getElementById('stat-tracks').value),
  };
  try {
    await apiFetch('/api/data/stats', { method: 'PUT', body });
    toast('Stats saved! The homepage counters will update on next load.', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ==========================================================
// SETTINGS
// ==========================================================
function changeSessionToken() {
  const newToken = document.getElementById('newTokenInput').value.trim();
  if (!newToken) { toast('Enter a new token first', 'error'); return; }
  ADMIN_TOKEN = newToken;
  sessionStorage.setItem('avishkaar_admin_token', newToken);
  const masked = newToken.slice(0, 4) + '•'.repeat(Math.max(0, newToken.length - 4));
  document.getElementById('maskedToken').textContent = masked;
  document.getElementById('newTokenInput').value = '';
  toast('Session token updated. Remember to update ADMIN_TOKEN in your .env for persistence.', 'info');
}
