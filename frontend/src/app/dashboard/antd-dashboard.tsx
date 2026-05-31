"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  ConfigProvider,
  Grid,
  List,
  Segmented,
  Statistic,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { abroadlyAntdTheme } from "@/lib/antd-theme";
import {
  classifyFit,
  currencySymbol,
  gpaToPercentage,
  inferField,
  pickUniversities,
  type AdmissionFit,
  type University,
} from "@/lib/university-data";
import {
  COUNTRY_PROFILES,
  nextIntakeFor,
  type CountryCode,
  type CountryProfile,
} from "@/lib/country-data";
import type { StudentOut, StudentDocument, ChatTurn } from "@/lib/api";

const { Title, Text, Paragraph } = Typography;

/* ── Document checklist (7) ───────────────────────────────────────────── */
const DOC_SLOTS = [
  { id: "grade_sheet", label: "Transcript / grade sheet", hint: "+2 or bachelor's marksheet" },
  { id: "passport", label: "Passport", hint: "Valid for course + 6 months" },
  { id: "ielts", label: "English test", hint: "IELTS / PTE / TOEFL score" },
  { id: "sop", label: "Statement of purpose", hint: "500–1,000 words per university" },
  { id: "recommendation", label: "Recommendation letters", hint: "2 letters from recent teachers" },
  { id: "financial", label: "Financial documents", hint: "Bank statement, sponsor, loan letter" },
  { id: "other", label: "Other documents", hint: "Character cert, portfolio, CV" },
];

const FIT_TAG: Record<AdmissionFit, { color: string; label: string }> = {
  reach: { color: "gold", label: "Reach" },
  match: { color: "green", label: "Match" },
  safety: { color: "blue", label: "Safety" },
  unknown: { color: "default", label: "—" },
};

/* ── Section wrapper — consistent rhythm + heading ────────────────────── */
function Section({
  eyebrow,
  title,
  extra,
  children,
}: {
  eyebrow: string;
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">{eyebrow}</p>
          <Title level={3} style={{ margin: "4px 0 0", fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em" }}>
            {title}
          </Title>
        </div>
        {extra}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function UniLogo({ name, url }: { name: string; url: string }) {
  const [failed, setFailed] = useState(false);
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  const initial = name.replace(/\(.*?\)/g, "").trim()[0]?.toUpperCase() ?? "U";
  if (failed || !host) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F2EC] text-[12px] font-extrabold text-[#6B655C]">
        {initial}
      </span>
    );
  }
  return (
    <img
      src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
      alt=""
      width={32}
      height={32}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-8 w-8 shrink-0 rounded-lg border border-[#EFECE4] bg-white object-contain p-1"
    />
  );
}

export interface AntdDashboardProps {
  student: StudentOut;
  documents: StudentDocument[];
  history: ChatTurn[];
  activeCountry: CountryCode;
  countries: CountryCode[];
  onSelectCountry: (c: CountryCode) => void;
  onSendQuery: (q: string) => void;
}

export function AntdDashboard({
  student,
  documents,
  history,
  activeCountry,
  countries,
  onSelectCountry,
  onSendQuery,
}: AntdDashboardProps) {
  const screens = Grid.useBreakpoint();
  const country: CountryProfile = COUNTRY_PROFILES[activeCountry];
  const intake = nextIntakeFor(country.code);
  const firstName = student.full_name?.split(" ")[0] ?? "there";

  const docTypes = useMemo(() => new Set(documents.map((d) => d.doc_type)), [documents]);
  const docCount = docTypes.size;

  const studentPct = gpaToPercentage(student.gpa, student.expected_gpa);
  const field = inferField(student.preferred_field);
  const unis = useMemo(
    () => pickUniversities(country.code as University["country"], studentPct, field, 6),
    [country.code, studentPct, field],
  );

  /* progress stages */
  const profileDone = !!student.profile_completed;
  const docsDone = docCount >= DOC_SLOTS.length;
  const stages = [
    { title: "Profile", description: profileDone ? "Complete" : "Add details", done: profileDone },
    { title: "Documents", description: `${docCount}/${DOC_SLOTS.length} uploaded`, done: docsDone },
    { title: "Shortlist", description: "Pick universities", done: false },
    { title: "Apply", description: "Submit & track", done: false },
    { title: "Visa", description: "Offer → visa", done: false },
  ];
  const currentStage = Math.max(0, stages.findIndex((s) => !s.done));

  const uniColumns: ColumnsType<University> = [
    {
      title: "University",
      dataIndex: "name",
      key: "name",
      render: (_: string, u: University) => (
        <div className="flex items-center gap-3">
          <UniLogo name={u.name} url={u.official_url} />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-[#1B1916]">{u.name}</div>
            <div className="text-[11.5px] text-[#8A847B]">{u.city}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Fit",
      key: "fit",
      width: 92,
      render: (_: unknown, u: University) => {
        const fit = classifyFit(studentPct, u.entry_pct_min);
        return <Tag color={FIT_TAG[fit].color} style={{ fontWeight: 700, marginInlineEnd: 0 }}>{FIT_TAG[fit].label}</Tag>;
      },
    },
    {
      title: "Int'l tuition / yr",
      key: "tuition",
      width: 124,
      responsive: ["sm"],
      render: (_: unknown, u: University) => (
        <span className="text-[13px] font-semibold text-[#1B1916]">
          {currencySymbol(u.tuition_currency)}
          {(u.tuition_min / 1000).toFixed(0)}k–{(u.tuition_max / 1000).toFixed(0)}k
        </span>
      ),
    },
    {
      title: "IELTS",
      key: "ielts",
      width: 70,
      responsive: ["md"],
      render: (_: unknown, u: University) => <span className="text-[13px] font-semibold text-[#1B1916]">{u.ielts_min}+</span>,
    },
    {
      title: "",
      key: "action",
      width: 96,
      align: "right",
      render: (_: unknown, u: University) => (
        <Button size="small" type="text" onClick={() => onSendQuery(`Tell me about ${u.name} for ${student.preferred_field ?? "my field"} — entry bar, fees, who fits there.`)}>
          <span className="text-[12px] font-semibold text-[#0A6E45]">Ask →</span>
        </Button>
      ),
    },
  ];

  const costItems = [
    { label: country.cost.tuitionLabel, value: country.cost.tuitionValue },
    { label: country.cost.livingLabel, value: country.cost.livingValue },
    { label: country.cost.visaLabel, value: country.cost.visaValue },
    { label: "Flight (one-way)", value: country.cost.flightValue },
  ];

  const timelineColor: Record<string, string> = {
    prep: "#A8A29A",
    test: "#E0A21B",
    deadline: "#E11D2A",
    visa: "#1F3D78",
    intake: "#0A6E45",
  };

  return (
    <ConfigProvider theme={abroadlyAntdTheme}>
      <main className="min-h-screen bg-[#FAF9F6] text-[#1B1916]">
        {/* Header */}
        <header className="border-b border-[#E8E5DD] bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-3">
              <img src="/images/abroadly-logo.png" alt="Abroadly" className="h-8 w-8 rounded-md" />
              <span className="text-base font-bold">Abroadly</span>
            </Link>
            <Link href="/chat">
              <Button type="default">Open chat →</Button>
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-5 pb-24 pt-7 sm:px-8">
          {/* Country switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A847B" }}>
              Your plan
            </Text>
            {countries.length > 1 && (
              <Segmented
                value={activeCountry}
                onChange={(v) => onSelectCountry(v as CountryCode)}
                options={countries.map((c) => ({ label: COUNTRY_PROFILES[c].name, value: c }))}
              />
            )}
          </div>

          <div className="mt-7 flex flex-col gap-12">
            {/* Hero focus */}
            <Card
              styles={{ body: { padding: screens.sm ? 28 : 20 } }}
              style={{ background: "#0E2A4D", borderColor: "#0E2A4D" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7DDBB1]">Today &middot; {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
              <h2 className="mt-3 text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white sm:text-[28px]">
                {heroFocus(student, docTypes, country).title}
              </h2>
              <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-white/75">
                Hey {firstName} — {heroFocus(student, docTypes, country).context}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button type="primary" onClick={() => onSendQuery(heroFocus(student, docTypes, country).primary.query)}>
                  {heroFocus(student, docTypes, country).primary.label} →
                </Button>
                <Link href="/chat">
                  <Button ghost style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>Open chat</Button>
                </Link>
              </div>
              <p className="mt-5 border-t border-white/10 pt-4 text-[11.5px] text-white/55">
                Targeting <span className="font-semibold text-white/80">{country.name}</span> &middot; Next intake{" "}
                <span className="font-semibold text-white/80">{intake.label}</span> (~{intake.monthsOut} months out)
              </p>
            </Card>

            {/* Progress */}
            <Section eyebrow="Your progress" title="Where you are" extra={<Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{stages.filter((s) => s.done).length} / {stages.length} done</Text>}>
              <Card styles={{ body: { padding: screens.md ? 24 : 18 } }}>
                <Steps
                  current={currentStage}
                  direction={screens.md ? "horizontal" : "vertical"}
                  size="small"
                  items={stages.map((s, i) => ({
                    title: s.title,
                    description: s.description,
                    status: s.done ? "finish" : i === currentStage ? "process" : "wait",
                  }))}
                />
              </Card>
            </Section>

            {/* Fact strip */}
            <Section eyebrow={`At a glance · ${country.name}`} title="What you're working with">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {country.factStrip.map((f) => (
                  <Card key={f.label} size="small" styles={{ body: { padding: 14 } }}>
                    <Statistic
                      title={<span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#8A847B]">{f.label}</span>}
                      value={f.value}
                      valueStyle={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", color: "#1B1916", lineHeight: 1.2 }}
                    />
                    {f.detail && <p className="mt-1 text-[10.5px] leading-[1.4] text-[#6B655C]">{f.detail}</p>}
                  </Card>
                ))}
              </div>
            </Section>

            {/* Timeline */}
            <Section eyebrow={`Formalities & timeline · ${country.name}`} title={`From now to ${intake.label}`}>
              <Card styles={{ body: { padding: screens.sm ? 24 : 18 } }}>
                <Timeline
                  items={[...country.timeline]
                    .sort((a, b) => (intake.date.getFullYear() + a.yearOffset) * 12 + a.monthIdx - ((intake.date.getFullYear() + b.yearOffset) * 12 + b.monthIdx))
                    .map((e) => ({
                      color: timelineColor[e.kind] ?? "#A8A29A",
                      children: (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#8A847B]">
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][e.monthIdx]} {intake.date.getFullYear() + e.yearOffset}
                          </p>
                          <p className="mt-0.5 text-[14px] font-bold tracking-[-0.01em] text-[#1B1916]">{e.title}</p>
                          <p className="mt-0.5 text-[12.5px] leading-[1.55] text-[#6B655C]">{e.detail}</p>
                        </div>
                      ),
                    }))}
                />
              </Card>
            </Section>

            {/* Universities */}
            <Section
              eyebrow={`Universities · ${country.name}`}
              title="Six picks worth shortlisting"
              extra={studentPct ? <Text type="secondary" style={{ fontSize: 12 }}>Matched to your <b style={{ color: "#1B1916" }}>{studentPct}%</b></Text> : <Text style={{ fontSize: 12, color: "#9B6200" }}>Add GPA for sharper tagging</Text>}
            >
              <Card styles={{ body: { padding: 0 } }} style={{ overflow: "hidden" }}>
                <Table
                  rowKey="id"
                  columns={uniColumns}
                  dataSource={unis}
                  pagination={false}
                  size="middle"
                />
              </Card>
              <p className="mt-2 text-[11.5px] text-[#8A847B]">Verify on each university&apos;s official &quot;International students&quot; page before applying.</p>
            </Section>

            {/* Documents */}
            <Section eyebrow="Documents" title="Your file" extra={<Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{docCount} / {DOC_SLOTS.length} uploaded</Text>}>
              <Card styles={{ body: { padding: 0 } }} style={{ overflow: "hidden" }}>
                <List
                  dataSource={DOC_SLOTS}
                  renderItem={(slot) => {
                    const up = docTypes.has(slot.id);
                    return (
                      <List.Item
                        style={{ padding: "12px 16px" }}
                        actions={[<Tag key="s" color={up ? "green" : "default"} style={{ marginInlineEnd: 0 }}>{up ? "Done" : "Pending"}</Tag>]}
                      >
                        <List.Item.Meta
                          avatar={
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${up ? "bg-[#0A6E45] text-white" : "border border-[#D1CABD] bg-white"}`}>
                              {up && (
                                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none"><path d="M3 6.5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              )}
                            </span>
                          }
                          title={<span className={`text-[13px] ${up ? "font-semibold text-[#1B1916]" : "text-[#3F3A33]"}`}>{slot.label}</span>}
                          description={<span className="text-[11px] text-[#8A847B]">{slot.hint}</span>}
                        />
                      </List.Item>
                    );
                  }}
                />
              </Card>
              <Link href="/chat?docs=open">
                <Button type="default" style={{ marginTop: 16 }}>Upload next document →</Button>
              </Link>
            </Section>

            {/* Recommendation letters */}
            <Section eyebrow="Recommendation letters" title="Draft a letter in minutes">
              <Link href="/recommendation-letter">
                <Card hoverable styles={{ body: { padding: 18 } }}>
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#0A6E45]/10 text-[#0A6E45]">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M5 3.5h9l5 5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M13.5 3.5V9h5.5M8 13h6M8 16.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-[#1B1916]">Create a recommendation letter</p>
                      <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[#6B655C]">Add your details and your teacher&apos;s, and we&apos;ll compose a clean, modern draft.</p>
                    </div>
                    <span className="text-[#8A847B]">→</span>
                  </div>
                </Card>
              </Link>
            </Section>

            {/* Scholarships */}
            <Section eyebrow={`Scholarships · ${country.name}`} title="Funding worth applying for">
              <List
                dataSource={country.scholarships}
                grid={{ gutter: 12, xs: 1, sm: 1, md: 2 }}
                renderItem={(s) => (
                  <List.Item>
                    <Card size="small" styles={{ body: { padding: 16 } }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-bold tracking-[-0.01em] text-[#1B1916]">{s.name}</span>
                        <span className="text-[11px] font-semibold text-[#6B655C]">{s.funder}</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[#3F3A33]"><span className="font-semibold text-[#0A6E45]">Covers.</span> {s.covers}</p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[11px] text-[#8A847B]">Cycle: {s.cycleOpens}</span>
                        <Button size="small" type="text" onClick={() => onSendQuery(`Am I eligible for the ${s.name}? How do I apply and what's the realistic chance?`)}>
                          <span className="text-[12px] font-semibold text-[#0A6E45]">Ask →</span>
                        </Button>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            </Section>

            {/* Cost */}
            <Section eyebrow={`Costs · ${country.name}`} title="Rough annual budget">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {costItems.map((c) => (
                  <Card key={c.label} size="small" styles={{ body: { padding: 14 } }}>
                    <Statistic
                      title={<span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#8A847B]">{c.label}</span>}
                      value={c.value}
                      valueStyle={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em", color: "#1B1916", lineHeight: 1.25 }}
                    />
                  </Card>
                ))}
              </div>
              <p className="mt-3 rounded-md border border-[#F0D89A] bg-[#FBF4E6] px-3 py-2.5 text-[11.5px] leading-[1.55] text-[#6B5224]">
                Indicative figures — actual cost depends on city, lifestyle, and your university. Check each uni&apos;s &quot;Cost of attendance&quot; page.
              </p>
            </Section>
          </div>

          <p className="mt-14 text-center text-[11px] text-[#8A847B]">
            Abroadly is a free guide — for binding decisions, always check the official university or government portal.
          </p>
        </div>
      </main>
    </ConfigProvider>
  );
}

/* hero focus — local copy of the heuristic (kept here so this file is self-contained) */
function heroFocus(student: StudentOut, docTypes: Set<string>, country: CountryProfile) {
  const intake = nextIntakeFor(country.code);
  if (!student.profile_completed)
    return { title: "Finish your study profile.", context: "Two minutes of detail (GPA, intake, field) sharpens every recommendation here.", primary: { label: "Edit profile", query: "Help me complete my study profile." } };
  if (!docTypes.has("ielts"))
    return { title: "Book your IELTS test this week.", context: `Slots in Kathmandu fill 4–6 weeks ahead, and you have ~${intake.monthsOut} months to ${intake.label}.`, primary: { label: "How do I book IELTS?", query: `Walk me through booking IELTS in Kathmandu for ${country.name}.` } };
  if (!docTypes.has("grade_sheet"))
    return { title: "Get your transcript attested.", context: "NEB + MoEST + MoFA attestation takes ~2 weeks — start now.", primary: { label: "Walk me through attestation", query: `How do I get my NEB transcript attested for ${country.name}?` } };
  if (!docTypes.has("sop"))
    return { title: "Draft your statement of purpose.", context: `A strong SOP takes 2–3 weeks. With ~${intake.monthsOut} months left, start the first draft now.`, primary: { label: "Help me outline my SOP", query: `Help me outline an SOP for ${student.preferred_field ?? "my field"} in ${country.name}.` } };
  if (!docTypes.has("financial"))
    return { title: `Plan financial proof for ${country.name}.`, context: "Banks take 1–3 weeks for usable statements — decide funds source now.", primary: { label: "How do I prove funds?", query: `Help me plan financial proof for a ${country.name} student visa.` } };
  return { title: "Shortlist universities and start applying.", context: "Your documents are coming together — aim for 5: 2 reach, 2 match, 1 safety.", primary: { label: "Help me pick 5 universities", query: `Suggest 5 ${country.name} universities for ${student.preferred_field ?? "my field"} that fit my profile.` } };
}
