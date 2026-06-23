"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  CheckSquare,
  ChevronRight,
  Inbox,
  HelpCircle,
  Loader2,
  MapPin,
  Plus,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { forwardStatusOptions } from "@/lib/status-flow";
import { COUNTIES, countyById } from "@/lib/counties";
import { daysUntil, deadlinePhrase, deadlineUrgency, formatShortDate } from "@/lib/dates";
import {
  ACTION_STATUSES,
  PERMIT_TYPE_LABELS,
  STATUS_LABELS,
  type PackageStatus,
  type PermitPackage,
  type PermitType,
} from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { NewPackagePanel } from "@/components/NewPackagePanel";

type GroupKey = "action" | "waiting" | "done";

const GROUPS: { key: GroupKey; title: string; hint: string }[] = [
  { key: "action", title: "Action needed", hint: "The ball is in your court" },
  { key: "waiting", title: "With the county", hint: "Submitted, in review, or resubmitted" },
  { key: "done", title: "Approved & closed", hint: "Nothing left to do" },
];

/** Waiting lists longer than this collapse by default (expand on demand). */
const WAITING_COLLAPSE_THRESHOLD = 5;

/** Urgent deadlines shown in the attention strip before "Show all". */
const URGENT_VISIBLE_CAP = 3;

const BULK_UNDO_MS = 8000;

const SELECT_HINT_KEY = "meridian-select-hint-seen";
const KBD_HINTS_KEY = "meridian-kbd-hints-seen";

interface BulkUndoState {
  snapshot: Array<{ id: string; status: PackageStatus }>;
  targetStatus: PackageStatus;
  count: number;
}

function groupOf(pkg: PermitPackage): GroupKey {
  if (ACTION_STATUSES.includes(pkg.status)) return "action";
  if (pkg.status === "approved" || pkg.status === "closed") return "done";
  return "waiting";
}

/** Overdue first, then due soon, then by date; no-deadline packages last. */
function comparePackages(a: PermitPackage, b: PermitPackage): number {
  const rank = (p: PermitPackage) => {
    if (!p.deadline) return 3;
    if (Number.isNaN(daysUntil(p.deadline))) return 4;
    const u = deadlineUrgency(p.deadline);
    if (u === "overdue") return 0;
    if (u === "soon") return 1;
    return 2;
  };
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (a.deadline && b.deadline) {
    const byDate = a.deadline.localeCompare(b.deadline);
    if (byDate !== 0) return byDate;
  } else if (a.deadline) return -1;
  else if (b.deadline) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

function displayClient(name: string): string {
  const trimmed = name.trim();
  return trimmed || "Unnamed client";
}

function daysSince(iso: string): number {
  const days = daysUntil(iso);
  return Number.isNaN(days) ? 0 : -days;
}

function isStaleInReview(pkg: PermitPackage): boolean {
  if (pkg.status !== "in_review") return false;
  const anchor = pkg.submittedAt ?? pkg.createdAt;
  return daysSince(anchor) > 14;
}

function packageRowLabel(pkg: PermitPackage, done: number, total: number): string {
  const county = countyById(pkg.countyId);
  const parts = [
    displayClient(pkg.client),
    STATUS_LABELS[pkg.status],
    pkg.reference,
    PERMIT_TYPE_LABELS[pkg.permitType],
    county ? `${county.name} County` : pkg.countyId,
    `checklist ${done} of ${total} complete`,
  ];
  if (pkg.deadline && pkg.status !== "approved" && pkg.status !== "closed") {
    parts.push(`${pkg.deadlineLabel ?? "Deadline"} ${deadlinePhrase(pkg.deadline)}`);
  }
  return parts.join(", ");
}

function PackageRow({
  pkg,
  onFocus,
  selectionMode,
  selected,
  onSelectClick,
}: {
  pkg: PermitPackage;
  onFocus?: () => void;
  selectionMode: boolean;
  selected: boolean;
  onSelectClick: (shiftKey: boolean) => void;
}) {
  const county = countyById(pkg.countyId);
  const done = pkg.checklist.filter((i) => i.done).length;
  const total = pkg.checklist.length;
  const rowLabel = packageRowLabel(pkg, done, total);
  const openLabel = `Open ${displayClient(pkg.client)}`;
  const shiftClick = useRef(false);

  const rowBody = (
    <>
      <div className="pkg-row-main">
        <div className="pkg-row-top">
          <span className="pkg-client">{displayClient(pkg.client)}</span>
          <StatusPill status={pkg.status} />
        </div>
        <div className="pkg-row-sub">
          <span className="pkg-ref tnum">{pkg.reference}</span>
          <span className="meta-pair">
            <span aria-hidden>·</span> {PERMIT_TYPE_LABELS[pkg.permitType]}
          </span>
          <span className="meta-pair">
            <span aria-hidden>·</span>{" "}
            <span className="pkg-county">
              <MapPin size={12} strokeWidth={2} aria-hidden />
              {county ? `${county.name} County` : pkg.countyId}
            </span>
          </span>
        </div>
      </div>
      <div className="pkg-row-meta">
        {pkg.deadline && pkg.status !== "approved" && pkg.status !== "closed" && (
          <span className={`deadline deadline-${deadlineUrgency(pkg.deadline)} tnum`}>
            <AlarmClock size={13} strokeWidth={2} aria-hidden />
            {pkg.deadlineLabel ?? "Deadline"} · {deadlinePhrase(pkg.deadline)}
          </span>
        )}
        <span className="pkg-checklist-count tnum">
          {done}/{total} docs
        </span>
      </div>
    </>
  );

  return (
    <li className={selected ? "pkg-list-item pkg-list-item--selected" : "pkg-list-item"}>
      {selectionMode && (
        <div className="pkg-row-select">
          <input
            type="checkbox"
            className="pkg-row-checkbox"
            checked={selected}
            onMouseDown={(e) => {
              shiftClick.current = e.shiftKey;
            }}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onSelectClick(shiftClick.current)}
            aria-label={`Select ${displayClient(pkg.client)}, ${STATUS_LABELS[pkg.status]}`}
          />
        </div>
      )}
      {selectionMode ? (
        <div className="pkg-row-wrap">
          <button
            type="button"
            className="pkg-row pkg-row--selectable"
            data-pkg-id={pkg.id}
            aria-pressed={selected}
            aria-label={`${rowLabel}. ${selected ? "Selected" : "Not selected"}.`}
            onClick={() => onSelectClick(false)}
            onFocus={onFocus}
          >
            {rowBody}
          </button>
          <Link
            href={`/packages/${pkg.id}`}
            className="pkg-row-open"
            aria-label={openLabel}
            title={openLabel}
          >
            <ChevronRight size={16} className="pkg-chevron" aria-hidden />
          </Link>
        </div>
      ) : (
        <Link
          href={`/packages/${pkg.id}`}
          className="pkg-row"
          data-pkg-id={pkg.id}
          aria-label={rowLabel}
          onFocus={onFocus}
        >
          {rowBody}
          <ChevronRight size={16} className="pkg-chevron" aria-hidden />
        </Link>
      )}
    </li>
  );
}

function SkeletonRows() {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading packages">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-line" style={{ width: "38%" }} />
          <div className="skeleton-line" style={{ width: "62%" }} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { loading, packages, bulkUpdateStatus, restorePackageStatuses } = useStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [waitingExpanded, setWaitingExpanded] = useState(false);
  const [rowFocusId, setRowFocusId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkTarget, setBulkTarget] = useState<PackageStatus | "">("");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkUndo, setBulkUndo] = useState<BulkUndoState | null>(null);
  const [showSelectHint, setShowSelectHint] = useState(false);
  const [urgentExpanded, setUrgentExpanded] = useState(false);
  /** Hint bar retires once any shortcut has been used; starts hidden to avoid a flash. */
  const [kbdHintsSeen, setKbdHintsSeen] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const shortcutsDialogRef = useRef<HTMLDialogElement>(null);
  const bulkUndoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSelectAnchor = useRef<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      if (typeFilter && p.permitType !== typeFilter) return false;
      if (countyFilter && p.countyId !== countyFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.client.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.projectAddress.toLowerCase().includes(q) ||
        (p.contractor?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [packages, query, typeFilter, countyFilter, statusFilter]);

  const filtering =
    query.trim() !== "" || typeFilter !== "" || countyFilter !== "" || statusFilter !== "";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count += 1;
    if (typeFilter) count += 1;
    if (countyFilter) count += 1;
    if (statusFilter) count += 1;
    return count;
  }, [query, typeFilter, countyFilter, statusFilter]);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, PermitPackage[]> = { action: [], waiting: [], done: [] };
    for (const pkg of filtered) map[groupOf(pkg)].push(pkg);
    // Within each group, hardest deadline first; no-deadline last.
    for (const key of Object.keys(map) as GroupKey[]) {
      map[key].sort(comparePackages);
    }
    return map;
  }, [filtered]);

  const urgent = useMemo(
    () =>
      packages
        .filter(
          (p) =>
            p.deadline &&
            p.status !== "approved" &&
            p.status !== "closed" &&
            deadlineUrgency(p.deadline) !== "normal"
        )
        .sort(comparePackages),
    [packages]
  );

  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);

  const urgentHiddenCount = useMemo(
    () => (filtering ? urgent.filter((p) => !filteredIds.has(p.id)).length : 0),
    [filtering, urgent, filteredIds]
  );

  const visibleUrgent = useMemo(
    () => (urgentExpanded ? urgent : urgent.slice(0, URGENT_VISIBLE_CAP)),
    [urgent, urgentExpanded]
  );

  const urgentOverflowCount = urgent.length - visibleUrgent.length;

  const waitingCount = grouped.waiting.length;
  const waitingCollapsible = waitingCount > WAITING_COLLAPSE_THRESHOLD;
  const staleInReviewCount = useMemo(
    () => grouped.waiting.filter(isStaleInReview).length,
    [grouped.waiting]
  );

  const visiblePackages = useMemo(() => {
    if (loading || packages.length === 0) return [];
    if (filtering && filtered.length === 0) return [];
    const items: PermitPackage[] = [];
    for (const { key } of GROUPS) {
      if (key === "done" && !doneExpanded) continue;
      if (key === "waiting" && waitingCollapsible && !waitingExpanded) continue;
      items.push(...grouped[key]);
    }
    return items;
  }, [
    loading,
    packages.length,
    filtering,
    filtered.length,
    grouped,
    doneExpanded,
    waitingCollapsible,
    waitingExpanded,
  ]);

  function clearFilters() {
    setQuery("");
    setTypeFilter("");
    setCountyFilter("");
    setStatusFilter("");
    setRowFocusId(null);
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    clearSelection();
    setBulkTarget("");
    lastSelectAnchor.current = null;
  }

  function toggleSelectionMode() {
    if (selectionMode) {
      exitSelectionMode();
      setShowSelectHint(false);
      return;
    }
    setSelectionMode(true);
    try {
      if (!localStorage.getItem(SELECT_HINT_KEY)) setShowSelectHint(true);
    } catch {
      /* private browsing */
    }
  }

  function togglePackageSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePackageSelectClick(id: string, shiftKey: boolean) {
    if (shiftKey && lastSelectAnchor.current) {
      const anchorIdx = visiblePackages.findIndex((p) => p.id === lastSelectAnchor.current);
      const clickIdx = visiblePackages.findIndex((p) => p.id === id);
      if (anchorIdx >= 0 && clickIdx >= 0) {
        const start = Math.min(anchorIdx, clickIdx);
        const end = Math.max(anchorIdx, clickIdx);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) {
            next.add(visiblePackages[i].id);
          }
          return next;
        });
        lastSelectAnchor.current = id;
        return;
      }
    }
    togglePackageSelected(id);
    lastSelectAnchor.current = id;
  }

  function expandGroup(key: GroupKey) {
    if (key === "done") setDoneExpanded(true);
    if (key === "waiting") setWaitingExpanded(true);
  }

  function selectAllVisible() {
    setSelectedIds(new Set(visiblePackages.map((p) => p.id)));
  }

  const selectedPackages = useMemo(
    () => packages.filter((p) => selectedIds.has(p.id)),
    [packages, selectedIds]
  );

  const selectedCount = selectedPackages.length;

  const bulkForwardOptions = useMemo(
    () => forwardStatusOptions(selectedPackages.map((p) => p.status)),
    [selectedPackages]
  );

  const bulkBlocked = selectedCount > 0 && bulkForwardOptions.length === 0;

  useEffect(() => {
    if (bulkForwardOptions.length === 1) {
      setBulkTarget(bulkForwardOptions[0]);
      return;
    }
    if (bulkTarget && bulkForwardOptions.includes(bulkTarget)) return;
    setBulkTarget(bulkForwardOptions[0] ?? "");
  }, [bulkForwardOptions, bulkTarget]);

  function dismissBulkUndo() {
    if (bulkUndoTimer.current) {
      clearTimeout(bulkUndoTimer.current);
      bulkUndoTimer.current = null;
    }
    setBulkUndo(null);
  }

  function scheduleBulkUndoDismiss() {
    if (bulkUndoTimer.current) clearTimeout(bulkUndoTimer.current);
    bulkUndoTimer.current = setTimeout(() => {
      setBulkUndo(null);
      bulkUndoTimer.current = null;
    }, BULK_UNDO_MS);
  }

  function resetBulkUndoTimer() {
    if (bulkUndo) scheduleBulkUndoDismiss();
  }

  function dismissSelectHint() {
    try {
      localStorage.setItem(SELECT_HINT_KEY, "1");
    } catch {
      /* private browsing */
    }
    setShowSelectHint(false);
  }

  useEffect(() => {
    try {
      setKbdHintsSeen(Boolean(localStorage.getItem(KBD_HINTS_KEY)));
    } catch {
      /* private browsing — leave hidden */
    }
  }, []);

  function markShortcutUsed() {
    try {
      localStorage.setItem(KBD_HINTS_KEY, "1");
    } catch {
      /* private browsing */
    }
    setKbdHintsSeen(true);
  }

  function openShortcutsDialog() {
    markShortcutUsed();
    shortcutsDialogRef.current?.showModal();
  }

  function closeShortcutsDialog() {
    shortcutsDialogRef.current?.close();
  }

  function handleBulkApply() {
    if (!bulkTarget || selectedCount === 0 || bulkBlocked) return;
    const snapshot = selectedPackages.map((p) => ({ id: p.id, status: p.status }));
    const count = selectedCount;
    const targetStatus = bulkTarget;
    setBulkApplying(true);
    bulkUpdateStatus(selectedPackages.map((p) => ({ id: p.id, status: targetStatus })));
    setBulkApplying(false);
    exitSelectionMode();
    dismissBulkUndo();
    setBulkUndo({ snapshot, targetStatus, count });
    scheduleBulkUndoDismiss();
    setLiveMessage(
      `${count} package${count === 1 ? "" : "s"} marked ${STATUS_LABELS[targetStatus]}`
    );
  }

  function handleBulkUndo() {
    if (!bulkUndo) return;
    restorePackageStatuses(bulkUndo.snapshot);
    dismissBulkUndo();
    setLiveMessage("Bulk status update undone");
  }

  useEffect(() => {
    return () => {
      if (bulkUndoTimer.current) clearTimeout(bulkUndoTimer.current);
    };
  }, []);

  const allVisibleSelected =
    visiblePackages.length > 0 && visiblePackages.every((p) => selectedIds.has(p.id));

  const collapsedGroupInfo = useMemo(() => {
    const info: { key: GroupKey; title: string; count: number }[] = [];
    if (!doneExpanded && grouped.done.length > 0) {
      info.push({ key: "done", title: "Approved & closed", count: grouped.done.length });
    }
    if (waitingCollapsible && !waitingExpanded && grouped.waiting.length > 0) {
      info.push({ key: "waiting", title: "With the county", count: grouped.waiting.length });
    }
    return info;
  }, [doneExpanded, waitingCollapsible, waitingExpanded, grouped.done.length, grouped.waiting.length]);

  useEffect(() => {
    if (!showSelectHint || selectedCount === 0) return;
    try {
      localStorage.setItem(SELECT_HINT_KEY, "1");
    } catch {
      /* private browsing */
    }
    setShowSelectHint(false);
  }, [showSelectHint, selectedCount]);

  // Debounced screen-reader announcements — avoids speaking every keystroke while searching.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (loading) {
        setLiveMessage("");
        return;
      }
      if (filtering) {
        setLiveMessage(
          `${filtered.length} of ${packages.length} package${packages.length === 1 ? "" : "s"} shown`
        );
        return;
      }
      setLiveMessage(
        `${packages.length} package${packages.length === 1 ? "" : "s"}, ${grouped.action.length} need your attention`
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [loading, filtering, filtered.length, packages.length, grouped.action.length, query, typeFilter, countyFilter, statusFilter]);

  function focusPackageRow(id: string) {
    const el = document.querySelector<HTMLElement>(`[data-pkg-id="${id}"]`);
    el?.focus();
    setRowFocusId(id);
  }

  function isPackageRowKeyTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.classList.contains("pkg-row--selectable")) return true;
    if (target.classList.contains("pkg-row-open")) return true;
    if (target.classList.contains("pkg-row-checkbox")) return true;
    return Boolean(target.closest(".pkg-row-open, .pkg-row--selectable"));
  }

  // "/" search, "n" new package, "j"/"k" row nav, Escape clears (outside form fields).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Escape" && !panelOpen) {
        if (inField && e.target === searchRef.current) {
          e.preventDefault();
          if (query.trim()) setQuery("");
          else searchRef.current?.blur();
          return;
        }
        if (!inField && selectionMode) {
          e.preventDefault();
          if (selectedIds.size > 0) clearSelection();
          else exitSelectionMode();
          return;
        }
        if (!inField && filtering) {
          e.preventDefault();
          clearFilters();
        }
        return;
      }

      if (inField || panelOpen) return;

      if (e.key === "/") {
        e.preventDefault();
        markShortcutUsed();
        searchRef.current?.focus();
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        markShortcutUsed();
        setPanelOpen(true);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        openShortcutsDialog();
        return;
      }

      if (e.key === "j" || e.key === "k") {
        if (visiblePackages.length === 0) return;
        e.preventDefault();
        markShortcutUsed();
        const currentIdx = rowFocusId
          ? visiblePackages.findIndex((p) => p.id === rowFocusId)
          : -1;
        const nextIdx =
          e.key === "j"
            ? currentIdx < 0
              ? 0
              : Math.min(currentIdx + 1, visiblePackages.length - 1)
            : currentIdx < 0
              ? visiblePackages.length - 1
              : Math.max(currentIdx - 1, 0);
        focusPackageRow(visiblePackages[nextIdx].id);
        return;
      }

      if (e.key === "Enter" && rowFocusId) {
        if (isPackageRowKeyTarget(e.target)) return;
        if (!visiblePackages.some((p) => p.id === rowFocusId)) return;
        e.preventDefault();
        markShortcutUsed();
        if (selectionMode) {
          handlePackageSelectClick(rowFocusId, false);
        } else {
          router.push(`/packages/${rowFocusId}`);
        }
        return;
      }

      if (selectionMode && (e.key === " " || e.key === "x")) {
        if (isPackageRowKeyTarget(e.target)) return;
        if (visiblePackages.length === 0) return;
        e.preventDefault();
        const focusId =
          rowFocusId && visiblePackages.some((p) => p.id === rowFocusId)
            ? rowFocusId
            : visiblePackages[0].id;
        handlePackageSelectClick(focusId, false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    panelOpen,
    query,
    filtering,
    visiblePackages,
    rowFocusId,
    selectionMode,
    selectedIds.size,
    router,
  ]);

  const showSelectionBar = selectionMode && !loading && packages.length > 0;

  return (
    <div className={showSelectionBar ? "page page--bulk-select" : "page"}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Packages</h1>
          <p className="page-subtitle">
            {loading
              ? "Loading your portfolio…"
              : filtering
                ? `${filtered.length} of ${packages.length} package${packages.length === 1 ? "" : "s"} shown`
                : `${packages.length} package${packages.length === 1 ? "" : "s"} · ${grouped.action.length} need${grouped.action.length === 1 ? "s" : ""} your attention`}
          </p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {liveMessage}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setPanelOpen(true)}
          title="New package (n)"
        >
          <Plus size={15} strokeWidth={2.25} aria-hidden />
          New package
        </button>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : packages.length === 0 ? (
        <div className="empty-state">
          <Inbox size={32} strokeWidth={1.5} aria-hidden />
          <h2>No packages yet</h2>
          <p>
            A package is one permit application for one property — its checklist,
            status, and deadlines in one place. Start your first one and Meridian
            seeds the standard document checklist for that permit type.
          </p>
          <button type="button" className="btn-primary" onClick={() => setPanelOpen(true)}>
            <Plus size={15} strokeWidth={2.25} aria-hidden />
            Start your first package
          </button>
        </div>
      ) : (
        <>
          <p id="dashboard-shortcuts" className="sr-only">
            Keyboard shortcuts: slash to search, n for new package, j and k to move between
            packages, Enter to open or toggle selection, question mark for shortcuts, x or space
            to toggle selection while in bulk mode, shift-click for range select, Escape to clear
            selection then filters.
          </p>
          <div className="portfolio-toolbar">
            <div
              className="directory-search portfolio-search"
              role="search"
              aria-describedby="dashboard-shortcuts"
            >
              <Search size={15} strokeWidth={2} aria-hidden />
              <label htmlFor="pkg-search" className="sr-only">
                Search packages
              </label>
              <input
                id="pkg-search"
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search client, reference, address…  ( / )"
                maxLength={200}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              className={selectionMode ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
              onClick={toggleSelectionMode}
              aria-pressed={selectionMode}
              title="Select packages for bulk status update"
            >
              <CheckSquare size={14} strokeWidth={2} aria-hidden />
              {selectionMode ? "Done selecting" : "Bulk update"}
            </button>
            <details className="portfolio-filters-details">
              <summary className="portfolio-filters-summary">
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </summary>
              <div className="portfolio-filters">
                <select
                  className="toolbar-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by permit type"
                >
                  <option value="">All types</option>
                  {(Object.keys(PERMIT_TYPE_LABELS) as PermitType[]).map((t) => (
                    <option key={t} value={t}>
                      {PERMIT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <select
                  className="toolbar-select"
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                  aria-label="Filter by county"
                >
                  <option value="">All counties</option>
                  {COUNTIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className="toolbar-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  {(Object.keys(STATUS_LABELS) as PackageStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                {filtering && (
                  <button type="button" className="btn-ghost btn-sm" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            </details>
          </div>
          {showSelectHint && (
            <div className="select-mode-hint" role="status">
              <p>
                Check packages with the same status, pick a forward move, then Apply. Shift-click
                selects a range. Mixed statuses are blocked automatically.
              </p>
              <button
                type="button"
                className="btn-ghost btn-sm select-mode-hint-dismiss"
                onClick={dismissSelectHint}
              >
                Got it
              </button>
            </div>
          )}
          <div className="keyboard-hints-row">
            {!kbdHintsSeen && (
            <p className="keyboard-hints" aria-hidden>
              <kbd>/</kbd> search
              <span className="keyboard-hints-sep" aria-hidden>·</span>
              <kbd>n</kbd> new
              <span className="keyboard-hints-sep" aria-hidden>·</span>
              <kbd>j</kbd>
              <kbd>k</kbd> move
              <span className="keyboard-hints-sep" aria-hidden>·</span>
              <kbd>Enter</kbd> open
              {selectionMode && (
                <>
                  <span className="keyboard-hints-sep" aria-hidden>·</span>
                  <kbd>x</kbd>
                  <kbd>Space</kbd> toggle
                  <span className="keyboard-hints-sep" aria-hidden>·</span>
                  Shift+click range
                </>
              )}
              <span className="keyboard-hints-sep" aria-hidden>·</span>
              <kbd>Esc</kbd> clear
              <span className="keyboard-hints-sep" aria-hidden>·</span>
              <kbd>?</kbd> shortcuts
            </p>
            )}
            <button
              type="button"
              className="btn-ghost btn-sm keyboard-hints-help"
              onClick={openShortcutsDialog}
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle size={14} strokeWidth={2} aria-hidden />
              Shortcuts
            </button>
          </div>

          {filtering && filtered.length === 0 && (
            <div className="empty-state">
              <SearchX size={28} strokeWidth={1.5} aria-hidden />
              <h2>No packages match</h2>
              <p>
                Nothing matches {query.trim() ? `“${query.trim()}”` : "these filters"}.
                Try a different spelling, or clear the filters to see all {packages.length} packages.
              </p>
              <button type="button" className="btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {urgent.length > 0 && (
            <section className="attention-strip" aria-label="Urgent deadlines">
              <AlarmClock size={16} strokeWidth={2} aria-hidden />
              <div className="attention-items">
                {visibleUrgent.map((p) => (
                  <Link key={p.id} href={`/packages/${p.id}`} className="attention-item">
                    <strong>{displayClient(p.client)}</strong>
                    <span className="tnum">
                      {p.deadlineLabel ?? "Deadline"} {formatShortDate(p.deadline!)} — {deadlinePhrase(p.deadline!)}
                    </span>
                  </Link>
                ))}
                {urgentOverflowCount > 0 && (
                  <button
                    type="button"
                    className="attention-show-all"
                    onClick={() => setUrgentExpanded(true)}
                  >
                    Show all {urgent.length} urgent
                  </button>
                )}
                {urgentExpanded && urgent.length > URGENT_VISIBLE_CAP && (
                  <button
                    type="button"
                    className="attention-show-all"
                    onClick={() => setUrgentExpanded(false)}
                  >
                    Show fewer
                  </button>
                )}
                {urgentHiddenCount > 0 && (
                  <p className="attention-filter-note">
                    {urgentHiddenCount} urgent deadline{urgentHiddenCount === 1 ? "" : "s"} hidden by
                    your filters —{" "}
                    <button type="button" className="attention-filter-clear" onClick={clearFilters}>
                      clear filters
                    </button>
                  </p>
                )}
              </div>
            </section>
          )}

          {GROUPS.map(({ key, title, hint }) => {
            const items = grouped[key];
            if (items.length === 0) return null;

            const isDone = key === "done";
            const isWaiting = key === "waiting";
            const collapsed =
              (isDone && !doneExpanded) ||
              (isWaiting && waitingCollapsible && !waitingExpanded);

            const toggleHint = isDone
              ? `Show ${items.length} package${items.length === 1 ? "" : "s"}`
              : `Show ${items.length} with the county`;
            const waitingHint =
              staleInReviewCount > 0
                ? `${staleInReviewCount} in review over 14 days`
                : hint;

            if (collapsed) {
              return (
                <section key={key} className="pkg-group" aria-label={title}>
                  <button
                    type="button"
                    className="pkg-group-toggle"
                    onClick={() => {
                      if (isDone) setDoneExpanded(true);
                      if (isWaiting) setWaitingExpanded(true);
                    }}
                    aria-expanded={false}
                  >
                    <h2>{title}</h2>
                    <span className="pkg-group-hint">
                      {isWaiting && staleInReviewCount > 0 ? waitingHint : toggleHint}
                    </span>
                    <span className="pkg-group-count tnum">{items.length}</span>
                  </button>
                </section>
              );
            }

            return (
              <section key={key} className="pkg-group" aria-label={title}>
                {(isDone || (isWaiting && waitingCollapsible)) ? (
                  <button
                    type="button"
                    className="pkg-group-toggle"
                    onClick={() => {
                      if (isDone) setDoneExpanded(false);
                      if (isWaiting) setWaitingExpanded(false);
                    }}
                    aria-expanded={true}
                  >
                    <h2>{title}</h2>
                    <span className="pkg-group-hint">
                      {isWaiting ? waitingHint : hint}
                    </span>
                    <span className="pkg-group-count tnum">{items.length}</span>
                    <span className="pkg-group-action">Hide</span>
                  </button>
                ) : (
                  <div className="pkg-group-head">
                    <h2>{title}</h2>
                    <span className="pkg-group-hint">{hint}</span>
                    <span className="pkg-group-count tnum">{items.length}</span>
                  </div>
                )}
                <ul className="pkg-list">
                  {items.map((pkg) => (
                    <PackageRow
                      key={pkg.id}
                      pkg={pkg}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(pkg.id)}
                      onSelectClick={(shiftKey) => handlePackageSelectClick(pkg.id, shiftKey)}
                      onFocus={() => setRowFocusId(pkg.id)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}

      {showSelectionBar && (
        <div
          className="selection-bar"
          role="toolbar"
          aria-label="Bulk status update"
        >
          <span className="selection-bar-count" aria-live="polite" aria-atomic="true">
            {selectedCount === 0
              ? "Select packages to update status"
              : `${selectedCount} selected`}
          </span>
          {bulkBlocked && (
            <p className="selection-bar-hint">
              These packages need different next steps. Select packages with the same status,
              or update individually.
            </p>
          )}
          {collapsedGroupInfo.length > 0 && (
            <p className="selection-bar-hint">
              {collapsedGroupInfo.map((g, i) => (
                <span key={g.key}>
                  {i > 0 ? " · " : null}
                  {g.count} hidden in {g.title} —{" "}
                  <button
                    type="button"
                    className="attention-filter-clear"
                    onClick={() => expandGroup(g.key)}
                  >
                    Show
                  </button>
                </span>
              ))}
            </p>
          )}
          <div className="selection-bar-controls">
            {visiblePackages.length > 0 && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={allVisibleSelected ? clearSelection : selectAllVisible}
              >
                {allVisibleSelected
                  ? "Deselect all"
                  : collapsedGroupInfo.length > 0
                    ? `Select all listed (${visiblePackages.length})`
                    : `Select all visible (${visiblePackages.length})`}
              </button>
            )}
            {selectedCount > 0 && !bulkBlocked && (
              <select
                className="toolbar-select selection-bar-select"
                value={bulkTarget}
                onChange={(e) => setBulkTarget(e.target.value as PackageStatus)}
                aria-label="New status for selected packages"
                disabled={bulkApplying}
              >
                {bulkForwardOptions.map((s) => (
                  <option key={s} value={s}>
                    Mark {STATUS_LABELS[s].toLowerCase()}
                  </option>
                ))}
              </select>
            )}
            {selectedCount > 0 && (
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={handleBulkApply}
                disabled={bulkBlocked || !bulkTarget || bulkApplying}
              >
                {bulkApplying ? (
                  <>
                    <Loader2 size={14} className="spin" aria-hidden />
                    <span className="sr-only">Applying</span>
                  </>
                ) : null}
                Apply to {selectedCount}
              </button>
            )}
            {selectedCount > 0 && (
              <button type="button" className="btn-ghost btn-sm" onClick={clearSelection}>
                Deselect
              </button>
            )}
          </div>
        </div>
      )}

      {bulkUndo && !showSelectionBar && (
        <div
          className="undo-toast"
          role="status"
          onMouseEnter={resetBulkUndoTimer}
          onFocus={resetBulkUndoTimer}
        >
          <span className="undo-toast-text" title={`${bulkUndo.count} packages`}>
            {bulkUndo.count} package{bulkUndo.count === 1 ? "" : "s"} marked{" "}
            {STATUS_LABELS[bulkUndo.targetStatus]}
          </span>
          <button type="button" className="undo-toast-btn" onClick={handleBulkUndo}>
            Undo
          </button>
        </div>
      )}

      <dialog
        ref={shortcutsDialogRef}
        className="shortcuts-dialog"
        aria-labelledby="shortcuts-dialog-title"
      >
        <div className="shortcuts-dialog-head">
          <h2 id="shortcuts-dialog-title">Keyboard shortcuts</h2>
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
            <dt><kbd>/</kbd></dt>
            <dd>Focus search</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>n</kbd></dt>
            <dd>New package</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>Enter</kbd></dt>
            <dd>Open focused package (toggle selection in bulk mode)</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>j</kbd> <kbd>k</kbd></dt>
            <dd>Move between packages</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>Esc</kbd></dt>
            <dd>Clear selection, then filters</dd>
          </div>
          <div className="shortcuts-entry">
            <dt><kbd>?</kbd></dt>
            <dd>Open this list</dd>
          </div>
          <div className="shortcuts-entry">
            <dt>Select mode</dt>
            <dd>
              <kbd>x</kbd> or <kbd>Space</kbd> toggles selection · Shift+click selects a range
            </dd>
          </div>
        </dl>
      </dialog>

      <NewPackagePanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
