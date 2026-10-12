import type { SelectedImage } from '../types/ledgerChat';

type StoredImage = Pick<SelectedImage, 'key' | 'file' | 'attachmentId'>;
interface Draft { text: string; images: StoredImage[] }
const prefix = 'dg-ledger-composer:';
let database: Promise<IDBDatabase> | null = null;
const pending = new Map<string, Promise<void>>();
function db(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('dg-ledger-composer', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}
async function imageStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('images', mode);
    const request = work(transaction.objectStore('images'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
export function saveComposer(identity: string, draft: Draft, saveImages = true): Promise<void> {
  sessionStorage.setItem(prefix + identity, JSON.stringify({ text: draft.text, imageKeys: draft.images.map(i => i.key) }));
  if (!saveImages) return Promise.resolve();
  const images = draft.images.map(({ key, file, attachmentId }) => ({ key, file, attachmentId }));
  const job = (pending.get(identity) ?? Promise.resolve()).catch(() => {}).then(async () => {
    // A copied tab can share the original image keys. Store individual blobs so
    // editing either tab's selection cannot overwrite the other tab's images.
    await Promise.all(images.map(image => imageStore('readwrite', store => store.put(image, image.key))));
  });
  pending.set(identity, job);
  return job;
}
async function read(identity: string): Promise<Draft> {
  let meta: { text?: unknown; imageKeys?: unknown } = {};
  try { meta = JSON.parse(sessionStorage.getItem(prefix + identity) ?? '{}'); } catch { /* Invalid local drafts are ignored. */ }
  const text = typeof meta?.text === 'string' ? meta.text : '';
  const keys = Array.isArray(meta?.imageKeys) ? meta.imageKeys : [];
  if (!keys.length) return { text, images: [] };
  await pending.get(identity)?.catch(() => {});
  const images = await Promise.all(keys.slice(0, 3).map(key => imageStore<StoredImage | undefined>('readonly', store => store.get(key)).catch(() => undefined)));
  return { text, images: images.filter((image): image is StoredImage => !!image && image.file instanceof File) };
}
export async function loadComposer(identity: string, adoptedGuestKey: string | null): Promise<Draft> {
  const current = await read(identity);
  if (!adoptedGuestKey || adoptedGuestKey === identity) return current;
  // The source key comes only from the authenticated server response. Local storage
  // and unverified guest cookies cannot authorize adoption into another account.
  const marker = prefix + 'adopted:' + identity + ':' + adoptedGuestKey;
  if (sessionStorage.getItem(marker)) return current;
  const source = await read(adoptedGuestKey);
  if (!current.text && !current.images.length && (source.text || source.images.length)) {
    await saveComposer(identity, source);
    sessionStorage.setItem(marker, '1');
    return source;
  }
  // Keep each original draft if this account already has unsent work.
  return current;
}
export async function clearComposer(identity: string): Promise<void> {
  sessionStorage.removeItem(prefix + identity);
  // Another copied tab may still reference these blobs. Only this tab's draft
  // references are cleared; site-data removal clears the browser's blob cache.
  await pending.get(identity)?.catch(() => {});
}
