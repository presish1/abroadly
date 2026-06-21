"use client";

import Link from "next/link";
import { GoogleSignInButton } from "@/app/google-sign-in-button";
import { BrandWordmark } from "@/components/brand-wordmark";
import { ModalShell } from "@/components/modal-shell";

export function GoogleSignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell open={open} onClose={onClose} titleId="google-modal-title" panelClassName="google-modal" closeLabel="Close sign in">
      <div className="google-modal-brand">
        <BrandWordmark size="large" />
      </div>
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
    </ModalShell>
  );
}
