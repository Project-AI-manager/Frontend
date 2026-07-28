const ISO_DATE_TIME_WITHOUT_OFFSET = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export function parseServerDateTime(value: string) {
  const normalized = value.trim();
  const withOffset = ISO_DATE_TIME_WITHOUT_OFFSET.test(normalized)
    ? `${normalized.replace(" ", "T")}Z`
    : normalized;

  return Date.parse(withOffset);
}

export function formatRelativeServerTime(value: string, now = Date.now()) {
  const timestamp = parseServerDateTime(value);
  if (Number.isNaN(timestamp)) return value;

  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) return "только что";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} ${relativeWord(elapsedMinutes, "минуту", "минуты", "минут")} назад`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} ${relativeWord(elapsedHours, "час", "часа", "часов")} назад`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${relativeWord(elapsedDays, "день", "дня", "дней")} назад`;
}

function relativeWord(count: number, singular: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return singular;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
