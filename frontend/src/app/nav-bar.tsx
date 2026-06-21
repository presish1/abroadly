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
      <header className="sticky top-6 z-50 px-4 sm:px-6 w-full max-w-7xl mx-auto">
        <nav className="mx-auto flex h-16 items-center justify-between px-6 bg-white/90 backdrop-blur-md rounded-full border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Link href="/" className="ab-focus rounded-lg">
            <BrandWordmark />
          </Link>

        {sectionLinks && sectionLinks.length > 0 && (
          <div className="hidden items-center gap-6 md:flex">
            {sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="ab-focus rounded-lg py-2 text-[15px] font-medium text-slate-600 transition hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {showSignIn && (
            <button
              type="button"
              onClick={() => setSignInOpen(true)}
              className="ab-focus hidden rounded-full px-5 py-2.5 text-[15px] font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex border border-slate-300"
            >
              Login
            </button>
          )}
          {primaryStartsGoogle ? (
            <button type="button" onClick={() => setSignInOpen(true)} className="ab-focus rounded-full bg-[#0044FF] px-5 py-2.5 text-[15px] font-semibold text-white shadow-md transition hover:bg-blue-600">
              Start for Free
            </button>
          ) : (
            <Link href={primary.href} className="ab-focus rounded-full bg-[#0044FF] px-5 py-2.5 text-[15px] font-semibold text-white shadow-md transition hover:bg-blue-600">
              Start for Free
            </Link>
          )}
        </div>
        </nav>
      </header>
      <GoogleSignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
