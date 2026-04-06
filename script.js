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
function switchTab(hash) {
  const id = hash.replace('#', '');
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active-tab'));
  // Show target section
  const target = document.getElementById(id);
  if (target && target.classList.contains('section')) {
    target.classList.add('active-tab');
  }
  // Update active nav link
  navMenu.querySelectorAll('a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + id) {
      a.classList.add('active');
    }
  });
  // Scroll to top of content area
  window.scrollTo({ top: document.querySelector('.hero').offsetHeight, behavior: 'smooth' });
}

// Nav link clicks switch tabs
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#') && href !== '#hero') {
      e.preventDefault();
      switchTab(href);
      history.replaceState(null, '', href);
    }
    navMenu.classList.remove('open');
    navToggle.classList.remove('active');
  });
});

// Handle in-page links (e.g. hero buttons) that point to sections
document.querySelectorAll('a[href^="#"]').forEach(link => {
  if (navMenu.contains(link)) return; // already handled above
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#hero') return; // let default scroll work
    const target = document.getElementById(href.replace('#', ''));
    if (target && target.classList.contains('section')) {
      e.preventDefault();
      switchTab(href);
      history.replaceState(null, '', href);
    }
  });
});

// Activate tab from URL hash on load
(function initTab() {
  const hash = window.location.hash || '#about';
  const id = hash.replace('#', '');
  const target = document.getElementById(id);
  if (target && target.classList.contains('section')) {
    switchTab(hash);
  } else {
    switchTab('#about');
  }
})();

// ===== Copy IP =====
function copyIP(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已複製到剪貼簿！');
  }).catch(() => {
    // Fallback
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

  // Close all
  document.querySelectorAll('.faq-question').forEach(q => {
    q.classList.remove('open');
    q.nextElementSibling.style.maxHeight = null;
  });

  // Open clicked (if it wasn't already open)
  if (!wasOpen) {
    btn.classList.add('open');
    const answer = btn.nextElementSibling;
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

// ===== Scroll animations =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

const fadeInSelector = '.about-card, .step, .feature-card, .rule-card, .store-category, .devops-card, .timeline-item, .faq-item, .store-disclaimer, .join-intro, .about-intro, .rules-preamble, .team-card';

// Apply fade-in to elements
document.querySelectorAll(fadeInSelector).forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Re-observe fade-in elements when tab switches (hidden elements can't intersect)
const origSwitchTab = switchTab;
switchTab = function(hash) {
  origSwitchTab(hash);
  // Re-trigger observer for newly visible section
  const id = hash.replace('#', '');
  const section = document.getElementById(id);
  if (section) {
    section.querySelectorAll(fadeInSelector).forEach(el => {
      observer.unobserve(el);
      observer.observe(el);
    });
  }
};

// (Active nav link is now handled by switchTab)

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

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
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
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108, 99, 255, ${p.opacity})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108, 99, 255, ${0.08 * (1 - dist / 150)})`;
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
      canvas: canvas,
      width: 200,
      height: 300,
      skin: `https://mineskin.eu/skin/${username}`,
    });

    // Camera: show full body
    viewer.camera.rotation.x = -0.1;
    viewer.camera.rotation.y = 0;
    viewer.camera.position.y = -2;
    viewer.zoom = 0.85;

    // Custom floating animation: idle + bobbing up/down + legs dangling
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

    // Auto-rotate
    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 1.0;

    // Transparent background
    viewer.renderer.setClearColor(0x000000, 0);
  });
})();
