"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  ConfigProvider,
  Grid,
  List,
  Progress,
  Segmented,
  Statistic,
  Tag,
  Timeline,
} from "antd";
import { abroadlyAntdTheme } from "@/lib/antd-theme";
import { StudentQuickTabs } from "@/components/student-quick-tabs";
import { BrandWordmark } from "@/components/brand-wordmark";
import { ESSENTIAL_SLOTS } from "@/lib/document-catalog";
import {
  classifyFit,
  gpaToPercentage,
  inferField,
  pickUniversities,
  universityLogoCandidates,
  universityVerifiedCampusImageUrl,
  type AdmissionFit,
  type University,
} from "@/lib/university-data";
import { COUNTRY_PROFILES, nextIntakeFor, type CountryCode, type CountryProfile } from "@/lib/country-data";
import type { StudentOut, StudentDocument, ChatTurn } from "@/lib/api";

const DOC_SLOTS = [
  { id: "grade_sheet", label: "Transcript", hint: "+2 / bachelor's marksheet" },
  { id: "citizenship", label: "Citizenship", hint: "Front + back of Nepali citizenship" },
  { id: "passport", label: "Passport", hint: "Valid course + 6 months" },
  { id: "ielts", label: "English test", hint: "IELTS / PTE / TOEFL" },
  { id: "sop", label: "Statement of purpose", hint: "500–1,000 words" },
  { id: "recommendation", label: "Recommendation letters", hint: "2 recent teachers" },
  { id: "financial", label: "Financial proof", hint: "Bank / sponsor / loan" },
  { id: "other", label: "Other", hint: "Character cert, CV, portfolio" },
];

const FIT_TAG: Record<AdmissionFit, { color: string; label: string }> = {
  reach: { color: "gold", label: "Reach" },
  match: { color: "green", label: "Match" },
  safety: { color: "blue", label: "Safety" },
  unknown: { color: "default", label: "—" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── small building blocks ────────────────────────────────────────────── */

function Panel({
  eyebrow,
  title,
  extra,
  children,
  className = "",
  bodyPad = 18,
}: {
  eyebrow?: string;
  title?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyPad?: number;
}) {
  return (
    <div className={`rounded-2xl border border-[#E8E5DD] bg-white shadow-[0_1px_2px_rgba(27,25,22,0.04)] ${className}`}>
      {(title || eyebrow) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-[18px] pt-4">
          <div>
            {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">{eyebrow}</p>}
            {title && <h3 className="text-[15px] font-extrabold tracking-[-0.01em] text-[#1B1916]">{title}</h3>}
          </div>
          {extra}
        </div>
      )}
      <div style={{ padding: bodyPad }}>{children}</div>
    </div>
  );
}

function UniLogo({ name, url }: { name: string; url: string }) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const university = { name, official_url: url } as University;
  const source = universityLogoCandidates(university)[candidateIndex];
  const initial = name.replace(/\(.*?\)/g, "").trim()[0]?.toUpperCase() ?? "U";
  if (!source)
    return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F2EC] text-[12px] font-extrabold text-[#6B655C]">{initial}</span>;
  return (
    <img
      src={source}
      alt=""
      width={32}
      height={32}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setCandidateIndex((current) => current + 1)}
      className="h-8 w-8 shrink-0 rounded-lg border border-[#EFECE4] bg-white object-contain p-1"
    />
  );
}

function heroFocus(student: StudentOut, docTypes: Set<string>, country: CountryProfile) {
  const intake = nextIntakeFor(country.code);
  if (!student.profile_completed)
    return { tag: "Profile", title: "Finish your study profile.", context: "Two minutes of detail (GPA, intake, field) sharpens every recommendation here.", label: "Edit profile", query: "Help me complete my study profile." };
  if (!docTypes.has("ielts"))
    return { tag: "Test", title: "Confirm your English test plan.", context: `Use the test and preferred time from your profile, or adjust them before you confirm. Abroadly will follow up with the available options.`, label: "Book a test", query: `Walk me through choosing an English test for ${country.name}.` };
  if (!docTypes.has("grade_sheet"))
    return { tag: "Documents", title: "Get your transcript attested.", context: "NEB + MoEST + MoFA attestation takes ~2 weeks — start now.", label: "Walk me through attestation", query: `How do I get my NEB transcript attested for ${country.name}?` };
  if (!docTypes.has("sop"))
    return { tag: "Writing", title: "Draft your statement of purpose.", context: `A strong SOP takes 2–3 weeks. With ~${intake.monthsOut} months to ${intake.label}, start the first draft now.`, label: "Help me outline my SOP", query: `Help me outline an SOP for ${student.preferred_field ?? "my field"} in ${country.name}.` };
  if (!docTypes.has("financial"))
    return { tag: "Finance", title: `Plan financial proof for ${country.name}.`, context: "Banks take 1–3 weeks for usable statements — decide your funds source now.", label: "How do I prove funds?", query: `Help me plan financial proof for a ${country.name} student visa.` };
  return { tag: "Apply", title: "Shortlist universities and start applying.", context: "Your documents are coming together — aim for 5: 2 reach, 2 match, 1 safety.", label: "Help me pick 5 universities", query: `Suggest 5 ${country.name} universities for ${student.preferred_field ?? "my field"} that fit my profile.` };
}

export interface AntdDashboardProps {
  student: StudentOut;
  documents: StudentDocument[];
  history: ChatTurn[];
  activeCountry: CountryCode;
  countries: CountryCode[];
  onSelectCountry: (c: CountryCode) => void;
  onSendQuery: (q: string) => void;
  onBookTest: () => void;
}

export function AntdDashboard({ student, documents, activeCountry, countries, onSelectCountry, onSendQuery, onBookTest }: AntdDashboardProps) {
  const screens = Grid.useBreakpoint();
  const country = COUNTRY_PROFILES[activeCountry];
  const intake = nextIntakeFor(country.code);
  const firstName = student.full_name?.split(" ")[0] ?? "there";
  const initials = (student.full_name ?? "AB").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  const docTypes = useMemo(() => new Set(documents.map((d) => d.doc_type)), [documents]);
  const docCount = docTypes.size;
  const essentialDocCount = useMemo(
    () => ESSENTIAL_SLOTS.filter((slot) => docTypes.has(slot.id)).length,
    [docTypes],
  );
  const studentPct = gpaToPercentage(student.gpa, student.expected_gpa);
  const field = inferField(student.preferred_field);
  const unis = useMemo(() => pickUniversities(country.code as University["country"], studentPct, field, 6), [country.code, studentPct, field]);

  const profileDone = !!student.profile_completed;
  const stages = [
    { title: "Profile", sub: profileDone ? "Complete" : "Add details", done: profileDone },
    { title: "Documents", sub: `${docCount}/${DOC_SLOTS.length} uploaded`, done: docCount >= DOC_SLOTS.length },
    { title: "Shortlist", sub: "Pick universities", done: false },
    { title: "Apply", sub: "Submit & track", done: false },
    { title: "Visa", sub: "Offer → visa", done: false },
  ];
  const currentStage = Math.max(0, stages.findIndex((s) => !s.done));
  const journeyPct = Math.round((((profileDone ? 1 : 0) + Math.min(docCount / DOC_SLOTS.length, 1)) / stages.length) * 100);

  const focus = heroFocus(student, docTypes, country);

  const costItems = [
    { label: country.cost.tuitionLabel, value: country.cost.tuitionValue },
    { label: country.cost.livingLabel, value: country.cost.livingValue },
    { label: country.cost.visaLabel, value: country.cost.visaValue },
    { label: "Flight (one-way)", value: country.cost.flightValue },
  ];
  const timelineColor: Record<string, string> = { prep: "#A8A29A", test: "#E0A21B", deadline: "#E11D2A", visa: "#1F3D78", intake: "#0A6E45" };

  // Timeline: if no documents are on file yet, target an intake with realistic
  // runway (~5 months) and begin the list at the current month — not past prep steps.
  const tlNow = new Date();
  const tlPlanFrom = docCount === 0 ? new Date(tlNow.getFullYear(), tlNow.getMonth() + 5, 1) : tlNow;
  const timelineIntake = nextIntakeFor(country.code, tlPlanFrom);
  const tlYear = timelineIntake.date.getFullYear();
  const tlNowAbs = tlNow.getFullYear() * 12 + tlNow.getMonth();
  const timelineItems = [
    ...(docCount === 0
      ? [{
          color: "#0A6E45",
          children: (
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#0A6E45]">This month · start here</p>
              <p className="text-[13px] font-bold tracking-[-0.01em] text-[#1B1916]">Get your documents ready</p>
              <p className="text-[12px] leading-[1.5] text-[#6B655C]">Upload your transcript, passport and English score — the dates below lock to your real progress once you do.</p>
            </div>
          ),
        }]
      : []),
    ...country.timeline
      .map((e) => ({
        e,
        abs: typeof e.monthsBefore === "number"
          ? timelineIntake.date.getFullYear() * 12 + timelineIntake.date.getMonth() - e.monthsBefore
          : (tlYear + e.yearOffset) * 12 + e.monthIdx,
      }))
      .filter((x) => x.abs >= tlNowAbs)
      .sort((a, b) => a.abs - b.abs)
      .map(({ e, abs }) => ({
        color: timelineColor[e.kind] ?? "#A8A29A",
        children: (
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#8A847B]">{MONTHS[((abs % 12) + 12) % 12]} {Math.floor(abs / 12)}</p>
            <p className="text-[13px] font-bold tracking-[-0.01em] text-[#1B1916]">{e.title}</p>
            <p className="text-[12px] leading-[1.5] text-[#6B655C]">{e.detail}</p>
          </div>
        ),
      })),
  ];

  return (
    <ConfigProvider theme={abroadlyAntdTheme}>
      <div className="chat-layout">
        <StudentQuickTabs
          active="dashboard"
          firstName={firstName}
          uploadedCount={essentialDocCount}
          documentTotal={ESSENTIAL_SLOTS.length}
          phoneRequired={!student.phone?.trim()}
          callConsented={student.call_consent}
        />

        <section className="chat-main overflow-y-auto bg-[#F4F2EC]">
          <div className="min-h-screen bg-[#F4F2EC] text-[#1B1916]">
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-[#E8E5DD] bg-[#FAF9F6]/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandWordmark />
            </Link>
            <div className="flex items-center gap-3">
              {countries.length > 1 && (
                <Segmented value={activeCountry} onChange={(v) => onSelectCountry(v as CountryCode)} options={countries.map((c) => ({ label: COUNTRY_PROFILES[c].name, value: c }))} />
              )}
              <Link href="/chat"><Button type="primary">Open chat →</Button></Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] px-5 py-6 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
            {/* ── Left rail ───────────────────────────────────────── */}
            <aside className="grid gap-5 md:grid-cols-3 xl:sticky xl:top-[84px] xl:flex xl:flex-col xl:self-start">
              {/* profile */}
              <Panel bodyPad={18}>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0A6E45] text-[16px] font-extrabold text-white">{initials}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-extrabold tracking-[-0.01em]">{student.full_name ?? "Your profile"}</p>
                    <p className="truncate text-[12px] text-[#6B655C]">{student.preferred_field ?? "Set your field"}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F4F2EC] px-3.5 py-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#8A847B]">Targeting</p>
                    <p className="text-[13px] font-bold">{country.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#8A847B]">Next intake</p>
                    <p className="text-[13px] font-bold">{intake.label}</p>
                  </div>
                </div>
              </Panel>

              {/* journey progress */}
              <Panel eyebrow="Your journey" title={`${journeyPct}% on track`} bodyPad={18}>
                <div className="flex items-center gap-4">
                  <Progress type="circle" percent={journeyPct} size={72} strokeColor="#0A6E45" trailColor="#EFECE4" format={(p) => <span className="text-[15px] font-extrabold text-[#1B1916]">{p}%</span>} />
                  <ol className="flex-1 space-y-1.5">
                    {stages.map((s, i) => {
                      const st = s.done ? "done" : i === currentStage ? "current" : "todo";
                      return (
                        <li key={s.title} className="flex items-center gap-2">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${st === "done" ? "bg-[#0A6E45]" : st === "current" ? "bg-[#0A6E45]" : "border border-[#D1CABD] bg-white"}`}>
                            {st === "done" ? <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none"><path d="M3 6.5l2 2 4-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : st === "current" ? <span className="h-1 w-1 rounded-full bg-white" /> : null}
                          </span>
                          <span className={`text-[12px] ${st === "todo" ? "text-[#A8A29A]" : "font-semibold text-[#1B1916]"}`}>{s.title}</span>
                          {st === "current" && <span className="ml-auto text-[10px] font-bold text-[#0A6E45]">now</span>}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </Panel>

              {/* counsellor */}
              <div className="rounded-2xl border border-[#E8E5DD] bg-gradient-to-br from-[#0E2A4D] to-[#13325c] p-[18px] text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7DDBB1]">Free counsellor</p>
                <p className="mt-1.5 text-[14px] font-bold leading-[1.4]">Stuck on a decision? Talk it through with a real person.</p>
                <Link href="/chat"><Button block style={{ marginTop: 14, background: "#fff", color: "#0E2A4D", borderColor: "#fff", fontWeight: 700 }}>Request a call</Button></Link>
              </div>
            </aside>

            {/* ── Main grid ───────────────────────────────────────── */}
            <main className="flex flex-col gap-5">
              {/* greeting */}
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h1 className="text-[24px] font-extrabold tracking-[-0.02em] sm:text-[27px]">Good {greeting()}, {firstName}</h1>
                  <p className="mt-0.5 text-[13.5px] text-[#6B655C]">Here&apos;s your plan for {country.name} — {intake.monthsOut} months to {intake.label}.</p>
                </div>
              </div>

              {/* focus hero */}
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E2A4D] via-[#12315b] to-[#0E2A4D] p-[22px] text-white sm:p-7">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#7DDBB1]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7DDBB1]" /> Today&apos;s focus · {focus.tag}
                </span>
                <h2 className="mt-3.5 max-w-2xl text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[26px]">{focus.title}</h2>
                <p className="mt-2.5 max-w-2xl text-[13.5px] leading-[1.6] text-white/75">{focus.context}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button type="primary" onClick={focus.tag === "Test" ? onBookTest : () => onSendQuery(focus.query)}>{focus.label} →</Button>
                  <Link href="/chat?docs=open"><Button ghost style={{ color: "#fff", borderColor: "rgba(255,255,255,0.28)" }}>Manage documents</Button></Link>
                </div>
              </div>

              {/* fact tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {country.factStrip.map((f) => (
                  <div key={f.label} className="rounded-xl border border-[#E8E5DD] bg-white p-3.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.05em] text-[#8A847B]">{f.label}</p>
                    <p className="mt-1 text-[15px] font-extrabold leading-[1.2] tracking-[-0.01em] text-[#1B1916]">{f.value}</p>
                    {f.detail && <p className="mt-0.5 text-[10px] leading-[1.4] text-[#6B655C]">{f.detail}</p>}
                  </div>
                ))}
              </div>

              {/* universities */}
              <Panel eyebrow="Shortlist" title="Open the full university workspace" bodyPad={18}
                extra={studentPct ? <span className="text-[12px] text-[#6B655C]">Matched to your <b className="text-[#1B1916]">{studentPct}%</b></span> : <span className="text-[12px] text-[#9B6200]">Add GPA for sharper tags</span>}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="max-w-2xl text-[13px] leading-[1.6] text-[#6B655C]">
                      University profiles, official links, course starters, scholarships, and fit tags now live in the Universities tab so the dashboard can stay focused on progress.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {unis.slice(0, 3).map((u) => {
                        const fit = classifyFit(studentPct, u.entry_pct_min);
                        const campusImage = universityVerifiedCampusImageUrl(u);
                        return (
                          <div key={u.id} className="overflow-hidden rounded-lg border border-[#EFECE4] bg-[#FCFBF8]">
                            <div className="relative flex h-24 items-center justify-center bg-[#F1F0EC]">
                              {campusImage && (
                                <img
                                  src={campusImage}
                                  alt={`${u.name} campus view`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {campusImage && <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />}
                              <div className={`${campusImage ? "absolute left-2.5 top-2.5 bg-white/92 shadow-[0_8px_18px_rgba(15,15,15,0.15)] backdrop-blur" : "bg-white"} rounded-[7px] p-1.5`}>
                                <UniLogo name={u.name} url={u.official_url} />
                              </div>
                            </div>
                            <div className="px-3 py-2">
                              <p className="max-w-[180px] truncate text-[12px] font-bold text-[#1B1916]">{u.name}</p>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="text-[10.5px] text-[#6B655C]">{u.city}</p>
                                <Tag color={FIT_TAG[fit].color} style={{ marginInlineEnd: 0, fontSize: 10, fontWeight: 700 }}>{FIT_TAG[fit].label}</Tag>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Link href="/universities" className="shrink-0">
                    <Button type="primary">Open Universities →</Button>
                  </Link>
                </div>
              </Panel>

              {/* documents — profile-style cards with a sample preview + clear upload */}
              <Panel eyebrow="Documents" title="Your application file" bodyPad={18}
                extra={<span className="text-[12px] font-semibold text-[#6B655C]">{docCount}/{DOC_SLOTS.length} ready</span>}>
                {docCount === 0 && (
                  <Link href="/chat/documents" className="document-start-callout">
                    <span className="document-start-icon" aria-hidden>↑</span>
                    <span><strong>Start with your transcript</strong><small>Upload one document to personalize your plan.</small></span>
                    <span aria-hidden>→</span>
                  </Link>
                )}
                <div className="mb-4">
                  <Progress percent={Math.round((docCount / DOC_SLOTS.length) * 100)} strokeColor="#0A6E45" trailColor="#EFECE4" showInfo={false} />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {DOC_SLOTS.map((slot) => {
                    const up = docTypes.has(slot.id);
                    const META: Record<string, { emoji: string; tint: string; bar: string }> = {
                      grade_sheet: { emoji: "\u{1F4CA}", tint: "linear-gradient(135deg,#E8F0FB,#D6E6F7)", bar: "#3B6FB0" },
                      citizenship: { emoji: "\u{1F4C7}", tint: "linear-gradient(135deg,#F1EFEA,#E6E2D9)", bar: "#6B655C" },
                      passport: { emoji: "\u{1F6C2}", tint: "linear-gradient(135deg,#E1E7F4,#D0DAEF)", bar: "#1F3D78" },
                      ielts: { emoji: "\u{1F5E3}\u{FE0F}", tint: "linear-gradient(135deg,#FBF1DF,#F6E6C8)", bar: "#B8860B" },
                      sop: { emoji: "\u{270D}\u{FE0F}", tint: "linear-gradient(135deg,#E3F5EC,#CFEEDD)", bar: "#0A6E45" },
                      recommendation: { emoji: "\u{2709}\u{FE0F}", tint: "linear-gradient(135deg,#F0EBFA,#E2D8F4)", bar: "#6E4FB0" },
                      financial: { emoji: "\u{1F3E6}", tint: "linear-gradient(135deg,#E0F3F1,#CCEAE6)", bar: "#0E8C7E" },
                      other: { emoji: "\u{1F5C2}\u{FE0F}", tint: "linear-gradient(135deg,#F1EFEA,#E6E2D9)", bar: "#8A847B" },
                    };
                    const m = META[slot.id] ?? META.other;
                    return (
                      <div key={slot.id} className={`group flex flex-col overflow-hidden rounded-2xl border border-[#E8E5DD] bg-white transition hover:-translate-y-0.5 hover:border-[#0A6E45]/40 hover:shadow-[0_12px_26px_-14px_rgba(27,25,22,0.25)] ${docCount === 0 && slot.id === "grade_sheet" ? "document-card-next" : ""}`}>
                        <div className="relative flex h-[104px] items-center justify-center" style={{ background: m.tint }}>
                          <div className="flex h-[62px] w-[48px] flex-col items-center justify-center gap-[5px] rounded-md bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.14)]">
                            <span className="text-[20px] leading-none">{m.emoji}</span>
                            <span className="h-[3px] w-7 rounded-full" style={{ background: m.bar }} />
                            <span className="h-[3px] w-5 rounded-full" style={{ background: m.bar, opacity: 0.55 }} />
                          </div>
                          <span className={`absolute right-2 top-2 rounded-full px-2 py-[3px] text-[10px] font-bold ${up ? "bg-[#0A6E45] text-white" : "bg-white/85 text-[#6B655C]"}`}>
                            {up ? "✓ Done" : "Needed"}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-3">
                          <p className="text-[12.5px] font-bold leading-[1.25] tracking-[-0.01em] text-[#1B1916]">{slot.label}</p>
                          <p className="mt-0.5 flex-1 text-[10.5px] leading-[1.4] text-[#8A847B]">{slot.hint}</p>
                          <Link href="/chat?docs=open" className="mt-2.5 block">
                            <Button block type={up ? "default" : "primary"} size="small">{up ? "View / replace" : "Upload"}</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              {/* formalities timeline — full width */}
              <Panel eyebrow={`Formalities · ${country.name}`} title={`Timeline to ${timelineIntake.label}`}>
                <Timeline items={timelineItems} />
              </Panel>

              {/* scholarships | cost */}
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Panel eyebrow={`Scholarships · ${country.name}`} title="Funding worth applying for">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {country.scholarships.map((s) => (
                        <div key={s.name} className="rounded-xl border border-[#EFECE4] bg-[#FAF9F6] p-3.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[13.5px] font-bold tracking-[-0.01em] text-[#1B1916]">{s.name}</span>
                            <span className="shrink-0 text-[10.5px] font-semibold text-[#6B655C]">{s.funder}</span>
                          </div>
                          <p className="mt-1.5 text-[12px] leading-[1.5] text-[#3F3A33]"><span className="font-semibold text-[#0A6E45]">Covers.</span> {s.covers}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10.5px] text-[#8A847B]">{s.cycleOpens}</span>
                            <Button size="small" type="text" onClick={() => onSendQuery(`Am I eligible for the ${s.name}? How do I apply and what's the realistic chance?`)}><span className="text-[12px] font-semibold text-[#0A6E45]">Ask →</span></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
                <Panel eyebrow={`Costs · ${country.name}`} title="Annual budget">
                  <div className="grid grid-cols-2 gap-2.5">
                    {costItems.map((c) => (
                      <div key={c.label} className="rounded-xl border border-[#EFECE4] bg-[#FAF9F6] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-[#8A847B]">{c.label}</p>
                        <p className="mt-1 text-[13.5px] font-extrabold leading-[1.2] tracking-[-0.01em] text-[#1B1916]">{c.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10.5px] leading-[1.45] text-[#8A847B]">Indicative — check each uni&apos;s cost-of-attendance page.</p>
                </Panel>
              </div>

              {/* recommendation letter */}
              <Link href="/recommendation-letter">
                <div className="flex items-center gap-4 rounded-2xl border border-[#E8E5DD] bg-white p-[18px] transition hover:border-[#0A6E45]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#0A6E45]/10 text-[#0A6E45]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M5 3.5h9l5 5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M13.5 3.5V9h5.5M8 13h6M8 16.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-[#1B1916]">Create a recommendation letter</p>
                    <p className="mt-0.5 text-[12.5px] text-[#6B655C]">Fill your details + your teacher&apos;s, and we&apos;ll compose a clean, modern draft.</p>
                  </div>
                  <span className="text-[#8A847B]">→</span>
                </div>
              </Link>

              <p className="mt-2 text-center text-[11px] text-[#8A847B]">Abroadly is a free guide — for binding decisions, always check the official university or government portal.</p>
            </main>
          </div>
        </div>
          </div>
        </section>
      </div>
    </ConfigProvider>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
