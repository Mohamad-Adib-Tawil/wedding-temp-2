import test from 'node:test';
import assert from 'node:assert/strict';
import { initExperience } from '../src/invitation-experience.js';

function element() {
  const listeners = new Map();
  return {
    hidden: false, inert: false, dataset: {}, textContent: '', paused: true,
    classList: { values: new Set(), add(...names) { names.forEach((name) => this.values.add(name)); }, remove(...names) { names.forEach((name) => this.values.delete(name)); }, contains(name) { return this.values.has(name); } },
    style: { setProperty() {} }, append() {}, querySelectorAll() { return []; }, closest() { return null; },
    setAttribute() {}, focus() {},
    addEventListener(name, callback) { listeners.set(name, callback); },
    click() { listeners.get('click')?.(); },
    emit(name, event) { listeners.get(name)?.(event); },
  };
}

function setup(reduced) {
  const selectors = Object.fromEntries([
    '#experience', '#wedding-content', '#open-invitation', '#cover-glints', '#crystal-dust',
    '#hall-strands', '#skip-intro', '#replay-invitation', '#sound-toggle',
    '#background-music', '#door-video', '#home',
  ].map((key) => [key, element()]));
  let plays = 0;
  selectors['#background-music'].play = () => {
    plays += 1;
    selectors['#background-music'].paused = false;
    return Promise.resolve();
  };
  selectors['#background-music'].pause = () => { selectors['#background-music'].paused = true; };
  selectors['#door-video'].play = () => {
    selectors['#door-video'].paused = false;
    return Promise.resolve();
  };
  selectors['#door-video'].pause = () => { selectors['#door-video'].paused = true; };
  globalThis.document = {
    querySelector: (selector) => selectors[selector],
    querySelectorAll: () => [],
    createElement: () => element(),
    body: { classList: { add() {}, remove() {} } },
  };
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} };
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
  assert.equal(app.selectors['#door-video'].paused, false);
  app.selectors['#door-video'].emit('ended');
  assert.equal(app.selectors['#wedding-content'].classList.contains('visible'), true);
  assert.equal(app.selectors['#wedding-content'].inert, false);
  assert.equal(app.selectors['#door-video'].paused, true);
});

test('the hall remains the first scrollable section after the door', () => {
  const app = setup(false);
  app.selectors['#open-invitation'].click();
  app.selectors['#door-video'].emit('ended');
  assert.equal(app.selectors['#wedding-content'].inert, false);
  assert.equal(app.selectors['#home'].hidden, false);
  assert.equal(app.selectors['#wedding-content'].classList.contains('visible'), true);
});
