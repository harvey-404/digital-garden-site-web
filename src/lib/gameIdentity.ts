const FP_KEY = "dg.game.fp";
const USERNAME_KEY = "dg.game.username";

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Browser fingerprint for game identity (UUID v4 in localStorage). */
export function getOrCreateFp(): string {
  let fp = localStorage.getItem(FP_KEY);
  if (!fp) {
    fp = createUuid();
    localStorage.setItem(FP_KEY, fp);
  }
  return fp;
}

export function loadUsername(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

export function saveUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}
