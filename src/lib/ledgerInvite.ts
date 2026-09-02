/** Client-side invite normalize (mirrors LedgerInviteUtil). */

export function previewInviteCode(raw: string): string {
  const stripped = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);
  if (!stripped) return "";
  const parts: string[] = [stripped.slice(0, Math.min(4, stripped.length))];
  if (stripped.length > 4) parts.push(stripped.slice(4, Math.min(8, stripped.length)));
  if (stripped.length > 8) parts.push(stripped.slice(8, 12));
  return parts.join("-");
}

export function normalizeInviteCode(raw: string): string {
  const stripped = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (stripped.length !== 12) {
    throw new Error("邀请码应为 12 位字符（可带或不带横杠）");
  }
  return `${stripped.slice(0, 4)}-${stripped.slice(4, 8)}-${stripped.slice(8, 12)}`;
}
