export function toDate(value) {
  if (!value) return null;
  return typeof value.toDate === "function" ? value.toDate() : new Date(value);
}

export function formatDate(value) {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value) {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toTimestampNumber(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}
