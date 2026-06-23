import type { PackageStatus } from "./types";

/** Sensible forward moves from each status; regressions stay possible on the detail page. */
export const NEXT_STATUSES: Record<PackageStatus, PackageStatus[]> = {
  preparing: ["submitted"],
  submitted: ["in_review", "corrections"],
  in_review: ["corrections", "approved"],
  corrections: ["resubmitted"],
  resubmitted: ["in_review", "corrections", "approved"],
  approved: ["closed"],
  closed: [],
};

/** Status targets valid for every package in the selection (forward-only bulk). */
export function forwardStatusOptions(statuses: PackageStatus[]): PackageStatus[] {
  if (statuses.length === 0) return [];
  let options = [...NEXT_STATUSES[statuses[0]]];
  for (let i = 1; i < statuses.length; i++) {
    const allowed = NEXT_STATUSES[statuses[i]];
    options = options.filter((s) => allowed.includes(s));
    if (options.length === 0) break;
  }
  return options;
}
