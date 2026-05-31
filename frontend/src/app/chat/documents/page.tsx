"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getStudentDocuments,
  getStudentDocumentDownloadUrl,
  uploadFile,
  type StudentDocument,
} from "@/lib/api";

/* ── Type model ─────────────────────────────────────────────────────── */

type Slot = {
  id: string;
  label: string;
  desc: string;
  accept: string;
  sampleSlug?: string;
  samplePages?: number;
  requirements: string[];
  tip: string;
};

const ESSENTIAL_SLOTS: Slot[] = [
  {
    id: "grade_sheet",
    label: "Grade sheet / Transcript",
    desc: "Your most recent academic record (NEB, A-Level, Bachelors).",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Most recent official transcript or grade sheet.",
      "All subjects with marks/grades visible.",
      "School/college stamp and signature if printed.",
    ],
    tip: "If it's a +2 mark sheet, both year-one and year-two pages help us check your GPA accurately.",
  },
  {
    id: "citizenship",
    label: "Citizenship",
    desc: "Front + back of your Nepali citizenship card.",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Both sides of the citizenship card.",
      "Clear, no glare, all four corners visible.",
      "Issue date and citizenship number legible.",
    ],
    tip: "Phone photos work fine — daylight, flat surface, no flash.",
  },
  {
    id: "passport",
    label: "Passport",
    desc: "Bio-data page (the one with your photo).",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Bio-data page with photo and personal details.",
      "Expiry date at least 12 months in the future.",
      "If renewing soon, mention it in chat so we plan ahead.",
    ],
    tip: "If you don't have one yet, that's okay — we'll guide you through the application later.",
  },
  {
    id: "sop",
    label: "Statement of Purpose (SOP)",
    desc: "Your draft personal statement. We'll review structure & tone.",
    accept: ".pdf,.doc,.docx,.txt",
    sampleSlug: "sop",
    samplePages: 3,
    requirements: [
      "1–2 pages, focused on why this course in this country.",
      "Specific examples, not generic ambition.",
      "Honest about gaps — they're easier to address than to hide.",
    ],
    tip: "First draft is fine. The AI will suggest edits, not rewrite it for you.",
  },
  {
    id: "recommendation",
    label: "Recommendation letter",
    desc: "From a teacher, professor, or supervisor who knows your work.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "recommendation",
    samplePages: 1,
    requirements: [
      "On official letterhead with signature.",
      "From someone who taught/supervised you directly.",
      "Specific anecdotes beat vague praise.",
    ],
    tip: "Two LORs is typical — academic + work, or two academic.",
  },
  {
    id: "financial",
    label: "Financial documents",
    desc: "Bank balance, income proofs, sponsor docs.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "bank-balance",
    samplePages: 1,
    requirements: [
      "Bank balance certificate from your sponsor's bank.",
      "Income proof of the sponsor (salary, business, rental, pension — whichever applies).",
      "Cover at least the first year's tuition + living costs.",
    ],
    tip: "More income-proof types are in the Additional section below — upload whichever match your case.",
  },
  {
    id: "ielts",
    label: "IELTS / PTE / TOEFL",
    desc: "Your English-test result. Upload as soon as you have it.",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Official score report (TRF for IELTS, score report for others).",
      "All four module scores visible.",
      "Test date within the last 2 years.",
    ],
    tip: "No score yet? Tell the AI when you plan to test — it'll plan your timeline around it.",
  },
  {
    id: "other",
    label: "Other / Cover letter",
    desc: "Anything else — visa cover letter, custom docs.",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    sampleSlug: "visa-cover",
    samplePages: 1,
    requirements: [
      "Visa cover letter, itinerary, or anything case-specific.",
      "If unsure where it belongs, drop it here and we'll re-categorise.",
    ],
    tip: "When in doubt, upload here — better to have it on file than miss a step.",
  },
];

type OptionalSlot = Slot & { group: string };

const OPTIONAL_SLOTS: OptionalSlot[] = [
  // Income proofs
  { group: "Income proofs", id: "income_rental", label: "Rental income certificate",
    desc: "If your sponsor has rental income.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-rental", samplePages: 1,
    requirements: ["Ward-issued certificate stating annual rental income.", "Matching rental agreement helps."],
    tip: "Common when the sponsor owns shutters or a flat that's rented out." },
  { group: "Income proofs", id: "income_agriculture", label: "Agriculture income certificate",
    desc: "Ward verification of farming income.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-agriculture", samplePages: 1,
    requirements: ["Ward-issued certificate stating annual agriculture income.", "Land ownership doc strengthens it."],
    tip: "Important for rural sponsors — visa officers expect this if the sponsor lists farming." },
  { group: "Income proofs", id: "income_business", label: "Business income statement",
    desc: "PAN, business registration + income.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-business", samplePages: 2,
    requirements: ["Business PAN/VAT certificate.", "Annual income statement, ideally CA-attested.", "Business registration."],
    tip: "If sponsor is self-employed, this is the strongest income proof you can give." },
  { group: "Income proofs", id: "income_pension", label: "Pension income certificate",
    desc: "For retired-government-employee sponsors.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-pension", samplePages: 1,
    requirements: ["Pension book or government pension slip.", "Last 6–12 months of pension credits."],
    tip: "Often combined with rental or other income to hit the funding threshold." },
  { group: "Income proofs", id: "income_abroad", label: "Abroad income (remittance)",
    desc: "If sponsor works overseas.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-abroad", samplePages: 2,
    requirements: ["Employment contract from the foreign employer.", "Last 6 months of salary slips.", "Remittance receipts into Nepali bank."],
    tip: "Pair with the sponsor's foreign work visa/permit copy." },
  { group: "Income proofs", id: "income_salary", label: "Salary income statement",
    desc: "Monthly salary from Nepali employer.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-salary", samplePages: 1,
    requirements: ["Employer letter on letterhead with monthly salary.", "Last 3 months of salary slips."],
    tip: "Add the sponsor's tax-clearance certificate if available — it strengthens the case." },
  { group: "Income proofs", id: "income_lease", label: "Lease income certificate",
    desc: "Income from long-term lease arrangements.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-lease", samplePages: 1,
    requirements: ["Ward-issued lease income certificate.", "Underlying lease agreement."],
    tip: "Less common than rental, but valid for agricultural/commercial land." },
  { group: "Income proofs", id: "educational_loan", label: "Educational loan letter",
    desc: "Bank approval-in-principle for a study loan.",
    accept: ".pdf",
    sampleSlug: "educational-loan", samplePages: 2,
    requirements: ["Bank letter approving the loan amount.", "Repayment terms and collateral noted."],
    tip: "Strong supplement when sponsor income alone doesn't cover total cost." },

  // Affidavits
  { group: "Affidavits of support", id: "affidavit_general", label: "Applicant's affidavit of support",
    desc: "Sponsor's commitment to fund your studies.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "affidavit-support", samplePages: 2,
    requirements: ["Notarised statement of financial support.", "Sponsor's identity proof attached."],
    tip: "Usually paired with the bank balance and income certificates." },
  { group: "Affidavits of support", id: "affidavit_children", label: "Support affidavit (children)",
    desc: "Parent → child support affidavit.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "affidavit-children", samplePages: 1,
    requirements: ["Parent's notarised statement of support."],
    tip: "Common when one parent is the primary sponsor." },
  { group: "Affidavits of support", id: "affidavit_husband", label: "Support affidavit (spouse)",
    desc: "Spouse-funded applicants.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "affidavit-husband", samplePages: 1,
    requirements: ["Spouse's notarised statement of support.", "Marriage certificate must also be on file."],
    tip: "Pair this with the marriage certificate in the next group." },

  // Relationship
  { group: "Relationship & marriage", id: "marriage_cert", label: "Marriage certificate",
    desc: "If you're married or claiming spouse support.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "marriage-cert", samplePages: 1,
    requirements: ["Official marriage certificate.", "English translation if the original is in Nepali."],
    tip: "Required for dependent visas and spouse-sponsored applications." },
  { group: "Relationship & marriage", id: "relationship_cert", label: "Relationship certificate",
    desc: "Proves your relationship to your sponsor.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "relationship-cert", samplePages: 1,
    requirements: ["Ward-issued certificate stating the relationship.", "Both names and relationship type clearly stated."],
    tip: "Essential when sponsor is anyone other than your direct parent." },
  { group: "Relationship & marriage", id: "defacto", label: "De-facto relationship doc",
    desc: "Unmarried partner / long-term relationship cases.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "defacto", samplePages: 2,
    requirements: ["Statutory declaration from both partners.", "Shared evidence (lease, bills, photos)."],
    tip: "Mostly relevant for Australia and similar destinations that recognise de-facto." },

  // Visa extras
  { group: "Visa application extras", id: "itinerary", label: "Travel itinerary",
    desc: "Indicative flight/travel plan.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "itinerary", samplePages: 1,
    requirements: ["Indicative dates of travel.", "Intended port of entry."],
    tip: "Don't book tickets until the visa is granted." },
  { group: "Visa application extras", id: "stat_dec", label: "Statutory declaration",
    desc: "Genuine-temporary-entrant declaration where required.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "stat-dec", samplePages: 1,
    requirements: ["Notarised declaration as per destination country format."],
    tip: "Australia specifically asks for this for some visa subclasses." },
  { group: "Visa application extras", id: "moi", label: "Means of identification (MOI)",
    desc: "Self-identification declaration.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "moi", samplePages: 1,
    requirements: ["Notarised declaration linking variant spellings of your name."],
    tip: "Important if your name appears differently across documents (e.g. transcript vs passport)." },

  // Australia-specific
  { group: "Australia-specific", id: "ward_au", label: "Ward documents (Australia)",
    desc: "Bundle ward-issued docs Australia expects.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "ward-au", samplePages: 2,
    requirements: ["Ward income, relationship, and identity certificates."],
    tip: "Australia DHA expects ward-issued docs even when you have other proofs — include them anyway." },

  // Professional
  { group: "Professional", id: "cv", label: "CV / Résumé",
    desc: "Your study and work history.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "cv", samplePages: 1,
    requirements: ["Reverse-chronological work + education history.", "1–2 pages, no photos."],
    tip: "Even if not asked for, several countries expect it for skilled or postgrad applications." },
  { group: "Professional", id: "experience_letter", label: "Work experience letter",
    desc: "For applicants with work history.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "experience-letter", samplePages: 1,
    requirements: ["On official letterhead with HR signature.", "Role, dates, and responsibilities specified."],
    tip: "Important for MBA and postgrad applications — and visa applications that ask about work history." },
];

/* ── Small icon set ──────────────────────────────────────────────────── */

const Icon = {
  check: () => (<svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none"><path d="M5 10.5l3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  upload: () => (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  arrowRight: () => (<svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  close: () => (<svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  doc: () => (<svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none"><path d="M3.5 1.5h6L13 5v9.5H3.5z M9 1.5V5h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>),
  chat: () => (<svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none"><path d="M3 3.5h10v7H7l-3 3v-3H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>),
  dashboard: () => (<svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none"><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>),
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Lightweight sidebar (logo + nav + logout) ───────────────────────── */

function DocsSidebar({ active }: { active: "chat" | "documents" | "dashboard" }) {
  const router = useRouter();
  return (
    <aside className="chat-sidebar">
      <div className="border-b border-[#E8E5DD] bg-[#FAF9F6] px-5 py-4">
        <Link href="/" className="ab-focus flex items-center gap-2.5 rounded-md">
          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-[8px]">
            <img src="/images/abroadly-logo.png" alt="Ab" className="h-full w-full object-cover" />
          </div>
          <span className="text-[13px] font-bold tracking-[-0.005em] text-[#1B1916]">Abroadly</span>
        </Link>
      </div>

      <nav className="px-3 py-4">
        <p className="px-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Workspace</p>
        <ul className="mt-3 flex flex-col gap-0.5">
          {[
            { id: "chat", label: "Chat", href: "/chat", icon: Icon.chat },
            { id: "documents", label: "Documents", href: "/chat/documents", icon: Icon.doc },
            { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: Icon.dashboard },
          ].map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`ab-focus flex items-center gap-2 rounded-md px-2 py-2 text-[12.5px] font-semibold transition ${
                    isActive ? "bg-white text-[#0A6E45] shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "text-[#3F3A33] hover:bg-white"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ${isActive ? "bg-[#E8F2EC] text-[#0A6E45]" : "text-[#6B655C]"}`}>
                    <item.icon />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-[#E8E5DD] px-5 py-3">
        <button
          type="button"
          onClick={() => { try { localStorage.removeItem("abroadly_student_id"); } catch {} router.push("/onboarding"); }}
          className="ab-focus inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8A847B] transition hover:text-[#1B1916]"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="M6 14H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 2h2M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Log out
        </button>
      </div>
    </aside>
  );
}

/* ── Sample preview side-sheet ───────────────────────────────────────── */

function SampleSheet({
  slot,
  onClose,
  onUpload,
}: {
  slot: Slot;
  onClose: () => void;
  onUpload: () => void;
}) {
  const pages = slot.samplePages ?? 0;
  const [idx, setIdx] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(pages, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(1, i - 1));
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, pages]);

  if (!slot.sampleSlug || !pages) return null;
  const src = `/samples/${slot.sampleSlug}/page-${String(idx).padStart(2, "0")}.webp`;

  return (
    <>
      <div className="docs-sheet-overlay" onClick={onClose} />
      <aside className="docs-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <header className="docs-sheet-header">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Sample</p>
            <h2 id="sheet-title" className="mt-1 truncate text-[15px] font-bold text-[#1B1916]">{slot.label}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ab-focus flex h-8 w-8 items-center justify-center rounded-lg text-[#8A847B] hover:bg-[#F0EDE4] hover:text-[#1B1916] transition-colors">
            <Icon.close />
          </button>
        </header>

        <div className="docs-sheet-body">
          <div className="docs-sample-frame">
            <img
              key={src}
              src={src}
              alt={`${slot.label} sample, page ${idx}`}
              className="docs-sample-img"
              loading="eager"
            />
          </div>
          {pages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <button type="button" onClick={() => setIdx((i) => Math.max(1, i - 1))} disabled={idx === 1} className="ab-focus rounded-md border border-[#E8E5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3F3A33] disabled:opacity-40 hover:border-[#0A6E45]">← Prev</button>
              <span className="text-[12px] font-semibold text-[#6B655C]">Page {idx} of {pages}</span>
              <button type="button" onClick={() => setIdx((i) => Math.min(pages, i + 1))} disabled={idx === pages} className="ab-focus rounded-md border border-[#E8E5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3F3A33] disabled:opacity-40 hover:border-[#0A6E45]">Next →</button>
            </div>
          )}

          <div className="mt-6 rounded-[14px] border border-[#E8E5DD] bg-[#FAF9F6] p-5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#0A6E45]">What counts</p>
            <ul className="mt-2 space-y-1.5">
              {slot.requirements.map((r, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-[1.55] text-[#1B1916]">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0A6E45]" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12.5px] leading-[1.55] text-[#3F3A33]">
              <span className="font-bold text-[#1B1916]">Tip · </span>{slot.tip}
            </p>
          </div>

          <p className="mt-4 text-[11px] text-[#8A847B]">
            Sample shown for guidance only. Your own document does not need to match the sample
            formatting exactly — what matters is the content and the issuer.
          </p>
        </div>

        <footer className="docs-sheet-footer">
          <button type="button" onClick={onUpload} className="ab-focus inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0A6E45] px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(10,110,69,0.18)] transition hover:bg-[#075B39]">
            <Icon.upload />
            Upload your {slot.label.toLowerCase()}
          </button>
        </footer>
      </aside>
    </>
  );
}

/* ── Single document card ───────────────────────────────────────────── */

function DocumentCard({
  slot,
  uploaded,
  uploading,
  studentId,
  onUploadComplete,
  onShowSample,
}: {
  slot: Slot;
  uploaded?: StudentDocument;
  uploading: boolean;
  studentId: string;
  onUploadComplete: () => void;
  onShowSample: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUploading, setLocalUploading] = useState(false);
  const isBusy = uploading || localUploading;

  const onFile = useCallback(async (file: File) => {
    setError(null); setLocalUploading(true);
    try {
      await uploadFile(studentId, file, slot.id, file.name);
      onUploadComplete();
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setLocalUploading(false);
    }
  }, [studentId, slot.id, onUploadComplete]);

  const openPicker = () => inputRef.current?.click();
  const thumb = uploaded?.is_image ? getStudentDocumentDownloadUrl(studentId, uploaded.doc_id) : null;

  return (
    <div
      className={`docs-card ${uploaded ? "is-done" : ""} ${dragOver ? "is-drag" : ""} ${isBusy ? "is-busy" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <button type="button" onClick={uploaded ? undefined : openPicker} className="docs-card-button" disabled={isBusy}>
        <div className="docs-card-status" aria-hidden>
          {isBusy ? (
            <span className="docs-spinner" />
          ) : uploaded ? (
            <span className="docs-tick"><Icon.check /></span>
          ) : (
            <span className="docs-empty-dot" />
          )}
        </div>

        <div className="docs-card-body">
          <p className="docs-card-label">{slot.label}</p>
          {uploaded ? (
            <p className="docs-card-meta truncate">
              {uploaded.filename} <span aria-hidden> · </span>
              <span className="uppercase">{uploaded.ext.replace(".", "")}</span> · {formatBytes(uploaded.size_bytes)}
            </p>
          ) : (
            <p className="docs-card-meta">{slot.desc}</p>
          )}
        </div>

        {thumb && (
          <img src={thumb} alt="" aria-hidden className="docs-card-thumb" />
        )}
      </button>

      <div className="docs-card-actions">
        {slot.sampleSlug && (
          <button type="button" onClick={onShowSample} className="ab-focus docs-card-link">
            View sample
          </button>
        )}
        {uploaded ? (
          <button type="button" onClick={openPicker} className="ab-focus docs-card-link">
            Replace
          </button>
        ) : (
          !isBusy && (
            <button type="button" onClick={openPicker} className="ab-focus docs-card-link is-primary">
              Upload <Icon.arrowRight />
            </button>
          )
        )}
      </div>

      {error && <p className="docs-card-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={slot.accept}
        className="hidden"
        data-slot-id={slot.id}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function DocumentsPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleSlot, setSampleSlot] = useState<Slot | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>("Income proofs");

  useEffect(() => {
    const sid = typeof window !== "undefined" ? localStorage.getItem("abroadly_student_id") : null;
    if (!sid) { router.replace("/onboarding"); return; }
    setStudentId(sid);
  }, [router]);

  const refresh = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const docs = await getStudentDocuments(studentId);
      setDocuments(docs);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { if (studentId) refresh(); }, [studentId, refresh]);

  const uploadedByType = useMemo(() => {
    const map = new Map<string, StudentDocument>();
    for (const d of documents) {
      const existing = map.get(d.doc_type);
      if (!existing || new Date(d.uploaded_at) > new Date(existing.uploaded_at)) map.set(d.doc_type, d);
    }
    return map;
  }, [documents]);

  const essentialsDone = ESSENTIAL_SLOTS.filter((s) => uploadedByType.has(s.id)).length;
  const essentialsTotal = ESSENTIAL_SLOTS.length;
  const pct = Math.round((essentialsDone / essentialsTotal) * 100);
  const nextSlot = ESSENTIAL_SLOTS.find((s) => !uploadedByType.has(s.id));
  const optionalDone = OPTIONAL_SLOTS.filter((s) => uploadedByType.has(s.id)).length;

  const optionalByGroup = useMemo(() => {
    const groups: Record<string, OptionalSlot[]> = {};
    for (const s of OPTIONAL_SLOTS) {
      if (!groups[s.group]) groups[s.group] = [];
      groups[s.group].push(s);
    }
    return groups;
  }, []);

  if (!studentId) {
    return (
      <div className="chat-layout">
        <DocsSidebar active="documents" />
        <section className="chat-main flex items-center justify-center text-[13px] text-[#6B655C]">Loading…</section>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <DocsSidebar active="documents" />

      <section className="chat-main docs-main">
        <header className="docs-page-header">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Documents</p>
            <h1 className="mt-1 text-[22px] font-bold tracking-[-0.015em] text-[#1B1916]">Your study-abroad paperwork, in one place.</h1>
            <p className="mt-1.5 text-[13px] text-[#6B655C]">
              Upload what you have. See real samples for what you don&apos;t. Track readiness at a glance.
            </p>
          </div>
          <Link href="/chat" className="ab-focus inline-flex items-center gap-1.5 rounded-md border border-[#E8E5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#3F3A33] hover:border-[#0A6E45] hover:text-[#0A6E45]">
            ← Back to chat
          </Link>
        </header>

        <div className="docs-scroll">
          <div className="docs-progress">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Readiness</p>
                <p className="mt-1 text-[18px] font-bold tracking-[-0.01em] text-[#1B1916]">
                  {essentialsDone} of {essentialsTotal} essentials ready
                </p>
                <p className="mt-0.5 text-[12px] text-[#6B655C]">
                  {nextSlot ? <>Next up: <span className="font-semibold text-[#1B1916]">{nextSlot.label}</span></> : <>All essentials uploaded — strong shape.</>}
                  {optionalDone > 0 && <span> · +{optionalDone} additional on file</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[26px] font-extrabold tracking-[-0.025em] text-[#0A6E45]">{pct}%</p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#EFECE4]">
              <div className="h-full rounded-full bg-[#0A6E45] transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <h2 className="docs-section-title">Essentials</h2>
          <p className="docs-section-sub">The 8 documents most countries ask for, in some form.</p>

          {loading ? (
            <div className="docs-grid">
              {ESSENTIAL_SLOTS.map((s) => (
                <div key={s.id} className="docs-card docs-skeleton" aria-hidden />
              ))}
            </div>
          ) : (
            <div className="docs-grid">
              {ESSENTIAL_SLOTS.map((s) => (
                <DocumentCard
                  key={s.id}
                  slot={s}
                  uploaded={uploadedByType.get(s.id)}
                  uploading={false}
                  studentId={studentId}
                  onUploadComplete={refresh}
                  onShowSample={() => setSampleSlot(s)}
                />
              ))}
            </div>
          )}

          <h2 className="docs-section-title mt-12">Additional documents</h2>
          <p className="docs-section-sub">Optional, but useful when your case calls for them. Open a group to see samples.</p>

          <div className="docs-accordion">
            {Object.entries(optionalByGroup).map(([group, slots]) => {
              const doneInGroup = slots.filter((s) => uploadedByType.has(s.id)).length;
              const isOpen = openGroup === group;
              return (
                <div key={group} className={`docs-accordion-item ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isOpen ? null : group)}
                    className="ab-focus docs-accordion-head"
                    aria-expanded={isOpen}
                  >
                    <div>
                      <p className="text-[13px] font-bold text-[#1B1916]">{group}</p>
                      <p className="text-[11px] text-[#8A847B]">
                        {slots.length} document{slots.length === 1 ? "" : "s"}{doneInGroup > 0 && ` · ${doneInGroup} uploaded`}
                      </p>
                    </div>
                    <span className={`docs-chev ${isOpen ? "is-open" : ""}`} aria-hidden>▾</span>
                  </button>
                  {isOpen && (
                    <div className="docs-accordion-body">
                      <div className="docs-grid">
                        {slots.map((s) => (
                          <DocumentCard
                            key={s.id}
                            slot={s}
                            uploaded={uploadedByType.get(s.id)}
                            uploading={false}
                            studentId={studentId}
                            onUploadComplete={refresh}
                            onShowSample={() => setSampleSlot(s)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="h-12" />
        </div>
      </section>

      {sampleSlot && (
        <SampleSheet
          slot={sampleSlot}
          onClose={() => setSampleSlot(null)}
          onUpload={() => {
            const slotId = sampleSlot.id;
            setSampleSlot(null);
            // small delay so the sheet unmounts before the file picker opens
            setTimeout(() => {
              const el = document.querySelector<HTMLInputElement>(`input[data-slot-id="${slotId}"]`);
              el?.click();
            }, 80);
          }}
        />
      )}
    </div>
  );
}
