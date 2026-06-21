import Link from "next/link";
import { HeroIntentForm } from "./hero-intent-form";
import { HeroUniversityStrip } from "./hero-university-strip";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";
import { HeroVideoSection } from "@/components/hero-video-section";

const steps = [
  {
    no: "01",
    title: "Tell it your situation",
    body: "Your education level, GPA, expected GPA, field, budget worries, and the countries you are weighing.",
  },
  {
    no: "02",
    title: "Ask the messy questions",
    body: "Eligibility, documents, visa steps, scholarships, SOPs, costs, timelines — or simply what to do first.",
  },
  {
    no: "03",
    title: "Leave with a next step",
    body: "A clear answer, the gaps you still need to check, and the official link or document prompt that matters.",
  },
];

const studentProblems = [
  {
    icon: "\u{1F3AF}",
    title: "Am I eligible?",
    body: "See whether your grades, level, and goals look realistic before you spend money applying.",
  },
  {
    icon: "\u{1F4CB}",
    title: "Which documents?",
    body: "A checklist for transcripts, passport, SOP, recommendation letters, finances, and English tests.",
  },
  {
    icon: "\u{1F4B0}",
    title: "How much will it cost?",
    body: "Tuition, living costs, deposits, proof of funds, scholarships, and safer budget planning.",
  },
  {
    icon: "\u{1F9ED}",
    title: "What do I do next?",
    body: "Turn confusion into a short action plan you can talk through with family or universities.",
  },
];

const topics = [
  "UK student route",
  "Australia study visa",
  "Canada planning",
  "Scholarship search",
  "SOP review ideas",
  "Document checklist",
  "Course selection",
  "Budget questions",
  "Nepali student doubts",
];

/* ── Inline building blocks ───────────────────────────────────────────
 * Small, self-contained helpers so /onboarding can reuse the same shapes
 * (when we lift them out next PR). No new files in this PR.
 */

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`ab-eyebrow ${className}`}>{children}</span>;
}

function ChatPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="ab-hero-glow pointer-events-none absolute -inset-x-10 -top-16 bottom-0 -z-10 bg-purple-900/10 blur-[120px]" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-2xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-slate-900/40 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-white/10" />
          <span className="h-3 w-3 rounded-full bg-white/10" />
          <span className="h-3 w-3 rounded-full bg-white/10" />
          <span className="ml-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            abroadly.online / chat
          </span>
        </div>

        {/* conversation */}
        <div className="space-y-4 px-5 py-6 sm:px-7">
          <div className="flex justify-end">
            <div className="max-w-[78%] rounded-2xl rounded-br-md bg-purple-600 px-4 py-2.5 text-[14px] font-medium leading-relaxed text-white shadow-lg shadow-purple-500/15">
              I just finished +2 in Nepal with a 3.2 GPA. Can I study computer science in the UK?
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <img src="/images/abroadly-logo.png" alt="" className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-slate-900 object-contain p-0.5 border border-white/10" />
            <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-white/5 bg-slate-900/60 px-4 py-3 text-[14px] leading-relaxed text-slate-200">
              Yes — a <strong className="font-semibold text-white">3.2 GPA after +2</strong> puts most UK undergraduate
              CS courses in reach, often via direct entry or a foundation year. You will typically need{" "}
              <strong className="font-semibold text-white">IELTS 6.0–6.5</strong>.
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[12px] font-semibold text-slate-300">
                  Upload your transcript &rarr; I&apos;ll check eligibility
                </span>
                <span className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[12px] font-semibold text-slate-300">
                  Which universities fit my grades?
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="public-dark min-h-screen">
      <NavBar
        sectionLinks={[
          ["How it works", "#how-it-works"],
          ["What it helps with", "#student-problems"],
          ["Topics", "#topics"],
        ]}
      />

      {/* ── Hero — dark, futuristic and single-purpose ───────── */}
      <section className="ab-light-hero relative overflow-hidden bg-transparent">
        <div aria-hidden className="ab-light-hero-grid pointer-events-none absolute inset-0" />

        <div aria-hidden className="ab-hero-float ab-hero-float-a">
          <span className="ab-hero-float-icon bg-orange-500/10 text-orange-400">
            <svg viewBox="0 0 20 20" fill="none"><path d="M4 5.5h12M4 9.5h8M4 13.5h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="m13.5 13 1.7 1.7L18 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span><strong>Document-ready</strong><small className="text-slate-400">Clear checks, one step at a time</small></span>
        </div>
        <div aria-hidden className="ab-hero-float ab-hero-float-b">
          <span className="ab-hero-float-icon bg-emerald-500/10 text-emerald-400">
            <svg viewBox="0 0 20 20" fill="none"><path d="M3.5 15.5h13M5 14V8.5M9 14V5.5M13 14v-3M17 14V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </span>
          <span><strong>Realistic fit</strong><small className="text-slate-400">Grades, budget and goals together</small></span>
        </div>
        <div aria-hidden className="ab-hero-float ab-hero-float-c">
          <span className="ab-hero-float-icon bg-purple-500/10 text-purple-400">
            <svg viewBox="0 0 20 20" fill="none"><path d="m3 8 7-4 7 4-7 4-7-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M5.5 10v3.5c2.8 2 6.2 2 9 0V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </span>
          <span><strong>University details</strong><small className="text-slate-400">Requirements without the sales pitch</small></span>
        </div>
        <div aria-hidden className="ab-hero-float ab-hero-float-d">
          <span className="ab-hero-float-icon bg-amber-500/10 text-amber-400">
            <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6.5v4l2.8 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </span>
          <span><strong>Visa timeline</strong><small className="text-slate-400">Built around your intake</small></span>
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-24 pt-16 text-center sm:pb-28 sm:pt-20">
          <span className="ab-fade-up ab-d1 inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3.5 py-1.5 text-[12.5px] font-bold text-purple-300">
            <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5 text-orange-400 animate-pulse" fill="currentColor">
              <path d="M8 0l1.6 4.9L14.4 6 9.6 7.1 8 12 6.4 7.1 1.6 6l4.8-1.1L8 0z" />
            </svg>
            Built for students in Nepal
          </span>

          <h1 className="ab-fade-up ab-d2 ab-display-1 mt-7 max-w-3xl text-white">
            Guidance that adapts<br className="hidden sm:block" /> to <span className="ab-hero-emphasis">your plan.</span>
          </h1>

          <p className="ab-fade-up ab-d3 mt-5 max-w-xl text-[15px] leading-[1.7] text-slate-300 sm:text-[17px]">
            Ask about eligibility, universities, costs, documents and visas. Get a clear next step grounded in official sources — free from agency pressure.
          </p>

          <div className="ab-fade-up ab-d4 mt-9 w-full">
            <HeroIntentForm />
          </div>

          {/* university trust strip */}
          <div className="ab-fade-up ab-d5 mt-12 flex w-full flex-col items-center gap-4 border-t border-white/10 pt-7">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Free, independent guidance for universities like
            </p>
            <HeroUniversityStrip />
          </div>
        </div>
      </section>

      <HeroVideoSection />

      {/* ── Product peek ─────────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-slate-950/40">
        <div className="mx-auto max-w-2xl px-5 pb-16 sm:px-8 sm:pb-20">
          <ChatPreview className="ab-fade-up relative z-10 -mt-12 sm:-mt-16" />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="ab-section border-t border-white/5 bg-transparent">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="ab-display-2 mt-3 text-white">
              From a confused question to a clear next step.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.no}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-7 transition hover:-translate-y-0.5 hover:border-purple-500/30 hover:bg-white/[0.04] hover:shadow-xl hover:shadow-purple-500/5 duration-300"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-900/30 text-[15px] font-extrabold tracking-[-0.01em] text-purple-300 border border-purple-500/20">
                  {step.no}
                </span>
                <h3 className="ab-h3 mt-5 text-white">{step.title}</h3>
                <p className="ab-body mt-2.5 text-[14px] leading-7 text-slate-300">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it helps with ───────────────────────────────────────── */}
      <section id="student-problems" className="ab-section border-t border-white/5 bg-slate-950/20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <Eyebrow>What it helps with</Eyebrow>
            <h2 className="ab-display-2 mt-3 text-white">
              The questions students actually ask.
            </h2>
            <p className="ab-subhead mt-4 max-w-xl text-slate-300">
              Use it before you pay an application fee, choose a country, write an SOP, or tell your
              family a plan you are not sure about yet.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {studentProblems.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:-translate-y-0.5 hover:border-purple-500/30 hover:bg-white/[0.04] hover:shadow-xl hover:shadow-purple-500/5 duration-300"
              >
                <span className="text-2xl">{item.icon}</span>
                <h3 className="ab-h3 mt-4 text-[16px] text-white">{item.title}</h3>
                <p className="ab-body mt-2 text-[14px] leading-7 text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics ───────────────────────────────────────────────────── */}
      <section id="topics" className="ab-section border-t border-white/5 bg-transparent">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Eyebrow>Ask in plain language</Eyebrow>
            <h2 className="ab-display-2 mt-3 text-white">
              You can start with a half-formed plan.
            </h2>
            <p className="ab-subhead mt-4 max-w-md text-slate-300">
              Abroadly is made for the first draft of your thinking — family pressure, country
              comparisons, and &ldquo;what does this requirement even mean?&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-white/5 bg-white/[0.02] px-4 py-2.5 text-[14px] font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-purple-300 hover:bg-white/[0.04] cursor-default"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="ab-section border-t border-white/10 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-purple-950/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-7 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="ab-display-2 text-white">
              Build your study profile once, then ask better questions every time.
            </h2>
            <p className="ab-body mt-4 text-slate-300">
              Free, honest, and ready whenever you are. No agency, no pressure.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="ab-focus inline-flex h-12 shrink-0 items-center justify-center rounded-[10px] bg-purple-600 px-7 text-[14px] font-bold text-white shadow-lg shadow-purple-600/25 transition hover:-translate-y-0.5 hover:bg-purple-500 duration-300"
          >
            Get started free
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
