/**
 * Firestore document layout for the shared workspace:
 *
 *   workspaces/main/packages/{packageId}   — one doc per permit package
 *   workspaces/main/directory/{entryId}    — one doc per contractor
 *   workspaces/main/meta/templates         — { templates: {...} }
 *   workspaces/main/meta/counters          — { refCounter: number }
 *
 * Document blobs live in Cloud Storage under workspaces/main/files/{attachmentId}
 * (see files.ts). Access for both is restricted to allowlisted emails via
 * firestore.rules / storage.rules.
 */

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db, WORKSPACE_ID } from "./firebase";
import type {
  ChecklistTemplate,
  DirectoryEntry,
  PermitPackage,
  PermitType,
} from "./types";

const ws = () => doc(db(), "workspaces", WORKSPACE_ID);

export interface WorkspaceSnapshot {
  packages?: PermitPackage[];
  directory?: DirectoryEntry[];
  templates?: Record<PermitType, ChecklistTemplate>;
  refCounter?: number;
}

/**
 * Subscribe to the whole workspace. `onChange` fires per area as snapshots
 * arrive; `onReady` fires once after every area has reported at least once;
 * `onError` surfaces permission/network failures.
 */
export function subscribeWorkspace(
  onChange: (patch: WorkspaceSnapshot, serverKeys: Map<string, string>) => void,
  onReady: () => void,
  onError: (message: string) => void
): () => void {
  let pending = 3; // packages, directory, meta
  const arrived = () => {
    pending -= 1;
    if (pending === 0) onReady();
  };
  let packagesSeen = false;
  let directorySeen = false;
  let metaSeen = 0; // templates + counters share one listener via collection

  const fail = (err: { code?: string }) => {
    onError(
      err.code === "permission-denied"
        ? "Your Google account isn't on this workspace's allowlist. Add your email to firestore.rules and storage.rules, then redeploy the rules."
        : "Couldn't reach the cloud workspace. Check your connection — changes made now may not be saved."
    );
  };

  const unsubPackages = onSnapshot(
    collection(ws(), "packages"),
    (snap) => {
      const keys = new Map<string, string>();
      const packages = snap.docs.map((d) => {
        const data = d.data() as PermitPackage;
        keys.set(`pkg:${d.id}`, JSON.stringify(data));
        return data;
      });
      packages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onChange({ packages }, keys);
      if (!packagesSeen) {
        packagesSeen = true;
        arrived();
      }
    },
    fail
  );

  const unsubDirectory = onSnapshot(
    collection(ws(), "directory"),
    (snap) => {
      const keys = new Map<string, string>();
      const directory = snap.docs.map((d) => {
        const data = d.data() as DirectoryEntry;
        keys.set(`dir:${d.id}`, JSON.stringify(data));
        return data;
      });
      directory.sort((a, b) => a.name.localeCompare(b.name));
      onChange({ directory }, keys);
      if (!directorySeen) {
        directorySeen = true;
        arrived();
      }
    },
    fail
  );

  const unsubMeta = onSnapshot(
    collection(ws(), "meta"),
    (snap) => {
      const keys = new Map<string, string>();
      const patch: WorkspaceSnapshot = {};
      for (const d of snap.docs) {
        if (d.id === "templates") {
          patch.templates = (d.data() as { templates: WorkspaceSnapshot["templates"] }).templates;
          keys.set("templates", JSON.stringify(patch.templates));
        }
        if (d.id === "counters") {
          patch.refCounter = (d.data() as { refCounter: number }).refCounter;
          keys.set("counter", String(patch.refCounter));
        }
      }
      onChange(patch, keys);
      if (metaSeen === 0) {
        metaSeen = 1;
        arrived();
      }
    },
    fail
  );

  return () => {
    unsubPackages();
    unsubDirectory();
    unsubMeta();
  };
}

/** Firestore rejects `undefined` values; a JSON round-trip strips them. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function writePackage(pkg: PermitPackage): Promise<void> {
  await setDoc(doc(ws(), "packages", pkg.id), clean(pkg));
}

export async function deletePackageDoc(id: string): Promise<void> {
  await deleteDoc(doc(ws(), "packages", id));
}

export async function writeDirectoryEntry(entry: DirectoryEntry): Promise<void> {
  await setDoc(doc(ws(), "directory", entry.id), clean(entry));
}

export async function deleteDirectoryEntryDoc(id: string): Promise<void> {
  await deleteDoc(doc(ws(), "directory", id));
}

export async function writeTemplates(
  templates: Record<PermitType, ChecklistTemplate>
): Promise<void> {
  await setDoc(doc(ws(), "meta", "templates"), { templates: clean(templates) });
}

export async function writeCounter(refCounter: number): Promise<void> {
  await setDoc(doc(ws(), "meta", "counters"), { refCounter });
}
