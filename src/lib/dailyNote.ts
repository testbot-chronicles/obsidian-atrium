export function formatDate(d: Date, fmt: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return fmt
    .replace(/YYYY/g, String(d.getFullYear()))
    .replace(/MM/g, pad(d.getMonth() + 1))
    .replace(/DD/g, pad(d.getDate()));
}
export function dailyNotePath(d: Date, fmt: string, folder: string): string {
  const name = `${formatDate(d, fmt)}.md`;
  const f = folder.replace(/\/+$/, "");
  return f ? `${f}/${name}` : name;
}
