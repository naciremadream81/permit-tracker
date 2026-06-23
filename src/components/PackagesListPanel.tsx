"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  Archive,
  CheckCircle2,
  CircleDashed,
  FileWarning,
  Filter,
  Inbox,
  Plus,
  RefreshCcw,
  Search,
  SearchCheck,
  Send,
  SearchX,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { COUNTIES } from "@/lib/counties";
import { countyById } from "@/lib/counties";
import { deadlinePhrase, deadlineUrgency, daysUntil } from "@/lib/dates";
import {
  ACTION_STATUSES,
  PERMIT_TYPE_LABELS,
  STATUS_LABELS,
  type PackageStatus,
  type PermitPackage,
  type PermitType,
} from "@/lib/types";

type GroupKey = "action" | "waiting" | "done";

const GROUPS: { key: GroupKey; label: string }[] = [
  { key: "action", label: "Action Required" },
  { key: "waiting", label: "In County Review" },
  { key: "done", label: "Approved & Closed" },
];

function groupOf(pkg: PermitPackage): GroupKey {
  if (ACTION_STATUSES.includes(pkg.status)) return "action";
  if (pkg.status === "approved" || pkg.status === "closed") return "done";
  return "waiting";
}

function daysSince(iso: string): number {
  const days = daysUntil(iso);
  return Number.isNaN(days) ? 0 : -days;
}

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

const STATUS_ICON_MAP: Record<PackageStatus, React.ElementType> = {
  preparing: CircleDashed,
  submitted: Send,
  in_review: SearchCheck,
  corrections: FileWarning,
  resubmitted: RefreshCcw,
  approved: CheckCircle2,
  closed: Archive,
};

function statusColorClass(status: PackageStatus): string {
  switch (status) {
    case "corrections":
      return "pkg-card-status--red";
    case "preparing":
    case "submitted":
      return "pkg-card-status--amber";
    case "in_review":
    case "resubmitted":
      return "pkg-card-status--blue";
    case "approved":
      return "pkg-card-status--green";
    case "closed":
      return "pkg-card-status--zinc";
    default:
      return "pkg-card-status--zinc";
  }
}

function permitTypeBadgeLabel(type: PermitType): string {
  const labels: Record<PermitType, string> = {
    residential_building: "RES",
    electrical: "ELEC",
    hvac: "HVAC",
    mobile_home: "MH",
    modular_home: "MOD",
    shed: "SHED",
  };
  return labels[type] ?? type.slice(0, 4).toUpperCase();
}

function dayLabel(pkg: PermitPackage): string {
  const since = daysSince(pkg.createdAt);
  return `Day ${since}`;
}

interface Props {
  onNewPackage: () => void;
}

export function PackagesListPanel({ onNewPackage }: Props) {
  const params = useParams<{ id?: string }>();
  const activeId = params?.id ?? null;
  const { loading, packages } = useStore();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      if (typeFilter && p.permitType !== typeFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.client.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.projectAddress.toLowerCase().includes(q) ||
        (p.contractor?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [packages, query, typeFilter, statusFilter]);

  const filtering = query.trim() !== "" || typeFilter !== "" || statusFilter !== "";
  const activeFilterCount = (query.trim() ? 1 : 0) + (typeFilter ? 1 : 0) + (statusFilter ? 1 : 0);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, PermitPackage[]> = { action: [], waiting: [], done: [] };
    for (const pkg of filtered) map[groupOf(pkg)].push(pkg);
    for (const key of Object.keys(map) as GroupKey[]) {
      map[key].sort(comparePackages);
    }
    return map;
  }, [filtered]);

  function clearFilters() {
    setQuery("");
    setTypeFilter("");
    setStatusFilter("");
  }

  const totalShown = filtered.length;

  return (
    <div className="pkg-list-panel">
      {/* Header */}
      <div className="pkg-list-header">
        <div className="pkg-list-header-top">
          <h2 className="pkg-list-title">Portfolio</h2>
          <div className="pkg-list-header-actions">
            <button
              type="button"
              className={showFilters || activeFilterCount > 0 ? "pkg-list-icon-btn is-active" : "pkg-list-icon-btn"}
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Toggle filters"
              aria-pressed={showFilters}
              title="Filters"
            >
              <Filter size={15} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className="pkg-list-icon-btn"
              onClick={onNewPackage}
              aria-label="New package"
              title="New package (n)"
            >
              <Plus size={15} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="pkg-list-search-wrap">
          <span className="pkg-list-search-icon">
            <Search size={14} strokeWidth={2} aria-hidden />
          </span>
          <label htmlFor="pkg-list-search" className="sr-only">
            Search packages
          </label>
          <input
            id="pkg-list-search"
            ref={searchRef}
            type="search"
            className="pkg-list-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, reference…"
            maxLength={200}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="pkg-list-filters">
          <div className="pkg-list-filter-row">
            <select
              className="pkg-list-filter-select"
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
              className="pkg-list-filter-select"
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
          </div>
          {filtering && (
            <button type="button" className="pkg-list-filter-clear" onClick={clearFilters}>
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div className="pkg-list-body" aria-label="Package list">
        {loading ? (
          <div className="pkg-list-skeleton" role="status" aria-label="Loading packages">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="pkg-list-skeleton-card">
                <div className="pkg-list-skeleton-line" style={{ width: "40%" }} />
                <div className="pkg-list-skeleton-line" style={{ width: "70%" }} />
                <div className="pkg-list-skeleton-line" style={{ width: "55%" }} />
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="pkg-list-empty">
            <span className="pkg-list-empty-icon">
              <Inbox size={32} strokeWidth={1.5} aria-hidden />
            </span>
            <h3>No packages yet</h3>
            <p>Click the + button above to start your first package.</p>
          </div>
        ) : filtering && totalShown === 0 ? (
          <div className="pkg-list-empty">
            <span className="pkg-list-empty-icon">
              <SearchX size={28} strokeWidth={1.5} aria-hidden />
            </span>
            <h3>No matches</h3>
            <p>Try a different search or clear filters.</p>
            <button type="button" className="pkg-list-filter-clear" onClick={clearFilters} style={{ marginTop: 4 }}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {GROUPS.map(({ key, label }) => {
              const items = grouped[key];
              if (items.length === 0) return null;
              return (
                <div key={key}>
                  <div
                    className={`pkg-list-group-band pkg-list-group-band--${key === "action" ? "action" : key === "done" ? "done" : "waiting"}`}
                  >
                    {label}
                  </div>
                  {items.map((pkg) => {
                    const county = countyById(pkg.countyId);
                    const isActive = pkg.id === activeId;
                    const Icon = STATUS_ICON_MAP[pkg.status];
                    const colorClass = statusColorClass(pkg.status);
                    const badgeLabel = permitTypeBadgeLabel(pkg.permitType);

                    // Parse address: try to get city/state from the end
                    const parts = pkg.projectAddress.split(",");
                    const street = parts[0]?.trim() ?? pkg.projectAddress;
                    const cityState = parts.slice(1).join(",").trim();

                    return (
                      <Link
                        key={pkg.id}
                        href={`/packages/${pkg.id}`}
                        className={`pkg-card${isActive ? " is-active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {isActive && <span className="pkg-card-accent" aria-hidden />}
                        <div className="pkg-card-top">
                          <span
                            className={`pkg-card-badge ${isActive ? "pkg-card-badge--active" : "pkg-card-badge--inactive"}`}
                          >
                            {badgeLabel}
                          </span>
                          <span className="pkg-card-county">
                            {county ? county.name : pkg.countyId}
                          </span>
                        </div>
                        <p className="pkg-card-address" title={street}>{street}</p>
                        {cityState && <p className="pkg-card-city">{cityState}</p>}
                        <div className="pkg-card-bottom">
                          <span className={`pkg-card-status ${colorClass}`}>
                            <Icon size={13} strokeWidth={2} aria-hidden />
                            {STATUS_LABELS[pkg.status]}
                            {pkg.deadline &&
                              pkg.status !== "approved" &&
                              pkg.status !== "closed" && (
                                <>
                                  {" · "}
                                  <AlarmClock size={12} strokeWidth={2} aria-hidden />
                                  {deadlinePhrase(pkg.deadline)}
                                </>
                              )}
                          </span>
                          <span className="pkg-card-day">{dayLabel(pkg)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
