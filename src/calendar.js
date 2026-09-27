/** Date and calendar helpers kept independent of the page for direct verification. */
export function zonedDateTime(dateValue, timeValue, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue) || !timeZone) return null;
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  if (new Date(guess).toISOString().slice(0, 10) !== dateValue) return null;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    let candidate = guess;
    for (let i = 0; i < 3; i += 1) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(({ type, value }) => [type, value]));
      const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
      candidate += guess - represented;
    }
    const result = new Date(candidate);
    const resultParts = Object.fromEntries(formatter.formatToParts(result).map(({ type, value }) => [type, value]));
    if (Number(resultParts.year) !== year || Number(resultParts.month) !== month || Number(resultParts.day) !== day || Number(resultParts.hour) !== hour || Number(resultParts.minute) !== minute) return null;
    return result;
  } catch {
    return null;
  }
}

export function eventEnd(config, start) {
  if (!config.endTime) return null;
  const end = zonedDateTime(config.weddingDate, config.endTime, config.timeZone);
  if (!end) return null;
  return end <= start ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : end;
}

export function calendarStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');
}

export function buildIcs({ start, end, title, location = '', description = '', uid, now = new Date() }) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'CALSCALE:GREGORIAN',
    'PRODID:-//Personal Wedding Invitation//AR', 'BEGIN:VEVENT',
    `UID:${uid}@wedding-temp-2`, `DTSTAMP:${calendarStamp(now)}`,
    `DTSTART:${calendarStamp(start)}`, `DTEND:${calendarStamp(end)}`,
    `SUMMARY:${icsEscape(title)}`, `LOCATION:${icsEscape(location)}`,
    `DESCRIPTION:${icsEscape(description)}`, 'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}
