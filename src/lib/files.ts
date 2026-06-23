/**
 * Document blob storage.
 *
 * Metadata (file name, size, which checklist item it belongs to) lives in the
 * main store; the bytes live here, keyed by attachment id. In cloud mode the
 * bytes go to Cloud Storage for Firebase; in local mode, to IndexedDB
 * (localStorage can't hold file contents, IndexedDB can).
 */

import {
  deleteObject,
  getBlob,
  ref,
  uploadBytes,
} from "firebase/storage";
import { cloudEnabled, storage, WORKSPACE_ID } from "./firebase";

function cloudRef(id: string) {
  return ref(storage(), `workspaces/${WORKSPACE_ID}/files/${id}`);
}

const DB_NAME = "permit-tracker-files";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putFile(id: string, blob: Blob): Promise<void> {
  if (cloudEnabled) {
    await uploadBytes(cloudRef(id), blob);
    return;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFile(id: string): Promise<Blob | undefined> {
  if (cloudEnabled) {
    try {
      return await getBlob(cloudRef(id));
    } catch {
      return undefined; // object missing or permission denied
    }
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFile(id: string): Promise<void> {
  if (cloudEnabled) {
    try {
      await deleteObject(cloudRef(id));
    } catch {
      // Already gone — fine.
    }
    return;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Read straight from IndexedDB regardless of mode — used when migrating local data to the cloud. */
export async function getLocalFile(id: string): Promise<Blob | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
