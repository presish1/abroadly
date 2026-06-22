"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Folder,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Menu,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { EnglishClassPopupCompact } from "./english-class-popup";

export type StudentQuickTab = "profile" | "chat" | "dashboard" | "documents" | "universities";

interface StudentQuickTabsProps {
  active?: StudentQuickTab;
  firstName?: string;
  uploadedCount?: number;
  documentTotal?: number;
  phoneRequired?: boolean;
  callConsented?: boolean;
  onProfileClick?: () => void;
  onDocumentsClick?: () => void;
  onCounselorCall?: () => void;
}

function tabClass(active: boolean): string {
  return `ab-focus chat-right-tab ${active ? "chat-right-tab-active" : ""}`;
}

function MobileAction({
  href,
  onClick,
  active,
  icon,
  label,
  badge,
  ariaLabel,
}: {
  href?: string;
  onClick?: () => void;
  active?: boolean;
  icon: ReactNode;
  label: string;
  badge?: string;
  ariaLabel?: string;
}) {
  const className = `ab-focus flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
    active ? "bg-[#E8F2EC] text-[#0A6E45]" : "text-[#6B655C] hover:bg-[#F6F5F1]"
  }`;

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel ?? label} aria-current={active ? "page" : undefined} className={className}>
        <span className={`relative flex h-6 w-6 items-center justify-center rounded-xl ${active ? "bg-white text-[#0A6E45]" : "text-[#8A847B]"}`}>
          {icon}
          {active && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[#0A6E45]" aria-hidden />}
        </span>
        <span className="leading-none">{label}</span>
        {badge ? <span className="text-[10px] font-bold text-[#0A6E45]">{badge}</span> : null}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={className}>
      <span className={`relative flex h-6 w-6 items-center justify-center rounded-xl ${active ? "bg-white text-[#0A6E45]" : "text-[#8A847B]"}`}>
        {icon}
        {active && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[#0A6E45]" aria-hidden />}
      </span>
      <span className="leading-none">{label}</span>
      {badge ? <span className="text-[10px] font-bold text-[#0A6E45]">{badge}</span> : null}
    </button>
  );
}

export function StudentQuickTabs({
  active,
  firstName = "",
  uploadedCount = 0,
  documentTotal = 8,
  phoneRequired = false,
  callConsented = false,
  onProfileClick,
  onDocumentsClick,
  onCounselorCall,
}: StudentQuickTabsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  const counselorHref = `/chat?send=${encodeURIComponent("I would like to request a counsellor callback.")}`;
  const profileTitle = phoneRequired
    ? "Open profile - phone number needed"
    : firstName
      ? `Open profile for ${firstName}`
      : "Open profile";

  const mobileUploadedLabel = useMemo(() => {
    return `${uploadedCount}/${documentTotal}`;
  }, [uploadedCount, documentTotal]);

  return (
    <>
      <aside className="chat-right-rail" aria-label="Student quick tabs">
        <Link href="/" className="ab-focus chat-left-brand">
          <Image src="/images/abroadly-logo.png" alt="" width={40} height={40} priority aria-hidden />
          <span>Abroadly</span>
        </Link>

        <nav className="chat-left-nav" aria-label="Student workspace">
          {onProfileClick ? (
            <button
              type="button"
              onClick={onProfileClick}
              title={profileTitle}
              aria-current={active === "profile" ? "page" : undefined}
              className={tabClass(active === "profile")}
            >
              <span className="chat-right-tab-icon"><UserRound aria-hidden /></span>
              <span className="chat-right-tab-copy">
                <span className="chat-right-tab-label">Profile</span>
              </span>
              {phoneRequired && <span className="chat-right-tab-alert">Action</span>}
            </button>
          ) : (
            <Link
              href="/chat/profile"
              title={profileTitle}
              aria-current={active === "profile" ? "page" : undefined}
              className={tabClass(active === "profile")}
            >
              <span className="chat-right-tab-icon"><UserRound aria-hidden /></span>
              <span className="chat-right-tab-copy">
                <span className="chat-right-tab-label">Profile</span>
              </span>
              {phoneRequired && <span className="chat-right-tab-alert">Action</span>}
            </Link>
          )}

          <Link
            href="/chat"
            title="Open chat"
            aria-current={active === "chat" ? "page" : undefined}
            className={tabClass(active === "chat")}
          >
            <span className="chat-right-tab-icon"><MessageCircle aria-hidden /></span>
            <span className="chat-right-tab-copy">
              <span className="chat-right-tab-label">Chat</span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            title="Open dashboard"
            aria-current={active === "dashboard" ? "page" : undefined}
            className={tabClass(active === "dashboard")}
          >
            <span className="chat-right-tab-icon"><LayoutDashboard aria-hidden /></span>
            <span className="chat-right-tab-copy">
              <span className="chat-right-tab-label">Dashboard</span>
            </span>
          </Link>

          {onDocumentsClick ? (
            <button
              type="button"
              onClick={onDocumentsClick}
              title={`Open document manager — ${uploadedCount} of ${documentTotal} essentials uploaded`}
              aria-current={active === "documents" ? "page" : undefined}
              className={tabClass(active === "documents")}
            >
              <span className="chat-right-tab-icon"><Folder aria-hidden /></span>
              <span className="chat-right-tab-copy">
                <span className="chat-right-tab-label">Documents</span>
              </span>
              <span className="chat-right-tab-count" aria-label={`${uploadedCount} of ${documentTotal} essentials uploaded`}>
                {uploadedCount}/{documentTotal}
              </span>
            </button>
          ) : (
            <Link
              href="/chat/documents"
              title={`Open document manager — ${uploadedCount} of ${documentTotal} essentials uploaded`}
              aria-current={active === "documents" ? "page" : undefined}
              className={tabClass(active === "documents")}
            >
              <span className="chat-right-tab-icon"><Folder aria-hidden /></span>
              <span className="chat-right-tab-copy">
                <span className="chat-right-tab-label">Documents</span>
              </span>
              <span className="chat-right-tab-count" aria-label={`${uploadedCount} of ${documentTotal} essentials uploaded`}>
                {uploadedCount}/{documentTotal}
              </span>
            </Link>
          )}

          <Link
            href="/universities"
            title="Open university shortlist"
            aria-current={active === "universities" ? "page" : undefined}
            className={tabClass(active === "universities")}
          >
            <span className="chat-right-tab-icon"><GraduationCap aria-hidden /></span>
            <span className="chat-right-tab-copy">
              <span className="chat-right-tab-label">Universities</span>
            </span>
          </Link>
        </nav>

        {active === "documents" && (
          <Link href="/chat?class=claim" className="ab-focus class-claim-card">
            <span className="class-claim-confetti" aria-hidden>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="class-claim-kicker">Included with Abroadly</span>
            <strong>Claim your free IELTS / PTE class</strong>
            <span className="class-claim-action">Confirm a time <span aria-hidden>→</span></span>
          </Link>
        )}

        {/* English class popup */}
        <EnglishClassPopupCompact variant="sidebar" onOpenDocuments={onDocumentsClick} />

        <div className="chat-left-counselor">
          <p className="chat-left-counselor-kicker">Counsellor</p>
          <h2>Need human help?</h2>
          <p>Ask for a no-pressure callback when you want a real person to review your situation.</p>
          {callConsented ? (
            <div className="chat-left-counselor-status">
              <CheckCircle2 aria-hidden />
              <span>Request received</span>
            </div>
          ) : onCounselorCall ? (
            <button type="button" onClick={onCounselorCall} className="ab-focus chat-left-counselor-btn">
              <Phone aria-hidden />
              Request a call
            </button>
          ) : (
            <Link href={counselorHref} className="ab-focus chat-left-counselor-btn">
              <Phone aria-hidden />
              Request a call
            </Link>
          )}
        </div>
      </aside>

      <nav className="chat-mobile-nav md:hidden" aria-label="Mobile navigation">
        <div className="grid h-full grid-cols-4 gap-2 px-3">
          <MobileAction href="/chat" active={active === "chat"} icon={<MessageCircle aria-hidden className="h-4.5 w-4.5" />} label="Chat" />
          {onDocumentsClick ? (
            <MobileAction
              onClick={onDocumentsClick}
              active={active === "documents"}
              icon={<Folder aria-hidden className="h-4.5 w-4.5" />}
              label="Docs"
              badge={mobileUploadedLabel}
              ariaLabel="Open documents"
            />
          ) : (
            <MobileAction href="/chat/documents" active={active === "documents"} icon={<Folder aria-hidden className="h-4.5 w-4.5" />} label="Docs" badge={mobileUploadedLabel} />
          )}
          {onProfileClick ? (
            <MobileAction
              onClick={onProfileClick}
              active={active === "profile"}
              icon={<UserRound aria-hidden className="h-4.5 w-4.5" />}
              label="Profile"
              ariaLabel="Open profile"
            />
          ) : (
            <MobileAction href="/chat/profile" active={active === "profile"} icon={<UserRound aria-hidden className="h-4.5 w-4.5" />} label="Profile" />
          )}
          <MobileAction
            onClick={() => setMobileMenuOpen(true)}
            icon={<Menu aria-hidden className="h-4.5 w-4.5" />}
            label="Menu"
            ariaLabel="Open menu"
          />
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        >
          <aside
            className="absolute left-0 top-0 h-full w-[85vw] max-w-sm overflow-y-auto border-r border-[#E8E5DD] bg-[#FDFCF9] shadow-[24px_0_50px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <div className="flex items-center justify-between border-b border-[#E8E5DD] px-4 py-4">
              <Link href="/" className="ab-focus flex items-center gap-2">
                <Image src="/images/abroadly-logo.png" alt="" width={36} height={36} aria-hidden />
                <span className="text-[15px] font-black text-[#1B1916]">Abroadly</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="ab-focus flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E8E5DD] text-[#6B655C] transition hover:bg-white hover:text-[#1B1916]"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <section className="rounded-[22px] border border-[#E8E5DD] bg-white p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Quick links</p>
                <div className="mt-3 grid gap-2">
                  <Link href="/chat/profile" className="ab-focus rounded-2xl border border-[#E8E5DD] px-4 py-3 text-[13px] font-semibold text-[#1B1916] transition hover:border-[#0A6E45] hover:bg-[#FAF9F6]">
                    Profile
                  </Link>
                  <Link href="/chat/documents" className="ab-focus rounded-2xl border border-[#E8E5DD] px-4 py-3 text-[13px] font-semibold text-[#1B1916] transition hover:border-[#0A6E45] hover:bg-[#FAF9F6]">
                    Documents
                  </Link>
                  <Link href="/dashboard" className="ab-focus rounded-2xl border border-[#E8E5DD] px-4 py-3 text-[13px] font-semibold text-[#1B1916] transition hover:border-[#0A6E45] hover:bg-[#FAF9F6]">
                    Dashboard
                  </Link>
                  <Link href="/universities" className="ab-focus rounded-2xl border border-[#E8E5DD] px-4 py-3 text-[13px] font-semibold text-[#1B1916] transition hover:border-[#0A6E45] hover:bg-[#FAF9F6]">
                    Universities
                  </Link>
                </div>
              </section>

              <section className="rounded-[22px] border border-[#E8E5DD] bg-white p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Documents</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1B1916]">{uploadedCount}/{documentTotal} essentials uploaded</p>
                <p className="mt-1 text-[12px] leading-6 text-[#6B655C]">
                  Keep documents close. Upload the missing ones, then return to chat without losing context.
                </p>
                <div className="mt-3 grid gap-2">
                  {onDocumentsClick ? (
                    <button type="button" onClick={onDocumentsClick} className="ab-focus rounded-2xl bg-[#0A6E45] px-4 py-3 text-[13px] font-bold text-white">
                      Open document panel
                    </button>
                  ) : (
                    <Link href="/chat/documents" className="ab-focus rounded-2xl bg-[#0A6E45] px-4 py-3 text-center text-[13px] font-bold text-white">
                      Open document panel
                    </Link>
                  )}
                </div>
              </section>

              <section className="rounded-[22px] border border-[#E8E5DD] bg-white p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Counsellor</p>
                <h2 className="mt-1 text-[17px] font-black tracking-[-0.02em] text-[#1B1916]">Need human help?</h2>
                <p className="mt-1 text-[12px] leading-6 text-[#6B655C]">
                  Request a callback when you want a person to review your plan.
                </p>
                {callConsented ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#EEF7F1] px-4 py-3 text-[13px] font-semibold text-[#0A6E45]">
                    <CheckCircle2 aria-hidden className="h-4 w-4" />
                    Request received
                  </div>
                ) : onCounselorCall ? (
                  <button type="button" onClick={onCounselorCall} className="ab-focus mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D7E7DD] bg-white px-4 py-3 text-[13px] font-bold text-[#0A6E45]">
                    <Phone aria-hidden className="h-4 w-4" />
                    Request a call
                  </button>
                ) : (
                  <Link href={counselorHref} className="ab-focus mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D7E7DD] bg-white px-4 py-3 text-[13px] font-bold text-[#0A6E45]">
                    <Phone aria-hidden className="h-4 w-4" />
                    Request a call
                  </Link>
                )}
              </section>

              <section className="rounded-[22px] border border-[#E8E5DD] bg-white p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Free class</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1B1916]">Claim your free IELTS / PTE class</p>
                <p className="mt-1 text-[12px] leading-6 text-[#6B655C]">Choose a time and we’ll handle the rest.</p>
                <Link href="/chat?class=claim" className="ab-focus mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[#0A6E45] px-4 py-3 text-[13px] font-bold text-white">
                  Confirm a time
                </Link>
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
