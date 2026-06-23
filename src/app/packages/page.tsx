"use client";

import { FolderOpen } from "lucide-react";

export default function PackagesIndexPage() {
  return (
    <div className="pkg-detail-empty">
      <span className="pkg-detail-empty-icon">
        <FolderOpen size={40} strokeWidth={1.25} aria-hidden />
      </span>
      <p>Select a package from the portfolio</p>
    </div>
  );
}
