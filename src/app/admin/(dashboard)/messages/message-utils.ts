// Product questions from a watch page start with "About: <title>\n<url>".
export function parseAbout(message: string): { title: string; url: string | null; body: string } | null {
  const m = message.match(/^About: (.+)\n(https?:\/\/\S+)?\n*([\s\S]*)$/);
  if (!m) return null;
  return { title: m[1], url: m[2] ?? null, body: m[3] };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = (now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}
