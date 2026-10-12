(() => {
  const menu = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-navigation');
  function closeMenu() { menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','メニューを開く'); nav.classList.remove('open'); }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open ? 'メニューを閉じる' : 'メニューを開く'); nav.classList.toggle('open',open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e => { if(e.key==='Escape' && nav.classList.contains('open')){closeMenu();menu.focus();} });
  document.addEventListener('click',e => { if(!e.target.closest('.site-header'))closeMenu(); });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), {threshold:.08});
    const headings = document.querySelectorAll('main h1, main h2, main .section-label, .hero-copy > .eyebrow, .hero-description, .page-lead');
    const photos = document.querySelectorAll('.triptych-image, .case-image > a, .president-image, .dfm-case > a, .related-work > a');
    headings.forEach(el => {
      el.classList.add('motion-reveal');
      el.style.setProperty('--reveal-delay', el.matches('h1,h2') ? '90ms' : el.matches('.hero-description,.page-lead') ? '180ms' : '0ms');
    });
    photos.forEach((el, index) => {
      el.classList.add('motion-reveal', 'motion-photo');
      el.style.setProperty('--reveal-delay', el.matches('.triptych-image') ? `${index % 3 * 110}ms` : '60ms');
    });
    document.querySelectorAll('.process-drawing').forEach(svg => {
      svg.querySelectorAll('path:not([stroke-dasharray])').forEach((path, index) => {
        const length = path.getTotalLength();
        path.style.setProperty('--path-length', String(length));
        path.style.setProperty('--draw-delay', `${index * 180}ms`);
        path.classList.add('draw-path');
      });
      svg.classList.add('motion-drawing');
    });
    const targets = document.querySelectorAll('.motion-reveal, .motion-drawing');
    targets.forEach(el => { if (reducedMotion.matches) el.classList.add('visible'); else observer.observe(el); });
    document.body.classList.add('motion-ready');
    // Keyboard focus must never land on visually concealed content.
    document.addEventListener('focusin', event => {
      const el = event.target.closest('.motion-reveal');
      if (el) { el.classList.add('visible'); observer.unobserve(el); }
    });
    reducedMotion.addEventListener('change', e => {
      if (e.matches) { targets.forEach(el => el.classList.add('visible')); observer.disconnect(); }
    });
  }

  const dialog=document.getElementById('image-dialog');
  if(dialog){
    let opener;
    document.querySelectorAll('[data-image-caption]').forEach(link=>link.addEventListener('click',e=>{
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
      e.preventDefault(); opener=link;
      const image=document.getElementById('image-expanded'); image.src=link.href; image.alt=link.dataset.imageCaption;
      document.getElementById('image-caption').textContent=link.dataset.imageCaption;
      dialog.showModal(); document.body.classList.add('dialog-open');
    }));
    document.getElementById('image-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
    dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');opener?.focus({preventScroll:true});});
  }
  const copy=document.getElementById('copy-template');
  if(copy)copy.addEventListener('click',async()=>{
    const template=document.getElementById('inquiry-template'); const status=document.getElementById('copy-status');
    try { await navigator.clipboard.writeText(template.textContent); status.textContent='コピーしました。メール本文に貼り付けてお使いください。'; }
    catch {const range=document.createRange();range.selectNodeContents(template);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='自動コピーが許可されていません。選択した本文を手動でコピーしてください。';}
  });

  // Progressive enhancement: the original figures and anchors remain the static layout.
  const storyMedia = matchMedia('(min-width: 1000px) and (min-height: 640px)');
  const story = document.getElementById('case-story');
  if (story) {
    const sections = [...story.querySelectorAll('.case-step')];
    const frames = [...story.querySelectorAll('[data-story-frame]')];
    const links = [...story.querySelectorAll('[data-story-link]')];
    let active = '', queued = false, lastStoryFocus = null;
    document.addEventListener('focusin', event => { lastStoryFocus = story.contains(event.target) ? event.target : null; });
    function updateStory() {
      queued = false;
      if (!story.classList.contains('story-enabled') || reducedMotion.matches || !storyMedia.matches) return;
      const readingLine = innerHeight * .52;
      const current = sections.reduce((chosen, section) => section.getBoundingClientRect().top <= readingLine ? section : chosen, sections[0]);
      if (active === current.id) return;
      active = current.id;
      story.dataset.activeStep = active;
      frames.forEach(frame => {
        const selected = frame.dataset.storyFrame === active;
        // Do not strand keyboard focus on a figure hidden by scrolling.
        if (!selected && frame.contains(document.activeElement)) links.find(link => link.dataset.storyLink === active).focus({preventScroll:true});
        frame.classList.toggle('is-active', selected);
        frame.inert = !selected;
        frame.setAttribute('aria-hidden', String(!selected));
      });
      links.forEach(link => {
        if (link.dataset.storyLink === active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    function requestStory() { if (!queued) { queued = true; requestAnimationFrame(updateStory); } }
    function configureStory() {
      const enabled = storyMedia.matches && !reducedMotion.matches;
      const panel = story.querySelector('.case-story-panel');
      // CSS media rules may already have hidden the focused element before this event.
      const focused = document.activeElement === document.body ? lastStoryFocus : document.activeElement;
      const fromPanel = !enabled && focused && panel.contains(focused);
      const fromSection = enabled ? focused?.closest('.case-step .case-image') : null;
      const focusedStep = fromSection?.closest('.case-step').id;
      const previousStep = focused?.closest('[data-story-frame]')?.dataset.storyFrame || focused?.dataset.storyLink || active;
      story.classList.toggle('story-enabled', enabled);
      active = ''; updateStory();
      if (fromPanel) sections.find(section => section.id === previousStep)?.querySelector('a')?.focus({preventScroll:true});
      if (fromSection) links.find(link => link.dataset.storyLink === focusedStep)?.focus({preventScroll:true});
    }
    addEventListener('scroll', requestStory, {passive:true});
    addEventListener('resize', configureStory, {passive:true});
    reducedMotion.addEventListener('change', configureStory);
    document.fonts.ready.then(requestStory);
    configureStory();
  }

  const stage = document.getElementById('sculpture-stage');
  if (!stage) return;
  const hero = document.getElementById('hero');
  const form = document.getElementById('view-form'), structure = document.getElementById('view-structure');
  const auto = document.getElementById('view-auto'), motion = document.getElementById('motion-toggle');
  const desktopMotion = matchMedia('(min-width: 1000px) and (pointer: fine)');
  let automatic = true, paused = reducedMotion.matches, wire = false, queued = false;
  function setView(nextWire) {
    wire = nextWire;
    form.classList.toggle('active', !wire); structure.classList.toggle('active', wire);
    form.setAttribute('aria-pressed', String(!wire)); structure.setAttribute('aria-pressed', String(wire));
    stage.classList.toggle('wireframe-fallback', wire);
    window.dispatchEvent(new CustomEvent('metal-view', {detail:{wire}}));
  }
  function updateHero() {
    queued = false;
    if (paused || reducedMotion.matches) return;
    const progress = desktopMotion.matches ? Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / (hero.offsetHeight * .5))) : 0;
    stage.dataset.scrollProgress = String(progress);
    window.dispatchEvent(new CustomEvent('metal-scroll', {detail:{progress}}));
    if (automatic && wire !== (progress >= .6)) setView(progress >= .6);
  }
  function requestHero() { if (!queued) { queued = true; requestAnimationFrame(updateHero); } }
  function setAutomatic(value) {
    automatic = value; auto.classList.toggle('active', value); auto.setAttribute('aria-pressed', String(value));
  }
  [form, structure].forEach(button => button.addEventListener('click', () => { setAutomatic(false); setView(button === structure); }));
  auto.addEventListener('click', () => { setAutomatic(true); requestHero(); });
  function setPaused(value) {
    paused = value;
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? 'アニメーションを再生' : 'アニメーションを停止');
    motion.textContent = paused ? '▷' : 'Ⅱ';
    window.dispatchEvent(new CustomEvent('metal-motion', {detail:{paused}}));
    if (!paused) requestHero();
  }
  motion.addEventListener('click', () => setPaused(!paused));
  reducedMotion.addEventListener('change', e => setPaused(e.matches));
  addEventListener('scroll', requestHero, {passive:true});
  addEventListener('resize', requestHero, {passive:true});
  setPaused(reducedMotion.matches);
})();
