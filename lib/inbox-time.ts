export function messageTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";
}

export function conversationListTime(value: string | null, now = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDifference = Math.round(
    (startToday.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1_000),
  );
  if (dayDifference === 0) return messageTime(value);
  if (dayDifference === 1) return "Вчера";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    ...(date.getFullYear() === now.getFullYear()
      ? {}
      : { year: "2-digit" as const }),
  }).format(date);
}
