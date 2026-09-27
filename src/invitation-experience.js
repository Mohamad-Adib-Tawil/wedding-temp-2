/** Keeps the ballroom as the first scrollable scene after the door opens. */
export function initExperience(config, showToast) {
  const cover = document.querySelector('#experience');
  const site = document.querySelector('#wedding-content');
  const doorVideo = document.querySelector('#door-video');
  const audio = document.querySelector('#background-music');
  const soundButton = document.querySelector('#sound-toggle');
  const openButton = document.querySelector('#open-invitation');
  const skipButton = document.querySelector('#skip-intro');
  const replayButton = document.querySelector('#replay-invitation');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let started = false;
  let hallShown = false;

  if (config.audioPath) audio.src = config.audioPath;

  function addLights(container, count, sideOnly = false) {
    if (reduceMotion.matches) return;
    for (let index = 0; index < count; index += 1) {
      const light = document.createElement('i');
      const fraction = ((index * 67 + 23) % 101) / 100;
      const x = sideOnly ? (index % 2 ? 4 + fraction * 16 : 80 + fraction * 16) : fraction * 100;
      light.style.left = `${x}%`;
      light.style.top = `${(index * 43 + 17) % 96}%`;
      light.style.setProperty('--spark-size', `${2 + index % 3}px`);
      light.style.setProperty('--spark-delay', `${(index % 7) * -.43}s`);
      container.append(light);
    }
  }

  addLights(document.querySelector('#cover-glints'), 16);
  addLights(document.querySelector('#crystal-dust'), 18, true);
  const strands = document.querySelector('#hall-strands');
  if (!reduceMotion.matches) {
    for (let index = 0; index < 12; index += 1) {
      const strand = document.createElement('i');
      strand.className = 'strand';
      strand.style.left = `${index < 6 ? 3 + index * 3 : 81 + (index - 6) * 3}%`;
      strand.style.height = `${180 + (index * 53) % 190}px`;
      strand.style.setProperty('--glowDelay', `${index * -.47}s`);
      strands.append(strand);
    }
  }

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
  }

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers.clear();
  }

  function updateSoundButton() {
    soundButton.hidden = !config.audioPath || !started;
    soundButton.textContent = audio.paused ? config.copy.unmute : config.copy.mute;
    soundButton.setAttribute('aria-label', soundButton.textContent);
    soundButton.setAttribute('aria-pressed', String(!audio.paused));
  }

  function playAudio() {
    if (!config.audioPath) return;
    audio.play().then(updateSoundButton).catch(() => {
      updateSoundButton();
      showToast(config.copy.musicUnavailable);
    });
  }

  function revealSections() {
    if (reduceMotion.matches) {
      document.querySelectorAll('.sreveal,.creveal').forEach((node) => node.classList.add('is-in', 'is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .1, rootMargin: '0px 0px -25px 0px' });
    document.querySelectorAll('.creveal').forEach((node) => observer.observe(node));
  }

  function showHall() {
    if (!started || hallShown) return;
    hallShown = true;
    clearTimers();
    doorVideo.pause();
    site.classList.add('visible');
    site.inert = false;
    site.setAttribute('aria-hidden', 'false');
    document.body.classList.remove('is-locked');
    window.scrollTo({ top: 0, behavior: 'instant' });
    const stage = document.querySelector('#home');
    stage.focus({ preventScroll: true });
    const stageItems = [...stage.querySelectorAll('.sreveal')];
    stageItems.forEach((item, index) => schedule(() => item.classList.add('is-in'), reduceMotion.matches ? 0 : 250 + index * 470));
    revealSections();
    cover.classList.add('is-open');
    if (reduceMotion.matches) cover.hidden = true;
    else schedule(() => { cover.hidden = true; }, 1200);
  }

  function startOpening() {
    if (started) return;
    started = true;
    skipButton.hidden = false;
    if (!reduceMotion.matches) playAudio();
    updateSoundButton();
    if (reduceMotion.matches) { showHall(); return; }
    cover.classList.add('is-playing');
    doorVideo.currentTime = 0;
    doorVideo.play().catch(showHall);
    schedule(showHall, 16_000);
  }

  function replay() {
    clearTimers();
    doorVideo.pause();
    doorVideo.currentTime = 0;
    audio.pause();
    audio.currentTime = 0;
    started = false;
    hallShown = false;
    updateSoundButton();
    window.scrollTo({ top: 0, behavior: 'instant' });
    site.inert = true;
    site.setAttribute('aria-hidden', 'true');
    site.classList.remove('visible');
    document.body.classList.add('is-locked');
    cover.hidden = false;
    cover.classList.remove('is-playing', 'is-flood', 'is-open');
    doorVideo.classList.remove('is-live');
    document.querySelectorAll('.sreveal').forEach((node) => node.classList.remove('is-in'));
    skipButton.hidden = true;
    openButton.focus();
  }

  openButton.addEventListener('click', startOpening);
  cover.addEventListener('click', (event) => {
    if (event.target.closest('#skip-intro,#open-invitation')) return;
    startOpening();
  });
  doorVideo.addEventListener('playing', () => doorVideo.classList.add('is-live'));
  doorVideo.addEventListener('timeupdate', () => {
    if (doorVideo.currentTime >= 8.85) cover.classList.add('is-flood');
  });
  doorVideo.addEventListener('ended', showHall);
  doorVideo.addEventListener('error', showHall);
  skipButton.addEventListener('click', showHall);
  replayButton.addEventListener('click', replay);
  soundButton.addEventListener('click', () => {
    if (audio.paused) playAudio();
    else { audio.pause(); updateSoundButton(); }
  });
  reduceMotion.addEventListener('change', () => {
    if (!reduceMotion.matches) return;
    audio.pause();
    doorVideo.pause();
    updateSoundButton();
    if (started && !cover.hidden) showHall();
  });
}
