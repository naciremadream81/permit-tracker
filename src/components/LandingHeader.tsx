"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, Moon, Sun } from "lucide-react";
import { LandingCta } from "@/components/LandingCta";

export function LandingHeader() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "";
    try {
      localStorage.setItem("permit-tracker-theme", next ? "dark" : "light");
    } catch {
      /* private browsing */
    }
  }

  return (
    <header className="landing-header">
      <Link href="/" className="landing-brand">
        <Compass size={20} strokeWidth={1.75} aria-hidden />
        <span>Meridian</span>
      </Link>
      <nav className="landing-nav" aria-label="Landing">
        <a href="#how-it-works" className="landing-nav-link">
          How it works
        </a>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        </button>
        <LandingCta className="btn-primary btn-sm landing-header-cta" />
      </nav>
    </header>
  );
}
