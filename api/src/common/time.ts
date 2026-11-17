export const TZ = 'Europe/Kyiv';

const parts = (date: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );

export const kyivHour = (date: Date) => Number(parts(date).hour);

export const isWeekend = (date: Date) =>
  ['Sat', 'Sun'].includes(parts(date).weekday);

export const kyivDateTime = (date: Date) =>
  new Intl.DateTimeFormat('uk-UA', {
    timeZone: TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

// "2026-11-10" + hour in Kyiv -> UTC Date
export const kyivToUtc = (day: string, hour: number) => {
  const guess = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00Z`);
  const offset = kyivHour(guess) - hour;
  const fix = offset > 12 ? offset - 24 : offset < -12 ? offset + 24 : offset;
  return new Date(guess.getTime() - fix * 3600_000);
};
