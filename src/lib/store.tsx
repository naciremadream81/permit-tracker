"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SEED_PACKAGES } from "./seed";
import { STANDARD_CHECKLISTS } from "./standard-checklists";
import { deleteFile, getLocalFile, putFile } from "./files";
import {
  cloudEnabled,
  signIn as fbSignIn,
  signOut as fbSignOut,
  watchAuth,
  type User,
} from "./firebase";
import {
  deleteDirectoryEntryDoc,
  subscribeWorkspace,
  writeCounter,
  writeDirectoryEntry,
  writePackage,
  writeTemplates,
} from "./cloud";
import type {
  ActivityEntry,
  Attachment,
  ChecklistTemplate,
  Contractor,
  DirectoryEntry,
  NewPackageInput,
  PackageStatus,
  PermitPackage,
  PermitType,
  PropertyInfo,
  Subcontractor,
} from "./types";

const STORAGE_KEY = "permit-tracker-v1";

interface PersistedState {
  packages: PermitPackage[];
  templates: Record<PermitType, ChecklistTemplate>;
  directory: DirectoryEntry[];
  refCounter: number;
}

/** Build directory entries from contractors already on packages (first-run + migration). */
function directoryFromPackages(packages: PermitPackage[]): DirectoryEntry[] {
  const entries = new Map<string, DirectoryEntry>();
  const keyOf = (name: string) => name.trim().toLowerCase();
  const upsert = (c: Contractor, trade?: string) => {
    const key = keyOf(c.name);
    const existing = entries.get(key);
    if (existing) {
      if (trade && !existing.trades.includes(trade)) existing.trades.push(trade);
      existing.license ??= c.license;
      existing.phone ??= c.phone;
    } else {
      entries.set(key, {
        id: crypto.randomUUID(),
        name: c.name.trim(),
        license: c.license,
        phone: c.phone,
        trades: trade ? [trade] : [],
      });
    }
  };
  for (const pkg of packages) {
    if (pkg.contractor) upsert(pkg.contractor);
    for (const sub of pkg.subcontractors ?? []) upsert(sub, sub.trade);
  }
  return Array.from(entries.values()).sort((a, b) => a.name.localeCompare(b.name));
}

interface StoreValue {
  loading: boolean;
  /** True when Firebase env vars are configured. */
  cloudEnabled: boolean;
  /** Signed-in Google user (cloud mode only). */
  user: User | null;
  /** False until Firebase has reported the initial auth state. */
  authReady: boolean;
  cloudError: string | null;
  /** Reconnect Firestore listeners after a sync failure. */
  retryCloudSync: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  packages: PermitPackage[];
  templates: Record<PermitType, ChecklistTemplate>;
  directory: DirectoryEntry[];
  addDirectoryEntry: (entry: Omit<DirectoryEntry, "id">) => void;
  updateDirectoryEntry: (entry: DirectoryEntry) => void;
  removeDirectoryEntry: (id: string) => void;
  addPackage: (input: NewPackageInput) => PermitPackage;
  updateStatus: (id: string, status: PackageStatus) => void;
  bulkUpdateStatus: (updates: Array<{ id: string; status: PackageStatus }>) => void;
  /** Restore prior statuses without activity log entries (bulk undo). */
  restorePackageStatuses: (snapshot: Array<{ id: string; status: PackageStatus }>) => void;
  toggleChecklistItem: (packageId: string, itemId: string) => void;
  attachFiles: (packageId: string, itemId: string, files: File[]) => Promise<void>;
  /** Removes metadata only when keepBlob is set, so the caller can offer undo before the bytes go. */
  removeAttachment: (
    packageId: string,
    itemId: string,
    attachmentId: string,
    opts?: { keepBlob?: boolean }
  ) => Promise<void>;
  /** Re-insert attachment metadata after an undone removal (blob must still exist). */
  restoreAttachment: (packageId: string, itemId: string, attachment: Attachment) => void;
  addActivity: (packageId: string, text: string) => void;
  updateNotes: (packageId: string, notes: string) => void;
  updateContractor: (packageId: string, contractor: Contractor | undefined) => void;
  updateProperty: (packageId: string, property: PropertyInfo | undefined) => void;
  addSubcontractor: (packageId: string, sub: Omit<Subcontractor, "id">) => void;
  updateSubcontractor: (packageId: string, sub: Subcontractor) => void;
  removeSubcontractor: (packageId: string, subId: string) => void;
  saveTemplate: (template: ChecklistTemplate) => void;
  resetTemplate: (permitType: PermitType) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadPersisted(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.packages) && parsed.templates) {
        // Merge in any permit types added after the user's data was saved.
        const templates = { ...STANDARD_CHECKLISTS, ...parsed.templates };
        // Backfill fields added after the user's data was saved.
        const packages = parsed.packages.map((p) => ({
          ...p,
          subcontractors: p.subcontractors ?? [],
          checklist: p.checklist.map((item) => ({
            ...item,
            attachments: item.attachments ?? [],
          })),
        }));
        const directory = parsed.directory ?? directoryFromPackages(packages);
        return { ...parsed, templates, packages, directory };
      }
    }
  } catch {
    // Corrupt storage falls through to a fresh seed.
  }
  return {
    packages: SEED_PACKAGES,
    templates: STANDARD_CHECKLISTS,
    directory: directoryFromPackages(SEED_PACKAGES),
    refCounter: 147,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<PersistedState>({
    packages: [],
    templates: STANDARD_CHECKLISTS,
    directory: [],
    refCounter: 147,
  });
  const hydrated = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!cloudEnabled);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudSyncKey, setCloudSyncKey] = useState(0);
  /** JSON of each doc as last seen on (or written to) the server, keyed pkg:{id} / dir:{id} / templates / counter. */
  const serverKeys = useRef(new Map<string, string>());
  const migrated = useRef(false);

  // ── Local mode: localStorage hydration + persistence ──
  useEffect(() => {
    if (cloudEnabled) return;
    setState(loadPersisted());
    hydrated.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    if (cloudEnabled || !hydrated.current || loading) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — keep working in memory.
    }
  }, [state, loading]);

  // ── Cloud mode: auth ──
  useEffect(() => {
    if (!cloudEnabled) return;
    return watchAuth((u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        // Signed out: drop workspace data from memory.
        hydrated.current = false;
        serverKeys.current.clear();
        setState({ packages: [], templates: STANDARD_CHECKLISTS, directory: [], refCounter: 147 });
        setLoading(true);
      }
    });
  }, []);

  // ── Cloud mode: live workspace subscription ──
  useEffect(() => {
    if (!cloudEnabled || !user) return;
    setCloudError(null);
    const unsub = subscribeWorkspace(
      (patch, keys) => {
        // Record server truth before applying, so the write-back diff treats it as in-sync.
        keys.forEach((v, k) => serverKeys.current.set(k, v));
        if (patch.packages) {
          for (const k of Array.from(serverKeys.current.keys())) {
            if (k.startsWith("pkg:") && !keys.has(k)) serverKeys.current.delete(k);
          }
        }
        if (patch.directory) {
          for (const k of Array.from(serverKeys.current.keys())) {
            if (k.startsWith("dir:") && !keys.has(k)) serverKeys.current.delete(k);
          }
        }
        setState((s) => ({
          ...s,
          ...(patch.packages ? { packages: patch.packages } : {}),
          ...(patch.directory ? { directory: patch.directory } : {}),
          ...(patch.templates
            ? { templates: { ...STANDARD_CHECKLISTS, ...patch.templates } }
            : {}),
          ...(patch.refCounter !== undefined ? { refCounter: patch.refCounter } : {}),
        }));
      },
      () => {
        hydrated.current = true;
        setLoading(false);
      },
      (message) => setCloudError(message)
    );
    return unsub;
  }, [user, cloudSyncKey]);

  const retryCloudSync = useCallback(() => {
    if (!cloudEnabled || !user) return;
    setCloudError(null);
    setLoading(true);
    hydrated.current = false;
    serverKeys.current.clear();
    setCloudSyncKey((k) => k + 1);
  }, [user]);

  // ── Cloud mode: one-time migration of local data into an empty workspace ──
  useEffect(() => {
    if (!cloudEnabled || !user || loading || migrated.current) return;
    migrated.current = true;
    if (state.packages.length > 0) return; // workspace already has data
    const local = loadPersisted();
    if (local.packages.length === 0) return;
    void (async () => {
      // Upload any locally stored document blobs first.
      for (const pkg of local.packages) {
        for (const item of pkg.checklist) {
          for (const att of item.attachments) {
            const blob = await getLocalFile(att.id);
            if (blob) {
              try {
                await putFile(att.id, blob); // cloud mode → goes to Cloud Storage
              } catch {
                // Blob upload failed; metadata still migrates, file can be re-attached.
              }
            }
          }
        }
      }
      // Then let the write-back diff push the data: just set the state.
      setState((s) => ({
        ...s,
        packages: local.packages,
        directory: local.directory,
        templates: local.templates,
        refCounter: Math.max(s.refCounter, local.refCounter),
      }));
    })();
  }, [user, loading, state.packages.length]);

  // ── Cloud mode: write-back diff. Pushes any state not matching server truth. ──
  useEffect(() => {
    if (!cloudEnabled || !user || !hydrated.current || loading) return;
    const keys = serverKeys.current;
    const fail = () =>
      setCloudError("A change couldn't be saved to the cloud. It will retry on your next edit — check your connection.");

    const seenPkg = new Set<string>();
    for (const pkg of state.packages) {
      const key = `pkg:${pkg.id}`;
      seenPkg.add(key);
      const json = JSON.stringify(pkg);
      if (keys.get(key) !== json) {
        keys.set(key, json);
        writePackage(pkg).catch(fail);
      }
    }
    const seenDir = new Set<string>();
    for (const entry of state.directory) {
      const key = `dir:${entry.id}`;
      seenDir.add(key);
      const json = JSON.stringify(entry);
      if (keys.get(key) !== json) {
        keys.set(key, json);
        writeDirectoryEntry(entry).catch(fail);
      }
    }
    for (const key of Array.from(keys.keys())) {
      if (key.startsWith("dir:") && !seenDir.has(key)) {
        keys.delete(key);
        deleteDirectoryEntryDoc(key.slice(4)).catch(fail);
      }
      // Packages can't be deleted from the UI yet; skip pkg tombstones so a
      // partial snapshot never wipes data.
    }
    const tplJson = JSON.stringify(state.templates);
    if (keys.get("templates") !== tplJson) {
      keys.set("templates", tplJson);
      writeTemplates(state.templates).catch(fail);
    }
    if (keys.get("counter") !== String(state.refCounter)) {
      keys.set("counter", String(state.refCounter));
      writeCounter(state.refCounter).catch(fail);
    }
  }, [state, user, loading]);

  /** Upsert a contractor into the directory by name (case-insensitive). */
  const captureInDirectory = useCallback((c: Contractor, trade?: string) => {
    const name = c.name.trim();
    if (!name) return;
    setState((s) => {
      const key = name.toLowerCase();
      const existing = s.directory.find((d) => d.name.trim().toLowerCase() === key);
      if (existing) {
        const updated: DirectoryEntry = {
          ...existing,
          license: existing.license ?? c.license,
          phone: existing.phone ?? c.phone,
          trades:
            trade && !existing.trades.includes(trade)
              ? [...existing.trades, trade]
              : existing.trades,
        };
        return {
          ...s,
          directory: s.directory.map((d) => (d.id === existing.id ? updated : d)),
        };
      }
      const entry: DirectoryEntry = {
        id: crypto.randomUUID(),
        name,
        license: c.license,
        phone: c.phone,
        trades: trade ? [trade] : [],
      };
      return {
        ...s,
        directory: [...s.directory, entry].sort((a, b) => a.name.localeCompare(b.name)),
      };
    });
  }, []);

  const addDirectoryEntry = useCallback((entry: Omit<DirectoryEntry, "id">) => {
    setState((s) => ({
      ...s,
      directory: [...s.directory, { ...entry, id: crypto.randomUUID() }].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  }, []);

  const updateDirectoryEntry = useCallback((entry: DirectoryEntry) => {
    setState((s) => ({
      ...s,
      directory: s.directory
        .map((d) => (d.id === entry.id ? entry : d))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, []);

  const removeDirectoryEntry = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      directory: s.directory.filter((d) => d.id !== id),
    }));
  }, []);

  const mutatePackage = useCallback(
    (id: string, fn: (pkg: PermitPackage) => PermitPackage) => {
      setState((s) => ({
        ...s,
        packages: s.packages.map((p) => (p.id === id ? fn(p) : p)),
      }));
    },
    []
  );

  const addPackage = useCallback(
    (input: NewPackageInput): PermitPackage => {
      const now = new Date().toISOString();
      const year = new Date().getFullYear();
      const id = `pkg-${crypto.randomUUID()}`;
      let created: PermitPackage | null = null;
      setState((s) => {
        const reference = `PKG-${year}-${String(s.refCounter).padStart(4, "0")}`;
        const template = s.templates[input.permitType];
        created = {
          id,
          reference,
          client: input.client,
          projectAddress: input.projectAddress,
          countyId: input.countyId,
          permitType: input.permitType,
          contractor: input.contractor,
          subcontractors: [],
          status: "preparing",
          createdAt: now,
          deadline: input.deadline,
          deadlineLabel: input.deadlineLabel,
          checklist: template.items.map((item) => ({
            id: item.id,
            label: item.label,
            note: item.note,
            done: false,
            attachments: [],
          })),
          activity: [{ id: crypto.randomUUID(), date: now, text: "Package opened" }],
        };
        return {
          ...s,
          refCounter: s.refCounter + 1,
          packages: [created, ...s.packages],
        };
      });
      if (input.contractor) captureInDirectory(input.contractor);
      // setState runs synchronously in React 18 event handlers before this returns.
      return created!;
    },
    [captureInDirectory]
  );

  const updateStatus = useCallback(
    (id: string, status: PackageStatus) => {
      const now = new Date().toISOString();
      mutatePackage(id, (pkg) => {
        const entry: ActivityEntry = {
          id: crypto.randomUUID(),
          date: now,
          text: `Status changed to ${status.replace("_", " ")}`,
        };
        return {
          ...pkg,
          status,
          submittedAt:
            status === "submitted" && !pkg.submittedAt ? now : pkg.submittedAt,
          activity: [...pkg.activity, entry],
        };
      });
    },
    [mutatePackage]
  );

  const bulkUpdateStatus = useCallback(
    (updates: Array<{ id: string; status: PackageStatus }>) => {
      if (updates.length === 0) return;
      const now = new Date().toISOString();
      const byId = new Map(updates.map((u) => [u.id, u.status]));
      setState((s) => ({
        ...s,
        packages: s.packages.map((pkg) => {
          const next = byId.get(pkg.id);
          if (!next) return pkg;
          const entry: ActivityEntry = {
            id: crypto.randomUUID(),
            date: now,
            text: `Status changed to ${next.replace("_", " ")}`,
          };
          return {
            ...pkg,
            status: next,
            submittedAt:
              next === "submitted" && !pkg.submittedAt ? now : pkg.submittedAt,
            activity: [...pkg.activity, entry],
          };
        }),
      }));
    },
    []
  );

  const restorePackageStatuses = useCallback(
    (snapshot: Array<{ id: string; status: PackageStatus }>) => {
      if (snapshot.length === 0) return;
      const byId = new Map(snapshot.map((entry) => [entry.id, entry.status]));
      setState((s) => ({
        ...s,
        packages: s.packages.map((pkg) => {
          const prev = byId.get(pkg.id);
          if (prev === undefined) return pkg;
          return { ...pkg, status: prev };
        }),
      }));
    },
    []
  );

  const toggleChecklistItem = useCallback(
    (packageId: string, itemId: string) => {
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        checklist: pkg.checklist.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item
        ),
      }));
    },
    [mutatePackage]
  );

  const attachFiles = useCallback(
    async (packageId: string, itemId: string, files: File[]) => {
      const metas: Attachment[] = [];
      // Write blobs first so the metadata never points at missing bytes.
      for (const file of files) {
        const id = crypto.randomUUID();
        await putFile(id, file);
        metas.push({
          id,
          fileName: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString(),
        });
      }
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        checklist: pkg.checklist.map((item) =>
          item.id === itemId
            ? { ...item, attachments: [...item.attachments, ...metas] }
            : item
        ),
      }));
    },
    [mutatePackage]
  );

  const removeAttachment = useCallback(
    async (
      packageId: string,
      itemId: string,
      attachmentId: string,
      opts?: { keepBlob?: boolean }
    ) => {
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        checklist: pkg.checklist.map((item) =>
          item.id === itemId
            ? {
                ...item,
                attachments: item.attachments.filter((a) => a.id !== attachmentId),
              }
            : item
        ),
      }));
      if (opts?.keepBlob) return;
      try {
        await deleteFile(attachmentId);
      } catch {
        // Orphaned blob is harmless; metadata is already gone.
      }
    },
    [mutatePackage]
  );

  const restoreAttachment = useCallback(
    (packageId: string, itemId: string, attachment: Attachment) => {
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        checklist: pkg.checklist.map((item) =>
          item.id === itemId && !item.attachments.some((a) => a.id === attachment.id)
            ? { ...item, attachments: [...item.attachments, attachment] }
            : item
        ),
      }));
    },
    [mutatePackage]
  );

  const addActivity = useCallback(
    (packageId: string, text: string) => {
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        activity: [
          ...pkg.activity,
          { id: crypto.randomUUID(), date: new Date().toISOString(), text },
        ],
      }));
    },
    [mutatePackage]
  );

  const updateNotes = useCallback(
    (packageId: string, notes: string) => {
      mutatePackage(packageId, (pkg) => ({ ...pkg, notes }));
    },
    [mutatePackage]
  );

  const updateContractor = useCallback(
    (packageId: string, contractor: Contractor | undefined) => {
      mutatePackage(packageId, (pkg) => ({ ...pkg, contractor }));
      if (contractor) captureInDirectory(contractor);
    },
    [mutatePackage, captureInDirectory]
  );

  const updateProperty = useCallback(
    (packageId: string, property: PropertyInfo | undefined) => {
      mutatePackage(packageId, (pkg) => ({ ...pkg, property }));
    },
    [mutatePackage]
  );

  const addSubcontractor = useCallback(
    (packageId: string, sub: Omit<Subcontractor, "id">) => {
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        subcontractors: [
          ...pkg.subcontractors,
          { ...sub, id: crypto.randomUUID() },
        ],
      }));
      captureInDirectory(sub, sub.trade);
    },
    [mutatePackage, captureInDirectory]
  );

  const updateSubcontractor = useCallback(
    (packageId: string, sub: Subcontractor) => {
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        subcontractors: pkg.subcontractors.map((s) =>
          s.id === sub.id ? sub : s
        ),
      }));
      captureInDirectory(sub, sub.trade);
    },
    [mutatePackage, captureInDirectory]
  );

  const removeSubcontractor = useCallback(
    (packageId: string, subId: string) => {
      mutatePackage(packageId, (pkg) => ({
        ...pkg,
        subcontractors: pkg.subcontractors.filter((s) => s.id !== subId),
      }));
    },
    [mutatePackage]
  );

  const saveTemplate = useCallback((template: ChecklistTemplate) => {
    setState((s) => ({
      ...s,
      templates: { ...s.templates, [template.permitType]: template },
    }));
  }, []);

  const resetTemplate = useCallback((permitType: PermitType) => {
    setState((s) => ({
      ...s,
      templates: { ...s.templates, [permitType]: STANDARD_CHECKLISTS[permitType] },
    }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      loading,
      cloudEnabled,
      user,
      authReady,
      cloudError,
      retryCloudSync,
      signIn: fbSignIn,
      signOut: fbSignOut,
      packages: state.packages,
      templates: state.templates,
      directory: state.directory,
      addDirectoryEntry,
      updateDirectoryEntry,
      removeDirectoryEntry,
      addPackage,
      updateStatus,
      bulkUpdateStatus,
      restorePackageStatuses,
      toggleChecklistItem,
      attachFiles,
      removeAttachment,
      restoreAttachment,
      addActivity,
      updateNotes,
      updateContractor,
      updateProperty,
      addSubcontractor,
      updateSubcontractor,
      removeSubcontractor,
      saveTemplate,
      resetTemplate,
    }),
    [
      loading,
      user,
      authReady,
      cloudError,
      retryCloudSync,
      state.packages,
      state.templates,
      state.directory,
      addDirectoryEntry,
      updateDirectoryEntry,
      removeDirectoryEntry,
      addPackage,
      updateStatus,
      bulkUpdateStatus,
      restorePackageStatuses,
      toggleChecklistItem,
      attachFiles,
      removeAttachment,
      restoreAttachment,
      addActivity,
      updateNotes,
      updateContractor,
      updateProperty,
      addSubcontractor,
      updateSubcontractor,
      removeSubcontractor,
      saveTemplate,
      resetTemplate,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
