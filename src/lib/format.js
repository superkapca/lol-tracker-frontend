export function compact(value) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  const sign = number < 0 ? "-" : "";
  const absolute = Math.abs(number);

  if (absolute >= 1_000_000_000) return `${sign}${trim(absolute / 1_000_000_000)}B`;
  if (absolute >= 1_000_000) return `${sign}${trim(absolute / 1_000_000)}M`;
  if (absolute >= 1_000) return `${sign}${trim(absolute / 1_000)}K`;
  return `${number}`;
}

function trim(value) {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, "");
}

export function duration(seconds) {
  if (seconds === null || seconds === undefined) return "-";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function dateTime(timestamp) {
  if (!timestamp) return "Unknown time";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}
