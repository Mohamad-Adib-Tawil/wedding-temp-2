import { weddingConfig as config } from './wedding-config.js';
import { initExperience } from './invitation-experience.js';
import { zonedDateTime, eventEnd, calendarStamp, buildIcs } from './calendar.js';

const $ = (selector) => document.querySelector(selector);
const copy = config.copy;
let toastTimer;

function hydrateCopy() {
  document.title = copy.pageTitle;
  document.querySelectorAll('[data-copy]').forEach((node) => {
    node.textContent = copy[node.dataset.copy] || '';
  });
  document.querySelectorAll('[data-name="groom"]').forEach((node) => { node.textContent = config.groom.ar; });
  document.querySelectorAll('[data-name="bride"]').forEach((node) => { node.textContent = config.bride.ar; });
  $('#open-invitation').setAttribute('aria-label', `${copy.open}: ${config.groom.ar} و${config.bride.ar}`);
}

function eventStart() {
  return zonedDateTime(config.weddingDate, config.startTime, config.timeZone);
}

function updateCountdown(start) {
  const remaining = Math.max(0, start.getTime() - Date.now());
  $('#countdown').hidden = remaining === 0;
  $('#countdown-complete').hidden = remaining !== 0;
  if (remaining === 0) return;
  const values = [
    [Math.floor(remaining / 86_400_000), copy.days],
    [Math.floor((remaining % 86_400_000) / 3_600_000), copy.hours],
    [Math.floor((remaining % 3_600_000) / 60_000), copy.minutes],
    [Math.floor((remaining % 60_000) / 1000), copy.seconds],
  ];
  $('#countdown').replaceChildren(...values.map(([number, label]) => {
    const unit = document.createElement('div');
    unit.className = 'countdown__unit';
    const value = document.createElement('strong');
    value.textContent = String(number).padStart(2, '0');
    const text = document.createElement('span');
    text.textContent = label;
    unit.append(value, text);
    return unit;
  }));
}

function downloadCalendar(start, end) {
  const location = [config.venue, config.address].filter(Boolean).join(', ');
  const description = config.mapsUrl || config.siteUrl;
  const ics = buildIcs({ start, end, title: copy.pageTitle, location, description, uid: crypto.randomUUID() });
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'wedding-invitation.ics';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderEvent() {
  const start = eventStart();
  if (!start) return;
  $('#countdown-section').hidden = false;
  updateCountdown(start);
  window.setInterval(() => updateCountdown(start), 1000);

  const end = eventEnd(config, start);
  if (!end) return;
  $('#calendar-section').hidden = false;
  $('#event-date').textContent = new Intl.DateTimeFormat('ar', { timeZone: config.timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(start);
  $('#event-time').textContent = config.startTime;
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: copy.pageTitle,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`, ctz: config.timeZone,
    details: config.siteUrl,
  });
  if (config.venue || config.address) params.set('location', [config.venue, config.address].filter(Boolean).join(', '));
  $('#google-calendar').href = `https://calendar.google.com/calendar/render?${params}`;
  $('#ics-calendar').addEventListener('click', () => downloadCalendar(start, end));
}

function renderOptionalSections() {
  const program = config.program.filter((item) => item?.time && item?.title);
  if (program.length) {
    $('#program-section').hidden = false;
    $('#program-list').replaceChildren(...program.map(({ time, title }) => {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = title;
      const clock = document.createElement('time');
      clock.textContent = time;
      row.append(label, clock);
      return row;
    }));
  }
  if (config.venue || config.address || config.mapsUrl) {
    $('#venue-section').hidden = false;
    $('#venue-name').textContent = config.venue;
    $('#venue-name').hidden = !config.venue;
    $('#venue-address').textContent = config.address;
    $('#venue-address').hidden = !config.address;
    if (/^https:\/\//.test(config.mapsUrl)) {
      $('#map-link').hidden = false;
      $('#map-link').href = config.mapsUrl;
    }
  }
  if (config.guestNotes.length) {
    $('#notes-section').hidden = false;
    $('#notes-list').replaceChildren(...config.guestNotes.map((note) => {
      const item = document.createElement('li');
      item.textContent = note;
      return item;
    }));
  }
  if (/^\d{7,15}$/.test(config.rsvp.whatsappNumber)) {
    $('#rsvp-section').hidden = false;
    if (config.rsvp.deadline) {
      $('#rsvp-deadline').hidden = false;
      $('#rsvp-deadline').textContent = `${copy.rsvpDeadline} ${config.rsvp.deadline}`;
    }
    $('#rsvp-link').href = `https://wa.me/${config.rsvp.whatsappNumber}?text=${encodeURIComponent(copy.rsvpMessage)}`;
  }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2500);
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast(copy.copied);
  } catch {
    showToast(copy.copyFailed);
  }
}

async function shareInvitation() {
  if (!navigator.share) return copyLink();
  try {
    await navigator.share({ title: copy.pageTitle, text: copy.pageDescription, url: window.location.href });
  } catch (error) {
    if (error.name !== 'AbortError') showToast(copy.copyFailed);
  }
}

hydrateCopy();
renderEvent();
renderOptionalSections();
initExperience(config, showToast);
$('#share-button').addEventListener('click', shareInvitation);
$('#copy-link').addEventListener('click', copyLink);
