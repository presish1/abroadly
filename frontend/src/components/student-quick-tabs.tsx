"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  CheckCircle2,
  Folder,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Phone,
  UserRound,
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
  active,
  icon,
  label,
  badge,
  ariaLabel,
}: {
  href: string;
  active?: boolean;
  icon: ReactNode;
  label: string;
  badge?: string;
  ariaLabel?: string;
}) {
  const className = `ab-focus group relative flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 text-[9.5px] font-semibold transition-colors sm:text-[10.5px] ${
    active ? "bg-[#EEF5F0] text-[#0A6E45]" : "text-[#746E65] hover:bg-[#F6F5F1] hover:text-[#3F3A33]"
  }`;

  return (
    <Link href={href} aria-label={ariaLabel ?? label} aria-current={active ? "page" : undefined} className={className}>
      <span className={`relative flex h-6 w-6 items-center justify-center ${active ? "text-[#0A6E45]" : "text-[#8A847B] group-hover:text-[#3F3A33]"}`}>
        {icon}
        {badge ? (
          <span className="absolute -right-3 -top-2 flex min-h-4 min-w-5 items-center justify-center rounded-full border border-white bg-[#E8F2EC] px-1 text-[8.5px] font-extrabold leading-none text-[#0A6E45]">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="whitespace-nowrap leading-none">{label}</span>
    </Link>
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
        <div className="grid h-full grid-cols-5 gap-0.5 px-1.5">
          <MobileAction href="/dashboard" active={active === "dashboard"} icon={<LayoutDashboard aria-hidden className="h-[21px] w-[21px]" />} label="Dashboard" />
          <MobileAction href="/chat" active={active === "chat"} icon={<MessageCircle aria-hidden className="h-[21px] w-[21px]" />} label="Chat" />
          <MobileAction href="/chat/documents" active={active === "documents"} icon={<Folder aria-hidden className="h-[21px] w-[21px]" />} label="Docs" badge={mobileUploadedLabel} ariaLabel={`Documents, ${mobileUploadedLabel} uploaded`} />
          <MobileAction href="/universities" active={active === "universities"} icon={<GraduationCap aria-hidden className="h-[21px] w-[21px]" />} label="Universities" />
          <MobileAction href="/chat/profile" active={active === "profile"} icon={<UserRound aria-hidden className="h-[21px] w-[21px]" />} label="Profile" />
        </div>
      </nav>
    </>
  );
}
