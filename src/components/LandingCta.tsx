"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";

interface LandingCtaProps {
  className?: string;
  variant?: "primary" | "secondary";
  children?: ReactNode;
}

export function LandingCta({
  className = "btn-primary",
  variant = "primary",
  children,
}: LandingCtaProps) {
  const { cloudEnabled, authReady, user, signIn } = useStore();
  const [error, setError] = useState<string | null>(null);

  const label = children ?? (cloudEnabled ? "Open your workspace" : "Open your portfolio");

  if (cloudEnabled && authReady && !user) {
    return (
      <span className="landing-cta-wrap">
        <button
          type="button"
          className={className}
          onClick={() => {
            setError(null);
            signIn().catch(() =>
              setError("Sign-in didn't complete — allow pop-ups for this site and try again.")
            );
          }}
        >
          Sign in with Google
          {variant === "primary" && <ArrowRight size={15} strokeWidth={2.25} aria-hidden />}
        </button>
        {error && (
          <span className="landing-cta-error" role="alert">
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <Link href="/packages" className={className}>
      {label}
      {variant === "primary" && <ArrowRight size={15} strokeWidth={2.25} aria-hidden />}
    </Link>
  );
}
