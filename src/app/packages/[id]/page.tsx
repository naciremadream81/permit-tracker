"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlarmClock,
  ArrowLeft,
  CalendarDays,
  Download,
  FileArchive,
  Loader2,
  MapPin,
  Paperclip,
  Plus,
  SearchX,
  X,
} from "lucide-react";
import { exportSubmittalZip, type ExportResult } from "@/lib/export";
import { deleteFile, formatBytes, getFile } from "@/lib/files";
import type { Attachment } from "@/lib/types";
import { useStore } from "@/lib/store";
import { countyById } from "@/lib/counties";
import { deadlinePhrase, deadlineUrgency, formatDate } from "@/lib/dates";
import {
  PERMIT_TYPE_LABELS,
  STATUS_LABELS,
  type PackageStatus,
} from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { ContractorsCard } from "@/components/ContractorsCard";
import { PropertyCard } from "@/components/PropertyCard";
import { NEXT_STATUSES } from "@/lib/status-flow";

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    loading,
    packages,
    updateStatus,
    toggleChecklistItem,
    attachFiles,
    removeAttachment,
    restoreAttachment,
    addActivity,
    updateNotes,
  } = useStore();
  const [newActivity, setNewActivity] = useState("");
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  /** Selection staged in the "Change status…" picker; committed only on Apply. */
  const [pendingStatus, setPendingStatus] = useState<PackageStatus | null>(null);
  /** Local notes draft; committed to the store (and cloud) after a typing pause. */
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedVisible, setNotesSavedVisible] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const shortcutsDialogRef = useRef<HTMLDialogElement>(null);
  /** Pending attachment removal awaiting undo; blob is deleted only after the timer fires. */
  const [pendingRemoval, setPendingRemoval] = useState<{
    itemId: string;
    attachment: Attachment;
  } | null>(null);
  const removalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      // Leaving the page abandons the timer; the blob stays (harmless orphan)
      // and the metadata is already gone, matching what the user asked for.
      if (removalTimer.current) clearTimeout(removalTimer.current);
      if (notesTimer.current) clearTimeout(notesTimer.current);
      if (notesSavedTimer.current) clearTimeout(notesSavedTimer.current);
    };
  }, []);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const openShortcutsDialog = useCallback(() => {
    shortcutsDialogRef.current?.showModal();
  }, []);

  const closeShortcutsDialog = useCallback(() => {
    shortcutsDialogRef.current?.close();
  }, []);

  const cancelStatusPicker = useCallback(() => {
    setPendingStatus(null);
    setShowAllStatuses(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    const activePkg = packages.find((p) => p.id === params.id);
    if (!activePkg) return;

    const attached = activePkg.checklist.reduce((n, i) => n + i.attachments.length, 0);

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const dialogOpen = shortcutsDialogRef.current?.open ?? false;

      if (e.key === "Escape") {
        if (dialogOpen) {
          e.preventDefault();
          closeShortcutsDialog();
          return;
        }
        if (showAllStatuses && !inField) {
          e.preventDefault();
          cancelStatusPicker();
        }
        return;
      }

      if (inField || dialogOpen) return;

      if (e.key === "?") {
        e.preventDefault();
        openShortcutsDialog();
        return;
      }

      if (e.key === "b") {
        e.preventDefault();
        router.push("/packages");
        return;
      }

      if (e.key === "e") {
        if (exporting || attached === 0) return;
        e.preventDefault();
        exportBtnRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    loading,
    packages,
    params.id,
    exporting,
    showAllStatuses,
    router,
    openShortcutsDialog,
    closeShortcutsDialog,
    cancelStatusPicker,
  ]);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-list" role="status" aria-label="Loading package">
          <div className="skeleton-row">
            <div className="skeleton-line" style={{ width: "30%" }} />
            <div className="skeleton-line" style={{ width: "55%" }} />
            <div className="skeleton-line" style={{ width: "70%" }} />
          </div>
        </div>
      </div>
    );
  }

  const pkg = packages.find((p) => p.id === params.id);

  if (!pkg) {
    return (
      <div className="page">
        <div className="empty-state">
          <SearchX size={32} strokeWidth={1.5} aria-hidden />
          <h2>Package not found</h2>
          <p>
            This package may have been removed, or the link is out of date.
            Head back to the portfolio to find what you need.
          </p>
          <Link href="/packages" className="btn-primary">
            <ArrowLeft size={15} aria-hidden />
            Back to packages
          </Link>
        </div>
      </div>
    );
  }

  const county = countyById(pkg.countyId);
  const done = pkg.checklist.filter((i) => i.done).length;
  const total = pkg.checklist.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const nextMoves = NEXT_STATUSES[pkg.status];
  const sortedActivity = [...pkg.activity].sort((a, b) => b.date.localeCompare(a.date));

  const attachedCount = pkg.checklist.reduce((n, i) => n + i.attachments.length, 0);

  async function handleAttach(itemId: string, list: FileList | null) {
    if (!list || list.length === 0) return;
    try {
      await attachFiles(pkg!.id, itemId, Array.from(list));
      setExportResult(null);
    } catch {
      setExportError("Couldn't save the file locally. Your browser storage may be full.");
    }
  }

  async function downloadAttachment(attId: string, fileName: string) {
    const blob = await getFile(attId);
    if (!blob) {
      setExportError(`"${fileName}" is missing from local storage and can't be downloaded.`);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function showNotesSaved() {
    setNotesSavedVisible(true);
    if (notesSavedTimer.current) clearTimeout(notesSavedTimer.current);
    notesSavedTimer.current = setTimeout(() => {
      setNotesSavedVisible(false);
      notesSavedTimer.current = null;
    }, 2000);
  }

  function commitNotes(value: string) {
    updateNotes(pkg!.id, value);
    setNotesDraft(null);
    setNotesSaving(false);
    showNotesSaved();
  }

  function editNotes(value: string) {
    setNotesSavedVisible(false);
    setNotesSaving(true);
    setNotesDraft(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      commitNotes(value);
      notesTimer.current = null;
    }, 600);
  }

  function flushNotes() {
    if (notesTimer.current) {
      clearTimeout(notesTimer.current);
      notesTimer.current = null;
    }
    if (notesDraft !== null) {
      commitNotes(notesDraft);
    }
  }

  function requestRemoval(itemId: string, attachment: Attachment) {
    // Commit any previously pending removal first.
    if (removalTimer.current) clearTimeout(removalTimer.current);
    if (pendingRemoval) void deleteFile(pendingRemoval.attachment.id);
    void removeAttachment(pkg!.id, itemId, attachment.id, { keepBlob: true });
    setPendingRemoval({ itemId, attachment });
    removalTimer.current = setTimeout(() => {
      void deleteFile(attachment.id);
      setPendingRemoval(null);
      removalTimer.current = null;
    }, 8000);
  }

  function undoRemoval() {
    if (!pendingRemoval) return;
    if (removalTimer.current) clearTimeout(removalTimer.current);
    removalTimer.current = null;
    restoreAttachment(pkg!.id, pendingRemoval.itemId, pendingRemoval.attachment);
    setPendingRemoval(null);
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    setExportResult(null);
    try {
      const result = await exportSubmittalZip(pkg!);
      setExportResult(result);
      addActivity(pkg!.id, `Submittal exported (${result.fileCount} document${result.fileCount === 1 ? "" : "s"})`);
    } catch {
      setExportError("Export failed. Try again — if it keeps happening, re-attach the documents.");
    } finally {
      setExporting(false);
    }
  }

  function logActivity(e: React.FormEvent) {
    e.preventDefault();
    const text = newActivity.trim();
    if (!text) return;
    addActivity(pkg!.id, text);
    setNewActivity("");
  }

  return (
    <div className="page">
      <div className="detail-nav">
        <Link href="/packages" className="back-link" title="Back to packages (b)">
          <ArrowLeft size={14} aria-hidden />
          Packages
        </Link>
        <button
          type="button"
          className="btn-ghost btn-sm keyboard-hints-help detail-shortcuts-help"
          onClick={openShortcutsDialog}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          ?
        </button>
      </div>
      <p id="detail-shortcuts" className="sr-only">
        Keyboard shortcuts: b back to packages, e focus export, question mark for shortcuts.
      </p>

      <header className="detail-head">
        <div>
          <div className="detail-title-row">
            <h1 className="page-title">{pkg.client}</h1>
            <StatusPill status={pkg.status} />
          </div>
          <p className="detail-meta">
            <span className="pkg-ref tnum">{pkg.reference}</span>
            <span className="meta-pair">
              <span aria-hidden>·</span> {PERMIT_TYPE_LABELS[pkg.permitType]}
            </span>
            <span className="meta-pair">
              <span aria-hidden>·</span>{" "}
              <span className="pkg-county">
                <MapPin size={13} strokeWidth={2} aria-hidden />
                {county ? `${county.name} County` : pkg.countyId}
              </span>
            </span>
          </p>
          <p className="detail-address">{pkg.projectAddress}</p>
        </div>

        <div
          className="status-actions"
          role="group"
          aria-label="Move status"
          aria-describedby="detail-shortcuts"
        >
          {showAllStatuses ? (
            <span className="status-apply">
              <select
                className="status-select"
                value={pendingStatus ?? pkg.status}
                onChange={(e) => setPendingStatus(e.target.value as PackageStatus)}
                aria-label="Set any status"
                autoFocus
              >
                {(Object.keys(STATUS_LABELS) as PackageStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={!pendingStatus || pendingStatus === pkg.status}
                onClick={() => {
                  if (pendingStatus && pendingStatus !== pkg.status) {
                    updateStatus(pkg.id, pendingStatus);
                  }
                  setPendingStatus(null);
                  setShowAllStatuses(false);
                }}
              >
                Apply
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={cancelStatusPicker}>
                Cancel
              </button>
            </span>
          ) : (
            <>
              <div className="status-actions-forward">
                {nextMoves.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn-secondary"
                    onClick={() => updateStatus(pkg.id, s)}
                  >
                    Mark {STATUS_LABELS[s].toLowerCase()}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-secondary status-actions-mobile"
                onClick={() => setShowAllStatuses(true)}
              >
                Update status
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm status-actions-picker"
                onClick={() => setShowAllStatuses(true)}
              >
                Change status…
              </button>
            </>
          )}
        </div>
      </header>

      <div className="detail-facts">
        <span className="fact">
          <CalendarDays size={13} strokeWidth={2} aria-hidden />
          Opened {formatDate(pkg.createdAt)}
        </span>
        {pkg.submittedAt && (
          <span className="fact">
            <CalendarDays size={13} strokeWidth={2} aria-hidden />
            Submitted {formatDate(pkg.submittedAt)}
          </span>
        )}
        {pkg.deadline && pkg.status !== "approved" && pkg.status !== "closed" && (
          <span className={`deadline deadline-${deadlineUrgency(pkg.deadline)} tnum`}>
            <AlarmClock size={13} strokeWidth={2} aria-hidden />
            {pkg.deadlineLabel ?? "Deadline"} {formatDate(pkg.deadline)} — {deadlinePhrase(pkg.deadline)}
          </span>
        )}
      </div>

      <div className="detail-grid">
        <section className="card" aria-labelledby="checklist-heading">
          <div className="card-head">
            <h2 id="checklist-heading">Document checklist</h2>
            <div className="card-head-actions">
              <span className="tnum card-head-meta">{done}/{total} · {pct}%</span>
              <button
                ref={exportBtnRef}
                type="button"
                className="btn-secondary btn-sm export-btn"
                onClick={handleExport}
                disabled={exporting || attachedCount === 0}
                title={
                  attachedCount === 0
                    ? "Attach documents first"
                    : "Export submittal (.zip) (e)"
                }
              >
                {exporting ? (
                  <Loader2 size={13} className="spin" aria-hidden />
                ) : (
                  <FileArchive size={13} aria-hidden />
                )}
                {exporting ? (
                  "Bundling…"
                ) : (
                  <>
                    <span className="export-label-long">Export submittal (.zip)</span>
                    <span className="export-label-short">Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {exportResult && (
            <p className="export-note export-ok" role="status">
              Downloaded {exportResult.fileName} with {exportResult.fileCount} document
              {exportResult.fileCount === 1 ? "" : "s"}.
              {exportResult.missing.length > 0 &&
                ` Heads up: ${exportResult.missing.length} checklist item${exportResult.missing.length === 1 ? " has" : "s have"} no documents attached.`}
            </p>
          )}
          {exportError && (
            <p className="export-note export-err" role="alert">
              {exportError}
            </p>
          )}
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Checklist completion"
          >
            <div className="progress-fill" style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
          <ul className="checklist">
            {pkg.checklist.map((item) => (
              <li key={item.id} className="check-row">
                <label className={`check-item ${item.done ? "is-done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(pkg.id, item.id)}
                  />
                  <span className="check-text">
                    <span className="check-label">{item.label}</span>
                    {item.note && <span className="check-note">{item.note}</span>}
                  </span>
                </label>
                <div className="check-files">
                  {item.attachments.map((att) => (
                    <div key={att.id} className="file-chip">
                      <button
                        type="button"
                        className="file-chip-name"
                        onClick={() => downloadAttachment(att.id, att.fileName)}
                        title={`Download ${att.fileName}`}
                      >
                        <Download size={11} strokeWidth={2} aria-hidden />
                        <span className="file-chip-label">{att.fileName}</span>
                        <span className="file-chip-size tnum">{formatBytes(att.size)}</span>
                      </button>
                      <button
                        type="button"
                        className="file-chip-remove"
                        onClick={() => requestRemoval(item.id, att)}
                        aria-label={`Remove ${att.fileName}`}
                      >
                        <X size={11} strokeWidth={2.25} aria-hidden />
                      </button>
                    </div>
                  ))}
                  <label
                    className={
                      item.attachments.length > 0 ? "file-attach file-attach--quiet" : "file-attach"
                    }
                  >
                    <Paperclip size={12} strokeWidth={2} aria-hidden />
                    {item.attachments.length === 0 ? "Attach" : "Add"}
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        void handleAttach(item.id, e.target.files);
                        e.target.value = "";
                      }}
                      aria-label={`Attach documents to ${item.label}`}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="detail-side">
          <PropertyCard pkg={pkg} />
          <ContractorsCard pkg={pkg} />

          <section className="card" aria-labelledby="activity-heading">
            <div className="card-head">
              <h2 id="activity-heading">Activity</h2>
            </div>
            <form onSubmit={logActivity} className="activity-form">
              <label htmlFor="new-activity" className="sr-only">
                Log activity
              </label>
              <input
                id="new-activity"
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Log a call, email, or county update…"
              />
              <button
                type="submit"
                className="btn-secondary"
                disabled={!newActivity.trim()}
                aria-label="Add activity entry"
              >
                <Plus size={15} strokeWidth={2.25} aria-hidden />
              </button>
            </form>
            {sortedActivity.length === 0 ? (
              <p className="activity-empty">No activity logged yet — add a call, email, or county update above.</p>
            ) : (
              <ol className="timeline">
                {sortedActivity.map((entry) => (
                  <li key={entry.id} className="timeline-entry">
                    <span className="timeline-date tnum">{formatDate(entry.date)}</span>
                    <span className="timeline-text">{entry.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card" aria-labelledby="notes-heading">
            <div className="card-head">
              <h2 id="notes-heading">Notes</h2>
              {notesSaving && (
                <span className="notes-saving" role="status">
                  Saving…
                </span>
              )}
              {notesSavedVisible && !notesSaving && (
                <span className="notes-saved" role="status">
                  Saved
                </span>
              )}
            </div>
            <textarea
              className="notes-area"
              value={notesDraft ?? pkg.notes ?? ""}
              onChange={(e) => editNotes(e.target.value)}
              onBlur={flushNotes}
              placeholder="Reviewer names, portal quirks, resubmission instructions…"
              rows={4}
              aria-label="Package notes"
            />
          </section>
        </div>
      </div>

      {pendingRemoval && (
        <div className="undo-toast" role="status">
          <span className="undo-toast-text">
            Removed “{pendingRemoval.attachment.fileName}”
          </span>
          <button type="button" className="undo-toast-btn" onClick={undoRemoval}>
            Undo
          </button>
        </div>
      )}

      <p className="keyboard-hints detail-keyboard-hints" aria-hidden>
        <kbd>b</kbd> back
        <span className="keyboard-hints-sep" aria-hidden>·</span>
        <kbd>e</kbd> export
        <span className="keyboard-hints-sep" aria-hidden>·</span>
        <kbd>?</kbd> shortcuts
      </p>

      <dialog
        ref={shortcutsDialogRef}
        className="shortcuts-dialog"
        aria-labelledby="detail-shortcuts-dialog-title"
      >
        <div className="shortcuts-dialog-head">
          <h2 id="detail-shortcuts-dialog-title">Keyboard shortcuts</h2>
          <button
            type="button"
            className="btn-ghost btn-sm shortcuts-dialog-close"
            onClick={closeShortcutsDialog}
            aria-label="Close shortcuts"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <dl className="shortcuts-list">
          <div className="shortcuts-entry">
            <dt><kbd>b</kbd></dt>
            <dd>Back to packages</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>e</kbd></dt>
            <dd>Focus export (when documents are attached)</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>Esc</kbd></dt>
            <dd>Close status picker or this list</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>?</kbd></dt>
            <dd>Open this list</dd>
          </div>
        </dl>
      </dialog>
    </div>
  );
}
