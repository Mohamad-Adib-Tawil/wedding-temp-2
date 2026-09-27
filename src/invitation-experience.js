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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let started = false;

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
    root.hidden = true;
    site.inert = false;
    site.setAttribute('aria-hidden', 'false');
    document.body.classList.remove('is-locked');
    document.querySelector('#home').focus({ preventScroll: true });
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
    root.dataset.flash = 'on';
    schedule(() => {
      root.dataset.stage = 'hall';
      hallContent.hidden = false;
    }, 2400);
    schedule(() => { root.dataset.reveal = '1'; }, 3300);
    schedule(() => { root.dataset.reveal = '2'; }, 4100);
    schedule(() => { root.dataset.reveal = '3'; }, 5000);
    schedule(revealSite, 10500);
  }

  function replay() {
    clearTimeline();
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
    root.dataset.reveal = '0';
    coverContent.inert = false;
    hallContent.hidden = true;
    openButton.hidden = false;
    skipButton.hidden = true;
    openButton.focus();
  }

  openButton.addEventListener('click', startOpening);
  root.querySelector('.arch').addEventListener('click', startOpening);
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
    updateSoundButton();
    if (started && !root.hidden) revealSite();
  });
}
