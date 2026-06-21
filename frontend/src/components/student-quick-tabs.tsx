"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";

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

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 16.5a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <path d="M4 4.5h12v8H9l-4.5 3.5v-3.5H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <rect x="3" y="3" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="3" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="13" width="6" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="10" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <path d="M2.5 5.5a2 2 0 0 1 2-2h3.17a2 2 0 0 1 1.42.59l.82.82a2 2 0 0 0 1.42.59h4.17a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UniversitiesIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <path d="M3 8.2 10 4l7 4.2M5 8.8v6.7M9 8.8v6.7M11 8.8v6.7M15 8.8v6.7M3.5 16h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none">
      <path d="M3.5 2.5h2.4l1 2.4-1.3 1A7.2 7.2 0 0 0 9.4 9.8l1-1.3 2.4 1V12a1.2 1.2 0 0 1-1.3 1.2A10 10 0 0 1 2.3 3.8 1.2 1.2 0 0 1 3.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 8l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function tabClass(active: boolean): string {
  return `ab-focus chat-right-tab ${active ? "chat-right-tab-active" : ""}`;
}

/** A row of N tiny dots — filled ones show how many docs are uploaded.
 * Sits under the "X / N" count to give a glanceable progress feel without
 * adding a full bar. */
function DocsProgressDots({ filled, total }: { filled: number; total: number }) {
  const safeFilled = Math.max(0, Math.min(total, filled));
  return (
    <span className="chat-right-tab-progress" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`chat-right-tab-progress-dot ${i < safeFilled ? "is-filled" : ""}`}
        />
      ))}
    </span>
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
  const profileHint = phoneRequired ? "Phone needed" : firstName || "Edit details";
  const counselorHref = `/chat?send=${encodeURIComponent("I would like to request a counsellor callback.")}`;

  return (
    <aside className="chat-right-rail" aria-label="Student quick tabs">
      <Link href="/" className="ab-focus chat-left-brand">
        <BrandWordmark />
      </Link>

      <p className="chat-right-rail-kicker">Quick tabs</p>
      <nav className="mt-3 flex flex-col gap-2.5">
        {onProfileClick ? (
          <button
            type="button"
            onClick={onProfileClick}
            title="Open profile"
            aria-current={active === "profile" ? "page" : undefined}
            className={tabClass(active === "profile")}
          >
            <span className="chat-right-tab-icon"><ProfileIcon /></span>
            <span className="chat-right-tab-copy">
              <span className="chat-right-tab-label">Profile</span>
              <span className={`chat-right-tab-hint ${phoneRequired ? "text-[#B42318]" : ""}`}>{profileHint}</span>
            </span>
          </button>
        ) : (
          <Link
            href="/chat?profile=open"
            title="Open profile"
            aria-current={active === "profile" ? "page" : undefined}
            className={tabClass(active === "profile")}
          >
            <span className="chat-right-tab-icon"><ProfileIcon /></span>
            <span className="chat-right-tab-copy">
              <span className="chat-right-tab-label">Profile</span>
              <span className={`chat-right-tab-hint ${phoneRequired ? "text-[#B42318]" : ""}`}>{profileHint}</span>
            </span>
          </Link>
        )}

        <Link
          href="/chat"
          title="Open chat"
          aria-current={active === "chat" ? "page" : undefined}
          className={tabClass(active === "chat")}
        >
          <span className="chat-right-tab-icon"><ChatIcon /></span>
          <span className="chat-right-tab-copy">
            <span className="chat-right-tab-label">Chat</span>
            <span className="chat-right-tab-hint">Ask anything</span>
          </span>
        </Link>

        <Link
          href="/dashboard"
          title="Open dashboard"
          aria-current={active === "dashboard" ? "page" : undefined}
          className={tabClass(active === "dashboard")}
        >
          <span className="chat-right-tab-icon"><DashboardIcon /></span>
          <span className="chat-right-tab-copy">
            <span className="chat-right-tab-label">Dashboard</span>
            <span className="chat-right-tab-hint">Progress</span>
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
            <span className="chat-right-tab-icon"><FolderIcon /></span>
            <span className="chat-right-tab-copy">
              <span className="chat-right-tab-label">Documents</span>
              <span className="chat-right-tab-hint">{uploadedCount} / {documentTotal}</span>
              <DocsProgressDots filled={uploadedCount} total={documentTotal} />
            </span>
          </button>
        ) : (
          <Link
            href="/chat/documents"
            title={`Open document manager — ${uploadedCount} of ${documentTotal} essentials uploaded`}
            aria-current={active === "documents" ? "page" : undefined}
            className={tabClass(active === "documents")}
          >
            <span className="chat-right-tab-icon"><FolderIcon /></span>
            <span className="chat-right-tab-copy">
              <span className="chat-right-tab-label">Documents</span>
              <span className="chat-right-tab-hint">{uploadedCount} / {documentTotal}</span>
              <DocsProgressDots filled={uploadedCount} total={documentTotal} />
            </span>
          </Link>
        )}

        <Link
          href="/universities"
          title="Open university shortlist"
          aria-current={active === "universities" ? "page" : undefined}
          className={tabClass(active === "universities")}
        >
          <span className="chat-right-tab-icon"><UniversitiesIcon /></span>
          <span className="chat-right-tab-copy">
            <span className="chat-right-tab-label">Universities</span>
            <span className="chat-right-tab-hint">Shortlist</span>
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

      <div className="chat-left-counselor">
        <p className="chat-left-counselor-kicker">Counsellor</p>
        <h2>Need human help?</h2>
        <p>Ask for a no-pressure callback when you want a real person to review your situation.</p>
        {callConsented ? (
          <div className="chat-left-counselor-status">
            <CheckCircleIcon />
            <span>Request received</span>
          </div>
        ) : onCounselorCall ? (
          <button type="button" onClick={onCounselorCall} className="ab-focus chat-left-counselor-btn">
            <PhoneIcon />
            Request a call
          </button>
        ) : (
          <Link href={counselorHref} className="ab-focus chat-left-counselor-btn">
            <PhoneIcon />
            Request a call
          </Link>
        )}
      </div>
    </aside>
  );
}
