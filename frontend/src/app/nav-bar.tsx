"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { GoogleSignInModal } from "@/components/google-sign-in-modal";

/**
 * Shared public NavBar — used by /, /onboarding, /privacy, /terms.
 * Internal surfaces (/chat, /admin/*) have their own internal designs and
 * deliberately do NOT use this component.
 *
 * Variants are driven by props rather than by which page renders it:
 *   - `sectionLinks` — optional in-page anchor links shown center
 *   - `showSignIn`   — show the right-side "Sign in" link (Google)
 *   - `primary`      — the solid CTA on the right (defaults to "Get started free")
 */
interface NavBarProps {
  sectionLinks?: Array<[string, string]>;
  showSignIn?: boolean;
  primary?: { href: string; label: string };
}

export function NavBar({
  sectionLinks,
  showSignIn = true,
  primary = { href: "/onboarding", label: "Get started free" },
}: NavBarProps) {
  const [signInOpen, setSignInOpen] = useState(false);
  const primaryStartsGoogle = primary.href === "/onboarding";

  return (
    <>
      <header className="public-nav-shell sticky top-0 z-50 bg-transparent backdrop-blur-xl">
        <nav className="public-nav mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="ab-focus rounded-lg">
            <BrandWordmark />
          </Link>

        {sectionLinks && sectionLinks.length > 0 && (
          <div className="hidden items-center gap-1 md:flex">
            {sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="ab-focus rounded-lg px-3 py-2 text-[14px] font-semibold text-[var(--ab-ink-soft)] transition hover:bg-white/10 hover:text-[var(--ab-ink)]"
              >
                {label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-2.5">
          {showSignIn && (
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="ab-focus hidden rounded-lg px-3 py-2 text-[14px] font-semibold text-[var(--ab-ink-soft)] transition hover:bg-white/10 hover:text-[var(--ab-ink)] sm:inline-flex"
            >
              Sign in
            </button>
          )}
          {primaryStartsGoogle ? (
            <button type="button" onClick={() => setSignInOpen(true)} className="ab-focus ab-btn ab-btn-primary h-9 px-4 text-[13.5px]">
              {primary.label}
            </button>
          ) : (
            <Link href={primary.href} className="ab-focus ab-btn ab-btn-primary h-9 px-4 text-[13.5px]">
              {primary.label}
            </Link>
          )}
        </div>
        </nav>
      </header>
      <GoogleSignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
