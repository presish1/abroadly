"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  Globe2,
  GraduationCap,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import {
  chat,
  uploadFile,
  getStudent,
  updateStudent,
  getCurrentStudent,
  getChatHistory,
  getStudentDocuments,
  getStudentDocumentDownloadUrl,
  requestCounselorCall,
  logoutStudent,
  signalStudent,
  uploadProfilePhoto,
  type ChatResponse,
  type ChatSource,
  type ChatTurn,
  type EducationLevel,
  type StudentDocument,
  type StudentOut,
} from "@/lib/api";
import {
  COUNTRY_PROFILES,
  pickPendingTodos,
  resolveTargetCountries,
  type PendingTodo,
} from "@/lib/country-data";
import { ESSENTIAL_SLOTS, computeDocReadiness } from "@/lib/document-catalog";
import { StudentQuickTabs } from "@/components/student-quick-tabs";
import { ServiceRequestModal } from "@/components/service-request-modal";
import { ModalShell } from "@/components/modal-shell";
import { EnglishClassPopupCompact } from "@/components/english-class-popup";
import {
  decideChatEngagement,
  emptyChatEngagementMemory,
  readChatEngagementMemory,
  recordChatEngagement,
  recordClassBooked,
  writeChatEngagementMemory,
} from "@/lib/chat-engagement";
import { compressImageToTarget } from "@/lib/image-compress";

/* Abroadly's own human counsellor (placeholder identity — operator can edit). */
const COUNSELOR = {
  name: "Prisma Gautam",
  role: "Study-Abroad Counsellor · Abroadly",
  experience: "guided 800+ students",
  blurb: "Friendly, no-pressure help with universities, visas, scholarships and documents.",
  initials: "PG",
  photo: "/images/prisma-gautam.jpeg",
};

interface UserMessage {
  role: "user";
  text: string;
}

interface AiMessage {
  role: "ai";
  response: ChatResponse;
}

interface WelcomeVideoMessage {
  role: "welcome_video";
  text: string;
}

interface CounselorMessage {
  role: "counselor";
  text: string;
}

interface UploadMessage {
  role: "upload";
  status: "uploading" | "done" | "error";
  filename: string;
  text: string;
  docType?: string;
}

interface CounselorCardMessage {
  role: "counselor_card";
  // Driven by backend offer_counselor / offer_reason signal.
  auto?: boolean;
  reason?: "question" | "qualified" | "sequence" | "bypass";
  tier?: "soft" | "medium" | "strong" | "bypass" | null;
  handoff_target?: string | null;
}

type Message = UserMessage | AiMessage | WelcomeVideoMessage | CounselorMessage | UploadMessage | CounselorCardMessage;

/* ── Question launcher (empty state) + suggestion starters ─────────── */

interface Category {
  icon: LucideIcon;
  label: string;
  hint: string;
  question: string;
}

const categories: Category[] = [
  {
    icon: GraduationCap,
    label: "Eligibility",
    hint: "Will my grades qualify?",
    question: "I just finished +2 in Nepal. Am I eligible to study in the UK, and what do universities look for?",
  },
  {
    icon: CircleDollarSign,
    label: "Costs & funding",
    hint: "Tuition, living, scholarships",
    question: "What's the realistic total cost to study in Australia, and what scholarships exist for Nepali students?",
  },
  {
    icon: ClipboardList,
    label: "Documents",
    hint: "What to prepare",
    question: "Give me a complete document checklist for a UK student visa application.",
  },
  {
    icon: FileCheck2,
    label: "Visa process",
    hint: "Steps & timelines",
    question: "How does the UK student visa process work, step by step, and how long does it take?",
  },
  {
    icon: PenLine,
    label: "SOP help",
    hint: "Statement of purpose",
    question: "Help me outline a strong statement of purpose for a UK undergraduate application.",
  },
  {
    icon: Globe2,
    label: "Compare countries",
    hint: "UK vs Australia vs Canada",
    question: "Compare the UK, Australia and Canada for a Nepali student on a tight budget.",
  },
];

const starterSuggestions: string[] = [
  "Which country is best for my budget?",
  "Can you help me shortlist universities?",
  "What documents do I need for visa?",
  "How much does studying abroad cost?",
  "Can I study without IELTS?",
  "Help me plan my application timeline.",
];

/* ── Document types for upload ────────────────────────────────────── */

interface DocType {
  id: string;
  label: string;
  icon: string;
  desc: string;
  accept: string;
  // Shown in the doc panel when a row is expanded ("what counts" + a Nepal-specific tip).
  requirements?: string[];
  tip?: string;
}

const docTypes: DocType[] = [
  {
    id: "grade_sheet", label: "Transcript", icon: "\u{1F4CA}",
    desc: "+2, A-levels, or bachelor's marksheet", accept: ".pdf,.txt,.jpg,.jpeg,.png",
    requirements: [
      "Official marksheet or transcript from your board or university",
      "Every year or semester you've completed so far",
      "A clear scan where all grades are legible",
    ],
    tip: "NEB +2 transcripts are fine. If your bachelor's is ongoing, upload the semesters you've finished.",
  },
  {
    id: "passport", label: "Passport", icon: "\u{1F6C2}",
    desc: "Valid passport bio page", accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "The photo / bio page showing name, number and expiry",
      "Valid for at least your full intended stay",
      "A colour scan with all four corners visible",
    ],
    tip: "No passport yet? Apply early at the DoP — visa filing needs it, so don't wait for an offer.",
  },
  {
    id: "ielts", label: "English test", icon: "\u{1F4DD}",
    desc: "IELTS, PTE, TOEFL or Duolingo score", accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Official score report (TRF) or a clear screenshot",
      "Taken within the last two years",
      "Shows all four skill scores",
    ],
    tip: "Most UK and Australian unis want IELTS 6.0–6.5 overall. Booked but not sat? Upload the confirmation for now.",
  },
  {
    id: "sop", label: "Statement of purpose", icon: "\u{270D}\u{FE0F}",
    desc: "SOP or personal statement draft", accept: ".pdf,.txt",
    requirements: [
      "Your draft — even a rough first version helps",
      "Why this course, why this country, and your goals",
      "PDF or plain text",
    ],
    tip: "Don't have one yet? Upload a few bullet points and I'll help you shape a full draft.",
  },
  {
    id: "recommendation", label: "Recommendation letters", icon: "\u{1F4E8}",
    desc: "LOR from a teacher or employer", accept: ".pdf,.txt,.jpg,.jpeg,.png",
    requirements: [
      "Signed letter on letterhead where possible",
      "From someone who taught or supervised you",
      "Their name, role and contact details",
    ],
    tip: "Need to create one? Use the recommendation-letter generator on your dashboard, then have your referee sign it.",
  },
  {
    id: "financial", label: "Financial proof", icon: "\u{1F3E6}",
    desc: "Bank statement, sponsor letter or scholarship", accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Bank balance certificate or recent statement",
      "Sponsor's letter and relationship proof, if sponsored",
      "Enough to cover tuition plus living for year one",
    ],
    tip: "The UK needs funds held ~28 days; Australia and Canada differ. Ask me the exact amount for your country.",
  },
  { id: "provisional", label: "Provisional certificate", icon: "📄", desc: "Board / university provisional", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "character_cert", label: "Character certificate", icon: "📜", desc: "From your last school / college", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "migration", label: "Migration certificate", icon: "🔁", desc: "When switching board / university", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "degree_cert", label: "Degree certificate", icon: "🎓", desc: "Final or provisional degree", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "citizenship", label: "Citizenship", icon: "🪪", desc: "Both sides, clear scan", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "photos", label: "Passport photos", icon: "📷", desc: "Recent passport-size photos", accept: ".jpg,.jpeg,.png" },
  { id: "moi", label: "Medium of instruction", icon: "🗣️", desc: "MOI letter from your college", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "gre_gmat", label: "GRE / GMAT", icon: "🧮", desc: "If your program requires it", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "cv", label: "CV / résumé", icon: "📋", desc: "One-page academic CV", accept: ".pdf,.txt" },
  { id: "experience_letter", label: "Experience letter", icon: "💼", desc: "Work / internship letter", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "portfolio", label: "Portfolio", icon: "🎨", desc: "Design / architecture / arts", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "research_proposal", label: "Research proposal", icon: "🔬", desc: "For research / PhD applications", accept: ".pdf,.txt" },
  { id: "bank_statement", label: "Bank statement", icon: "🏦", desc: "Recent 6-month statement", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "balance_cert", label: "Balance certificate", icon: "💳", desc: "Bank balance certificate", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "sponsor_letter", label: "Sponsor letter", icon: "🤝", desc: "Affidavit of support", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "income_source", label: "Income source", icon: "🧾", desc: "CA report / income proof", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "property_valuation", label: "Property valuation", icon: "🏠", desc: "Valuation of family assets", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "loan_letter", label: "Loan sanction", icon: "🏛️", desc: "Education loan approval", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "offer_letter", label: "Offer letter", icon: "🎟️", desc: "Offer / CAS / I-20", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "medical", label: "Medical report", icon: "🩺", desc: "Health / vaccination check", accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "police_clearance", label: "Police clearance", icon: "👮", desc: "Police clearance report", accept: ".pdf,.jpg,.jpeg,.png" },
  {
    id: "other", label: "Other", icon: "\u{1F4CE}",
    desc: "Any other relevant document", accept: ".pdf,.txt,.jpg,.jpeg,.png",
    requirements: [
      "Offer letters, CV, certificates or awards",
      "Work experience or internship letters",
      "Anything a university has specifically asked you for",
    ],
    tip: "Not sure if it matters? Upload it anyway — I'll tell you whether it's useful.",
  },
];

const DOC_TINTS = [
  "linear-gradient(135deg,#E8F0FB,#D6E6F7)",
  "linear-gradient(135deg,#E3F5EC,#CFEEDD)",
  "linear-gradient(135deg,#FBF1DF,#F6E6C8)",
  "linear-gradient(135deg,#F0EBFA,#E2D8F4)",
  "linear-gradient(135deg,#E0F3F1,#CCEAE6)",
  "linear-gradient(135deg,#FBEAEC,#F6D7DC)",
  "linear-gradient(135deg,#E1E7F4,#D0DAEF)",
  "linear-gradient(135deg,#F1EFEA,#E6E2D9)",
];

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "plus_two", label: "+2 / Class 12" },
  { value: "a_levels", label: "A-Levels" },
  { value: "bba", label: "BBA" },
  { value: "bachelors", label: "Bachelors" },
  { value: "other", label: "Other" },
];

interface ProfileFormState {
  full_name: string;
  phone: string;
  location: string;
  education_level: EducationLevel;
  gpa: string;
  expected_gpa: string;
  preferred_field: string;
  goals: string;
}

function optionalProfileNumber(value: string): number | null | undefined {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function profileFormFromStudent(student: StudentOut): ProfileFormState {
  return {
    full_name: student.full_name || "",
    phone: student.phone || "",
    location: student.location || "",
    education_level: student.education_level || "plus_two",
    gpa: student.gpa == null ? "" : String(student.gpa),
    expected_gpa: student.expected_gpa == null ? "" : String(student.expected_gpa),
    preferred_field: student.preferred_field || "",
    goals: student.goals || "",
  };
}

/* ── Icons ────────────────────────────────────────────────────────── */

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <path d="M3.5 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <path d="m7.5 10.5 4.6-4.6a2.5 2.5 0 0 1 3.5 3.5l-6 6a4 4 0 0 1-5.7-5.7l6.3-6.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadCloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
      <path d="M12 16V8m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none">
      <path d="M8 13V4m0 0L4 8m4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightSm() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="none">
      <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function ProfileTabIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 16.5a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DashboardTabIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <rect x="3" y="3" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="3" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="13" width="6" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="10" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function UniversitiesTabIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
      <path d="M3 8.2 10 4l7 4.2M5 8.8v6.7M9 8.8v6.7M11 8.8v6.7M15 8.8v6.7M3.5 16h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* The compact sidebar checklist now comes from the shared catalog so its
 * count matches the full-screen /chat/documents page exactly (8 essentials). */
const SIDEBAR_DOC_SLOTS = ESSENTIAL_SLOTS.map((s) => ({ id: s.id, label: s.shortLabel ?? s.label }));

/* Accept attribute per doc id — prefer the catalog, fall back to the legacy
 * inline docTypes config for any ids the sidebar uses but the catalog hasn't
 * mapped yet. */
const DOC_ACCEPT_BY_ID: Record<string, string> = {
  ...Object.fromEntries(docTypes.map((d) => [d.id, d.accept])),
  ...Object.fromEntries(ESSENTIAL_SLOTS.map((s) => [s.id, s.accept])),
};

/* ── Typing indicator ─────────────────────────────────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-[6px] w-[6px] rounded-full bg-[#E11D2A]"
          style={{ opacity: 0.4, animation: `dotPulse 1.4s ease-in-out ${i * 0.16}s infinite` }}
        />
      ))}
    </div>
  );
}

/* ── Avatars ──────────────────────────────────────────────────────── */

function AiAvatar() {
  return (
    <div className="h-8 w-8 shrink-0 rounded-[10px] overflow-hidden ring-1 ring-black/5">
      <img src="/images/abroadly-logo.png" alt="Abroadly" className="h-full w-full bg-white object-contain p-0.5" />
    </div>
  );
}

function UserAvatar({ initial, photoUrl, name }: { initial: string; photoUrl?: string | null; name?: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#12244a] ring-1 ring-white/10">
      {photoUrl ? (
        <img src={photoUrl} alt={name || "Your profile"} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[11px] font-bold text-white/90">{initial}</span>
      )}
    </div>
  );
}

/* ── Source chip ──────────────────────────────────────────────────── */

function cleanSourceTitle(title: string | null, chunkId: string): string {
  if (!title) return chunkId.slice(0, 8);
  let clean = title.replace(/^\d+-/, "").replace(/\.(md|txt|pdf)$/, "").replace(/[-_]/g, " ").trim();
  if (clean.length > 0) clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  return clean || title;
}

function SourceChip({ source }: { source: ChatSource }) {
  return (
    <span className="chat-source-chip">
      <span className="min-w-0 truncate">{cleanSourceTitle(source.title, source.chunk_id)}</span>
    </span>
  );
}

/* ── Answer parsing ───────────────────────────────────────────────── */

interface ParsedAnswer {
  body: string;
  actions: { text: string; isUpload: boolean }[];
}

function parseAnswer(raw: string): ParsedAnswer {
  let text = raw;
  text = text.replace(/\[Source:\s*[^\]]*\]/gi, "");
  text = text.replace(/\n{3,}/g, "\n\n");

  const actionMatch = text.match(/\*\*(?:What to do next|Next steps|You might also want to ask):\*\*\s*\n([\s\S]*)/i);

  let body = text;
  const actions: { text: string; isUpload: boolean }[] = [];

  if (actionMatch) {
    body = text.slice(0, actionMatch.index).trim();
    for (const line of actionMatch[1].split("\n")) {
      const cleaned = line
        .replace(/^\s*[\*\-•]\s*/, "")          // leading bullet
        .replace(/^"(.+)"$/, "$1")              // surrounding quotes
        .replace(/\*\*(.+?)\*\*/g, "$1")        // **bold** → bold (chips are plain-text)
        .replace(/__(.+?)__/g, "$1")            // __bold__ → bold (same)
        .replace(/\*(.+?)\*/g, "$1")            // *italic* → italic
        .trim();
      if (cleaned.length > 5) {
        const hasVerb = /\b(upload|share|send|provide|attach|submit|drop|give|show|need|require)\b/i.test(cleaned);
        const hasDoc = /\b(marksheet|transcript|document|ielts|pte|toefl|passport|sop|lor|cv|citizenship|financial|statement|proof)\b/i.test(cleaned);
        const isUpload = hasVerb && hasDoc;
        actions.push({ text: cleaned, isUpload });
      }
    }
  }

  return { body: body.trim(), actions };
}

/* Elegant, capped emoji enrichment for AI replies — each emoji at most once
 * per reply (first mention only), so it accents rather than spams. */
const COUNTRY_FLAGS: [RegExp, string][] = [
  [/\bUnited Kingdom\b/i, "\u{1F1EC}\u{1F1E7}"],
  [/\bUK\b/, "\u{1F1EC}\u{1F1E7}"],
  [/\bAustralia\b/i, "\u{1F1E6}\u{1F1FA}"],
  [/\bCanada\b/i, "\u{1F1E8}\u{1F1E6}"],
  [/\b(?:United States|USA)\b/i, "\u{1F1FA}\u{1F1F8}"],
  [/\bGermany\b/i, "\u{1F1E9}\u{1F1EA}"],
  [/\bIreland\b/i, "\u{1F1EE}\u{1F1EA}"],
  [/\bNew Zealand\b/i, "\u{1F1F3}\u{1F1FF}"],
  [/\bNepal\b/i, "\u{1F1F3}\u{1F1F5}"],
];
const KEYWORD_EMOJI: [RegExp, string][] = [
  [/\b(?:passport|visa)\b/i, "\u{1F6C2}"],
  [/\b(?:universit(?:y|ies)|degree|graduat(?:e|ion)|scholarship)\b/i, "\u{1F393}"],
  [/\b(?:city|cities|campus|located|location)\b/i, "\u{1F4CD}"],
];

function enrichEmoji(text: string): string {
  let out = text;
  for (const [re, emoji] of [...COUNTRY_FLAGS, ...KEYWORD_EMOJI]) {
    if (out.includes(emoji)) continue; // each emoji at most once
    out = out.replace(re, (m) => `${emoji} ${m}`); // first match only (no /g)
  }
  return out;
}

function renderInline(content: string, keyBase: number) {
  return content.split(/(\*\*[^*]+\*\*)/).map((seg, j) =>
    seg.startsWith("**") && seg.endsWith("**")
      ? <strong key={`${keyBase}-${j}`} className="font-semibold text-[var(--ab-ink)]">{seg.slice(2, -2)}</strong>
      : seg
  );
}

function FormattedBody({ text }: { text: string }) {
  const lines = enrichEmoji(text).split("\n");
  return (
    <div className="chat-bubble-text">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;

        const bulletMatch = /^\s*[\*\-•]\s+(.*)$/.exec(line);
        const numMatch = /^\s*(\d+)\.\s+(.*)$/.exec(line);
        const trimmed = line.trim();
        const isHeading = /^\*\*[^*]+\*\*:?$/.test(trimmed); // a line that's entirely bold = subheading

        if (isHeading) {
          return (
            <p key={i} className="mt-2 mb-1 text-[13px] font-bold text-[var(--ab-ink)]">
              {trimmed.replace(/^\*\*|\*\*:?$/g, "").replace(/:$/, "")}
            </p>
          );
        }
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2.5 py-[3px]">
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#FDECEE] text-[10px] font-bold text-[#E11D2A]">{numMatch[1]}</span>
              <span className="flex-1">{renderInline(numMatch[2], i)}</span>
            </div>
          );
        }
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2 pl-0.5 py-[3px]">
              <span className="text-[#E11D2A] mt-[6px] text-[7px] shrink-0">{"●"}</span>
              <span className="flex-1">{renderInline(bulletMatch[1], i)}</span>
            </div>
          );
        }
        return <p key={i} className="py-0.5">{renderInline(line, i)}</p>;
      })}
    </div>
  );
}

/* ── AI bubble ────────────────────────────────────────────────────── */
/* Follow-up suggestions are surfaced in the rail above the composer, and
 * upload prompts via a popup — so the bubble itself stays clean. */

const CHAT_COLLAPSE_AFTER_WORDS = 90;
const CHAT_PREVIEW_WORDS = 58;

function compactAnswerPreview(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= CHAT_PREVIEW_WORDS) return text;
  let preview = words.slice(0, CHAT_PREVIEW_WORDS).join(" ").replace(/[,:;\-–—]+$/, "");
  if ((preview.match(/\*\*/g) || []).length % 2 !== 0) preview += "**";
  return `${preview}…`;
}

function AiResponseBubble({ response }: { response: ChatResponse }) {
  const answer = response.answer ?? response.clarifying_question ?? "I need a little more context.";
  const { body } = parseAnswer(answer);
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = body.trim().split(/\s+/).length > CHAT_COLLAPSE_AFTER_WORDS;
  const visibleBody = shouldCollapse && !expanded ? compactAnswerPreview(body) : body;
  return (
    <div className="chat-bubble-ai">
      <FormattedBody text={visibleBody} />
      {shouldCollapse && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="ab-focus chat-answer-toggle">
          {expanded ? "Show less" : "Show full answer"}
        </button>
      )}
    </div>
  );
}

function WelcomeVideoCard({ text }: { text: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <article className="chat-welcome-video">
      <p className="chat-welcome-video-kicker">Your 1-minute Abroadly tour</p>
      <p className="chat-welcome-video-copy">{text}</p>
      <div className="chat-welcome-video-frame">
        <video
          ref={videoRef}
          src="/media/abroadly-welcome-tour.mp4"
          poster="/media/abroadly-welcome-tour-poster.jpg"
          preload="metadata"
          playsInline
          muted
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onClick={togglePlayback}
        />
        <button type="button" className="chat-video-play" onClick={togglePlayback} aria-label={playing ? "Pause welcome video" : "Play welcome video"}>
          {playing ? "Pause" : "Play tour"}
        </button>
        <button type="button" className="chat-video-mute" onClick={toggleMute} aria-label={muted ? "Unmute welcome video" : "Mute welcome video"}>
          <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
          {muted ? "Muted" : "Sound on"}
        </button>
      </div>
      <p className="chat-welcome-video-note">Muted by default · turn sound on when you are ready.</p>
    </article>
  );
}

/* ── Image compression ────────────────────────────────────────────── */

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXTS.some((e) => file.name.toLowerCase().endsWith(e));
}

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
          resolve(compressed);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Document upload panel ────────────────────────────────────────── */

function DocumentPanel({
  open,
  onClose,
  studentId,
  documents,
  onUploadDone,
  onDiscuss,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string;
  documents: StudentDocument[];
  onUploadDone: (docType: DocType, filename: string, document: StudentDocument | null) => void;
  onDiscuss: (docType: DocType) => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Which row has its "what counts" detail expanded (tapping Upload reveals it).
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const uploadedByType = useMemo(() => {
    const byType = new Map<string, StudentDocument>();
    for (const doc of documents) {
      if (!byType.has(doc.doc_type)) byType.set(doc.doc_type, doc);
    }
    return byType;
  }, [documents]);
  const completedTypeCount = docTypes.filter((dt) => uploadedByType.has(dt.id)).length;

  const handleFile = useCallback(
    async (docType: DocType, file: File) => {
      setError(null);
      setUploadingId(docType.id);
      let fileToUpload = file;
      try {
        if (isImageFile(file)) {
          fileToUpload = await compressImage(file);
        }
        const res = await uploadFile(studentId, fileToUpload, docType.id, file.name);
        onUploadDone(docType, file.name, res.document);
      } catch (err: unknown) {
        setError(`${docType.label}: ${err instanceof Error ? err.message : "Upload failed"}`);
      } finally {
        setUploadingId(null);
      }
    },
    [studentId, onUploadDone]
  );

  const handleDrop = useCallback(
    (docType: DocType, e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(docType, file);
    },
    [handleFile]
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="document-panel-title"
      panelClassName="doc-panel"
      layerClassName="doc-panel-layer"
      showClose={false}
    >
        <div className="doc-panel-header">
          <div>
            <h2 id="document-panel-title" className="text-[16px] font-bold text-[var(--ab-ink)]">Upload Documents</h2>
            <p className="text-[12px] text-[#8A847B] mt-0.5">
              Add your documents and I&apos;ll tailor answers to your real situation.
            </p>
          </div>
          <button type="button" onClick={onClose} className="ab-focus flex h-8 w-8 items-center justify-center rounded-lg text-[#8A847B] hover:bg-[#F0EDE4] hover:text-[#1B1916] transition-colors">
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="mx-5 mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[12px] text-red-600 font-medium">{error}</div>
        )}

        <div className="doc-panel-body">
          <div className="grid grid-cols-2 gap-2.5">
            {docTypes.map((dt, idx) => {
              const isUploading = uploadingId === dt.id;
              const uploadedDoc = uploadedByType.get(dt.id);
              const thumbUrl = uploadedDoc && uploadedDoc.is_image
                ? getStudentDocumentDownloadUrl(studentId, uploadedDoc.doc_id)
                : null;
              const isDragTarget = dragOver === dt.id;
              const tint = DOC_TINTS[idx % DOC_TINTS.length];
              return (
                <div
                  key={dt.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(dt.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(dt, e)}
                  className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition ${isDragTarget ? "border-[#E11D2A] ring-2 ring-[#FDECEE]" : uploadedDoc ? "border-[#CDE6DB]" : "border-[var(--ab-line)] hover:-translate-y-0.5 hover:border-[#E11D2A]/40 hover:shadow-[0_10px_24px_-14px_rgba(27,25,22,0.25)]"}`}
                >
                  {/* sample-preview "photo" */}
                  <div className="relative flex h-[84px] items-center justify-center overflow-hidden" style={{ background: tint }}>
                    {uploadedDoc && thumbUrl ? (
                      <img src={thumbUrl} alt={uploadedDoc.filename} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-[52px] w-[40px] flex-col items-center justify-center gap-[5px] rounded-md bg-white/95 shadow-[0_3px_10px_rgba(0,0,0,0.13)]">
                        <span className="text-[17px] leading-none">{dt.icon}</span>
                        <span className="h-[3px] w-6 rounded-full bg-[#C9C3B8]" />
                        <span className="h-[3px] w-4 rounded-full bg-[#D8D3C8]" />
                      </div>
                    )}
                    <span className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-[2px] text-[9px] font-bold ${uploadedDoc ? "bg-[#0A6E45] text-white" : "bg-white/85 text-[#6B655C]"}`}>
                      {uploadedDoc ? "✓ Done" : "Needed"}
                    </span>
                  </div>
                  {/* info + clear upload */}
                  <div className="flex flex-1 flex-col p-2.5">
                    <p className="text-[12px] font-bold leading-[1.2] tracking-[-0.01em] text-[var(--ab-ink)]">{dt.label}</p>
                    <p className="mt-0.5 flex-1 truncate text-[10px] text-[#8A847B]">{uploadedDoc ? uploadedDoc.filename : dt.desc}</p>
                    {uploadedDoc ? (
                      <div className="mt-2 flex items-center gap-1.5">
                        <button type="button" onClick={() => onDiscuss(dt)} className="flex-1 rounded-lg bg-[#FDECEE] px-2 py-1.5 text-[11px] font-bold text-[#E11D2A] transition-colors hover:bg-[#fbdce0]">Ask AI</button>
                        <button type="button" onClick={() => fileRefs.current[dt.id]?.click()} className="rounded-lg border border-[var(--ab-line)] px-2 py-1.5 text-[11px] font-semibold text-[#6B655C] transition-colors hover:border-[#E11D2A] hover:text-[#E11D2A]">Replace</button>
                      </div>
                    ) : isUploading ? (
                      <div className="mt-2 flex justify-center py-1"><div className="h-5 w-5 rounded-full border-2 border-[#E11D2A] border-t-transparent animate-spin" /></div>
                    ) : (
                      <button type="button" onClick={() => fileRefs.current[dt.id]?.click()} className="mt-2 rounded-lg bg-[#E11D2A] px-2 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#C0121F]">Upload</button>
                    )}
                    <input
                      ref={(el) => { fileRefs.current[dt.id] = el; }}
                      type="file"
                      accept={dt.accept}
                      className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(dt, file); e.target.value = ""; }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="doc-drop-zone">
            <UploadCloudIcon />
            <p className="mt-2 text-[12px] font-semibold text-[#8A847B]">Drag &amp; drop any document here</p>
            <p className="text-[10px] text-[#B5B0A6] mt-1">PDF, TXT, JPG, PNG supported</p>
          </div>
        </div>

        <div className="doc-panel-footer">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8A847B]">{completedTypeCount} of {docTypes.length} categories uploaded</span>
            <div className="h-1.5 w-20 rounded-full bg-[#EFECE4] overflow-hidden">
              <div className="h-full rounded-full bg-[#E11D2A] transition-all duration-500" style={{ width: `${(completedTypeCount / docTypes.length) * 100}%` }} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="ab-focus rounded-lg bg-[#E11D2A] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-[#C0121F] transition-colors">Done</button>
        </div>
    </ModalShell>
  );
}

/* ── Upload prompt popup ──────────────────────────────────────────── */

function UploadPromptModal({
  label,
  accept,
  onFile,
  onBrowse,
  onClose,
}: {
  label: string;
  accept: string;
  onFile: (file: File) => void;
  onBrowse: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <ModalShell open onClose={onClose} titleId="upload-prompt-title" panelClassName="upload-modal" closeLabel="Close upload prompt" mobileSheet>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDECEE] text-[#E11D2A]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path d="M12 16V8m0 0-3.5 3.5M12 8l3.5 3.5M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 id="upload-prompt-title" className="mt-4 text-[17px] font-extrabold tracking-[-0.01em] text-[var(--ab-ink)]">
          Upload your {label}
        </h3>
        <p className="mt-2 text-[13px] leading-5 text-[#6B655C]">
          I can check your real details instead of giving another generic answer. Your file stays private to your account.
        </p>
        <div className="mt-5 flex gap-2.5">
          <button type="button" onClick={() => inputRef.current?.click()} className="ab-focus flex-1 rounded-lg bg-[#E11D2A] px-4 py-3 text-[13px] font-bold text-white shadow-[var(--shadow-sm)] transition hover:bg-[#C0121F]">
            Choose file
          </button>
          <button type="button" onClick={onBrowse} className="ab-focus rounded-lg border border-[#E8E5DD] bg-white px-4 py-3 text-[13px] font-semibold text-[#6B655C] transition hover:bg-[#F4F2EC]">
            All documents
          </button>
        </div>
        <button type="button" onClick={onClose} className="ab-focus mt-3 w-full text-center text-[11px] font-semibold text-[#8A847B] hover:text-[#1B1916]">
          Not now
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = "";
          }}
        />
    </ModalShell>
  );
}

/* ── Profile popup ────────────────────────────────────────────────── */

function ProfilePopup({
  student,
  onClose,
  onSaved,
  requirePhone = false,
  uploadedCount,
  documentTotal,
  optionalUploadedCount,
}: {
  student: StudentOut;
  onClose: () => void;
  onSaved: (student: StudentOut) => void;
  requirePhone?: boolean;
  uploadedCount: number;
  documentTotal: number;
  optionalUploadedCount: number;
}) {
  const [editing, setEditing] = useState(requirePhone);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(() => profileFormFromStudent(student));
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fileToUpload = await compressImageToTarget(file, 250 * 1024);
      const res = await uploadProfilePhoto(student.id, fileToUpload);
      onSaved({ ...student, profile_photo_url: res.profile_photo_url });
    } catch (err: any) {
      alert(err.message || "Failed to upload profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }
  const targetCountries = student.target_countries || [];
  const initial = (student.full_name || "Y").charAt(0).toUpperCase();
  const phoneMissing = !student.phone?.trim();
  const profilePct = Math.round(((student.profile_completed ? 6 : [student.full_name, student.phone, student.education_level, targetCountries.length, student.preferred_field, student.gpa ?? student.expected_gpa].filter(Boolean).length) / 6) * 100);
  const nextStepLabel =
    phoneMissing
      ? "Add phone"
      : !student.profile_completed
        ? "Finish profile"
        : uploadedCount < documentTotal
          ? "Upload docs"
          : targetCountries.length === 0
            ? "Review destinations"
            : "Shortlist universities";
  const visibleFields: [string, string | number | null | undefined][] = [
    ["Email", student.email],
    ["Phone", student.phone],
    ["Education", student.education_level?.replace(/_/g, " ")],
    ["Target countries", targetCountries.join(", ")],
  ];
  const expandedFields: [string, string | number | null | undefined][] = [
    ["City / district", student.location],
    ["Current GPA", student.gpa],
    ["Expected GPA", student.expected_gpa],
    ["Field of interest", student.preferred_field],
    ["Goals", student.goals],
  ];
  const completionCount = [
    student.full_name,
    student.phone,
    student.education_level,
    student.target_countries?.length,
    student.preferred_field,
    student.gpa ?? student.expected_gpa,
  ].filter(Boolean).length;
  const completionPct = Math.round((completionCount / 6) * 100);
  const inputClass =
    "w-full rounded-md border border-[#E8E5DD] bg-white px-3 py-2.5 text-base md:text-[13px] font-semibold text-[#1B1916] placeholder:text-[#A8A29A] focus:border-[#0A6E45] focus:outline-none focus:ring-4 focus:ring-[#0A6E45]/12";
  const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B655C]";
  const errorClass = "mt-1.5 text-[11px] font-bold text-[#b42318]";

  function setField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateProfileForm(): boolean {
    const next: Partial<Record<keyof ProfileFormState, string>> = {};
    const gpa = optionalProfileNumber(form.gpa);
    const expectedGpa = optionalProfileNumber(form.expected_gpa);

    if (!form.full_name.trim()) next.full_name = "Full name is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (gpa === undefined || (gpa !== null && (gpa < 0 || gpa > 4.5))) {
      next.gpa = "Use a GPA between 0 and 4.5.";
    }
    if (expectedGpa === undefined || (expectedGpa !== null && (expectedGpa < 0 || expectedGpa > 4.5))) {
      next.expected_gpa = "Use an expected GPA between 0 and 4.5.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateProfileForm()) return;

    const gpa = optionalProfileNumber(form.gpa);
    const expectedGpa = optionalProfileNumber(form.expected_gpa);
    setSaving(true);
    setApiError("");
    try {
      const updated = await updateStudent(student.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim() || null,
        education_level: form.education_level,
        gpa: gpa === undefined ? null : gpa,
        expected_gpa: expectedGpa === undefined ? null : expectedGpa,
        preferred_field: form.preferred_field.trim() || null,
        goals: form.goals.trim() || null,
      });
      onSaved(updated);
      setEditing(false);
      setExpanded(true);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      titleId="profile-modal-title"
      panelClassName="profile-panel"
      layerClassName="profile-panel-layer"
      closeLabel="Close profile"
      showClose={!requirePhone}
      closeOnBackdrop={!requirePhone}
      closeOnEscape={!requirePhone}
    >
        <div className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-[#E8E5DD] bg-[linear-gradient(135deg,#0B1631_0%,#12244a_55%,#0A6E45_100%)] p-5 text-white shadow-[0_18px_44px_-26px_rgba(10,110,69,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-white text-[18px] font-black text-[#12244a] shadow-[0_10px_24px_-12px_rgba(255,255,255,0.25)] overflow-hidden group transition hover:scale-105"
                  title="Click to upload profile photo"
                >
                  {uploadingPhoto ? (
                    <div className="flex h-full w-full items-center justify-center bg-black/40 text-[10px] text-white font-bold animate-pulse">
                      ...
                    </div>
                  ) : student.profile_photo_url ? (
                    <img src={student.profile_photo_url} alt={student.full_name} className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="min-w-0">
                  <h3 id="profile-modal-title" className="truncate text-[18px] font-extrabold tracking-[-0.02em]">
                    {student.full_name || "Your profile"}
                  </h3>
                  <p className="truncate text-[12px] text-white/78">{student.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-white/12 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/90">
                      {student.profile_completed ? "Onboarded" : "Needs details"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#7DDBB1]/14 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#D8FFF0]">
                      {nextStepLabel}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                className="ab-focus inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-3.5 text-[11px] font-bold text-white transition hover:bg-white/18"
                aria-expanded={expanded}
              >
                <span>{expanded ? "Collapse" : "Inspect"}</span>
                <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}><ArrowRightSm /></span>
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[18px] border border-white/12 bg-white/10 p-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">Profile</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[22px] font-black leading-none">{profilePct}%</p>
                    <p className="mt-1 text-[11px] text-white/72">Completion score</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-[10px] font-black text-white">
                    {profilePct}%
                  </div>
                </div>
              </div>
              <div className="rounded-[18px] border border-white/12 bg-white/10 p-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">Documents</p>
                <p className="mt-2 text-[22px] font-black leading-none">{uploadedCount}<span className="text-white/55">/{documentTotal}</span></p>
                <p className="mt-1 text-[11px] text-white/72">+{optionalUploadedCount} optional</p>
              </div>
              <div className="rounded-[18px] border border-white/12 bg-white/10 p-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">Countries</p>
                <p className="mt-2 text-[22px] font-black leading-none">{targetCountries.length || "0"}</p>
                <p className="mt-1 truncate text-[11px] text-white/72">{targetCountries.length ? targetCountries.join(" · ") : "Not set"}</p>
              </div>
              <div className="rounded-[18px] border border-white/12 bg-white/10 p-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/65">Next action</p>
                <p className="mt-2 text-[15px] font-black leading-[1.2]">{nextStepLabel}</p>
                <p className="mt-1 text-[11px] text-white/72">Then we sharpen universities and visas.</p>
              </div>
            </div>
          </section>

          <nav className="profile-panel-tabs" aria-label="Student workspace">
            <span className="is-active"><ProfileTabIcon /> Profile</span>
            <Link href="/dashboard"><DashboardTabIcon /> Dashboard</Link>
            <Link href="/chat/documents"><FolderIcon /> Documents</Link>
            <Link href="/universities"><UniversitiesTabIcon /> Universities</Link>
          </nav>

          {phoneMissing && (
            <div className="rounded-2xl border border-[#F5C2BC] bg-[#FFF4F2] px-4 py-3 text-[12px] font-semibold leading-5 text-[#B42318]">
              Add your phone number to keep using your signed-in profile.
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[24px] border border-[#E8E5DD] bg-white p-4 shadow-[0_1px_2px_rgba(15,15,15,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Workspace snapshot</p>
                  <h4 className="mt-1 text-[16px] font-extrabold tracking-[-0.02em] text-[var(--ab-ink)]">Already onboarded, now refine it.</h4>
                </div>
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#0A6E45 ${profilePct}%, #EFECE4 0)` }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-black text-[#12244a]">{profilePct}%</div>
                </div>
              </div>
              <div className="mt-4 grid gap-2.5">
                {visibleFields.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#EFECE4] bg-[#FAF9F6] px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">{label}</p>
                    <p className="mt-1 text-[13px] font-semibold text-[var(--ab-ink)]">{value ? String(value) : "Not set"}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                className="ab-focus mt-4 flex min-h-11 w-full items-center justify-between rounded-full border border-[#E8E5DD] bg-white px-4 text-[12px] font-bold text-[#3F3A33] transition hover:border-[#0A6E45] hover:text-[#0A6E45]"
                aria-expanded={expanded}
              >
                <span>{expanded ? "Hide extra details" : "Show extra details"}</span>
                <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}><ArrowRightSm /></span>
              </button>
              {expanded && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {expandedFields.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-[#EFECE4] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,15,15,0.03)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">{label}</p>
                      <p className="mt-1 text-[13px] font-medium text-[var(--ab-ink)]">{value ? String(value) : "Not set"}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[24px] border border-[#E8E5DD] bg-white p-4 shadow-[0_1px_2px_rgba(15,15,15,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Profile editor</p>
                  <h4 className="mt-1 text-[16px] font-extrabold tracking-[-0.02em] text-[var(--ab-ink)]">
                    {editing ? "Adjust your details" : "Keep it concise and current"}
                  </h4>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="ab-focus rounded-full border border-[#E8E5DD] bg-[#FAF9F6] px-3 py-2 text-[11px] font-bold text-[#12244a] transition hover:border-[#12244a] hover:bg-white"
                  >
                    Edit details
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[#E8E5DD] bg-[linear-gradient(135deg,#F8FAFF,#F2FBF6)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0A6E45]">Why this matters</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#3F3A33]">
                      You’re already signed in. This tab is for tightening the plan: clearer goals, better docs, and less generic advice.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Link href="/dashboard" className="ab-focus inline-flex items-center justify-between rounded-2xl border border-[#E8E5DD] bg-white px-4 py-3 text-[13px] font-bold text-[#1B1916] transition hover:border-[#0A6E45]">
                      Open dashboard <ArrowRightSm />
                    </Link>
                    <Link href="/universities" className="ab-focus inline-flex items-center justify-between rounded-2xl border border-[#E8E5DD] bg-white px-4 py-3 text-[13px] font-bold text-[#1B1916] transition hover:border-[#0A6E45]">
                      Browse universities <ArrowRightSm />
                    </Link>
                    <Link href="/chat/documents" className="ab-focus inline-flex items-center justify-between rounded-2xl border border-[#E8E5DD] bg-white px-4 py-3 text-[13px] font-bold text-[#1B1916] transition hover:border-[#0A6E45]">
                      Review documents <ArrowRightSm />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={saveProfile} className="mt-4 space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="profile-full-name">Full name</label>
                    <input id="profile-full-name" className={inputClass} value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} autoComplete="name" />
                    {errors.full_name && <p className={errorClass}>{errors.full_name}</p>}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="profile-phone">Phone <span className="text-[#b42318]">*</span></label>
                    <input id="profile-phone" type="tel" inputMode="tel" required className={inputClass} value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+977 98XXXXXXXX" autoComplete="tel" />
                    {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="profile-location">City / district</label>
                      <input id="profile-location" className={inputClass} value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Kathmandu" autoComplete="address-level2" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="profile-education">Education</label>
                      <select id="profile-education" className={inputClass} value={form.education_level} onChange={(e) => setField("education_level", e.target.value as EducationLevel)}>
                        {EDUCATION_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="profile-field">Preferred field</label>
                    <input id="profile-field" className={inputClass} value={form.preferred_field} onChange={(e) => setField("preferred_field", e.target.value)} placeholder="Computer Science, Nursing, Business" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="profile-gpa">Current GPA</label>
                      <input id="profile-gpa" type="number" inputMode="decimal" step="0.01" min="0" max="4.5" className={inputClass} value={form.gpa} onChange={(e) => setField("gpa", e.target.value)} placeholder="3.25" />
                      {errors.gpa && <p className={errorClass}>{errors.gpa}</p>}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="profile-expected-gpa">Expected GPA</label>
                      <input id="profile-expected-gpa" type="number" inputMode="decimal" step="0.01" min="0" max="4.5" className={inputClass} value={form.expected_gpa} onChange={(e) => setField("expected_gpa", e.target.value)} placeholder="3.60" />
                      {errors.expected_gpa && <p className={errorClass}>{errors.expected_gpa}</p>}
                    </div>
                  </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className={labelClass}>Target countries</label>
                        <span className="text-[11px] font-bold text-[#8A847B]">{targetCountries.length || 0} selected</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {targetCountries.length ? (
                          targetCountries.map((country) => (
                            <span key={country} className="rounded-md border border-[#D7E7DD] bg-[#E8F2EC] px-3 py-2 text-[12px] font-bold text-[#0A6E45]">
                              {country}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-md border border-[#E8E5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#8A847B]">
                            Not set yet
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-[#8A847B]">
                        Destination changes are kept out of profile editing so your recommendations stay stable.
                      </p>
                    </div>

                  <div>
                    <label className={labelClass} htmlFor="profile-goals">Goals</label>
                    <textarea id="profile-goals" rows={4} maxLength={1200} className={inputClass} value={form.goals} onChange={(e) => setField("goals", e.target.value)} placeholder="What do you want Abroadly to help you plan?" />
                    <p className="mt-1.5 text-right text-[11px] font-bold text-[#8A847B]">{form.goals.length}/1200</p>
                  </div>

                  {apiError && (
                    <div className="rounded-2xl border border-[#F5C2BC] bg-[#FFF4F2] px-3 py-2 text-[12px] font-bold text-[#B42318]">{apiError}</div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {!requirePhone && (
                      <button type="button" onClick={() => { setEditing(false); setForm(profileFormFromStudent(student)); setErrors({}); setApiError(""); }} className="ab-focus min-h-11 rounded-full border border-[#E8E5DD] bg-white px-4 text-[13px] font-bold text-[#6B655C] transition hover:bg-[#F4F2EC]">
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={saving} className="ab-focus min-h-11 flex-1 rounded-full bg-[#0A6E45] px-4 text-[13px] font-bold text-white shadow-[var(--shadow-sm)] transition hover:bg-[#075b39] disabled:cursor-not-allowed disabled:bg-[#A8A29A]">
                      {saving ? "Saving..." : requirePhone ? "Save phone and profile" : "Save changes"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
    </ModalShell>
  );
}

/* ── Human counselor card (rendered inside chat) ──────────────────── */

function CounselorCard({
  consented,
  onGrant,
  reason,
  tier,
  handoff_target,
}: {
  consented: boolean;
  onGrant: () => void;
  reason?: "question" | "qualified" | "sequence" | "bypass";
  tier?: "soft" | "medium" | "strong" | "bypass" | null;
  handoff_target?: string | null;
}) {
  const isPartner = handoff_target === "partner";
  const counselorName = isPartner ? "our counsellor" : COUNSELOR.name.split(" ")[0];

  const intro =
    tier === "strong" || reason === "qualified"
      ? "Based on your questions, you're ready for a personal walkthrough."
      : tier === "medium"
        ? `You're clearly planning this. ${counselorName} can take it from here.`
        : tier === "bypass" || reason === "bypass"
          ? "You're clearly preparing. A real person can guide you from here."
          : tier === "soft" || reason === "question"
            ? "You've asked some good questions. Want help from a real person?"
            : "You've asked a few good questions. Want a real person to walk you through your options?";

  return (
    <div className="counselor-card">
      {reason && !consented && (
        <p className="mb-3 text-[12px] font-medium leading-[1.5] text-[#6B655C]">
          {intro}
        </p>
      )}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={COUNSELOR.photo}
            alt={COUNSELOR.name}
            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-black/5"
          />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#E11D2A]" fill="currentColor"><path d="M10 1l2.4 1.8 3-.1 1 2.8 2.5 1.6-1 2.8 1 2.8-2.5 1.6-1 2.8-3-.1L10 19l-2.4-1.8-3 .1-1-2.8L1.1 13l1-2.8-1-2.8 2.5-1.6 1-2.8 3 .1L10 1z"/><path d="M8.6 12.2 6.4 10l-1 1 3.2 3.2 5.8-5.8-1-1z" fill="#fff"/></svg>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-extrabold text-[var(--ab-ink)]">{COUNSELOR.name}</p>
            <span className="rounded-full bg-[#FDECEE] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#E11D2A]">Verified</span>
          </div>
          <p className="text-[12px] font-medium text-[#6B655C]">{COUNSELOR.role}</p>
          <p className="mt-0.5 text-[11px] text-[#8A847B]">{COUNSELOR.experience}</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-[#3F3A33]">{COUNSELOR.blurb}</p>
      {consented ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F2FBF6] border border-emerald-100 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-700">
          <CheckCircleIcon />
          <span>{isPartner ? "A counsellor" : COUNSELOR.name.split(" ")[0]} will reach out to call you soon.</span>
        </div>
      ) : (
        <button type="button" onClick={onGrant} className="counselor-call-btn">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none"><path d="M4.5 3h3l1.2 3-1.6 1.2a9 9 0 0 0 4.7 4.7L13 10.3l3 1.2v3a1.5 1.5 0 0 1-1.6 1.5A12.5 12.5 0 0 1 3 4.6 1.5 1.5 0 0 1 4.5 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          Allow {counselorName} to call me
        </button>
      )}
      <p className="mt-2 text-[10.5px] text-[#A8A296]">Free · Abroadly&apos;s own counsellor · not a paid agent</p>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */

export default function ChatPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>("");
  const [student, setStudent] = useState<StudentOut | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // Raw chat-history turns (for the dashboard's "Pick up where you left off" module
  // and for any other surface that needs role + timestamp metadata, which the rendered
  // Message[] union loses). Hydrated from getChatHistory on mount, appended on each send.
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [uploadPrompt, setUploadPrompt] = useState<{ slotId: string; label: string } | null>(null);
  const [classBookingPrompt, setClassBookingPrompt] = useState<{ test: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [callConsented, setCallConsented] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  // Counsellor offer: driven by backend offer_counselor signal; shown once per session.
  const counselorOffered = useRef(false);
  // Count of user-typed (not click-sourced) messages sent this session.
  // Used for the depth-bonus calculation and the 2-session-turn gate.
  const sessionTypedCount = useRef(0);
  // Lifetime question count and prompt memory include restored history, so
  // engagement prompts still work after a refresh or a later visit.
  const lifetimeUserTurns = useRef(0);
  const engagementMemory = useRef(emptyChatEngagementMemory());
  // True once the student uploads an SOP or financial document this session.
  const hasPriorityDoc = useRef(false);
  // Per-slot hidden inputs for the sidebar quick-upload checkboxes.
  const sidebarFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const chatLayoutRef = useRef<HTMLElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottom = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Hold a ref to sendMessage so the URL-deep-link effect (below) can call the
  // latest version without re-running every time sendMessage's deps change.
  const sendMessageRef = useRef<((text?: string, source?: string) => void) | null>(null);

  // URL deep links
  //   ?docs=open    → opens the document upload panel (existing behaviour)
  //   ?profile=open → opens the profile editor (used by shared Quick Tabs)
  //   ?class=claim  → opens the free IELTS/PTE class confirmation
  //   ?send=<query> → auto-sends a question on landing (used by /dashboard's
  //                   "Ask Abroadly" buttons to deep-link a specific prompt into chat)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("docs") === "open") setDocPanelOpen(true);
    if (params.get("profile") === "open") setProfileOpen(true);
    if (params.get("class") === "claim") setClassBookingPrompt({ test: "IELTS" });
    const pendingSend = params.get("send");
    const pendingSource = params.get("source") || undefined;
    if (pendingSend) {
      const q = pendingSend;
      const src = pendingSource;
      setTimeout(() => sendMessageRef.current?.(q, src), 300);
    }
    if (params.get("docs") || params.get("profile") || params.get("class") || params.get("send") || params.get("panel") || params.get("source")) {
      const next = new URL(window.location.href);
      next.searchParams.delete("docs");
      next.searchParams.delete("profile");
      next.searchParams.delete("class");
      next.searchParams.delete("send");
      next.searchParams.delete("panel");
      next.searchParams.delete("source");
      window.history.replaceState({}, "", next.toString());
    }
  }, []);

  const firstName = useMemo(() => (student?.full_name || "").trim().split(/\s+/)[0] || "", [student]);
  const userInitial = (firstName || "Y").charAt(0).toUpperCase();
  const docReadiness = useMemo(() => computeDocReadiness(documents), [documents]);
  /* uploadedCount = number of essentials with at least one upload (matches the
   * /chat/documents readiness strip). optionalUploadedCount surfaces as a +N
   * badge alongside it. */
  const uploadedCount = docReadiness.essentialsDone;
  const optionalUploadedCount = docReadiness.optionalDone;
  const phoneRequired = Boolean(student && !student.phone?.trim());
  const uploadPromptSlot = useMemo(
    () => uploadPrompt ? ESSENTIAL_SLOTS.find((slot) => slot.id === uploadPrompt.slotId) || null : null,
    [uploadPrompt],
  );

  const refreshDocuments = useCallback(async (sid: string) => {
    if (!sid) return;
    const docs = await getStudentDocuments(sid);
    setDocuments(docs);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      let sid = localStorage.getItem("abroadly_student_id");
      if (!sid) {
        try {
          const current = await getCurrentStudent();
          if (!current.profile_completed) { router.replace("/onboarding/details"); return; }
          sid = current.id;
          localStorage.setItem("abroadly_student_id", current.id);
          if (!cancelled) setStudent(current);
        } catch {
          router.replace("/onboarding");
          return;
        }
      }
      try {
        const s = await getStudent(sid);
        if (!s.profile_completed) { router.replace("/onboarding/details"); return; }
        if (!cancelled) {
          setStudent(s);
          setCallConsented(s.call_consent);
        }
      } catch {
        router.replace("/onboarding");
        return;
      }
      if (cancelled) return;
      setStudentId(sid);
      engagementMemory.current = readChatEngagementMemory(sid);
      refreshDocuments(sid).catch(() => {});
      try {
        const turns = await getChatHistory(sid);
        if (cancelled) return;
        setChatHistory(turns);
        lifetimeUserTurns.current = turns.filter((turn) => turn.role === "user").length;
        const restored: Message[] = turns.map((t): Message => {
          if (t.role === "user") return { role: "user", text: t.content };
          if (t.role === "counselor") return { role: "counselor", text: t.content };
          if (t.eval_decision === "welcome_video_v1") return { role: "welcome_video", text: t.content };
          return {
            role: "ai",
            response: {
              request_id: t.id, trace_id: t.id,
              decision: (t.eval_decision as ChatResponse["decision"]) || "proceed",
              confidence: 1, answer: t.content, clarifying_question: null,
              clarification_needed: false, sources: [], reason: "history",
            },
          };
        });
        setMessages(restored);
      } catch { /* empty history is fine */ }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, [router, refreshDocuments]);

  useEffect(() => {
    if (docPanelOpen && studentId) {
      refreshDocuments(studentId).catch(() => {});
      signalStudent(studentId, { event_type: "doc_panel_open" }).catch(() => {});
    }
  }, [docPanelOpen, studentId, refreshDocuments]);

  useEffect(() => {
    if (phoneRequired) setProfileOpen(true);
  }, [phoneRequired]);

  function syncScrollState() {
    const el = messagesScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 140;
    shouldStickToBottom.current = nearBottom;
    setShowScrollToBottom(!nearBottom && el.scrollHeight > el.clientHeight + 40);
  }

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (shouldStickToBottom.current) {
      scrollMessagesToBottom("smooth");
    }
  }, [messages, thinking, scrollMessagesToBottom]);

  useEffect(() => {
    requestAnimationFrame(syncScrollState);
  }, [messages.length, thinking]);

  // Keep mobile arrival calm; opening the keyboard automatically hides useful context.
  useEffect(() => {
    if (studentId && window.matchMedia("(min-width: 768px)").matches) taRef.current?.focus();
  }, [studentId]);

  useEffect(() => {
    const root = chatLayoutRef.current;
    if (!root) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    const viewport = window.visualViewport;

    const updateViewportHeight = () => {
      if (!mobile.matches) {
        root.style.removeProperty("--chat-viewport-height");
        return;
      }
      root.style.setProperty("--chat-viewport-height", `${Math.round(viewport?.height ?? window.innerHeight)}px`);
    };

    updateViewportHeight();
    mobile.addEventListener("change", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    viewport?.addEventListener("resize", updateViewportHeight);
    viewport?.addEventListener("scroll", updateViewportHeight);
    return () => {
      mobile.removeEventListener("change", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
      viewport?.removeEventListener("resize", updateViewportHeight);
      viewport?.removeEventListener("scroll", updateViewportHeight);
      root.style.removeProperty("--chat-viewport-height");
    };
  }, []);

  function growTextarea() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 168) + "px";
  }

  async function sendMessage(textFromPrompt?: string, messageSource?: string) {
    const text = (textFromPrompt ?? input).trim();
    if (!text || !studentId || thinking) return;
    if (phoneRequired) {
      setProfileOpen(true);
      return;
    }
    setInput("");
    requestAnimationFrame(() => {
      if (taRef.current) { taRef.current.style.height = "auto"; taRef.current.focus(); }
    });
    setMessages((m) => [...m, { role: "user", text }]);
    setChatHistory((h) => [
      ...h,
      { id: `local-user-${Date.now()}`, role: "user", content: text, eval_decision: null, created_at: new Date().toISOString() },
    ]);

    // Track session turns — only typed messages count for depth bonus + 2-turn gate.
    const isTyped = !messageSource || messageSource === "typed";
    if (isTyped) sessionTypedCount.current += 1;
    lifetimeUserTurns.current += 1;
    const totalUserTurns = lifetimeUserTurns.current;

    setThinking(true);
    try {
      const res = await chat(
        studentId,
        text,
        undefined,
        messageSource ?? "typed",
        isTyped ? sessionTypedCount.current : undefined,
      );
      setMessages((m) => [...m, { role: "ai", response: res }]);
      setChatHistory((h) => [
        ...h,
        { id: res.request_id || `local-ai-${Date.now()}`, role: "assistant", content: res.answer || "", eval_decision: res.decision, created_at: new Date().toISOString() },
      ]);

      // Deterministic engagement engine. It uses the student's question,
      // profile, document state and total history instead of hoping the LLM
      // writes an exact trigger phrase. Only one modal can be selected here.
      if (
        !docPanelOpen
        && !uploadPrompt
        && !classBookingPrompt
        && res.decision !== "out_of_scope"
      ) {
        const decision = decideChatEngagement({
          userMessage: text,
          totalUserTurns,
          uploadedDocTypes: new Set(documents.map((document) => document.doc_type)),
          student,
          memory: engagementMemory.current,
        });
        if (decision) {
          const nextMemory = recordChatEngagement(engagementMemory.current, decision, totalUserTurns);
          engagementMemory.current = nextMemory;
          writeChatEngagementMemory(studentId, nextMemory);
          if (decision.kind === "document") {
            setClassBookingPrompt(null);
            setUploadPrompt({ slotId: decision.slotId, label: decision.label });
          } else {
            setUploadPrompt(null);
            setClassBookingPrompt({ test: decision.test });
          }
        }
      }

      const enoughTurns = sessionTypedCount.current >= 2;
      const fallbackAnswer = `${res.answer ?? ""} ${res.clarifying_question ?? ""}`.toLowerCase();
      const fallbackHandoff =
        fallbackAnswer.includes("i'm not sure i can help with that one")
        || fallbackAnswer.includes("im not sure i can help with that one");

      // Slot A — counselor card. Normal lead offers wait for two typed turns,
      // but strict fallback refusals get an immediate human handoff.
      const backendOffersCard = Boolean(res.offer_counselor) && enoughTurns;
      const bypassCard = hasPriorityDoc.current && enoughTurns && !callConsented;
      const fallbackCounselorCard = res.decision === "out_of_scope" && fallbackHandoff;
      const shouldShowCounselorCard =
        !callConsented
        && (
          fallbackCounselorCard
          || (!counselorOffered.current && (backendOffersCard || bypassCard))
        );

      if (shouldShowCounselorCard) {
        counselorOffered.current = true;
        const tier: CounselorCardMessage["tier"] = bypassCard
          ? "bypass"
          : fallbackCounselorCard
            ? "strong"
            : (res.offer_counselor_tier as CounselorCardMessage["tier"]) ?? null;
        const cardReason: CounselorCardMessage["reason"] = bypassCard
          ? "bypass"
          : fallbackCounselorCard
            ? "qualified"
          : res.offer_reason === "question" ? "question"
          : res.offer_reason === "qualified" ? "qualified"
          : "sequence";
        setMessages((m) =>
          m.length && m[m.length - 1].role === "counselor_card"
            ? m
            : [...m, { role: "counselor_card", reason: cardReason, tier, handoff_target: res.handoff_target }]
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error contacting server.";
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          response: {
            request_id: "", trace_id: "", decision: "out_of_scope", confidence: 0,
            answer: `Something went wrong reaching the server. Please try again in a moment.\n\n(${msg})`,
            clarifying_question: null, clarification_needed: false, sources: [], reason: "error",
          },
        },
      ]);
    } finally {
      setThinking(false);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  }

  // Keep the ref in sync — see the ?send= URL-deep-link handler above
  sendMessageRef.current = sendMessage;

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const handleDocUploadDone = useCallback((docType: DocType, filename: string, document: StudentDocument | null) => {
    if (document) {
      setDocuments((docs) => [document, ...docs.filter((doc) => doc.doc_id !== document.doc_id)]);
    } else if (studentId) {
      refreshDocuments(studentId).catch(() => {});
    }
    // Award lead points for the upload via the signal endpoint.
    if (studentId) {
      signalStudent(studentId, { event_type: "doc_upload", doc_type: docType.id }).catch(() => {});
    }
    // Mark priority doc so SOP/financial bypass can fire on next turn.
    if (docType.id === "sop" || docType.id === "financial") {
      hasPriorityDoc.current = true;
    }
    setMessages((m) => [...m, { role: "upload", status: "done" as const, filename, text: `Uploaded ${docType.label}: ${filename}`, docType: docType.id }]);
  }, [refreshDocuments, studentId]);

  // Sidebar quick-upload: clicking a doc checkbox opens the picker, then uploads
  // straight to that doc_type (same path as the doc panel, minus the detail view).
  const uploadSidebarDoc = useCallback(async (slotId: string, slotLabel: string, file: File) => {
    if (!studentId) return;
    setUploadingSlot(slotId);
    setMessages((m) => [...m, { role: "upload", status: "uploading", filename: file.name, text: `Uploading ${slotLabel}: ${file.name}`, docType: slotId }]);
    let fileToUpload = file;
    try {
      if (isImageFile(file)) fileToUpload = await compressImage(file);
      const res = await uploadFile(studentId, fileToUpload, slotId, file.name);
      const document = res.document;
      if (document) {
        setDocuments((docs) => [document, ...docs.filter((d) => d.doc_id !== document.doc_id)]);
      } else {
        refreshDocuments(studentId).catch(() => {});
      }
      signalStudent(studentId, { event_type: "doc_upload", doc_type: slotId }).catch(() => {});
      if (slotId === "sop" || slotId === "financial") hasPriorityDoc.current = true;
      setMessages((m) => m.map((msg, i) => (i === m.length - 1 && msg.role === "upload" ? { ...msg, status: "done" as const, text: `Uploaded ${slotLabel}: ${file.name}` } : msg)));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Upload failed.";
      setMessages((m) => m.map((msg, i) => (i === m.length - 1 && msg.role === "upload" ? { ...msg, status: "error" as const, text: `Upload failed: ${errMsg}` } : msg)));
    } finally {
      setUploadingSlot(null);
    }
  }, [studentId, refreshDocuments]);

  async function grantCounselorCall() {
    if (phoneRequired) {
      setProfileOpen(true);
      return;
    }
    setCallConsented(true); // optimistic
    try {
      const updated = await requestCounselorCall(studentId, student?.phone || undefined);
      setStudent(updated);
      setCallConsented(updated.call_consent);
    } catch (err: unknown) {
      setCallConsented(false);
      const message = err instanceof Error ? err.message : "We could not save the callback request.";
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          response: {
            request_id: `callback-error-${Date.now()}`,
            trace_id: "",
            decision: "out_of_scope",
            confidence: 0,
            answer: `I couldn't save the callback request. Please try once more.\n\n(${message})`,
            clarifying_question: null,
            clarification_needed: false,
            sources: [],
            reason: "request_failed",
          },
        },
      ]);
    }
  }

  const hasMessages = messages.length > 0;

  // Sidebar to-do: top 3 pending items for the student's primary target country.
  // Same priority engine as the dashboard hero, so the two surfaces never disagree.
  const sidebarTodos: PendingTodo[] = useMemo(() => {
    if (!student) return [];
    const docTypes = new Set(documents.map((d) => d.doc_type));
    const country = resolveTargetCountries(student.target_countries)[0];
    const countryName = COUNTRY_PROFILES[country].name;
    return pickPendingTodos(
      student.profile_completed,
      docTypes,
      countryName,
      student.preferred_field ?? "your field",
      3,
    );
  }, [student, documents]);

  // Suggestion rail: use generated actions when present, then evolve around
  // the current topic and profile instead of falling back to the same six chips.
  const railSuggestions = useMemo(() => {
    const allUserQuestions = new Set(messages.filter(m => m.role === "user").map(m => m.text.trim().toLowerCase()));
    let latestAnswer = "";
    let latestQuestion = "";
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "ai") {
        latestAnswer = m.response.answer ?? m.response.clarifying_question ?? "";
        const acts = parseAnswer(m.response.answer ?? m.response.clarifying_question ?? "")
          .actions.filter((a) => !a.isUpload)
          .map((a) => a.text);
        if (acts.length) {
          const freshActs = Array.from(new Set(acts))
            .filter((item) => !allUserQuestions.has(item.trim().toLowerCase()));
          if (freshActs.length) return freshActs.slice(0, 4);
        }
      }
      if (m.role === "user" && !latestQuestion) latestQuestion = m.text;
      if (latestAnswer && latestQuestion) break;
    }
    const unusedStarters = starterSuggestions.filter(item => !allUserQuestions.has(item.toLowerCase()));
    if (!latestAnswer) return unusedStarters.slice(0, 4);

    const topic = `${latestQuestion} ${latestAnswer}`.toLowerCase();
    const country = student?.target_countries?.[0] || (topic.includes("australia") ? "Australia" : topic.includes("canada") ? "Canada" : "the UK");
    const field = student?.preferred_field || "my field";
    const contextual = /university|universities|college|course/.test(topic)
      ? [`Which 3 ${country} universities best fit my grades?`, "Compare their fees, scholarships and entry requirements", `Which ${field} course gives me the strongest career path?`]
      : /cost|budget|tuition|fund|scholarship|bank/.test(topic)
        ? [`Build a realistic first-year budget for ${country}`, "Which scholarships can I verify and apply for?", "What financial documents should my sponsor prepare?"]
        : /ielts|pte|toefl|english/.test(topic)
          ? [`What score do I need for ${field} in ${country}?`, "Make me a four-week test preparation plan", "Which universities accept my current English score?"]
          : /visa|coe|cas|permit|genuine student/.test(topic)
            ? [`Give me the visa steps for ${country} in order`, "What could delay or weaken my application?", "Which visa documents should I prepare first?"]
            : /document|passport|transcript|sop|recommendation/.test(topic)
              ? ["Which of my eight essential documents are still missing?", "What should I check before submitting these documents?", "Use my uploaded documents to flag the next risk"]
              : [`What should I do next for ${country}?`, `Which universities fit ${field} and my profile?`, "What is the biggest gap in my current plan?"];

    let filtered = contextual.filter((item) => !allUserQuestions.has(item.toLowerCase()));
    if (filtered.length < 4) {
      filtered = [...filtered, ...unusedStarters];
    }
    return Array.from(new Set(filtered)).slice(0, 4);
  }, [messages, student]);

  return (
    <main ref={chatLayoutRef} className="chat-layout chat-page-shell">
      {/* ── Sidebar ───────────────────────────────────────────────────
          A compact right-side work rail for documents and to-do. The left rail
          owns brand, quick tabs, and human-help CTA.
          Hidden below lg; on mobile, the chat-header buttons (Dashboard,
          Docs) cover the same affordances. */}
      <aside className="chat-sidebar">
        {/* Documents (compact 7-row status — each row is a quick-upload checkbox) */}
        <section className="border-b border-[#E8E5DD] px-5 py-6">
          <div className="flex items-baseline justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Documents</p>
            <p className="text-[10.5px] font-semibold text-[#6B655C]">
              {uploadedCount}<span className="text-[#A8A29A]"> / </span>{SIDEBAR_DOC_SLOTS.length} essentials
              {optionalUploadedCount > 0 && (
                <span className="ml-1.5 rounded-full bg-[#E8F2EC] px-1.5 py-px text-[9.5px] font-bold text-[#0A6E45]">+{optionalUploadedCount}</span>
              )}
            </p>
          </div>
          <ul className="mt-3 flex flex-col gap-0.5">
            {SIDEBAR_DOC_SLOTS.map((slot) => {
              const uploaded = documents.some((d) => d.doc_type === slot.id);
              const isUploadingSlot = uploadingSlot === slot.id;
              const accept = DOC_ACCEPT_BY_ID[slot.id] || ".pdf,.jpg,.jpeg,.png";
              return (
                <li key={slot.id}>
                  <button
                    type="button"
                    disabled={isUploadingSlot}
                    onClick={() => {
                      if (uploaded) { router.push("/chat/documents"); return; }
                      sidebarFileRefs.current[slot.id]?.click();
                    }}
                    title={uploaded ? `${slot.label} — view or replace` : `Upload ${slot.label}`}
                    className="ab-focus group flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition hover:bg-white disabled:cursor-default"
                  >
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] text-white transition ${
                        uploaded ? "bg-[#0A6E45]" : "border border-[#D1CABD] bg-white group-hover:border-[#0A6E45]"
                      }`}
                    >
                      {isUploadingSlot ? (
                        <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin text-[#0A6E45]" fill="none">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      ) : uploaded ? (
                        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none">
                          <path d="M2.5 5.5 4 7l3.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span className={`flex-1 truncate text-[11.5px] ${uploaded ? "text-[#1B1916]" : "text-[#6B655C] group-hover:text-[#1B1916]"}`}>
                      {slot.label}
                    </span>
                    {!uploaded && !isUploadingSlot && (
                      <span className="shrink-0 text-[10px] font-semibold text-[#0A6E45] opacity-0 transition group-hover:opacity-100">Upload</span>
                    )}
                  </button>
                  <input
                    ref={(el) => { sidebarFileRefs.current[slot.id] = el; }}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSidebarDoc(slot.id, slot.label, f); e.target.value = ""; }}
                  />
                </li>
              );
            })}
          </ul>
          <Link
            href="/chat/documents"
            className="ab-focus mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#E8E5DD] bg-white py-2 text-[12px] font-semibold text-[#1B1916] transition hover:border-[#0A6E45] hover:text-[#0A6E45]"
          >
            <FolderIcon />
            Open document manager
          </Link>
        </section>

        {/* To-do (top 3 pending) */}
        <section className="px-5 py-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">To-do</p>
          {sidebarTodos.length === 0 ? (
            <p className="mt-3 text-[11.5px] leading-[1.55] text-[#6B655C]">
              You&apos;re caught up. Keep refining your shortlist in chat.
            </p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2.5">
              {sidebarTodos.map((todo, i) => (
                <li key={todo.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (todo.query) {
                        sendMessage(todo.query, "todo");
                      } else if (todo.href) router.push(todo.href);
                    }}
                    className="ab-focus group flex w-full items-start gap-2 rounded-md px-1 py-1 text-left transition hover:bg-white"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FAF9F6] text-[9px] font-bold text-[#0A6E45] ring-1 ring-[#E8E5DD]"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold leading-tight text-[#1B1916]">
                        {todo.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] leading-tight text-[#8A847B]">
                        {todo.detail}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <Link
            href="/dashboard"
            className="ab-focus mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F3D78] transition hover:text-[#0A6E45]"
          >
            Open dashboard <ArrowRightSm />
          </Link>
        </section>

        <div className="mt-auto border-t border-[#E8E5DD] px-5 py-3">
          <button
            type="button"
            onClick={() => { logoutStudent().finally(() => { localStorage.removeItem("abroadly_student_id"); router.push("/onboarding"); }); }}
            className="ab-focus inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8A847B] transition hover:text-[#1B1916]"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="M6 14H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 2h2M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Chat area ─────────────────────────────────────────────── */}
      <section className="chat-main chat-conversation-main">
        {/* Header */}
        <header className="chat-header">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-[10px] overflow-hidden lg:hidden">
              <img src="/images/abroadly-logo.png" alt="Ab" className="h-full w-full bg-white object-contain p-0.5" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-[var(--ab-ink)]">Study Abroad Chat</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7DDBB1] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0A6E45]" />
                </span>
                <span className="text-[11px] font-medium text-[#8A847B]">AI advisor online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="ab-focus chat-header-btn hidden items-center gap-1.5 md:flex lg:hidden"
              title="Open profile"
            >
              <ProfileTabIcon />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <Link
              href="/dashboard"
              className="ab-focus chat-header-btn hidden items-center gap-1.5 md:flex xl:hidden"
              title="Open your full dashboard — to-do, recommended universities, timeline"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                <rect x="3" y="3" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="11" y="3" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="3" y="13" width="6" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                <rect x="11" y="10" width="6" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link href="/chat/documents" className="ab-focus chat-header-btn hidden items-center gap-1.5 md:flex lg:hidden">
              <FolderIcon />
              <span className="hidden sm:inline">Docs</span>
              {uploadedCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E8F2EC] px-1 text-[9px] font-bold text-[#0A6E45]">{uploadedCount}</span>}
            </Link>
          </div>
        </header>

        {/* Messages */}
        <div ref={messagesScrollRef} className="chat-messages" onScroll={syncScrollState}>
          <div className="mx-auto max-w-3xl">
            {/* Empty state — personalized launcher */}
            {!hasMessages && (
              <div className="chat-welcome">
                <div className="h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-[var(--shadow-md)]">
                  <img src="/images/abroadly-logo.png" alt="Abroadly" className="h-full w-full bg-white object-contain p-1" />
                </div>
                <h2 className="mt-5 text-[26px] font-extrabold tracking-[-0.02em] text-[var(--ab-ink)]">
                  {firstName ? `Namaste, ${firstName}` : "Namaste"}
                </h2>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[#6B655C]">
                  I&apos;m your free study-abroad guide. Pick a topic to begin, or just type your question below — no question is too small.
                </p>

                <div className="chat-launcher">
                  {categories.map((c) => {
                    const CategoryIcon = c.icon;
                    return (
                      <button key={c.label} type="button" onClick={() => sendMessage(c.question, "category")} className="ab-focus chat-launcher-card group">
                        <span className="chat-launcher-icon"><CategoryIcon aria-hidden className="h-[18px] w-[18px]" /></span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-bold text-[var(--ab-ink)]">{c.label}</span>
                          <span className="block truncate text-[12px] text-[#8A847B]">{c.hint}</span>
                        </span>
                        <span className="chat-launcher-arrow"><ArrowUpIcon /></span>
                      </button>
                    );
                  })}
                </div>

                <Link href="/chat/documents" className="ab-focus chat-upload-nudge is-highlighted">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F2EC] text-[#0A6E45]"><FolderIcon /></span>
                  <span className="text-left">
                    <span className="block text-[13px] font-semibold text-[var(--ab-ink)]">Upload your documents</span>
                    <span className="block text-[11px] text-[#8A847B]">Marksheet, passport, IELTS — for answers tailored to you</span>
                  </span>
                </Link>
              </div>
            )}

            {/* Conversation */}
            <div className="space-y-2">
              {messages.map((msg, i) => {
                if (msg.role === "welcome_video") {
                  return (
                    <div key={i} className="chat-row chat-row-ai" style={{ animationDelay: "0.04s" }}>
                      <AiAvatar />
                      <WelcomeVideoCard text={msg.text} />
                    </div>
                  );
                }
                if (msg.role === "user") {
                  return (
                    <div key={i} className="chat-row chat-row-user" style={{ animationDelay: "0.04s" }}>
                      <div className="chat-bubble-user">
                        <p className="whitespace-pre-wrap text-[14px] leading-[1.65]">{msg.text}</p>
                      </div>
                      <UserAvatar initial={userInitial} photoUrl={student?.profile_photo_url} name={student?.full_name || undefined} />
                    </div>
                  );
                }
                if (msg.role === "counselor") {
                  return (
                    <div key={i} className="chat-row chat-row-ai" style={{ animationDelay: "0.04s" }}>
                      <img
                        src={COUNSELOR.photo}
                        alt={COUNSELOR.name}
                        className="h-8 w-8 shrink-0 rounded-[10px] object-cover ring-1 ring-emerald-500/20"
                      />
                      <div className="chat-bubble-ai" style={{ borderColor: "rgba(16,185,129,0.2)", background: "#F2FBF6" }}>
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Human Counselor</p>
                        <p className="chat-bubble-text whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                }
                if (msg.role === "counselor_card") {
                  return (
                    <div key={i} className="chat-row chat-row-ai" style={{ animationDelay: "0.04s" }}>
                      <AiAvatar />
                      <CounselorCard consented={callConsented} onGrant={grantCounselorCall} reason={msg.reason ?? (msg.auto ? "sequence" : undefined)} tier={msg.tier} handoff_target={msg.handoff_target} />
                    </div>
                  );
                }
                if (msg.role === "upload") {
                  const colorClass = msg.status === "done" ? "chat-upload-done" : msg.status === "error" ? "chat-upload-error" : "chat-upload-pending";
                  return (
                    <div key={i} className="chat-row chat-row-ai" style={{ animationDelay: "0.04s" }}>
                      <AiAvatar />
                      <div className={`chat-upload-pill ${colorClass}`}>
                        {msg.status === "done" ? <CheckCircleIcon /> : <PaperclipIcon />}
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="chat-row chat-row-ai" style={{ animationDelay: "0.04s" }}>
                    <AiAvatar />
                    <AiResponseBubble response={msg.response} />
                  </div>
                );
              })}

              {thinking && (
                <div className="chat-row chat-row-ai" style={{ animationDelay: "0.04s" }}>
                  <AiAvatar />
                  <div className="chat-bubble-ai inline-flex items-center gap-2">
                    <TypingDots />
                    <span className="text-[12px] text-[#8A847B]">Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4" />
          </div>
        </div>

        {/* Composer */}
        <footer className="chat-footer">
          <div className="mx-auto max-w-3xl">
            {/* Suggestion rail — always one tap from the next question */}
            {!thinking && (
              <div className="chat-suggestion-rail">
                {railSuggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => sendMessage(s, "suggestion")} className="ab-focus chat-suggestion-chip">
                    <ArrowUpIcon />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="chat-input-wrap">
              <textarea
                ref={taRef}
                className="chat-input"
                placeholder={firstName ? `Ask anything, ${firstName} — eligibility, costs, visa, scholarships…` : "Ask anything — eligibility, costs, visa, scholarships…"}
                value={input}
                onChange={(e) => { setInput(e.target.value); growTextarea(); }}
                onKeyDown={onKey}
                disabled={thinking}
                rows={1}
                autoCorrect="on"
                autoCapitalize="sentences"
                inputMode="text"
              />
              <div className="flex items-center gap-1.5 px-2 pb-2">
                <button type="button" onClick={() => setAttachmentMenuOpen((open) => !open)} title="Reference an uploaded document" aria-label="Reference an uploaded document" aria-expanded={attachmentMenuOpen} className={`ab-focus chat-action-btn ${attachmentMenuOpen ? "is-active" : ""}`}>
                  <PaperclipIcon />
                </button>
                <div className="flex-1" />
                <span className="text-[10px] text-[#B5B0A6] font-medium hidden sm:block">Enter to send</span>
                <button type="button" onClick={() => sendMessage()} disabled={thinking || !input.trim()} title="Send message" aria-label="Send message" className="ab-focus chat-send-btn">
                  <SendIcon />
                </button>
              </div>
              {attachmentMenuOpen && (
                <div className="chat-attachment-menu" role="menu" aria-label="Uploaded documents">
                  <div className="chat-attachment-menu-head">
                    <span>Reference a document</span>
                    <button type="button" onClick={() => setAttachmentMenuOpen(false)} aria-label="Close document list"><CloseIcon /></button>
                  </div>
                  {documents.length ? (
                    <div className="chat-attachment-list">
                      {documents.map((doc) => {
                        const meta = docTypes.find((item) => item.id === doc.doc_type);
                        const label = meta?.label || "Document";
                        return (
                          <button
                            key={doc.doc_id}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setInput((current) => current.trim()
                                ? `Using my uploaded ${label.toLowerCase()} (${doc.filename}), ${current}`
                                : `Please review my uploaded ${label.toLowerCase()} (${doc.filename}) and tell me what to improve or double-check.`);
                              setAttachmentMenuOpen(false);
                              requestAnimationFrame(() => taRef.current?.focus());
                            }}
                            className="chat-attachment-item"
                          >
                            <span className="chat-attachment-item-icon">{meta?.icon || "📄"}</span>
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-[12px] font-bold text-[#1B1916]">{label}</span>
                              <span className="mt-0.5 block truncate text-[10.5px] text-[#8A847B]">{doc.filename}</span>
                            </span>
                            <ArrowRightSm />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="chat-attachment-empty">
                      <p>No documents uploaded yet.</p>
                      <Link href="/chat/documents" className="ab-focus">Upload a document</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-[#B5B0A6]">Abroadly can make mistakes. Verify important details with official sources.</p>
          </div>
        </footer>
        {showScrollToBottom && (
          <button
            type="button"
            onClick={() => scrollMessagesToBottom("smooth")}
            aria-label="Scroll to newest message"
            className="ab-focus chat-scroll-newest"
          >
            <ArrowUpIcon />
          </button>
        )}
      </section>

      {/* The dashboard is now a full standalone page at /dashboard — the chat-header
          link navigates there. The in-chat rail/drawer experiment was removed once the
          dashboard grew rich enough (universities, courses, timeline, costs) that 360px
          could no longer hold it comfortably. dashboard-panel.tsx is retained in the
          repo as a reference but is no longer rendered. */}
      <StudentQuickTabs
        active="chat"
        firstName={firstName}
        uploadedCount={uploadedCount}
        documentTotal={docReadiness.essentialsTotal}
        phoneRequired={phoneRequired}
        callConsented={callConsented}
        onCounselorCall={grantCounselorCall}
        onClassClaim={() => setClassBookingPrompt({ test: student?.planned_english_test || student?.english_test_type || "IELTS" })}
      />

      <DocumentPanel
        open={docPanelOpen}
        onClose={() => setDocPanelOpen(false)}
        studentId={studentId}
        documents={documents}
        onUploadDone={handleDocUploadDone}
        onDiscuss={(dt) => {
          setDocPanelOpen(false);
          sendMessage(`I just uploaded my ${dt.label}. Please review it — what stands out, and what should I improve or double-check?`);
        }}
      />

      {uploadPrompt && uploadPromptSlot && (
        <UploadPromptModal
          label={uploadPrompt.label}
          accept={uploadPromptSlot.accept}
          onFile={(file) => {
            setUploadPrompt(null);
            uploadSidebarDoc(uploadPromptSlot.id, uploadPromptSlot.label, file);
          }}
          onBrowse={() => { setUploadPrompt(null); setDocPanelOpen(true); }}
          onClose={() => setUploadPrompt(null)}
        />
      )}

      {classBookingPrompt && student && (
        <ServiceRequestModal
          student={student}
          requestType="class_booking"
          preferredTest={classBookingPrompt.test}
          onConfirmed={(updated) => {
            setStudent(updated);
            const nextMemory = recordClassBooked(engagementMemory.current);
            engagementMemory.current = nextMemory;
            writeChatEngagementMemory(studentId, nextMemory);
          }}
          onClose={() => setClassBookingPrompt(null)}
        />
      )}

      {profileOpen && student && (
        <ProfilePopup
          student={student}
          requirePhone={phoneRequired}
          uploadedCount={uploadedCount}
          documentTotal={docReadiness.essentialsTotal}
          optionalUploadedCount={optionalUploadedCount}
          onClose={() => setProfileOpen(false)}
          onSaved={(updated) => {
            setStudent(updated);
            setCallConsented(updated.call_consent);
            setProfileOpen(false);
          }}
        />
      )}
      <EnglishClassPopupCompact
        variant="floating"
        onClaim={() => setClassBookingPrompt({ test: student?.planned_english_test || student?.english_test_type || "IELTS" })}
        onOpenDocuments={() => router.push("/chat/documents")}
      />
    </main>
  );
}
