/* Hungry Hive — interactions */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const fine = window.matchMedia('(pointer:fine)').matches;
  document.body.classList.add('is-loading');
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { offset: -90 }) : el.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- Toast ---------- */
  const toastEl = document.getElementById('toast'); let toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600); }

  /* ---------- Cart ---------- */
  const cartBtn = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');
  let count = 0;
  function addToCart(name, fromImg) {
    const done = () => {
      count++;
      cartCount.textContent = count;
      cartBtn.setAttribute('aria-label', `Cart, ${count} item${count > 1 ? 's' : ''}`);
      if (hasGsap) gsap.fromTo(cartBtn, { scale: 1.18, rotate: -4 }, { scale: 1, rotate: 0, duration: .6, ease: 'elastic.out(1,.4)' });
      toast(`${name} added to your cart`);
    };
    if (!fromImg || !hasGsap || reduce) return done();
    const a = fromImg.getBoundingClientRect(), b = cartBtn.getBoundingClientRect();
    const f = document.createElement('img');
    f.src = fromImg.currentSrc || fromImg.src; f.className = 'fly'; f.alt = '';
    document.body.appendChild(f);
    gsap.set(f, { left: a.left + a.width / 2 - 28, top: a.top + a.height / 2 - 28 });
    gsap.timeline({ onComplete: () => { f.remove(); done(); } })
      .to(f, { left: b.left + b.width - 40, duration: .8, ease: 'power1.inOut' }, 0)
      .to(f, { top: a.top - 120, duration: .35, ease: 'power2.out' }, 0)
      .to(f, { top: b.top, duration: .45, ease: 'power2.in' }, .35)
      .to(f, { scale: .3, opacity: .4, duration: .3 }, .55);
  }

  /* ---------- Bestsellers ---------- */
  document.querySelectorAll('.add').forEach(btn => btn.addEventListener('click', () => {
    addToCart(btn.dataset.name, btn.closest('.dish').querySelector('img'));
    btn.classList.add('added'); btn.textContent = 'Added';
    setTimeout(() => { btn.classList.remove('added'); btn.textContent = 'Add'; }, 1800);
  }));
  const filterBtns = document.querySelectorAll('.filter button');
  filterBtns.forEach(b => b.addEventListener('click', () => {
    filterBtns.forEach(x => x.classList.toggle('is-on', x === b));
    const f = b.dataset.f;
    const dishes = document.querySelectorAll('.dish');
    dishes.forEach(d => d.classList.toggle('is-hidden', f !== 'all' && d.dataset.type !== f));
    if (hasGsap && !reduce) gsap.fromTo('.dish:not(.is-hidden)', { y: 30, opacity: 0, rotate: -2 }, { y: 0, opacity: 1, rotate: 0, duration: .5, stagger: .06, ease: 'back.out(1.6)' });
    if (hasGsap) ScrollTrigger.refresh();
  }));

  /* ---------- Bowl builder ---------- */
  const bowlForm = document.getElementById('bowlForm');
  const bowlPrice = document.getElementById('bowlPrice');
  const BASE = 249;
  function price() {
    const sum = [...bowlForm.querySelectorAll('input:checked')].reduce((s, i) => s + Number(i.value), BASE);
    const cur = Number(bowlPrice.textContent.replace(/\D/g, '')) || BASE;
    if (hasGsap && !reduce) {
      const o = { v: cur };
      gsap.to(o, { v: sum, duration: .5, ease: 'power2.out', onUpdate: () => bowlPrice.textContent = '₹' + Math.round(o.v) });
      gsap.fromTo('.bowl-plate', { rotate: -14 }, { rotate: 0, duration: .9, ease: 'elastic.out(1,.45)' });
    } else bowlPrice.textContent = '₹' + sum;
    return sum;
  }
  bowlForm.addEventListener('change', price);
  bowlForm.addEventListener('submit', e => {
    e.preventDefault();
    const sel = n => bowlForm.querySelector(`input[name="${n}"]:checked`).dataset.label;
    addToCart(`${sel('protein')} bowl on ${sel('base').toLowerCase()}`, document.querySelector('.bowl-plate img'));
  });

  /* ---------- Delivery zones ---------- */
  const zoneForm = document.getElementById('zoneForm');
  const zoneInput = document.getElementById('zoneInput');
  const zoneResult = document.getElementById('zoneResult');
  const zones = [...document.querySelectorAll('#zoneCloud li')];
  zoneForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = zoneInput.value.trim().toLowerCase();
    zones.forEach(z => z.classList.remove('hit'));
    if (!q) { zoneResult.textContent = 'Type your area to check delivery.'; zoneInput.focus(); return; }
    const hit = zones.find(z => z.textContent.toLowerCase().includes(q) || q.includes(z.textContent.toLowerCase()));
    if (hit) {
      hit.classList.add('hit');
      zoneResult.textContent = `Yes — we deliver to ${hit.textContent} in about 25–35 minutes.`;
      if (hasGsap && !reduce) gsap.fromTo(hit, { scale: 1.4 }, { scale: 1, duration: .7, ease: 'elastic.out(1,.4)' });
    } else {
      zoneResult.textContent = `We don't reach "${zoneInput.value.trim()}" yet. Try ordering on Swiggy or Zomato for wider coverage.`;
    }
  });

  /* ---------- Live order feed ---------- */
  const feed = document.getElementById('liveFeed');
  const items = feed.children.length;
  let fi = 0;
  if (!reduce) setInterval(() => { fi = (fi + 1) % items; feed.style.transform = `translateY(-${fi * 1.6}em)`; }, 2600);

  /* ---------- Magnetic buttons ---------- */
  if (hasGsap && fine && !reduce) {
    document.querySelectorAll('.magnetic').forEach(el => {
      const qx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
      const qy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .3); qy((e.clientY - r.top - r.height / 2) * .4); });
      el.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });
  }

  /* ---------- Loader ---------- */
  const loader = document.getElementById('loader');
  const steps = loader.querySelectorAll('.ticket-steps li');
  function finish() {
    document.body.classList.remove('is-loading');
    if (!hasGsap || reduce) { loader.remove(); return; }
    gsap.to(loader, { yPercent: -100, borderBottomLeftRadius: '50% 120px', borderBottomRightRadius: '50% 120px', duration: .8, ease: 'expo.inOut', onComplete: () => loader.remove() });
    if (intro) intro.play(0);
  }
  let intro;
  if (hasGsap && !reduce) {
    intro = gsap.timeline({ paused: true, delay: .15 })
      .from('.nav', { y: -120, duration: .8, ease: 'expo.out' }, 0)
      .from('.hero-content > *', { y: 35, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out' }, .1)
      .from('.hero-stage', { scale: .85, opacity: 0, duration: 1, ease: 'back.out(1.2)' }, .2);
    const fill = document.getElementById('ticketFill');
    const scooter = document.getElementById('ticketScooter');
    const road = scooter.parentElement;
    const p = { v: 0 };
    gsap.to(p, {
      v: 1, duration: 1, ease: 'power1.inOut',
      onUpdate: () => {
        fill.style.width = (p.v * 100) + '%';
        scooter.style.left = (p.v * road.clientWidth) + 'px';
        steps.forEach((s, i) => s.classList.toggle('done', p.v >= i / 2.2));
      },
      onComplete: () => setTimeout(finish, 150)
    });
  } else {
    steps.forEach(s => s.classList.add('done'));
    setTimeout(finish, 400);
  }

  if (!hasGsap || reduce) return;

  /* ---------- Scroll scenes ---------- */
  // Hero: stage gently floats on scroll
  gsap.to('.hero-stage', { y: 50, scale: .96, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Mouse parallax on the hero stage
  if (fine) {
    const stage = document.querySelector('.hero-stage');
    if (stage) {
      const sx = gsap.quickTo(stage, 'x', { duration: .7, ease: 'power2.out' });
      const sy = gsap.quickTo(stage, 'y', { duration: .7, ease: 'power2.out' });
      document.querySelector('.hero').addEventListener('mousemove', e => {
        const dx = (e.clientX / innerWidth - .5) * 24;
        const dy = (e.clientY / innerHeight - .5) * 24;
        sx(dx);
        sy(dy);
      });
      stage.addEventListener('mouseenter', () => stage.classList.add('is-paused'));
      stage.addEventListener('mouseleave', () => stage.classList.remove('is-paused'));
    }
  }

  // Brands: stacked cards shrink & tilt as the next one lands
  const cards = gsap.utils.toArray('.brand-card');
  cards.forEach((card, i) => {
    gsap.from(card.querySelector('.bc-img img'), { scale: 1.3, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 100px', scrub: true } });
    if (i === cards.length - 1) return;
    gsap.fromTo(card, { scale: 1, rotate: 0, filter: 'brightness(1)' }, {
      scale: .9 + i * .012, rotate: i % 2 ? 1.5 : -1.5, filter: 'brightness(.82)', ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 100px', scrub: true }
    });
  });
  gsap.from('.brands-intro h2', { y: 80, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.brands-intro', start: 'top 85%' } });

  // How it works: draw the route, pop the steps
  const path = document.getElementById('howPath');
  if (path) {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.how-wrap', start: 'top 75%', end: 'bottom 60%', scrub: true } });
  }
  gsap.from('.how-steps li', { y: 100, rotate: i => [-6, 4, -3][i], opacity: 0, duration: .9, stagger: .15, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.how-steps', start: 'top 80%' } });
  gsap.from('.how-num', { scale: 0, duration: .6, stagger: .15, delay: .4, ease: 'back.out(3)', scrollTrigger: { trigger: '.how-steps', start: 'top 80%' } });

  // Bowl section: plate spins in
  gsap.from('.bowl-plate', { rotate: -90, scale: .7, ease: 'none', scrollTrigger: { trigger: '.bowl', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.from('.bowl-price', { x: 80, opacity: 0, duration: .8, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.bowl', start: 'top 60%' } });

  // Bestsellers: cards drop in like tickets
  gsap.from('.dish', { y: 120, rotate: i => (i % 2 ? 5 : -5), opacity: 0, duration: .9, stagger: .08, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.best-grid', start: 'top 80%' } });

  // Zones: area pills scatter in
  gsap.from('.zone-cloud li', { scale: 0, rotate: () => gsap.utils.random(-30, 30), duration: .6, stagger: { each: .04, from: 'center' }, ease: 'back.out(2)', scrollTrigger: { trigger: '.zone-cloud', start: 'top 85%' } });

  // Corporate image wipes open
  gsap.from('.corp-img', { clipPath: 'inset(0 100% 0 0)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: '.corp', start: 'top 75%' } });

  // Footer headline bounces up
  gsap.from('.foot-top h2', { y: 120, rotate: -4, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 80%' } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
