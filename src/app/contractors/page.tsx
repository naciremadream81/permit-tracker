"use client";

import { useMemo, useState } from "react";
import { Check, HardHat, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import type { DirectoryEntry } from "@/lib/types";

interface Draft {
  name: string;
  license: string;
  phone: string;
  trades: string; // comma-separated in the form
}

const EMPTY_DRAFT: Draft = { name: "", license: "", phone: "", trades: "" };

function parseTrades(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ContractorsPage() {
  const {
    loading,
    directory,
    packages,
    addDirectoryEntry,
    updateDirectoryEntry,
    removeDirectoryEntry,
  } = useStore();

  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  /** How many packages reference each directory name (as main or sub). */
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of directory) {
      const key = entry.name.trim().toLowerCase();
      let n = 0;
      for (const pkg of packages) {
        const names = [
          pkg.contractor?.name,
          ...pkg.subcontractors.map((s) => s.name),
        ];
        if (names.some((nm) => nm?.trim().toLowerCase() === key)) n++;
      }
      counts.set(entry.id, n);
    }
    return counts;
  }, [directory, packages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.license?.toLowerCase().includes(q) ||
        d.trades.some((t) => t.toLowerCase().includes(q))
    );
  }, [directory, query]);

  function startEdit(entry: DirectoryEntry) {
    setDraft({
      name: entry.name,
      license: entry.license ?? "",
      phone: entry.phone ?? "",
      trades: entry.trades.join(", "),
    });
    setEditingId(entry.id);
    setAdding(false);
    setConfirmRemoveId(null);
  }

  function commit() {
    const name = draft.name.trim();
    if (!name) return;
    const data = {
      name,
      license: draft.license.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      trades: parseTrades(draft.trades),
    };
    if (editingId) {
      updateDirectoryEntry({ id: editingId, ...data });
      setEditingId(null);
    } else {
      addDirectoryEntry(data);
      setAdding(false);
    }
    setDraft(EMPTY_DRAFT);
  }

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-list" role="status" aria-label="Loading contractors">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-line" style={{ width: "40%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const form = (
    <div className="sub-form directory-form">
      <div className="sub-form-row">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Company or contractor name"
          aria-label="Contractor name"
          autoFocus
        />
        <input
          type="text"
          value={draft.trades}
          onChange={(e) => setDraft({ ...draft, trades: e.target.value })}
          placeholder="Trades (Electrical, HVAC…) — blank for GC"
          aria-label="Trades, comma separated"
        />
      </div>
      <div className="sub-form-row">
        <input
          type="text"
          value={draft.license}
          onChange={(e) => setDraft({ ...draft, license: e.target.value })}
          placeholder="License #"
          aria-label="License number"
        />
        <input
          type="tel"
          value={draft.phone}
          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          placeholder="Phone"
          aria-label="Phone"
        />
      </div>
      <div className="sub-form-actions">
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={commit}
          disabled={!draft.name.trim()}
        >
          <Check size={13} aria-hidden />
          {editingId ? "Save" : "Add"}
        </button>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => {
            setAdding(false);
            setEditingId(null);
            setDraft(EMPTY_DRAFT);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Contractors</h1>
          <p className="page-subtitle">
            Your shared directory. Anyone you add to a package lands here
            automatically, and typing their name on a future package fills in
            their license and phone.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            setAdding(true);
            setEditingId(null);
          }}
        >
          <Plus size={15} strokeWidth={2.25} aria-hidden />
          New contractor
        </button>
      </div>

      {directory.length > 0 && (
        <div className="directory-search">
          <Search size={15} strokeWidth={2} aria-hidden />
          <label htmlFor="dir-search" className="sr-only">
            Search contractors
          </label>
          <input
            id="dir-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, license, or trade…"
          />
        </div>
      )}

      {adding && form}

      {directory.length === 0 && !adding ? (
        <div className="empty-state">
          <Users size={32} strokeWidth={1.5} aria-hidden />
          <h2>No contractors yet</h2>
          <p>
            Add contractors here, or just put them on a package — every main
            contractor and sub you enter is saved to this directory for reuse.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setAdding(true);
            }}
          >
            <Plus size={15} strokeWidth={2.25} aria-hidden />
            Add a contractor
          </button>
        </div>
      ) : filtered.length === 0 && !adding ? (
        <p className="directory-no-match">
          No contractors match “{query}”. Try a different name, license, or trade.
        </p>
      ) : (
        <ul className="directory-list">
          {filtered.map((entry) =>
            editingId === entry.id ? (
              <li key={entry.id}>{form}</li>
            ) : (
              <li key={entry.id} className="directory-row">
                <HardHat size={16} strokeWidth={2} className="contractor-icon" aria-hidden />
                <div className="directory-main">
                  <div className="directory-name-row">
                    <span className="contractor-name">{entry.name}</span>
                    {entry.trades.length === 0 ? (
                      <span className="sub-trade sub-trade-gc">General</span>
                    ) : (
                      entry.trades.map((t) => (
                        <span key={t} className="sub-trade">
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="contractor-meta">
                    {entry.license && <span className="tnum">Lic. {entry.license}</span>}
                    {entry.phone && (
                      <span className="tnum contractor-phone">
                        <Phone size={11} strokeWidth={2} aria-hidden />
                        {entry.phone}
                      </span>
                    )}
                    <span className="directory-usage tnum">
                      {usage.get(entry.id) === 0
                        ? "Not on any package"
                        : `On ${usage.get(entry.id)} package${usage.get(entry.id) === 1 ? "" : "s"}`}
                    </span>
                  </div>
                </div>
                {confirmRemoveId === entry.id ? (
                  <div className="reset-confirm">
                    <span>Remove from directory?</span>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => {
                        removeDirectoryEntry(entry.id);
                        setConfirmRemoveId(null);
                      }}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => setConfirmRemoveId(null)}
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <div className="sub-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => startEdit(entry)}
                      aria-label={`Edit ${entry.name}`}
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      onClick={() => setConfirmRemoveId(entry.id)}
                      aria-label={`Remove ${entry.name}`}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
