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


export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <NavBar
        sectionLinks={[
          ["How it works", "#how-it-works"],
          ["What it helps with", "#student-problems"],
          ["Topics", "#topics"],
        ]}
      />

      {/* ── Hero — StudyFetch Inspired Light Theme ───────── */}
      <section className="relative overflow-hidden bg-[#fafafa] min-h-[85vh] flex flex-col items-center justify-center pt-24 pb-16">
        
        {/* Floating Background Images with badges */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden max-w-[1400px] mx-auto z-0">
          {/* Top left girl tablet */}
          <div className="absolute top-10 left-[15%] w-48 rounded-[24px] overflow-hidden shadow-2xl animate-[abFadeUp_1s_ease-out]">
             <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=450&fit=crop" alt="" className="w-full h-auto object-cover" />
             {/* Yellow Edit Badge */}
             <div className="absolute -left-3 top-8 w-14 h-14 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
             </div>
          </div>

          {/* Center left guy leaning on wall */}
          <div className="absolute top-48 left-[40%] w-32 rounded-[20px] overflow-hidden shadow-xl animate-[abFadeUp_1.2s_ease-out]">
             <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=300&h=300&fit=crop" alt="" className="w-full h-auto object-cover" />
          </div>

          {/* Top right girls on grass */}
          <div className="absolute top-12 right-[20%] w-56 rounded-[24px] overflow-hidden shadow-2xl animate-[abFadeUp_1.1s_ease-out]">
             <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=350&fit=crop" alt="" className="w-full h-auto object-cover" />
          </div>

          {/* Bottom far right guy listening to music */}
          <div className="absolute top-64 right-[5%] w-44 rounded-[24px] overflow-hidden shadow-2xl animate-[abFadeUp_1.3s_ease-out]">
             <img src="https://images.unsplash.com/photo-1515041219749-89347f83291a?w=400&h=500&fit=crop" alt="" className="w-full h-auto object-cover" />
             {/* Pink Soundwave Badge */}
             <div className="absolute -left-5 top-12 w-16 h-16 bg-gradient-to-br from-pink-300 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
             </div>
          </div>
          
          {/* Bottom far left guy typing */}
          <div className="absolute top-[22rem] left-[0%] w-48 rounded-[24px] overflow-hidden shadow-2xl animate-[abFadeUp_1.4s_ease-out]">
             <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=500&fit=crop" alt="" className="w-full h-auto object-cover" />
             {/* Teal List Badge */}
             <div className="absolute -right-4 top-16 w-16 h-16 bg-gradient-to-br from-teal-300 to-cyan-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
             </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex flex-col items-center text-center px-5 max-w-4xl mt-12 sm:mt-24">
          <h1 className="text-[3rem] leading-[1.1] font-semibold text-slate-900 tracking-tight sm:text-[4.5rem] mb-4 animate-[abFadeUp_0.8s_ease-out]">
            Guidance that adapts <br className="hidden sm:block" />
            to <span className="italic font-medium">you</span>
          </h1>
          <p className="ab-fade-up max-w-2xl text-[16px] text-slate-600 sm:text-[18px] mb-8">
            Ask about eligibility, universities, costs, documents and visas. Get a clear next step grounded in official sources.
          </p>

          <div className="ab-fade-up w-full">
            <HeroIntentForm />
          </div>

          {/* university trust strip */}
          <div className="ab-fade-up mt-12 flex w-full flex-col items-center gap-4 pt-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Free, independent guidance for universities like
            </p>
            <HeroUniversityStrip />
          </div>
        </div>
      </section>

      <HeroVideoSection />

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="ab-section bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <Eyebrow className="!text-blue-600 !bg-blue-50">How it works</Eyebrow>
            <h2 className="ab-display-2 mt-3 text-slate-900">
              From a confused question to a clear next step.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.no}
                className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 duration-300"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[15px] font-extrabold tracking-[-0.01em] text-blue-600 border border-blue-100">
                  {step.no}
                </span>
                <h3 className="ab-h3 mt-5 text-slate-900">{step.title}</h3>
                <p className="ab-body mt-2.5 text-[14px] leading-7 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it helps with ───────────────────────────────────────── */}
      <section id="student-problems" className="ab-section bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <Eyebrow className="!text-blue-600 !bg-blue-50">What it helps with</Eyebrow>
            <h2 className="ab-display-2 mt-3 text-slate-900">
              The questions students actually ask.
            </h2>
            <p className="ab-subhead mt-4 max-w-xl text-slate-600">
              Use it before you pay an application fee, choose a country, write an SOP, or tell your
              family a plan you are not sure about yet.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {studentProblems.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 duration-300"
              >
                <span className="text-2xl">{item.icon}</span>
                <h3 className="ab-h3 mt-4 text-[16px] text-slate-900">{item.title}</h3>
                <p className="ab-body mt-2 text-[14px] leading-7 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics ───────────────────────────────────────────────────── */}
      <section id="topics" className="ab-section bg-white border-t border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Eyebrow className="!text-blue-600 !bg-blue-50">Ask in plain language</Eyebrow>
            <h2 className="ab-display-2 mt-3 text-slate-900">
              You can start with a half-formed plan.
            </h2>
            <p className="ab-subhead mt-4 max-w-md text-slate-600">
              Abroadly is made for the first draft of your thinking — family pressure, country
              comparisons, and &ldquo;what does this requirement even mean?&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 cursor-default"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="ab-section bg-white border-t border-slate-200">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 px-5 sm:px-8 text-center">
          <h2 className="ab-display-2 text-slate-900">
            Build your study profile once, then ask better questions every time.
          </h2>
          <p className="ab-body mt-4 text-slate-600 max-w-xl">
            Free, honest, and ready whenever you are. No agency, no pressure.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex h-14 items-center justify-center rounded-full bg-[#0044FF] px-10 text-[16px] font-bold text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-600 duration-300"
          >
            Start learning
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
