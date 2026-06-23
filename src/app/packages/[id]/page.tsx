"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  AlarmClock,
  CalendarDays,
  ChevronRight,
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
import { ContractorsCard } from "@/components/ContractorsCard";
import { PropertyCard } from "@/components/PropertyCard";
import { NEXT_STATUSES } from "@/lib/status-flow";

type TabKey = "checklist" | "activity" | "contractors" | "notes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "checklist", label: "Document Checklist" },
  { key: "activity", label: "Timeline & Activity" },
  { key: "contractors", label: "Contractors" },
  { key: "notes", label: "Notes" },
];

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
  const [activeTab, setActiveTab] = useState<TabKey>("checklist");
  const [newActivity, setNewActivity] = useState("");
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PackageStatus | null>(null);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedVisible, setNotesSavedVisible] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const shortcutsDialogRef = useRef<HTMLDialogElement>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PackageStatus | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{
    itemId: string;
    attachment: Attachment;
  } | null>(null);
  const removalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    from: PackageStatus;
    to: PackageStatus;
  } | null>(null);
  const statusChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (removalTimer.current) clearTimeout(removalTimer.current);
      if (statusChangeTimer.current) clearTimeout(statusChangeTimer.current);
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
      <div className="pkg-detail-skeleton" role="status" aria-label="Loading package">
        <div className="pkg-detail-skeleton-line" style={{ width: "30%" }} />
        <div className="pkg-detail-skeleton-line" style={{ width: "55%", marginTop: 8 }} />
        <div className="pkg-detail-skeleton-line" style={{ width: "70%", marginTop: 4 }} />
      </div>
    );
  }

  const pkg = packages.find((p) => p.id === params.id);

  if (!pkg) {
    return (
      <div className="pkg-detail-empty">
        <span className="pkg-detail-empty-icon">
          <SearchX size={36} strokeWidth={1.25} aria-hidden />
        </span>
        <p>Package not found — it may have been removed.</p>
        <Link href="/packages" className="btn-secondary" style={{ marginTop: 8 }}>
          Back to portfolio
        </Link>
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
  const hasCorrections = pkg.status === "corrections";

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

  function requestStatusChange(newStatus: PackageStatus) {
    if (statusChangeTimer.current) clearTimeout(statusChangeTimer.current);
    const previousStatus = pkg!.status;
    updateStatus(pkg!.id, newStatus);
    setPendingStatusChange({ from: previousStatus, to: newStatus });
    statusChangeTimer.current = setTimeout(() => {
      setPendingStatusChange(null);
      statusChangeTimer.current = null;
    }, 8000);
  }

  function undoStatusChange() {
    if (!pendingStatusChange) return;
    if (statusChangeTimer.current) clearTimeout(statusChangeTimer.current);
    statusChangeTimer.current = null;
    updateStatus(pkg!.id, pendingStatusChange.from);
    setPendingStatusChange(null);
  }

  const TERMINAL_STATUSES: PackageStatus[] = ["approved", "closed"];

  function initiateStatusChange(newStatus: PackageStatus) {
    if (TERMINAL_STATUSES.includes(newStatus)) {
      setPendingConfirm(newStatus);
      confirmDialogRef.current?.showModal();
    } else {
      requestStatusChange(newStatus);
    }
  }

  function confirmStatusChange() {
    if (pendingConfirm) {
      requestStatusChange(pendingConfirm);
      setPendingConfirm(null);
    }
    confirmDialogRef.current?.close();
  }

  function cancelStatusChange() {
    setPendingConfirm(null);
    confirmDialogRef.current?.close();
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

  const parts = pkg.projectAddress.split(",");
  const street = parts[0]?.trim() ?? pkg.projectAddress;

  return (
    <>
      {/* Detail header */}
      <div className="pkg-detail-header">
        {/* Breadcrumbs */}
        <nav className="pkg-detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/packages">Portfolio</Link>
          <span className="pkg-detail-breadcrumbs-sep" aria-hidden>
            <ChevronRight size={12} strokeWidth={2} />
          </span>
          <span>{county ? county.name : pkg.countyId}</span>
          <span className="pkg-detail-breadcrumbs-sep" aria-hidden>
            <ChevronRight size={12} strokeWidth={2} />
          </span>
          <span className="pkg-detail-breadcrumbs-current">{pkg.reference}</span>
        </nav>

        {/* Title row */}
        <div className="pkg-detail-header-row">
          <h1 className="pkg-detail-h1">{street}</h1>
          <div className="pkg-detail-header-actions">
            {pkg.deadline &&
              pkg.status !== "approved" &&
              pkg.status !== "closed" &&
              (deadlineUrgency(pkg.deadline) === "overdue" || deadlineUrgency(pkg.deadline) === "soon") && (
              <span className={`deadline deadline-${deadlineUrgency(pkg.deadline)} tnum`}>
                <AlarmClock size={13} strokeWidth={2} aria-hidden />
                {pkg.deadlineLabel ?? "Deadline"} {deadlinePhrase(pkg.deadline)}
              </span>
            )}

            {/* Status actions */}
            {showAllStatuses ? (
              <div className="pkg-status-picker">
                <select
                  className="pkg-status-select"
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
                  className="pkg-detail-primary-btn"
                  disabled={!pendingStatus || pendingStatus === pkg.status}
                  onClick={() => {
                    if (pendingStatus && pendingStatus !== pkg.status) {
                      setPendingStatus(null);
                      setShowAllStatuses(false);
                      initiateStatusChange(pendingStatus);
                    } else {
                      setPendingStatus(null);
                      setShowAllStatuses(false);
                    }
                  }}
                >
                  Apply
                </button>
                <button type="button" className="pkg-status-btn" onClick={cancelStatusPicker}>
                  Cancel
                </button>
              </div>
            ) : nextMoves.length > 0 ? (
              <div className="pkg-status-actions">
                {nextMoves.slice(0, 2).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="pkg-detail-primary-btn"
                    onClick={() => initiateStatusChange(s)}
                  >
                    Mark {STATUS_LABELS[s].toLowerCase()}
                  </button>
                ))}
                <button
                  type="button"
                  className="pkg-status-btn"
                  onClick={() => setShowAllStatuses(true)}
                >
                  Change…
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="pkg-status-btn"
                onClick={() => setShowAllStatuses(true)}
              >
                Change status…
              </button>
            )}
          </div>
        </div>

        {/* Meta line */}
        <p className="pkg-detail-meta-line">
          <MapPin size={13} strokeWidth={2} aria-hidden />
          {county ? `${county.name} County` : pkg.countyId}
          <span className="pkg-detail-meta-sep" aria-hidden>·</span>
          {PERMIT_TYPE_LABELS[pkg.permitType]}
          <span className="pkg-detail-meta-sep" aria-hidden>·</span>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem" }}>{pkg.reference}</span>
          {pkg.client && (
            <>
              <span className="pkg-detail-meta-sep" aria-hidden>·</span>
              {pkg.client}
            </>
          )}
          <span className="pkg-detail-meta-sep" aria-hidden>·</span>
          <CalendarDays size={13} strokeWidth={2} aria-hidden />
          Opened {formatDate(pkg.createdAt)}
          {pkg.deadline &&
            pkg.status !== "approved" &&
            pkg.status !== "closed" &&
            deadlineUrgency(pkg.deadline) === "normal" && (
            <>
              <span className="pkg-detail-meta-sep" aria-hidden>·</span>
              <span className={`deadline deadline-normal tnum`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <AlarmClock size={13} strokeWidth={2} aria-hidden />
                {pkg.deadlineLabel ?? "Deadline"} {formatDate(pkg.deadline)}
              </span>
            </>
          )}
        </p>

        {/* RFI alert for corrections */}
        {hasCorrections && (
          <div className="pkg-detail-rfi-alert" role="alert">
            <AlertTriangle size={16} className="pkg-detail-rfi-alert-icon" aria-hidden />
            <p className="pkg-detail-rfi-alert-text">
              <strong>Action required:</strong> County issued corrections. Review the checklist below and resubmit with updated documents.
            </p>
          </div>
        )}

        {/* Tab bar */}
        <div className="pkg-detail-tabs" role="tablist" aria-label="Package sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`pkg-tab-${tab.key}`}
              className={`pkg-detail-tab${activeTab === tab.key ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="pkg-detail-content">
        {/* Checklist tab */}
        <div
          id="pkg-tab-checklist"
          role="tabpanel"
          aria-label="Document Checklist"
          className={`pkg-tab-pane${activeTab === "checklist" ? " is-active" : ""}`}
        >
          {/* Export / error messages */}
          {exportResult && (
            <p className="pkg-export-note pkg-export-ok" role="status">
              Downloaded {exportResult.fileName} with {exportResult.fileCount} document
              {exportResult.fileCount === 1 ? "" : "s"}.
              {exportResult.missing.length > 0 && (
                <> Heads up: {exportResult.missing.join(", ")} {exportResult.missing.length === 1 ? "has" : "have"} no documents attached.</>
              )}
            </p>
          )}
          {exportError && (
            <p className="pkg-export-note pkg-export-err" role="alert">
              {exportError}
            </p>
          )}

          {/* Heading + count badge */}
          <div className="pkg-docs-section-head">
            <h2 className="pkg-docs-heading">Required Documents</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pkg-docs-count-badge">
                <strong>{done}/{total}</strong> Completed · {pct}%
              </span>
              <button
                ref={exportBtnRef}
                type="button"
                className="pkg-detail-primary-btn"
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
                {exporting ? "Bundling…" : "Export .zip"}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Checklist completion"
            style={{ marginBottom: 16 }}
          >
            <div className="progress-fill" style={{ transform: `scaleX(${pct / 100})` }} />
          </div>

          {/* Document table */}
          <div className="pkg-doc-table-wrap">
            <table className="pkg-doc-table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pkg.checklist.map((item) => {
                  const hasFiles = item.attachments.length > 0;
                  return (
                    <tr key={item.id}>
                      <td>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleChecklistItem(pkg.id, item.id)}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <span>
                            <span className="pkg-doc-label">{item.label}</span>
                            {item.note && <p className="pkg-doc-note">{item.note}</p>}
                          </span>
                        </label>
                      </td>
                      <td>
                        {item.done && hasFiles ? (
                          <span className="pkg-doc-pill pkg-doc-pill--done" aria-label="Status: Validated — document attached and marked done">Validated</span>
                        ) : item.done ? (
                          <span className="pkg-doc-pill pkg-doc-pill--done" aria-label="Status: Done — marked complete, no document attached">Done</span>
                        ) : hasFiles ? (
                          <span className="pkg-doc-pill pkg-doc-pill--missing" aria-label="Status: Attached — file present, not yet marked done">Attached</span>
                        ) : (
                          <span className="pkg-doc-pill pkg-doc-pill--missing" aria-label="Status: Missing — no document attached">Missing</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {item.attachments.map((att) => (
                            <div key={att.id} className="pkg-doc-file-chip">
                              <button
                                type="button"
                                className="pkg-doc-file-link"
                                onClick={() => downloadAttachment(att.id, att.fileName)}
                                title={`Download ${att.fileName} (${formatBytes(att.size)})`}
                              >
                                <Download size={11} strokeWidth={2} aria-hidden />
                                {att.fileName}
                              </button>
                              <button
                                type="button"
                                className="pkg-doc-remove-btn"
                                onClick={() => requestRemoval(item.id, att)}
                                aria-label={`Remove ${att.fileName}`}
                              >
                                <X size={11} strokeWidth={2.25} aria-hidden />
                              </button>
                            </div>
                          ))}
                          <label className="pkg-doc-attach-label">
                            <Paperclip size={12} strokeWidth={2} aria-hidden />
                            {hasFiles ? "Add file" : "Attach"}
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Activity tab */}
        <div
          id="pkg-tab-activity"
          role="tabpanel"
          aria-label="Timeline & Activity"
          className={`pkg-tab-pane${activeTab === "activity" ? " is-active" : ""}`}
        >
          <div className="pkg-activity-section">
            <form onSubmit={logActivity} className="pkg-activity-form">
              <label htmlFor="pkg-new-activity" className="sr-only">Log activity</label>
              <input
                id="pkg-new-activity"
                type="text"
                className="pkg-activity-input"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Log a call, email, or county update…"
              />
              <button
                type="submit"
                className="pkg-activity-add-btn"
                disabled={!newActivity.trim()}
                aria-label="Add activity entry"
              >
                <Plus size={15} strokeWidth={2.25} aria-hidden />
              </button>
            </form>

            {sortedActivity.length === 0 ? (
              <p className="pkg-activity-empty">No activity logged yet.</p>
            ) : (
              <ol className="pkg-timeline">
                {sortedActivity.map((entry) => (
                  <li key={entry.id} className="pkg-timeline-entry">
                    <span className="pkg-timeline-date">{formatDate(entry.date)}</span>
                    <span className="pkg-timeline-text">{entry.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Property card in activity tab for reference */}
          <div className="pkg-contractors-section">
            <PropertyCard pkg={pkg} />
          </div>
        </div>

        {/* Contractors tab */}
        <div
          id="pkg-tab-contractors"
          role="tabpanel"
          aria-label="Contractors"
          className={`pkg-tab-pane${activeTab === "contractors" ? " is-active" : ""}`}
        >
          <div className="pkg-contractors-section">
            <ContractorsCard pkg={pkg} />
          </div>
        </div>

        {/* Notes tab */}
        <div
          id="pkg-tab-notes"
          role="tabpanel"
          aria-label="Notes"
          className={`pkg-tab-pane${activeTab === "notes" ? " is-active" : ""}`}
        >
          <div className="pkg-notes-section">
            <div className="pkg-notes-head">
              <h3 className="pkg-notes-heading">Notes</h3>
              {notesSaving && (
                <span className="pkg-notes-saving" role="status">Saving…</span>
              )}
              {notesSavedVisible && !notesSaving && (
                <span className="pkg-notes-saved" role="status">Saved</span>
              )}
            </div>
            <textarea
              className="pkg-notes-textarea"
              value={notesDraft ?? pkg.notes ?? ""}
              onChange={(e) => editNotes(e.target.value)}
              onBlur={flushNotes}
              placeholder="Reviewer names, portal quirks, resubmission instructions…"
              rows={8}
              aria-label="Package notes"
            />
          </div>
        </div>
      </div>

      {/* Undo toasts */}
      {pendingStatusChange && (
        <div className="undo-toast" role="status">
          <span className="undo-toast-text">
            Status → {STATUS_LABELS[pendingStatusChange.to]}
          </span>
          <button type="button" className="undo-toast-btn" onClick={undoStatusChange}>
            Undo
          </button>
        </div>
      )}
      {pendingRemoval && (
        <div className="undo-toast" role="status">
          <span className="undo-toast-text">
            Removed "{pendingRemoval.attachment.fileName}"
          </span>
          <button type="button" className="undo-toast-btn" onClick={undoRemoval}>
            Undo
          </button>
        </div>
      )}

      {/* Terminal status confirm dialog */}
      <dialog
        ref={confirmDialogRef}
        className="confirm-dialog"
        aria-labelledby="confirm-status-title"
        aria-modal="true"
      >
        <div className="confirm-dialog-body">
          <h2 id="confirm-status-title">
            Mark as {pendingConfirm ? STATUS_LABELS[pendingConfirm].toLowerCase() : ""}?
          </h2>
          <p>
            This moves the package to the Approved &amp; Closed group.
            You can undo immediately after with the toast.
          </p>
        </div>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={cancelStatusChange}>
            Cancel
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={confirmStatusChange}>
            Confirm
          </button>
        </div>
      </dialog>

      {/* Shortcuts dialog */}
      <dialog
        ref={shortcutsDialogRef}
        className="shortcuts-dialog"
        aria-labelledby="detail-shortcuts-dialog-title"
        aria-modal="true"
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
            <dt><kbd>n</kbd></dt>
            <dd>New package</dd>
          </div>
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
    </>
  );
}
