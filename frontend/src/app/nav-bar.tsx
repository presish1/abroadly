"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { googleLoginUrl } from "@/lib/api";

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
  return (
    <header className="sticky top-4 sm:top-6 z-50 px-3 sm:px-6 w-full max-w-7xl mx-auto">
      <nav className="mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 bg-white/90 backdrop-blur-md rounded-full border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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

        <div className="flex items-center gap-2 sm:gap-3">
          {showSignIn && (
            <a
              href={googleLoginUrl()}
              className="ab-focus rounded-full px-3 sm:px-4 py-2 text-[14px] sm:text-[15px] font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hidden sm:block"
            >
              Sign in
            </a>
          )}
          <Link
            href={primary.href}
            className="ab-focus inline-flex h-9 sm:h-10 items-center justify-center rounded-full bg-[#0044FF] px-4 sm:px-6 text-[13px] sm:text-[14px] font-bold text-white shadow-sm transition hover:bg-blue-600"
          >
            {primary.label}
          </Link>
        </div>
      </nav>
    </header>
  );
}
