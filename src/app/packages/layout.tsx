"use client";

import { useEffect, useState } from "react";
import { PackagesListPanel } from "@/components/PackagesListPanel";
import { NewPackagePanel } from "@/components/NewPackagePanel";
import "./packages.css";

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (inField) return;
      const dialogOpen = !!document.querySelector("dialog[open]");
      if (dialogOpen) return;
      if (e.key === "n") {
        e.preventDefault();
        setPanelOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pkg-split">
      <PackagesListPanel onNewPackage={() => setPanelOpen(true)} />
      <div className="pkg-detail-panel">
        {children}
      </div>
      <NewPackagePanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
