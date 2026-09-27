/** Owns the opening timeline, replay, accessibility state, and opt-in audio. */
export function initExperience(config, showToast) {
  const root = document.querySelector('#experience');
  const site = document.querySelector('#wedding-content');
  const openButton = document.querySelector('#open-invitation');
  const coverContent = document.querySelector('.cover-content');
  const hallContent = document.querySelector('#hall-content');
  const skipButton = document.querySelector('#skip-intro');
  const continueButton = document.querySelector('#continue-to-site');
  const replayButton = document.querySelector('#replay-invitation');
  const soundButton = document.querySelector('#sound-toggle');
  const audio = document.querySelector('#background-music');
  const doorVideo = document.querySelector('#door-video');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let started = false;
  let touchStartY = null;

  if (config.audioPath) audio.src = config.audioPath;

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  }

  function clearTimeline() {
    timers.forEach((timer) => window.clearTimeout(timer));
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

  function revealSite() {
    clearTimeline();
    doorVideo.pause();
    root.hidden = true;
    site.inert = false;
    site.setAttribute('aria-hidden', 'false');
    document.body.classList.remove('is-locked');
    document.querySelector('#home').focus({ preventScroll: true });
  }

  function showHall() {
    if (root.hidden || root.dataset.stage !== 'opening') return;
    root.dataset.stage = 'hall';
    root.dataset.flash = 'on';
    hallContent.hidden = false;
    schedule(() => { root.dataset.reveal = '1'; }, 450);
    schedule(() => { root.dataset.reveal = '2'; }, 1250);
    schedule(() => { root.dataset.reveal = '3'; }, 2100);
    schedule(revealSite, 7800);
  }

  function startOpening() {
    if (started) return;
    started = true;
    openButton.hidden = true;
    coverContent.inert = true;
    skipButton.hidden = false;
    if (!reduceMotion.matches) playAudio();
    updateSoundButton();
    if (reduceMotion.matches) {
      revealSite();
      return;
    }
    root.dataset.stage = 'opening';
    doorVideo.currentTime = 0;
    doorVideo.play().catch(showHall);
    schedule(showHall, 16_000);
  }

  function replay() {
    clearTimeline();
    touchStartY = null;
    doorVideo.pause();
    doorVideo.currentTime = 0;
    audio.pause();
    audio.currentTime = 0;
    started = false;
    updateSoundButton();
    window.scrollTo({ top: 0, behavior: 'instant' });
    site.inert = true;
    site.setAttribute('aria-hidden', 'true');
    document.body.classList.add('is-locked');
    root.hidden = false;
    root.dataset.stage = 'cover';
    root.dataset.flash = 'off';
    root.dataset.video = 'poster';
    root.dataset.reveal = '0';
    coverContent.inert = false;
    hallContent.hidden = true;
    openButton.hidden = false;
    skipButton.hidden = true;
    openButton.focus();
  }

  openButton.addEventListener('click', startOpening);
  root.querySelector('.cover-scene').addEventListener('click', startOpening);
  coverContent.addEventListener('click', startOpening);
  doorVideo.addEventListener('playing', () => { root.dataset.video = 'playing'; });
  doorVideo.addEventListener('timeupdate', () => {
    if (root.dataset.stage === 'opening' && doorVideo.currentTime >= 8.85) root.dataset.flash = 'on';
  });
  doorVideo.addEventListener('ended', showHall);
  doorVideo.addEventListener('error', showHall);
  root.addEventListener('wheel', (event) => {
    if (root.dataset.stage === 'hall' && event.deltaY > 12) revealSite();
  }, { passive: true });
  root.addEventListener('touchstart', (event) => {
    if (root.dataset.stage === 'hall') touchStartY = event.touches[0]?.clientY ?? null;
  }, { passive: true });
  root.addEventListener('touchend', (event) => {
    if (root.dataset.stage !== 'hall' || touchStartY === null) return;
    const distance = touchStartY - (event.changedTouches[0]?.clientY ?? touchStartY);
    touchStartY = null;
    if (distance > 45) revealSite();
  }, { passive: true });
  skipButton.addEventListener('click', revealSite);
  continueButton.addEventListener('click', revealSite);
  replayButton.addEventListener('click', replay);
  soundButton.addEventListener('click', () => {
    if (audio.paused) playAudio();
    else {
      audio.pause();
      updateSoundButton();
    }
  });
  reduceMotion.addEventListener('change', () => {
    if (!reduceMotion.matches) return;
    audio.pause();
    doorVideo.pause();
    updateSoundButton();
    if (started && !root.hidden) revealSite();
  });
}
