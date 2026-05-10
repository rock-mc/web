// ===== Navbar scroll effect =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== Mobile menu toggle =====
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  navToggle.classList.toggle('active');
});

// ===== Tab switching =====
const hero = document.querySelector('.hero');
const fadeInSelector = '.about-card, .step, .feature-card, .rule-card, .store-category, .devops-card, .timeline-item, .faq-item, .store-disclaimer, .join-intro, .about-intro, .rules-preamble, .team-card';

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll(fadeInSelector).forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

function switchTab(hash, scroll = true) {
  const id = hash.replace('#', '');

  if (id === 'hero') {
    hero.classList.remove('tab-hidden');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-tab'));
  } else {
    hero.classList.add('tab-hidden');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-tab'));
    const target = document.getElementById(id);
    if (target?.classList.contains('section')) {
      target.classList.add('active-tab');
      // Re-trigger fade-in for newly visible section
      target.querySelectorAll(fadeInSelector).forEach(el => {
        observer.unobserve(el);
        observer.observe(el);
      });
    }
  }

  navMenu.querySelectorAll('a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
  });

  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

// Nav link clicks
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href?.startsWith('#')) {
      e.preventDefault();
      switchTab(href);
      history.replaceState(null, '', href);
    }
    navMenu.classList.remove('open');
    navToggle.classList.remove('active');
  });
});

// Handle in-page links (hero buttons, footer links, etc.)
document.querySelectorAll('a[href^="#"]').forEach(link => {
  if (navMenu.contains(link)) return;
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    const id = href?.replace('#', '') || '';
    const target = document.getElementById(id);
    if (href === '#hero' || target?.classList.contains('section')) {
      e.preventDefault();
      switchTab(href);
      history.replaceState(null, '', href);
    }
  });
});

// Activate tab from URL hash on load
(function initTab() {
  const hash = window.location.hash || '#hero';
  const id = hash.replace('#', '');
  const target = document.getElementById(id);
  if (id === 'hero' || target?.classList.contains('section')) {
    switchTab(hash, false);
  } else {
    switchTab('#hero', false);
  }
})();

// ===== Copy IP =====
function copyIP(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已複製到剪貼簿！');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已複製到剪貼簿！');
  });
}

// ===== Toast =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== FAQ toggle =====
function toggleFAQ(btn) {
  const wasOpen = btn.classList.contains('open');
  document.querySelectorAll('.faq-question').forEach(q => {
    q.classList.remove('open');
    q.nextElementSibling.style.maxHeight = null;
  });
  if (!wasOpen) {
    btn.classList.add('open');
    const answer = btn.nextElementSibling;
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

// ===== Particles =====
(function initParticles() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('particles');
  if (!container) return;

  container.appendChild(canvas);
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

  let particles = [];
  const COUNT = 40;

  function resize() {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }

  const emberColors = [
    [201, 160, 51],
    [232, 85, 32],
    [255, 215, 0],
    [0, 212, 170],
    [204, 51, 51],
  ];

  function createParticle() {
    const color = emberColors[Math.random() < 0.7 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 5)];
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -(Math.random() * 0.3 + 0.05),
      opacity: Math.random() * 0.5 + 0.1,
      color,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      if (p.y < 0) { p.y = canvas.height; p.opacity = Math.random() * 0.5 + 0.1; }
      if (p.y > canvas.height) p.speedY *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.opacity})`;
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(201, 160, 51, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  init();
  animate();
})();

// ===== Team Skin Viewer (skinview3d) =====
(function initTeamSkins() {
  if (typeof skinview3d === 'undefined') return;

  document.querySelectorAll('.team-skin').forEach(canvas => {
    const username = canvas.dataset.skinUsername;
    if (!username) return;

    const viewer = new skinview3d.SkinViewer({
      canvas,
      width: 200,
      height: 300,
      skin: `https://mineskin.eu/skin/${username}`,
    });

    viewer.camera.rotation.x = -0.1;
    viewer.camera.rotation.y = 0;
    viewer.camera.position.y = -2;
    viewer.zoom = 0.85;

    viewer.animation = new skinview3d.IdleAnimation();
    viewer.animation.speed = 0.6;
    viewer.playerObject.skin.leftLeg.rotation.x = 0.1;
    viewer.playerObject.skin.rightLeg.rotation.x = -0.1;

    const playerObj = viewer.playerObject;
    const baseY = playerObj.position.y;
    let floatTime = 0;
    viewer.renderer.setAnimationLoop(() => {
      floatTime += 0.02;
      playerObj.position.y = baseY + Math.sin(floatTime) * 1.5;
      viewer.render();
    });

    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 1.0;
    viewer.renderer.setClearColor(0x000000, 0);
  });
})();
