"use client";

import Link from "next/link";
import { useEffect } from "react";
import { GoogleSignInButton } from "@/app/google-sign-in-button";
import { BrandWordmark } from "@/components/brand-wordmark";

export function GoogleSignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Close sign in" onClick={onClose} className="google-modal-overlay" />
      <section className="google-modal" role="dialog" aria-modal="true" aria-labelledby="google-modal-title">
        <button type="button" onClick={onClose} aria-label="Close" className="ab-focus google-modal-close">
          <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4" fill="none">
            <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <BrandWordmark size="large" />
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Free student account</p>
        <h2 id="google-modal-title" className="mt-2 text-[20px] font-extrabold tracking-[-0.025em] text-[#1B1916]">
          Sign in or create your profile
        </h2>
        <p className="mt-2 text-[12.5px] leading-6 text-[#6B655C]">
          Save your plan, documents and chats. Google verifies your email; Abroadly never sees your password.
        </p>

        <GoogleSignInButton
          variant="outline"
          label="Continue with Google"
          className="mt-5 w-full justify-start"
        />

        <div className="mt-5 flex items-center justify-center gap-3 border-t border-[#EFECE4] pt-4 text-[10.5px] font-semibold text-[#8A847B]">
          <Link href="/privacy" className="hover:text-[#1B1916]">Privacy</Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="hover:text-[#1B1916]">Terms</Link>
        </div>
      </section>
    </>
  );
}
