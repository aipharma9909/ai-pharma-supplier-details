/* =============================================
   script.js — AI Pharma Supplier Details
   Premium Logic: CRUD + Search + Animations
   ============================================= */

// ── STATE ──
let suppliers = JSON.parse(localStorage.getItem('pharmaSuppliers')) || [];
let deleteTargetId = null;
let isEditing = false;
let searchQuery = '';

// ── DOM ──
const form          = document.getElementById('supplierForm');
const editIdField   = document.getElementById('editId');
const submitBtn     = document.getElementById('submitBtn');
const submitText    = document.getElementById('submitText');
const cancelBtn     = document.getElementById('cancelBtn');
const clearBtn      = document.getElementById('clearBtn');
const sectionTitle  = document.getElementById('sectionTitle');
const searchInput   = document.getElementById('searchInput');
const clearSearch   = document.getElementById('clearSearch');
const tableBody     = document.getElementById('supplierTableBody');
const emptyState    = document.getElementById('emptyState');
const deleteModal   = document.getElementById('deleteModal');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete  = document.getElementById('cancelDelete');
const toastContainer= document.getElementById('toastContainer');
const loaderOverlay = document.getElementById('loaderOverlay');

// ── INIT ──
window.addEventListener('load', () => {
  // Hide loader with delay
  setTimeout(() => {
    loaderOverlay.classList.add('hidden');
  }, 1800);

  initParticles();
  initNavbarScroll();
  initScrollReveal();
  renderTable(suppliers);
  updateStats();
  initRipple();
});

// ══════════════════════════════════════
// PARTICLE SYSTEM
// ══════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#4f8ef740', '#8b5cf640', '#10b98130', '#ec489930'];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x    = Math.random() * W;
      this.y    = Math.random() * H;
      this.r    = Math.random() * 1.5 + 0.5;
      this.vx   = (Math.random() - 0.5) * 0.3;
      this.vy   = (Math.random() - 0.5) * 0.3;
      this.life = Math.random();
      this.c    = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.c;
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  (function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  })();
}

// ══════════════════════════════════════
// NAVBAR SCROLL EFFECT
// ══════════════════════════════════════
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ══════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════
function initScrollReveal() {
  const sections = document.querySelectorAll('.section');
  sections.forEach(s => s.classList.add('reveal'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.08 });

  sections.forEach(s => obs.observe(s));
}

// ══════════════════════════════════════
// RIPPLE EFFECT
// ══════════════════════════════════════
function initRipple() {
  document.querySelectorAll('.btn-premium').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none; z-index:10;
        width:12px; height:12px; margin-left:-6px; margin-top:-6px;
        background:rgba(255,255,255,0.35);
        top:${e.clientY - rect.top}px; left:${e.clientX - rect.left}px;
        animation: rippleAnim 0.6s ease-out forwards;
      `;
      if (!document.getElementById('rippleStyle')) {
        const style = document.createElement('style');
        style.id = 'rippleStyle';
        style.textContent = '@keyframes rippleAnim{to{transform:scale(30);opacity:0;}}';
        document.head.appendChild(style);
      }
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
}

// ══════════════════════════════════════
// ANIMATED COUNTER
// ══════════════════════════════════════
function animateCount(el, target, duration = 600) {
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const range = target - start;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + range * ease);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ══════════════════════════════════════
// UPDATE STATS
// ══════════════════════════════════════
function updateStats() {
  const companies = new Set(suppliers.map(s => s.companyName.toLowerCase().trim())).size;
  const employees = new Set(suppliers.map(s => s.employeeName.toLowerCase().trim())).size;
  const products  = new Set(suppliers.map(s => s.productName.toLowerCase().trim())).size;
  const total     = suppliers.length;

  animateCount(document.getElementById('heroCompanies'), companies);
  animateCount(document.getElementById('heroEmployees'), employees);
  animateCount(document.getElementById('heroProducts'),  products);
  animateCount(document.getElementById('heroRecords'),   total);
  animateCount(document.getElementById('navTotal'),      total);
}

// ══════════════════════════════════════
// SAVE TO LOCALSTORAGE
// ══════════════════════════════════════
function save() {
  localStorage.setItem('pharmaSuppliers', JSON.stringify(suppliers));
}

function generateId() {
  return 'sup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

// ══════════════════════════════════════
// RENDER TABLE
// ══════════════════════════════════════
function renderTable(data) {
  const count = document.getElementById('recordCount');
  animateCount(count, data.length);

  if (data.length === 0) {
    emptyState.style.display = 'flex';
    document.getElementById('supplierTable').style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  document.getElementById('supplierTable').style.display = 'table';
  tableBody.innerHTML = '';

  data.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${i * 0.04}s`;
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><span class="badge badge-company"><i class="fas fa-building" style="font-size:0.7rem;"></i>${esc(item.companyName)}</span></td>
      <td style="color:var(--text);font-weight:500;">${esc(item.employeeName)}</td>
      <td>
        <a class="phone-link" href="tel:${esc(item.phoneNumber)}">
          <i class="fas fa-phone-alt"></i>${esc(item.phoneNumber)}
        </a>
      </td>
      <td><span class="badge badge-product"><i class="fas fa-capsules" style="font-size:0.7rem;"></i>${esc(item.productName)}</span></td>
      <td style="color:var(--text2);">${esc(item.suppliedBy)}</td>
      <td><span class="badge-date">${formatDate(item.createdAt)}</span></td>
      <td>
        <div class="action-btns">
          <button class="tbl-btn tbl-edit" onclick="editSupplier('${item.id}')">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button class="tbl-btn tbl-del" onclick="promptDelete('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ══════════════════════════════════════
// FORM SUBMIT
// ══════════════════════════════════════
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const companyName  = document.getElementById('companyName').value.trim();
  const employeeName = document.getElementById('employeeName').value.trim();
  const phoneNumber  = document.getElementById('phoneNumber').value.trim();
  const productName  = document.getElementById('productName').value.trim();
  const suppliedBy   = document.getElementById('suppliedBy').value.trim();

  if (!companyName || !employeeName || !phoneNumber || !productName || !suppliedBy) {
    showToast('Please fill in all fields!', 'error', 'fas fa-exclamation-circle');
    shakeForm();
    return;
  }

  if (isEditing) {
    const id  = editIdField.value;
    const idx = suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      suppliers[idx] = { ...suppliers[idx], companyName, employeeName, phoneNumber, productName, suppliedBy, updatedAt: new Date().toISOString() };
    }
    showToast('Supplier updated successfully!', 'success', 'fas fa-check-circle');
    resetForm();
  } else {
    suppliers.unshift({ id: generateId(), companyName, employeeName, phoneNumber, productName, suppliedBy, createdAt: new Date().toISOString() });
    showToast('Supplier added successfully!', 'success', 'fas fa-check-circle');
    form.reset();
  }

  save();
  applySearch();
  updateStats();
});

function shakeForm() {
  const card = document.getElementById('formCard');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'shake 0.4s ease';
  if (!document.getElementById('shakeStyle')) {
    const s = document.createElement('style');
    s.id = 'shakeStyle';
    s.textContent = '@keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}';
    document.head.appendChild(s);
  }
}

// ══════════════════════════════════════
// EDIT
// ══════════════════════════════════════
function editSupplier(id) {
  const item = suppliers.find(s => s.id === id);
  if (!item) return;

  isEditing = true;
  editIdField.value = id;
  sectionTitle.textContent = 'Edit Supplier';
  submitText.textContent = 'Update Supplier';
  submitBtn.querySelector('.btn-bg').style.background = 'linear-gradient(135deg,#e3a008,#92400e)';
  cancelBtn.style.display = 'inline-flex';

  document.getElementById('companyName').value  = item.companyName;
  document.getElementById('employeeName').value = item.employeeName;
  document.getElementById('phoneNumber').value  = item.phoneNumber;
  document.getElementById('productName').value  = item.productName;
  document.getElementById('suppliedBy').value   = item.suppliedBy;

  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ══════════════════════════════════════
// RESET FORM
// ══════════════════════════════════════
function resetForm() {
  isEditing = false;
  editIdField.value = '';
  sectionTitle.textContent = 'New Supplier Entry';
  submitText.textContent = 'Save Supplier';
  submitBtn.querySelector('.btn-bg').style.background = '';
  cancelBtn.style.display = 'none';
  form.reset();
}

cancelBtn.addEventListener('click', resetForm);
clearBtn.addEventListener('click',  resetForm);

// ══════════════════════════════════════
// DELETE
// ══════════════════════════════════════
function promptDelete(id) {
  deleteTargetId = id;
  deleteModal.classList.add('active');
}

confirmDelete.addEventListener('click', () => {
  if (deleteTargetId) {
    suppliers = suppliers.filter(s => s.id !== deleteTargetId);
    save();
    applySearch();
    updateStats();
    showToast('Record deleted.', 'error', 'fas fa-trash');
    deleteTargetId = null;
  }
  closeModal();
});

cancelDelete.addEventListener('click', closeModal);
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeModal(); });

function closeModal() {
  const box = document.getElementById('modalBox');
  box.style.animation = 'modalOut 0.3s ease forwards';
  if (!document.getElementById('modalOutStyle')) {
    const s = document.createElement('style');
    s.id = 'modalOutStyle';
    s.textContent = '@keyframes modalOut{to{transform:scale(0.85) translateY(20px);opacity:0;}}';
    document.head.appendChild(s);
  }
  setTimeout(() => {
    deleteModal.classList.remove('active');
    box.style.animation = '';
  }, 280);
}

// ══════════════════════════════════════
// SEARCH
// ══════════════════════════════════════
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  clearSearch.classList.toggle('visible', searchQuery.length > 0);
  applySearch();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearSearch.classList.remove('visible');
  applySearch();
});

function applySearch() {
  const q = searchQuery.toLowerCase().trim();
  if (!q) { renderTable(suppliers); return; }
  renderTable(suppliers.filter(s =>
    s.companyName.toLowerCase().includes(q)  ||
    s.employeeName.toLowerCase().includes(q) ||
    s.phoneNumber.toLowerCase().includes(q)  ||
    s.productName.toLowerCase().includes(q)  ||
    s.suppliedBy.toLowerCase().includes(q)
  ));
}

// ══════════════════════════════════════
// NAV / HERO BUTTONS
// ══════════════════════════════════════
document.getElementById('heroAddBtn').addEventListener('click', () => {
  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('companyName').focus(), 600);
});

document.getElementById('heroViewBtn').addEventListener('click', () => {
  document.getElementById('recordsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('emptyAddBtn').addEventListener('click', () => {
  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('companyName').focus(), 600);
});

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════
function showToast(message, type = 'success', icon = 'fas fa-check-circle') {
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `
    <i class="toast-icon ${icon}"></i>
    <span>${message}</span>
    <i class="toast-close fas fa-times"></i>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  toastContainer.appendChild(toast);

  setTimeout(() => dismissToast(toast), 3500);
}

function dismissToast(toast) {
  toast.classList.add('out');
  setTimeout(() => toast.remove(), 400);
}

// ══════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (deleteModal.classList.contains('active')) closeModal();
    else if (isEditing) resetForm();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    document.getElementById('recordsSection').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => searchInput.focus(), 400);
  }
});
