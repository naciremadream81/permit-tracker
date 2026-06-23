"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CloudAlert, Compass, LayoutList, ListChecks, LogOut, Moon, Sun, Users } from "lucide-react";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/packages", label: "Packages", icon: LayoutList },
  { href: "/contractors", label: "Contractors", icon: Users },
  { href: "/checklists", label: "Checklists", icon: ListChecks },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { cloudEnabled, user, authReady, cloudError, retryCloudSync, signIn, signOut } = useStore();
  const [dark, setDark] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "";
    try {
      localStorage.setItem("permit-tracker-theme", next ? "dark" : "light");
    } catch {}
  }

  const isMarketing = pathname === "/";

  if (cloudEnabled && authReady && !user) {
    if (isMarketing) {
      return (
        <div className="shell shell--marketing">
          <main className="main main--flush">{children}</main>
        </div>
      );
    }
    return (
      <div className="shell shell--centered">
        <div className="signin-screen">
          <Compass size={28} strokeWidth={1.75} aria-hidden />
          <h1>Meridian</h1>
          <p>
            Sign in with the Google account on your team&apos;s allowlist to
            open the shared permit workspace.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setSignInError(null);
              signIn().catch(() =>
                setSignInError("Sign-in didn't complete. Pop-ups may be blocked — allow them and try again.")
              );
            }}
          >
            Sign in with Google
          </button>
          {signInError && <p className="field-error">{signInError}</p>}
        </div>
      </div>
    );
  }

  if (isMarketing) {
    return (
      <div className="shell shell--marketing">
        <main className="main main--flush">{children}</main>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Application navigation">
        <Link href="/" className="sidebar-brand" title="Meridian home">
          <Compass size={22} strokeWidth={1.5} aria-hidden />
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/packages"
                ? pathname === "/packages" || pathname.startsWith("/packages/")
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="sidebar-link"
                aria-current={active ? "page" : undefined}
                title={label}
                data-label={label}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                <span className="sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <button
            type="button"
            className="sidebar-icon-btn"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
          </button>
          {cloudEnabled && user && (
            <button
              type="button"
              className="sidebar-icon-btn sidebar-icon-btn--danger"
              onClick={() => void signOut()}
              aria-label="Sign out"
            >
              <LogOut size={16} aria-hidden />
            </button>
          )}
        </div>
      </aside>

      <div className="shell-body">
        {cloudError && (
          <div className="cloud-banner" role="alert">
            <CloudAlert size={15} strokeWidth={2} aria-hidden />
            <span className="cloud-banner-text">{cloudError}</span>
            {cloudEnabled && user && (
              <button type="button" className="btn-secondary btn-sm cloud-banner-retry" onClick={retryCloudSync}>
                Retry sync
              </button>
            )}
          </div>
        )}
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
