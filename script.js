// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// GitHub contribution calendar — rendered to match site theme exactly
(async function renderGithubCalendar() {
  const container = document.getElementById('github-calendar');
  if (!container) return;

  const cell = 11;
  const gap = 3;
  const step = cell + gap;
  const levelColors = ['transparent', '#0e4429', '#006d32', '#26a641', '#39d353'];

  try {
    const res = await fetch('https://github-contributions-api.jogruber.de/v4/soodujjwal?y=last');
    if (!res.ok) throw new Error('bad response');
    const { contributions } = await res.json();

    const startOffset = new Date(contributions[0].date).getDay();
    const weekCount = Math.ceil((contributions.length + startOffset) / 7);
    const width = weekCount * step;
    const height = 7 * step;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height + 18}`)
      .attr('width', width)
      .attr('height', height + 18)
      .style('width', '100%')
      .style('height', 'auto')
      .style('display', 'block');

    const g = svg.append('g').attr('transform', 'translate(0, 18)');

    g.selectAll('rect')
      .data(contributions)
      .enter()
      .append('rect')
      .attr('width', cell)
      .attr('height', cell)
      .attr('rx', 2)
      .attr('x', (d, i) => Math.floor((i + startOffset) / 7) * step)
      .attr('y', (d, i) => ((i + startOffset) % 7) * step)
      .attr('fill', (d) => levelColors[d.level])
      .attr('stroke', '#30363d')
      .attr('stroke-width', 1)
      .append('title')
      .text((d) => `${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`);

    const months = [];
    const seenMonths = new Set();
    contributions.forEach((d, i) => {
      const date = new Date(d.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (date.getDate() <= 7 && !seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        const week = Math.floor((i + startOffset) / 7);
        months.push({ week, label: date.toLocaleString('default', { month: 'short' }) });
      }
    });

    svg.selectAll('text.month-label')
      .data(months)
      .enter()
      .append('text')
      .attr('class', 'month-label')
      .attr('x', (d) => d.week * step)
      .attr('y', 11)
      .attr('fill', '#6b7689')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => d.label);
  } catch (e) {
    console.error('GitHub calendar failed to load:', e);
    container.innerHTML = '<p class="cal-empty">GitHub activity is temporarily unavailable.</p>';
  }
})();

// Navbar scroll state
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

// Dock nav — scrollspy with sliding glow indicator
const dock = document.getElementById('dock');
const dockGlow = document.getElementById('dock-glow');
const dockLinks = Array.from(dock.querySelectorAll('.dock-link'));
const sections = dockLinks.map((link) => document.getElementById(link.dataset.section));

function moveGlowTo(link) {
  const dockRect = dock.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  dockGlow.style.left = `${linkRect.left - dockRect.left}px`;
  dockGlow.style.width = `${linkRect.width}px`;
}

function setActive(link) {
  dockLinks.forEach((l) => l.classList.remove('active'));
  link.classList.add('active');
  moveGlowTo(link);
}

setActive(dockLinks[0]);
window.addEventListener('resize', () => {
  const active = dock.querySelector('.dock-link.active');
  if (active) moveGlowTo(active);
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target);
        if (idx !== -1) setActive(dockLinks[idx]);
      }
    });
  },
  { rootMargin: '-40% 0px -50% 0px' }
);
sections.forEach((section) => section && sectionObserver.observe(section));

// Reveal-on-scroll
document.querySelectorAll('.section, .project-card, .timeline-item').forEach((el) => {
  el.classList.add('reveal');
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Confetti / particle background canvas
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let pieces = [];
  let animationId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const colors = [
    'rgba(255, 255, 255, 0.9)',
    'rgba(248, 250, 252, 0.8)',
    'rgba(241, 245, 249, 0.9)',
    'rgba(226, 232, 240, 0.8)',
    'rgba(203, 213, 225, 0.7)',
  ];
  const shapes = ['rectangle', 'circle', 'star', 'diamond'];

  function makePiece(spawnBack) {
    return {
      x: -canvas.width * 0.2 + Math.random() * canvas.width * 1.4,
      y: -Math.random() * canvas.height * 0.3,
      z: spawnBack ? Math.random() * 800 + 1200 : Math.random() * 1500 + 800,
      velocityX: (Math.random() - 0.5) * 0.6,
      velocityY: Math.random() * 0.3 + 0.1,
      velocityZ: -(Math.random() * 0.6 + 0.3),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      baseSize: Math.random() * 12 + 6,
      opacity: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      floatPhase: Math.random() * Math.PI * 2,
      swayAmplitude: Math.random() * 0.5 + 0.2,
      bobAmplitude: Math.random() * 0.3 + 0.1,
      isFading: false,
    };
  }

  function initConfetti() {
    pieces = Array.from({ length: 90 }, () => makePiece(false));
  }

  function drawPiece(piece) {
    const perspective = 800;
    const scale = perspective / (perspective + piece.z);
    const projectedX = piece.x + (piece.x - canvas.width / 2) * (1 - scale);
    const projectedY = piece.y + (piece.y - canvas.height / 2) * (1 - scale);

    if (scale <= 0.01 || scale > 2) return;

    const size = piece.baseSize * scale;
    const opacity = Math.min(piece.opacity * scale * 1.5, 1);

    ctx.save();
    ctx.translate(projectedX, projectedY);
    ctx.rotate(piece.rotation);
    ctx.globalAlpha = opacity;
    ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(scale * 0.3, 0.2)})`;
    ctx.shadowBlur = scale * 4;
    ctx.shadowOffsetX = scale * 3;
    ctx.shadowOffsetY = scale * 3;
    ctx.fillStyle = piece.color;

    switch (piece.shape) {
      case 'rectangle': {
        const w = size * 1.5;
        const h = size * 0.8;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        break;
      }
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'star': {
        ctx.beginPath();
        const s = size * 0.7;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = Math.cos(angle) * s;
          const y = Math.sin(angle) * s;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          const innerAngle = ((i + 0.5) * Math.PI) / 3;
          ctx.lineTo(Math.cos(innerAngle) * s * 0.5, Math.sin(innerAngle) * s * 0.5);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'diamond': {
        const d = size * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -d);
        ctx.lineTo(d * 0.6, 0);
        ctx.lineTo(0, d);
        ctx.lineTo(-d * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
    ctx.restore();
  }

  function updateConfetti() {
    pieces.forEach((piece) => {
      piece.floatPhase += 0.02;
      const swayX = Math.sin(piece.floatPhase) * piece.swayAmplitude * 0.3;
      const bobY = Math.cos(piece.floatPhase * 0.7) * piece.bobAmplitude * 0.2;

      piece.x += piece.velocityX + swayX;
      piece.y += piece.velocityY + bobY;
      piece.z += piece.velocityZ;
      piece.rotation += piece.rotationSpeed;

      const turbulence = Math.max(0, 1 - piece.z / 1500) * 0.08;
      piece.velocityX += (Math.random() - 0.5) * turbulence * 0.5;
      piece.velocityY += (Math.random() - 0.5) * turbulence * 0.5;
      piece.velocityX += (Math.random() - 0.5) * 0.005;
      piece.velocityY += (Math.random() - 0.5) * 0.005;
      piece.velocityX *= 0.999;
      piece.velocityY *= 0.999;
      piece.velocityY += 0.0005;
      piece.velocityZ *= 1.0005;

      if (!piece.isFading && (piece.z <= 200 || piece.x < -150 || piece.x > canvas.width + 150 || piece.y > canvas.height + 150)) {
        piece.isFading = true;
      }
      if (piece.isFading) piece.opacity -= 0.02;

      if (piece.opacity <= 0) Object.assign(piece, makePiece(true));
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateConfetti();
    pieces.forEach(drawPiece);
    animationId = requestAnimationFrame(animate);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    initConfetti();
    animate();
  }
})();

// Rotating wireframe dotted globe — sits behind hero content only
(function () {
  const canvas = document.getElementById('globe-canvas');
  const hero = document.getElementById('home');
  if (!canvas || !hero || typeof d3 === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let size = 0;
  let radius = 0;
  let landFeatures = null;
  let dots = [];
  let projection = null;
  let path = null;
  let rotationTimer = null;
  const rotation = [0, 0];
  let autoRotate = !prefersReducedMotion;
  const rotationSpeed = 0.25;

  function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function pointInFeature(point, feature) {
    const geometry = feature.geometry;
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates;
      if (!pointInPolygon(point, coords[0])) return false;
      for (let i = 1; i < coords.length; i++) if (pointInPolygon(point, coords[i])) return false;
      return true;
    }
    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        if (pointInPolygon(point, polygon[0])) {
          let inHole = false;
          for (let i = 1; i < polygon.length; i++) {
            if (pointInPolygon(point, polygon[i])) { inHole = true; break; }
          }
          if (!inHole) return true;
        }
      }
      return false;
    }
    return false;
  }

  function generateDotsInFeature(feature, dotSpacing) {
    const result = [];
    const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feature);
    const step = dotSpacing * 0.08;
    for (let lng = minLng; lng <= maxLng; lng += step) {
      for (let lat = minLat; lat <= maxLat; lat += step) {
        if (pointInFeature([lng, lat], feature)) result.push([lng, lat]);
      }
    }
    return result;
  }

  function setupCanvas() {
    const rect = hero.getBoundingClientRect();
    size = Math.min(rect.width, rect.height, 640);
    radius = size / 2.5;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    projection = d3.geoOrthographic().scale(radius).translate([size / 2, size / 2]).clipAngle(90);
    path = d3.geoPath().projection(projection).context(ctx);
  }

  function render() {
    if (!projection) return;
    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, projection.scale(), 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (!landFeatures) return;

    const graticule = d3.geoGraticule();
    ctx.beginPath();
    path(graticule());
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.beginPath();
    landFeatures.features.forEach((feature) => path(feature));
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    dots.forEach(([lng, lat]) => {
      const projected = projection([lng, lat]);
      if (projected && projected[0] >= 0 && projected[0] <= size && projected[1] >= 0 && projected[1] <= size) {
        ctx.beginPath();
        ctx.arc(projected[0], projected[1], 1, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(180,190,210,0.7)';
        ctx.fill();
      }
    });
  }

  function rotate() {
    if (!autoRotate) return;
    rotation[0] += rotationSpeed;
    projection.rotate(rotation);
    render();
  }

  function attachInteraction() {
    canvas.addEventListener('mousedown', (event) => {
      autoRotate = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation = [...rotation];

      function onMove(moveEvent) {
        const sensitivity = 0.4;
        rotation[0] = startRotation[0] + (moveEvent.clientX - startX) * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - (moveEvent.clientY - startY) * sensitivity));
        projection.rotate(rotation);
        render();
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (!prefersReducedMotion) setTimeout(() => { autoRotate = true; }, 10);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  async function init() {
    setupCanvas();
    attachInteraction();
    render();

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json'
      );
      if (!response.ok) throw new Error('Failed to load land data');
      landFeatures = await response.json();
      dots = landFeatures.features.flatMap((feature) => generateDotsInFeature(feature, 16));
      render();
    } catch (err) {
      return;
    }

    rotationTimer = d3.timer(rotate);
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setupCanvas();
      projection.rotate(rotation);
      render();
    }, 200);
  });

  init();
})();
