// =========================================================
// AVISHKAAR ACADEMY — frontend interactions + dynamic data
// =========================================================

const API_BASE = window.AVISHKAAR_API_BASE || '';

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Sticky navbar + scroll progress ---------- */
const navbar = document.getElementById('navbar');
const progressBar = document.querySelector('.route-progress span');

function onScroll() {
  const scrollY = window.scrollY || window.pageYOffset;
  navbar.classList.toggle('is-scrolled', scrollY > 40);

  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => {
  const isOpen = navbar.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', isOpen);
});
document.getElementById('navLinks').addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    navbar.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', false);
  }
});

/* ---------- Scroll-reveal ---------- */
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* ---------- Animated counters ---------- */
function animateCounter(el, target) {
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('.stat__num');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    animateCounter(el, target);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(el => counterObserver.observe(el));

/* ---------- Re-observe utility for dynamic elements ---------- */
function observeNewReveals(container) {
  container.querySelectorAll('[data-reveal]').forEach(el => {
    el.classList.remove('is-visible');
    revealObserver.observe(el);
  });
}
function observeNewCounters(container) {
  container.querySelectorAll('.stat__num').forEach(el => {
    counterObserver.observe(el);
  });
}

function escape(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ==========================================================
   NOTICES BANNER
   ========================================================== */
async function loadNotices() {
  try {
    const res = await fetch(`${API_BASE}/api/data/notices`);
    if (!res.ok) return;
    const data = await res.json();
    const notices = data.notices || [];
    if (notices.length === 0) return;

    const banner = document.getElementById('noticesBanner');
    const track = document.getElementById('noticesBannerTrack');
    const closeBtn = document.getElementById('noticesBannerClose');

    const items = notices.map(n => `<span>${escape(n.text)}</span>`).join('<span style="color:var(--gold);margin:0 12px">✦</span>');
    track.innerHTML = items + '<span style="color:var(--gold);margin:0 12px">✦</span>' + items;

    banner.style.display = 'flex';
    document.body.classList.add('has-notices');

    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      document.body.classList.remove('has-notices');
    });
  } catch (_) {}
}

/* ==========================================================
   HERO STATS — dynamic from API
   ========================================================== */
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/data/stats`);
    if (!res.ok) return;
    const data = await res.json();
    const s = data.stats;
    if (!s) return;

    const statEls = document.querySelectorAll('.stat__num');
    const keys = ['students', 'successRate', 'years', 'tracks'];
    statEls.forEach((el, i) => {
      if (keys[i] && s[keys[i]] !== undefined) {
        el.dataset.count = s[keys[i]];
        el.textContent = '0';
      }
    });
    observeNewCounters(document.getElementById('heroStats'));
  } catch (_) {}
}

/* ==========================================================
   TOPPERS — dynamic Wall of Fame (with image support!)
   ========================================================== */
function buildTopperCard(t) {
  const featured = t.featured ? 'spotlight-card--featured' : '';
  const media = t.image ?
    `<img src="${escape(t.image)}" alt="${escape(t.name)}" loading="lazy">` :
    `<div class="spotlight-card__avatar" aria-hidden="true">${initials(t.name)}</div>`;

  return `
    <article class="spotlight-card ${featured}">
      ${media}
      <div class="spotlight-card__body">
        <span class="spotlight-card__rank">${escape(t.rank)}</span>
        <h3>${escape(t.name)}</h3>
        <p class="spotlight-card__score">${escape(t.score)}<span>${escape(t.scoreUnit)}</span></p>
        <p class="spotlight-card__subject">${escape(t.subject)}</p>
        ${t.quote ? `<p class="spotlight-card__quote">"${escape(t.quote)}"</p>` : ''}
      </div>
    </article>`;
}

async function loadToppers() {
  try {
    const res = await fetch(`${API_BASE}/api/data/toppers`);
    if (!res.ok) return;
    const data = await res.json();
    const toppers = data.toppers || [];
    if (toppers.length === 0) return;

    const container = document.getElementById('topperSpotlight');
    if (!container) return;

    const featured = toppers.filter(t => t.featured);
    const others   = toppers.filter(t => !t.featured);
    let ordered = [];
    if (featured.length > 0) {
      const mid = Math.floor(others.length / 2);
      ordered = [...others.slice(0, mid), ...featured, ...others.slice(mid)];
    } else {
      ordered = toppers;
    }

    container.innerHTML = ordered.map(buildTopperCard).join('');
    observeNewReveals(container);
  } catch (_) {}
}

/* ==========================================================
   FACULTY — dynamic
   ========================================================== */
function buildFacultyCard(f) {
  const avatarHtml = f.image ?
    `<img src="${escape(f.image)}" alt="${escape(f.name)}" class="faculty-card__avatar-img">` :
    `<div class="faculty-card__avatar">${escape(f.avatar || initials(f.name))}</div>`;
  return `
    <article class="faculty-card" data-reveal>
      ${avatarHtml}
      <h4>${escape(f.name)}</h4>
      <p class="faculty-card__role">${escape(f.role)}</p>
      <p class="faculty-card__meta">${escape(f.meta)}</p>
    </article>`;
}

async function loadFaculty() {
  try {
    const res = await fetch(`${API_BASE}/api/data/faculty`);
    if (!res.ok) return;
    const data = await res.json();
    const faculty = data.faculty || [];
    if (faculty.length === 0) return;

    const grid = document.getElementById('facultyGrid');
    if (!grid) return;
    grid.innerHTML = faculty.map(buildFacultyCard).join('');
    observeNewReveals(grid);
  } catch (_) {}
}

/* ==========================================================
   GALLERY — dynamic
   ========================================================== */
function buildGalleryItem(g) {
  const tall = g.tall ? 'masonry__item--tall' : '';
  return `
    <div class="masonry__item ${tall}">
      <img src="${escape(g.image)}" alt="${escape(g.alt || 'Academy gallery')}" loading="lazy">
    </div>`;
}

async function loadGallery() {
  try {
    const res = await fetch(`${API_BASE}/api/data/gallery`);
    if (!res.ok) return;
    const data = await res.json();
    const gallery = data.gallery || [];
    if (gallery.length === 0) return;

    const masonry = document.getElementById('galleryMasonry');
    if (!masonry) return;
    masonry.innerHTML = gallery.map(buildGalleryItem).join('');
    observeNewReveals(masonry);
  } catch (_) {}
}

/* ==========================================================
   CONTACT INFO — dynamic
   ========================================================== */
async function loadContact() {
  try {
    const res = await fetch(`${API_BASE}/api/data/contact`);
    if (!res.ok) return;
    const data = await res.json();
    const c = data.contact;
    if (!c) return;

    if (c.address) {
      const el = document.getElementById('contactAddress');
      if (el) el.textContent = c.address;
    }
    if (c.phoneDetails) {
      const el = document.getElementById('contactPhone');
      if (el) el.innerHTML = escape(c.phoneDetails).replace(/\n/g, '<br>');
    }
    if (c.email) {
      const el = document.getElementById('contactEmail');
      if (el) el.textContent = c.email;
    }
    if (c.hours) {
      const el = document.getElementById('contactHours');
      if (el) el.textContent = c.hours;
    }
    if (c.whatsappNumber) {
      document.querySelectorAll('.wa-link, .float-whatsapp').forEach(a => {
        a.href = `https://wa.me/${c.whatsappNumber.replace(/[^0-9]/g, '')}`;
      });
    }
    if (c.mapUrl) {
      const map = document.getElementById('contactMap');
      if (map) map.src = c.mapUrl;
    }
  } catch (_) {}
}

/* ==========================================================
   TESTIMONIALS — dynamic
   ========================================================== */
function buildTestimonialCard(t) {
  const stars = '★'.repeat(t.stars || 5) + '☆'.repeat(5 - (t.stars || 5));
  return `
    <article class="testimonial-card">
      <div class="testimonial-card__stars">${stars}</div>
      <p>"${escape(t.text)}"</p>
      <div class="testimonial-card__by">${escape(t.author)}</div>
    </article>`;
}

async function loadTestimonials() {
  try {
    const res = await fetch(`${API_BASE}/api/data/testimonials`);
    if (!res.ok) return;
    const data = await res.json();
    const testimonials = data.testimonials || [];
    if (testimonials.length === 0) return;

    const container = document.getElementById('testimonialTrack');
    if (!container) return;
    container.innerHTML = testimonials.map(buildTestimonialCard).join('');
    observeNewReveals(container);
  } catch (_) {}
}

/* ==========================================================
   PROGRAMS — dynamic
   ========================================================== */
function buildProgramCard(p) {
  const defence   = p.defence ? 'program-card--defence' : '';
  const iconClass = p.iconGold ? 'program-card__icon program-card__icon--gold' : 'program-card__icon';
  const features  = (p.features || []).map(f => `<li>${escape(f)}</li>`).join('');
  return `
    <article class="program-card ${defence}" data-reveal>
      <div class="${iconClass}">${escape(p.icon)}</div>
      <h4>${escape(p.title)}</h4>
      <p>${escape(p.description)}</p>
      <ul class="program-card__features">${features}</ul>
      <p class="program-card__duration">${escape(p.duration)}</p>
      <a href="#inquiry" class="program-card__cta">Enquire for this batch →</a>
    </article>`;
}

async function loadPrograms() {
  try {
    const res = await fetch(`${API_BASE}/api/data/programs`);
    if (!res.ok) return;
    const data = await res.json();
    const programs = data.programs || [];
    if (programs.length === 0) return;

    const schoolGrid      = document.getElementById('schoolProgramGrid');
    const competitiveGrid = document.getElementById('competitiveProgramGrid');
    if (!schoolGrid || !competitiveGrid) return;

    const school      = programs.filter(p => p.category === 'school');
    const competitive = programs.filter(p => p.category === 'competitive');

    if (school.length > 0) {
      schoolGrid.innerHTML = school.map(buildProgramCard).join('');
      observeNewReveals(schoolGrid);
    }
    if (competitive.length > 0) {
      competitiveGrid.innerHTML = competitive.map(buildProgramCard).join('');
      observeNewReveals(competitiveGrid);
    }
  } catch (_) {}
}

/* ==========================================================
   INQUIRY FORM → backend API
   ========================================================== */
const form      = document.getElementById('inquiryForm');
const statusEl  = document.getElementById('formStatus');
const submitBtn = document.getElementById('formSubmit');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    const label = submitBtn.querySelector('.btn__label');
    const originalLabel = label.textContent;
    label.textContent = 'Sending…';

    try {
      // Send form using EmailJS
      await emailjs.sendForm('service_1234', 'template_smry5hj', form);

      statusEl.textContent = 'Thank you! Our counsellor will call you back shortly.';
      statusEl.classList.add('success');
      form.reset();
    } catch (err) {
      console.error('EmailJS Error:', err);
      statusEl.textContent = 'Could not submit right now. Please call us directly.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      label.textContent = originalLabel;
    }
  });
}

/* ==========================================================
   INITIALISE — load all dynamic content
   ========================================================== */
(async function init() {
  await Promise.allSettled([
    loadNotices(),
    loadStats(),
    loadToppers(),
    loadFaculty(),
    loadGallery(),
    loadContact(),
    loadTestimonials(),
    loadPrograms(),
  ]);
})();
