// ==============================
// 0. Veille dynamique (veille-data.json)
// ==============================
(function loadVeille() {
  const container = document.getElementById('veille-items');
  const updatedEl = document.getElementById('veille-updated');
  if (!container) return;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(url) {
    try {
      const u = new URL(url);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch (_) { return '#'; }
  }

  if (location.protocol === 'file:') return;
  fetch('veille-data.json?_=' + Date.now())
    .then(r => { if (!r.ok) throw new Error('no data'); return r.json(); })
    .then(data => {
      if (!data.articles || !data.articles.length) return;

      container.innerHTML = data.articles.map(a => {
        const src = a.source ? ` · <span class="font-normal">${escapeHtml(a.source)}</span>` : '';
        return `
          <div class="veille-card">
            <time class="timeline-time">${escapeHtml(a.date)}${src}</time>
            <h3 class="timeline-title">
              <a href="${safeUrl(a.link)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                ${escapeHtml(a.title)}
              </a>
            </h3>
            <p class="timeline-text">${escapeHtml(a.summary)}</p>
          </div>`;
      }).join('');

      if (updatedEl && data.updated) {
        updatedEl.textContent = 'Dernière mise à jour : ' + data.updated;
      }
    })
    .catch(() => { /* Fallback : les items statiques restent affichés */ });
})();

// ==============================
// 0b. Scroll Reveal (data-scroll)
// ==============================
(function scrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-inview'); });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  window.__scrollRevealObserver = io;
  // Uniquement les sections hors Stages pour éviter que les cards disparaissent
  document.querySelectorAll('[data-scroll]').forEach(el => {
    if (!el.closest('#Stages') && !el.closest('.hscroll-track')) {
      el.classList.add('reveal');
      io.observe(el);
    }
  });
})();

// ==============================
// 1. Modale Certifications — UX+A11y
// ==============================
const modal = document.getElementById('cert-modal');
const modalTitle = document.getElementById('modal-title');
const modalPdf = document.getElementById('modal-pdf');
const modalLink = document.getElementById('modal-link');
const closeModalBtn = document.getElementById('close-modal');

// Boutons optionnels (si présents dans le HTML)
const prevBtn = document.getElementById('prev-skill');
const nextBtn = document.getElementById('next-skill');

// Cartes cliquables
const skillCards = Array.from(document.querySelectorAll('.skill-card'));

// Dictionnaire des compétences (conserve tes clés data-skill)
const skills = {
  html: {
    title: 'ANSSI - SecNumacadémie',
    pdf: 'photo/anssi-cert.pdf',
    link: 'https://www.credential.net/html-certification'
  },
  css: {
    title: 'THM - Learning Path Pre Security',
    pdf: 'photo/thm-cert.pdf',
    link: 'https://tryhackme-certificates.s3-eu-west-1.amazonaws.com/THM-ENZBIFU49D.pdf'
  },
  python: {
    title: 'Python - Python Essentials 1',
    pdf: 'photo/python-cert.pdf',
    link: 'https://www.credly.com/badges/fb443e33-7583-40ff-a817-802f7e00b754'
  },
  cybersecurity: {
    title: 'Cisco - Introduction to Cybersecurity',
    pdf: 'photo/cisco-cert.pdf',
    link: 'https://www.credly.com/badges/dff92613-91a2-43bc-8aa9-0e3d9ee8bf4f'
  }
};

// Ordre de navigation (Précédent/Suivant)
const ORDER = ['html', 'css', 'python', 'cybersecurity'];
let currentIndex = -1;

// Utilitaires
const keyToIndex = (key) => ORDER.indexOf(key);
const indexToKey = (i) => ORDER[(i + ORDER.length) % ORDER.length];

// Focus trap
let previousActiveElement = null;
const focusablesSelector = 'a, button, iframe, [tabindex]:not([tabindex="-1"])';

// Ouvre la modale à partir d'une clé
function openModalByKey(skillKey) {
  const skill = skills[skillKey];
  if (!skill) return;

  currentIndex = keyToIndex(skillKey);

  if(modalTitle) modalTitle.textContent = skill.title;
  if(modalPdf) modalPdf.src = skill.pdf;
  if(modalLink) modalLink.href = skill.link;

  previousActiveElement = document.activeElement;
  if(modal) {
    modal.classList.add('active');
    // Empêche le scroll derrière
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Focus : priorité au bouton fermer, sinon au lien
    setTimeout(() => {
      const focusables = modal.querySelectorAll(focusablesSelector);
      if(closeModalBtn) closeModalBtn.focus();
      else if(focusables[0]) focusables[0].focus();
      else modal.focus();
    }, 0);
  }
}

// Ouvre par index (avec wrap)
function openModalByIndex(i) {
  const key = indexToKey(i);
  openModalByKey(key);
}

// Ferme la modale proprement
function closeModal() {
  if(!modal) return;
  modal.classList.remove('active');
  if(modalPdf) modalPdf.src = ''; // stop le chargement/son éventuel
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
}

// Clic sur cartes (souris + clavier)
skillCards.forEach((card) => {
  const skillKey = card.getAttribute('data-skill'); 
  
  // NOTE : Si la carte n'a pas de data-skill (ex: outils sans certif), on ne met pas de listener modal
  if (!skillKey) return;

  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.addEventListener('click', () => openModalByKey(skillKey));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModalByKey(skillKey);
    }
  });
});

// Fermer via bouton
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeModal);
}

// Fermer en cliquant en dehors
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// Navigation Précédent/Suivant (si les boutons existent)
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentIndex < 0) return;
    openModalByIndex(currentIndex - 1);
  });
}
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (currentIndex < 0) return;
    openModalByIndex(currentIndex + 1);
  });
}

// Clavier global pendant la modale
document.addEventListener('keydown', (e) => {
  if (!modal || !modal.classList.contains('active')) return;

  // Échappement
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }

  // Flèches navigation
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    openModalByIndex(currentIndex + 1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    openModalByIndex(currentIndex - 1);
  }

  // Focus trap (Tab)
  if (e.key === 'Tab') {
    const focusables = Array.from(modal.querySelectorAll(focusablesSelector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  }
});

// Deep-link: ouvrir directement via ?cert=python, etc.
(function openFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const cert = params.get('cert');
  if (cert && skills[cert]) {
    setTimeout(() => openModalByKey(cert), 0);
  }
})();

// ==============================
// 2. Navbar active au scroll
// ==============================
(function navActiveOnScroll() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const links = Array.from(document.querySelectorAll('.nav-link'));
  if (!sections.length || !links.length) return;

  const map = new Map(
    links
      .map((a) => [a, (a.getAttribute('href') || '').replace('#', '')])
      .filter(([, id]) => !!id)
  );

  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('active', map.get(a) === id));
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0.1 }
  );

  sections.forEach((s) => io.observe(s));
})();

// ==============================
// 3. Menu mobile
// ==============================
(function mobileMenu() {
  const btn = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  menu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => menu.classList.add('hidden'));
  });
})();

// ==============================
// 4. Filtres Compétences (Standard)
// ==============================
(function skillsFilter() {
  const grid =
    document.getElementById('competences-grid') ||
    document.getElementById('skills-grid');

  const filterBar =
    document.getElementById('competences-filters') ||
    document.getElementById('skills-filters');

  const subFilterBar =
    document.getElementById('competences-subfilters') ||
    document.getElementById('skills-subfilters');

  if (!grid || !filterBar) return;

  const cards = Array.from(grid.querySelectorAll('.skill-card'));
  let currentFilter = 'all';
  let currentSub = 'all';

  function applyFilters() {
    cards.forEach(card => {
      const cats = (card.getAttribute('data-category') || '')
        .split(/\s+/)
        .map(c => c.trim().toLowerCase())
        .filter(Boolean);

      const tech = (card.getAttribute('data-title') || card.getAttribute('data-tech') || '')
        .trim()
        .toLowerCase();

      // Test filtre principal
      const passMain = (currentFilter === 'all') || cats.includes(currentFilter);

      // Test sous-filtre (actif uniquement si filtre principal = langage)
      const passSub = (currentFilter !== 'langage')
        ? true
        : (currentSub === 'all' || tech === currentSub);

      if (passMain && passSub) {
        card.classList.remove('hidden');
        card.style.display = ''; // Reset display pour le layout Grid
      } else {
        card.classList.add('hidden');
        // setTimeout pour laisser l'anim CSS se faire si besoin, mais display:none est requis pour le layout
        card.style.display = 'none'; 
      }
    });

    if (subFilterBar) {
      if (currentFilter === 'langage') {
        subFilterBar.classList.remove('hidden');
      } else {
        subFilterBar.classList.add('hidden');
        currentSub = 'all';
        subFilterBar.querySelectorAll('.subfilter-btn')
          .forEach(b => b.classList.toggle('active', (b.dataset.subfilter || '').toLowerCase() === 'all'));
      }
    }
  }

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    currentFilter = (btn.dataset.filter || 'all').toLowerCase();
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    applyFilters();
  });

  if (subFilterBar) {
    subFilterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-subfilter]');
      if (!btn) return;
      currentSub = (btn.dataset.subfilter || 'all').toLowerCase();
      subFilterBar.querySelectorAll('.subfilter-btn').forEach(b => b.classList.toggle('active', b === btn));
      applyFilters();
    });
  }

  applyFilters();
})();

// ==============================
// 5. Filtres Projets & Stages
// ==============================
(function projectsFilter() {
  const grid = document.getElementById('projects-grid');
  const bar  = document.getElementById('projects-filters');
  if (!grid || !bar) return;
  const cards = Array.from(grid.querySelectorAll('.project-card'));

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-proj-filter]');
    if (!btn) return;
    const current = (btn.dataset.projFilter || 'all').toLowerCase();
    bar.querySelectorAll('.proj-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    
    cards.forEach(card => {
      const cat = (card.dataset.category || '').toLowerCase();
      card.style.display = ((current === 'all') || (cat === current)) ? '' : 'none';
    });
  });
})();

(function stagesFilter(){
  const bar   = document.getElementById('stages-filters');
  const track = document.getElementById('stages-track-h');
  const items = Array.from(document.querySelectorAll('#Stages .stage-hcard'));
  if(!bar || !items.length) return;

  let emptyMsg = document.getElementById('stages-empty-msg');
  if(!emptyMsg){
    emptyMsg = document.createElement('p');
    emptyMsg.id = 'stages-empty-msg';
    emptyMsg.className = 'text-gray-500 italic py-6 w-full text-center hidden';
    emptyMsg.textContent = 'Aucun stage de prévu pour l\'instant.';
    track.after(emptyMsg);
  }

  bar.addEventListener('click', e=>{
    const btn = e.target.closest('[data-stage-filter]');
    if(!btn) return;
    const current = (btn.dataset.stageFilter || 'all').toLowerCase();
    bar.querySelectorAll('.stage-filter-btn').forEach(b=>b.classList.toggle('active', b===btn));

    let visible = 0;
    items.forEach(it=>{
      const status = (it.dataset.status || '').toLowerCase();
      const show = (current==='all') || (status===current);
      it.style.display = show ? '' : 'none';
      if(show) visible++;
    });

    emptyMsg.classList.toggle('hidden', visible > 0);
    track.classList.toggle('hidden', visible === 0);
  });
})();

// ==============================
// 6. Moteur de Particules (Skills)
// ==============================
(function initParticleSystem() {
  document.documentElement.classList.remove('no-js');

  // Un seul listener resize global avec debounce
  const resizeHandlers = [];
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => resizeHandlers.forEach(fn => fn()), 150);
  });

  const CONFIG = {
    particleCount: 25,
    particleSpeed: 0.4,
    mouseRadius: 100,
    mouseStrength: 0.08
  };

  // 1. Construit le DOM interne des cartes (Canvas + Overlay + Contenu)
  const cards = document.querySelectorAll('.skill-card');
  cards.forEach(card => {
    // Si la carte est vide (générée par le nouveau HTML), on la remplit.
    // Si elle a déjà du contenu (ancien HTML), on l'adapte.
    
    // Récup data
    const title = card.dataset.title || '';
    const iconUrl = card.dataset.icon || '';
    const colorStr = card.dataset.color || '255,255,255';
    const color = colorStr.split(',').map(Number);

    // Vérifie si le canvas existe déjà pour éviter doublons
    if(card.querySelector('canvas.skill-canvas')) return;

    // Création Canvas Layer
    const canvas = document.createElement('canvas');
    canvas.className = 'skill-canvas';
    
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    // Gestion du contenu existant vs nouveau
    let content = card.querySelector('.card-content');
    if(!content) {
      // Si pas de conteneur .card-content, on le crée
      content = document.createElement('div');
      content.className = 'card-content';
      
      // Si l'ancien HTML avait une image "icon-container", on essaie de récupérer l'info
      const oldImg = card.querySelector('img');
      const finalIconUrl = iconUrl || (oldImg ? oldImg.src : '');
      
      const img = document.createElement('img');
      img.className = 'skill-icon';
      img.src = finalIconUrl;
      img.alt = title;
      img.loading = "lazy";

      const p = document.createElement('div');
      p.className = 'skill-title';
      p.textContent = title; // Utilise le dataset title

      content.appendChild(img);
      content.appendChild(p);

      // Vide la carte pour reconstruire proprement
      card.innerHTML = ''; 
    }

    // Assemblage
    card.prepend(overlay); // overlay sous le contenu
    card.prepend(canvas);  // canvas tout au fond
    card.appendChild(content);

    // Lancement moteur
    initEngine(card, canvas, color);
  });

  // 2. Moteur Canvas
  function initEngine(card, canvas, color) {
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], requestId;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      const rect = card.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < CONFIG.particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * CONFIG.particleSpeed,
          vy: (Math.random() - 0.5) * CONFIG.particleSpeed,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.1
        });
      }
    };

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = cx - rect.left;
      mouse.y = cy - rect.top;
    };
    const onLeave = () => { mouse.x = -1000; mouse.y = -1000; };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = color;

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        
        // Interaction souris
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < CONFIG.mouseRadius) {
          const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * CONFIG.mouseStrength * 20;
          p.y -= Math.sin(angle) * force * CONFIG.mouseStrength * 20;
          ctx.globalAlpha = p.alpha + force;
        } else {
          ctx.globalAlpha = p.alpha;
        }

        // Wrap
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();
      });
      requestId = requestAnimationFrame(animate);
    };

    // Events
    resize();
    createParticles();
    
    // Observer pour perf (ne dessine que si visible)
    const observer = new IntersectionObserver((entries) => {
      if(entries[0].isIntersecting) { if(!requestId) animate(); }
      else { cancelAnimationFrame(requestId); requestId = null; }
    });
    observer.observe(card);

    resizeHandlers.push(() => { resize(); createParticles(); });
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('touchstart', onMove, {passive:true});
    card.addEventListener('touchmove', onMove, {passive:true});
  }
})();