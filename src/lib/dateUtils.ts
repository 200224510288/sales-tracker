export function getWeekdayIndex(dateStr: string): number {
  // dateStr expected: "YYYY-MM-DD"
  const d = new Date(`${dateStr}T00:00:00`);
  const idx = d.getDay(); // 0=Sunday ... 6=Saturday
  return idx;
}

export function getWeekdayLabel(idx: number): string {
  const labels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return labels[idx] ?? "Unknown";
}
