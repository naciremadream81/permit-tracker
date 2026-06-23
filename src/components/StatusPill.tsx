import {
  Archive,
  CheckCircle2,
  CircleDashed,
  FileWarning,
  RefreshCcw,
  SearchCheck,
  Send,
} from "lucide-react";
import { STATUS_LABELS, type PackageStatus } from "@/lib/types";

const STATUS_META: Record<
  PackageStatus,
  { icon: typeof Send; cssKey: string }
> = {
  preparing: { icon: CircleDashed, cssKey: "preparing" },
  submitted: { icon: Send, cssKey: "submitted" },
  in_review: { icon: SearchCheck, cssKey: "review" },
  corrections: { icon: FileWarning, cssKey: "corrections" },
  resubmitted: { icon: RefreshCcw, cssKey: "review" },
  approved: { icon: CheckCircle2, cssKey: "approved" },
  closed: { icon: Archive, cssKey: "closed" },
};

export function StatusPill({ status }: { status: PackageStatus }) {
  const { icon: Icon, cssKey } = STATUS_META[status];
  return (
    <span className={`status-pill status-${cssKey}`}>
      <Icon size={12} strokeWidth={2.25} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
