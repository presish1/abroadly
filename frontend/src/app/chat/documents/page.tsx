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
import {
  ESSENTIAL_SLOTS,
  OPTIONAL_SLOTS,
  computeDocReadiness,
  type DocSlot as Slot,
  type OptionalDocSlot as OptionalSlot,
} from "@/lib/document-catalog";
import { StudentQuickTabs } from "@/components/student-quick-tabs";


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
            <img src="/images/abroadly-logo.png" alt="Ab" className="h-full w-full bg-white object-contain p-0.5" />
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
  highlight = false,
}: {
  slot: Slot;
  uploaded?: StudentDocument;
  uploading: boolean;
  studentId: string;
  onUploadComplete: () => void;
  onShowSample: () => void;
  highlight?: boolean;
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
  const tint = [
    "linear-gradient(135deg,#E8F0FB,#D6E6F7)",
    "linear-gradient(135deg,#E3F5EC,#CFEEDD)",
    "linear-gradient(135deg,#FBF1DF,#F6E6C8)",
    "linear-gradient(135deg,#F0EBFA,#E2D8F4)",
    "linear-gradient(135deg,#E0F3F1,#CCEAE6)",
    "linear-gradient(135deg,#FBEAEC,#F6D7DC)",
  ][slot.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 6];

  return (
    <div
      className={`docs-card ${uploaded ? "is-done" : ""} ${dragOver ? "is-drag" : ""} ${isBusy ? "is-busy" : ""} ${highlight ? "is-next" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <button type="button" onClick={uploaded ? undefined : openPicker} disabled={isBusy} className="relative mb-3 flex h-[84px] w-full items-center justify-center overflow-hidden rounded-xl" style={{ background: tint }}>
        {thumb ? (
          <img src={thumb} alt="" aria-hidden className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-[52px] w-[40px] flex-col items-center justify-center gap-[5px] rounded-md bg-white shadow-[0_3px_10px_rgba(0,0,0,0.12)]">
            <span className="text-[17px] leading-none">📄</span>
            <span className="h-[3px] w-6 rounded-full bg-[#C9C3B8]" />
            <span className="h-[3px] w-4 rounded-full bg-[#D8D3C8]" />
          </div>
        )}
        <span className={`absolute right-2 top-2 rounded-full px-1.5 py-[2px] text-[9px] font-bold ${uploaded ? "bg-[#0A6E45] text-white" : "bg-white/85 text-[#6B655C]"}`}>{uploaded ? "✓ Done" : "Needed"}</span>
      </button>
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
            <button type="button" onClick={openPicker} className="ab-focus inline-flex items-center gap-1 rounded-lg bg-[#0A6E45] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#075B39]">
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
  const [openGroup, setOpenGroup] = useState<string | null>(null);

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

  const readiness = useMemo(() => computeDocReadiness(documents), [documents]);
  const {
    index: uploadedByType,
    essentialsDone,
    essentialsTotal,
    optionalDone,
    optionalTotal,
    totalDone,
    totalSlots,
    pct,
    nextEssential: nextSlot,
  } = readiness;
  const essentialsPct = essentialsTotal === 0 ? 0 : Math.round((essentialsDone / essentialsTotal) * 100);

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
        <StudentQuickTabs active="documents" uploadedCount={0} documentTotal={ESSENTIAL_SLOTS.length} />
        <section className="chat-main flex items-center justify-center text-[13px] text-[#6B655C]">Loading…</section>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <StudentQuickTabs active="documents" uploadedCount={essentialsDone} documentTotal={essentialsTotal} />

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
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">Readiness</span>
                <span className="text-[15px] font-extrabold tracking-[-0.01em] text-[#1B1916]">{totalDone}<span className="font-bold text-[#8A847B]"> / </span>{totalSlots}</span>
                <span className="text-[12px] text-[#6B655C]">on file</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-semibold text-[#6B655C]">
                <span>Essentials <b className="text-[#1B1916]">{essentialsDone}/{essentialsTotal}</b></span>
                <span className="text-[#D8D3C8]">·</span>
                <span>Additional <b className="text-[#1B1916]">{optionalDone}/{optionalTotal}</b></span>
                <span className="text-[14px] font-extrabold text-[#0A6E45]">{pct}%</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EFECE4]">
              <div className="h-full rounded-full bg-[#0A6E45] transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            {nextSlot && (
              <div className="docs-next-prompt">
                <span><strong>Start with {nextSlot.label}</strong><small>One upload makes every answer more specific to you.</small></span>
                <button type="button" onClick={() => document.querySelector<HTMLInputElement>(`input[data-slot-id="${nextSlot.id}"]`)?.click()} className="ab-focus">Upload now <span aria-hidden>→</span></button>
              </div>
            )}
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
                  highlight={nextSlot?.id === s.id}
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
