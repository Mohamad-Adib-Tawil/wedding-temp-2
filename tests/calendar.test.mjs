import test from 'node:test';
import assert from 'node:assert/strict';
import { zonedDateTime, eventEnd, buildIcs } from '../src/calendar.js';

test('requires complete valid date, time, and time zone', () => {
  assert.equal(zonedDateTime('', '19:00', 'Asia/Damascus'), null);
  assert.equal(zonedDateTime('2026-02-30', '19:00', 'Asia/Damascus'), null);
  assert.equal(zonedDateTime('2026-12-01', '25:00', 'Asia/Damascus'), null);
  assert.equal(zonedDateTime('2026-12-01', '19:00', ''), null);
});

test('converts local event time to UTC without changing the advertised hour', () => {
  const start = zonedDateTime('2026-12-01', '19:00', 'Asia/Damascus');
  assert.equal(start.toISOString(), '2026-12-01T16:00:00.000Z');
  const end = eventEnd({ weddingDate: '2026-12-01', endTime: '23:00', timeZone: 'Asia/Damascus' }, start);
  assert.equal(end.toISOString(), '2026-12-01T20:00:00.000Z');
  assert.equal(eventEnd({ endTime: '' }, start), null);
});

test('calendar file uses real UTC times and escapes text', () => {
  const start = new Date('2026-12-01T16:00:00Z');
  const end = new Date('2026-12-01T20:00:00Z');
  const file = buildIcs({ start, end, title: 'زفاف, محمد', location: 'قاعة; دمشق', description: 'سطر\nثانٍ', uid: 'test', now: start });
  assert.match(file, /DTSTART:20261201T160000Z\r\nDTEND:20261201T200000Z/);
  assert.match(file, /SUMMARY:زفاف\\, محمد/);
  assert.match(file, /LOCATION:قاعة\\; دمشق/);
  assert.match(file, /DESCRIPTION:سطر\\nثانٍ/);
  assert.match(file, /END:VCALENDAR\r\n$/);
});
