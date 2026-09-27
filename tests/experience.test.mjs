import test from 'node:test';
import assert from 'node:assert/strict';
import { initExperience } from '../src/invitation-experience.js';

function element() {
  const listeners = new Map();
  return {
    hidden: false, inert: false, dataset: {}, textContent: '', paused: true,
    classList: { add() {}, remove() {} },
    setAttribute() {}, focus() {},
    addEventListener(name, callback) { listeners.set(name, callback); },
    click() { listeners.get('click')?.(); },
  };
}

function setup(reduced) {
  const selectors = Object.fromEntries([
    '#experience', '#wedding-content', '#open-invitation', '.cover-content', '#hall-content',
    '#skip-intro', '#continue-to-site', '#replay-invitation', '#sound-toggle',
    '#background-music', '#home',
  ].map((key) => [key, element()]));
  const arch = element();
  selectors['#experience'].querySelector = () => arch;
  let plays = 0;
  selectors['#background-music'].play = () => {
    plays += 1;
    selectors['#background-music'].paused = false;
    return Promise.resolve();
  };
  selectors['#background-music'].pause = () => { selectors['#background-music'].paused = true; };
  globalThis.document = {
    querySelector: (selector) => selectors[selector],
    body: { classList: { add() {}, remove() {} } },
  };
  globalThis.window = {
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    setTimeout: () => 1,
    clearTimeout() {},
    scrollTo() {},
  };
  const config = { audioPath: 'assets/audio/test.wav', copy: { mute: 'كتم', unmute: 'تشغيل', musicUnavailable: 'تعذر' } };
  initExperience(config, () => {});
  return { selectors, get plays() { return plays; } };
}

test('reduced motion reveals content immediately without automatic audio', () => {
  const app = setup(true);
  app.selectors['#open-invitation'].click();
  assert.equal(app.plays, 0);
  assert.equal(app.selectors['#experience'].hidden, true);
  assert.equal(app.selectors['#wedding-content'].inert, false);
});

test('normal opening starts audio only after the guest clicks', () => {
  const app = setup(false);
  assert.equal(app.plays, 0);
  app.selectors['#open-invitation'].click();
  assert.equal(app.plays, 1);
  app.selectors['#skip-intro'].click();
  assert.equal(app.selectors['#experience'].hidden, true);
});
