"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/app/google-sign-in-button";
import { NavBar } from "@/app/nav-bar";
import { SiteFooter } from "@/app/site-footer";
import {
  completeGoogleProfile,
  getCurrentStudent,
  type EducationLevel,
  type StudentOut,
} from "@/lib/api";

type LoadState = "loading" | "ready" | "signed_out";
type Step = 1 | 2 | 3;
type ScoreType = "gpa" | "percentage" | "cgpa_10" | "grade" | "other";
type EnglishGoal = "join_class" | "not_looking" | "book_test";

interface ProfileForm {
  full_name: string;
  phone: string;
  location: string;
  education_level: EducationLevel | "";
  qualification_year: string;
  score_type: ScoreType | "";
  academic_score: string;
  english_test_taken: boolean | null;
  english_test_type: string;
  english_overall_score: string;
  english_lowest_score: string;
  english_goal: EnglishGoal | "";
  english_class_timing: string;
  planned_english_test: string;
  preferred_field: string;
  intended_study_level: string;
  preferred_intake: string;
  budget_range: string;
  target_countries: string[];
  goals: string;
  call_consent: boolean;
}

const EMPTY_FORM: ProfileForm = {
  full_name: "",
  phone: "",
  location: "",
  education_level: "",
  qualification_year: "",
  score_type: "",
  academic_score: "",
  english_test_taken: null,
  english_test_type: "",
  english_overall_score: "",
  english_lowest_score: "",
  english_goal: "",
  english_class_timing: "",
  planned_english_test: "",
  preferred_field: "",
  intended_study_level: "",
  preferred_intake: "",
  budget_range: "",
  target_countries: [],
  goals: "",
  call_consent: false,
};

const STEPS = [
  { id: 1 as Step, label: "Your details", helper: "Contact" },
  { id: 2 as Step, label: "Academic", helper: "Study readiness" },
  { id: 3 as Step, label: "Destination", helper: "Your plan" },
];

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "plus_two", label: "+2 / Class 12" },
  { value: "a_levels", label: "A-Levels" },
  { value: "bba", label: "Diploma / BBA" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "other", label: "Other qualification" },
];

const COUNTRY_OPTIONS = [
  "United Kingdom",
  "Australia",
  "Canada",
  "United States",
  "New Zealand",
  "Germany",
  "Finland",
  "Japan",
  "South Korea",
  "Ireland",
];

const ENGLISH_TESTS = ["IELTS", "PTE", "Duolingo", "TOEFL", "Oxford ELLT", "Other test"];
const CLASS_TIMES = ["Morning", "Afternoon", "Evening", "Weekend", "Flexible"];
const STUDY_LEVELS = ["Foundation / pathway", "Diploma", "Bachelor's", "Master's", "PhD / research", "Not sure yet"];
const INTAKES = ["January / February 2027", "May / July 2027", "September / October 2027", "2028", "Not sure yet"];
const BUDGETS = ["Under USD 15,000 / year", "USD 15,000-25,000 / year", "USD 25,000-40,000 / year", "Above USD 40,000 / year", "Need help estimating"];
const SCORE_TYPES: { value: ScoreType; label: string }[] = [
  { value: "gpa", label: "GPA (4.0 / 4.5)" },
  { value: "percentage", label: "Percentage" },
  { value: "cgpa_10", label: "CGPA (10.0)" },
  { value: "grade", label: "Letter grade" },
  { value: "other", label: "Other" },
];

const currentYear = new Date().getFullYear();
const COMPLETION_YEARS = Array.from({ length: 26 }, (_, index) => currentYear + 1 - index);

const INPUT_CLS =
  "ab-focus h-11 w-full rounded-lg border border-[var(--ab-line)] bg-white px-3.5 text-[14px] font-medium text-[var(--ab-ink)] placeholder:text-[#AAA69D] transition hover:border-[#D4D0C7] focus:border-[var(--ab-brand)] focus:ring-4 focus:ring-[rgba(10,110,69,0.11)]";
const LABEL_CLS = "mb-1.5 block text-[12.5px] font-bold text-[var(--ab-ink)]";
const ERROR_CLS = "mt-1.5 text-[11.5px] font-semibold text-[#B42318]";

function cleanPhoneForInput(value: string | null): string {
  return (value || "").replace(/^\+977[\s-]*/, "");
}

function ErrorText({ children }: { children?: ReactNode }) {
  return children ? <p className={ERROR_CLS}>{children}</p> : null;
}

function Choice({
  selected,
  label,
  onSelect,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`ab-focus flex min-h-10 w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] font-semibold transition ${
        selected
          ? "border-[var(--ab-brand)] bg-[#F0F8F4] text-[var(--ab-ink)]"
          : "border-[var(--ab-line)] bg-white text-[var(--ab-ink-soft)] hover:border-[#CBC7BD]"
      }`}
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[var(--ab-brand)]" : "border-[#B8B3A9]"}`}>
        {selected && <span className="h-2 w-2 rounded-full bg-[var(--ab-brand)]" />}
      </span>
      {label}
    </button>
  );
}

export default function ProfileDetailsPage() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [student, setStudent] = useState<StudentOut | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentStudent()
      .then((current) => {
        if (cancelled) return;
        localStorage.setItem("abroadly_student_id", current.id);
        if (current.profile_completed && current.phone?.trim()) {
          router.replace("/chat");
          return;
        }
        setStudent(current);
        setForm({
          ...EMPTY_FORM,
          full_name: current.full_name || "",
          phone: cleanPhoneForInput(current.phone),
          location: current.location || "",
          education_level: current.education_level === "other" && !current.profile_completed ? "" : current.education_level,
          qualification_year: current.qualification_year ? String(current.qualification_year) : "",
          score_type: (current.score_type as ScoreType | null) || "",
          academic_score: current.academic_score || (current.gpa == null ? "" : String(current.gpa)),
          english_test_taken: current.english_test_taken,
          english_test_type: current.english_test_type || "",
          english_overall_score: current.english_overall_score || "",
          english_lowest_score: current.english_lowest_score || "",
          english_goal: (current.english_goal as EnglishGoal | null) || "",
          english_class_timing: current.english_class_timing || "",
          planned_english_test: current.planned_english_test || "",
          preferred_field: current.preferred_field || "",
          intended_study_level: current.intended_study_level || "",
          preferred_intake: current.preferred_intake || "",
          budget_range: current.budget_range || "",
          target_countries: current.target_countries || [],
          goals: current.goals || "",
          call_consent: current.call_consent || false,
        });

        try {
          const rawIntent = localStorage.getItem("abroadly_intent");
          if (rawIntent) {
            const intent = JSON.parse(rawIntent) as { degree?: string; country?: string };
            setForm((prev) => ({
              ...prev,
              intended_study_level: prev.intended_study_level || intent.degree || "",
              target_countries: prev.target_countries.length ? prev.target_countries : intent.country ? [intent.country] : [],
            }));
            localStorage.removeItem("abroadly_intent");
          }
        } catch {
          // Ignore malformed one-shot landing intent.
        }
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("signed_out");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function setField<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  }

  function toggleCountry(country: string) {
    setForm((prev) => ({
      ...prev,
      target_countries: prev.target_countries.includes(country)
        ? prev.target_countries.filter((item) => item !== country)
        : [...prev.target_countries, country],
    }));
    setErrors((prev) => ({ ...prev, target_countries: "" }));
  }

  function validateStep(targetStep: Step): boolean {
    const next: Record<string, string> = {};

    if (targetStep === 1) {
      if (!form.full_name.trim()) next.full_name = "Enter your full name.";
      if (!form.phone.trim()) next.phone = "Enter your phone number.";
      if (!form.location.trim()) next.location = "Enter your city or district.";
    }

    if (targetStep === 2) {
      if (form.english_test_taken === null) next.english_test_taken = "Choose yes or no.";
      if (form.english_test_taken === true) {
        if (!form.english_test_type) next.english_test_type = "Choose the test you took.";
        if (!form.english_overall_score.trim()) next.english_overall_score = "Enter your overall score.";
      }
      if (form.english_test_taken === false) {
        if (!form.english_goal) next.english_goal = "Choose your English-test plan.";
        if (form.english_goal === "join_class" && !form.english_class_timing) next.english_class_timing = "Choose a class time.";
        if (form.english_goal === "book_test" && !form.planned_english_test) next.planned_english_test = "Choose a test.";
      }
      if (!form.education_level) next.education_level = "Choose your latest qualification.";
      if (!form.qualification_year) next.qualification_year = "Choose the completion year.";
      if (!form.score_type) next.score_type = "Choose how your result is graded.";
      if (!form.academic_score.trim()) next.academic_score = "Enter your score or grade.";
      if (form.score_type === "gpa") {
        const gpa = Number(form.academic_score);
        if (!Number.isFinite(gpa) || gpa < 0 || gpa > 4.5) next.academic_score = "Use a GPA between 0 and 4.5.";
      }
    }

    if (targetStep === 3) {
      if (!form.target_countries.length) next.target_countries = "Choose at least one destination.";
      if (!form.preferred_field.trim()) next.preferred_field = "Tell us what you want to study.";
      if (!form.intended_study_level) next.intended_study_level = "Choose your intended study level.";
      if (!form.preferred_intake) next.preferred_intake = "Choose a preferred intake.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function changeStep(nextStep: Step) {
    setStep(nextStep);
    setErrors({});
    setApiError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step < 3) changeStep((step + 1) as Step);
  }

  async function saveProfile() {
    if (!validateStep(3) || !form.education_level || !form.score_type || form.english_test_taken === null) return;

    setSubmitting(true);
    setApiError("");
    try {
      const gpa = form.score_type === "gpa" ? Number(form.academic_score) : undefined;
      const updated = await completeGoogleProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim().startsWith("+") ? form.phone.trim() : `+977 ${form.phone.trim()}`,
        location: form.location.trim(),
        education_level: form.education_level,
        ...(gpa !== undefined ? { gpa } : {}),
        qualification_year: Number(form.qualification_year),
        score_type: form.score_type,
        academic_score: form.academic_score.trim(),
        english_test_taken: form.english_test_taken,
        ...(form.english_test_taken
          ? {
              english_test_type: form.english_test_type,
              english_overall_score: form.english_overall_score.trim(),
              ...(form.english_lowest_score.trim() ? { english_lowest_score: form.english_lowest_score.trim() } : {}),
            }
          : {
              english_goal: form.english_goal as EnglishGoal,
              ...(form.english_goal === "join_class" ? { english_class_timing: form.english_class_timing } : {}),
              ...(form.english_goal === "book_test" ? { planned_english_test: form.planned_english_test } : {}),
            }),
        target_countries: form.target_countries,
        preferred_field: form.preferred_field.trim(),
        intended_study_level: form.intended_study_level,
        preferred_intake: form.preferred_intake,
        ...(form.budget_range ? { budget_range: form.budget_range } : {}),
        ...(form.goals.trim() ? { goals: form.goals.trim() } : {}),
        call_consent: form.call_consent,
      });
      localStorage.setItem("abroadly_student_id", updated.id);
      router.replace("/chat");
    } catch (error: unknown) {
      setApiError(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) goNext();
    else void saveProfile();
  }

  if (loadState === "loading") {
    return (
      <main className="min-h-screen bg-[var(--ab-paper-2)] text-[var(--ab-ink)]">
        <NavBar showSignIn={false} primary={{ href: "/", label: "Home" }} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          {/* Header Skeleton */}
          <header className="flex flex-col gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-[#E9E6DF]" />
            <div className="mt-2 h-8 w-56 animate-pulse rounded bg-[#E9E6DF]" />
            <div className="mt-2 h-4 w-full max-w-2xl animate-pulse rounded bg-[#E9E6DF]" />
          </header>

          {/* Progress Indicator Skeleton */}
          <div className="mt-7 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 border-b-2 border-[var(--ab-line)] pb-3">
                <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-[#E9E6DF]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 animate-pulse rounded bg-[#E9E6DF]" />
                  <div className="hidden h-2.5 w-10 animate-pulse rounded bg-[#E9E6DF] sm:block" />
                </div>
              </div>
            ))}
          </div>

          {/* Form Skeleton */}
          <div className="mt-6 overflow-hidden rounded-lg border border-[var(--ab-line)] bg-white shadow-[var(--shadow-sm)]">
            <div className="min-h-[470px] p-5 sm:p-8 lg:p-10">
              <div className="h-4 w-16 animate-pulse rounded bg-[#E9E6DF]" />
              <div className="mt-2 h-6 w-32 animate-pulse rounded bg-[#E9E6DF]" />
              <div className="mt-1 h-3.5 w-72 animate-pulse rounded bg-[#E9E6DF]" />

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="mb-2 h-3.5 w-24 animate-pulse rounded bg-[#E9E6DF]" />
                    <div className="h-11 w-full animate-pulse rounded-lg bg-[#F5F2EB]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Skeleton */}
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--ab-line)] bg-[#FAFAF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="h-3 w-64 animate-pulse rounded bg-[#E9E6DF]" />
              <div className="h-10 w-28 animate-pulse rounded-lg bg-[#E9E6DF]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loadState === "signed_out") {
    return (
      <main className="min-h-screen bg-[var(--ab-paper)] text-[var(--ab-ink)]">
        <NavBar showSignIn={false} primary={{ href: "/", label: "Home" }} />
        <section className="mx-auto max-w-md px-5 py-24 text-center sm:py-32">
          <p className="ab-eyebrow">Sign-in required</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em]">Continue with Google first.</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ab-muted)]">Your verified email keeps this one-time profile private and reusable.</p>
          <div className="mt-8 rounded-lg border border-[var(--ab-line)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <GoogleSignInButton variant="outline" className="w-full justify-start" />
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--ab-paper-2)] text-[var(--ab-ink)]">
      <NavBar showSignIn={false} primary={{ href: "/", label: "Home" }} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ab-eyebrow">One-time setup</p>
            <h1 className="mt-2 text-[28px] font-black leading-tight tracking-[-0.035em] sm:text-[34px]">Your study profile</h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[var(--ab-muted)]">Three short steps help Abroadly give answers that fit your grades, English readiness and destination.</p>
          </div>
          <p className="text-[12px] font-semibold text-[var(--ab-muted-soft)]">Saved to {student?.email}</p>
        </header>

        <ol className="mt-7 grid grid-cols-3 gap-2" aria-label="Profile setup progress">
          {STEPS.map((item) => {
            const active = item.id === step;
            const complete = item.id < step;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => item.id < step && changeStep(item.id)}
                  disabled={item.id > step}
                  className={`ab-focus flex w-full items-center gap-2 border-b-2 px-1 pb-3 text-left transition ${
                    active ? "border-[var(--ab-brand)]" : complete ? "border-[#9CCDB5]" : "border-[var(--ab-line)]"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${active || complete ? "bg-[var(--ab-brand)] text-white" : "bg-[#E9E6DF] text-[var(--ab-muted)]"}`}>
                    {complete ? "✓" : item.id}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-[12px] font-black sm:text-[13px] ${active ? "text-[var(--ab-ink)]" : "text-[var(--ab-muted)]"}`}>{item.label}</span>
                    <span className="hidden text-[10.5px] text-[var(--ab-muted-soft)] sm:block">{item.helper}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <form onSubmit={handleSubmit} className="mt-6 overflow-hidden rounded-lg border border-[var(--ab-line)] bg-white shadow-[var(--shadow-sm)]">
          <div className="min-h-[470px] p-5 sm:p-8 lg:p-10">
            {step === 1 && (
              <section aria-labelledby="step-one-title">
                <p className="ab-eyebrow">Step 1</p>
                <h2 id="step-one-title" className="mt-2 text-xl font-black tracking-[-0.02em]">Your details</h2>
                <p className="mt-1 text-[13px] text-[var(--ab-muted)]">Use the contact details you want attached to your study profile.</p>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="full_name" className={LABEL_CLS}>Full name</label>
                    <input id="full_name" autoComplete="name" className={INPUT_CLS} value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} placeholder="Your full legal name" />
                    <ErrorText>{errors.full_name}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="email" className={LABEL_CLS}>Verified email</label>
                    <input id="email" className={`${INPUT_CLS} cursor-not-allowed bg-[#F7F6F2] text-[var(--ab-muted)]`} value={student?.email || ""} readOnly />
                    <p className="mt-1.5 text-[11px] text-[var(--ab-muted-soft)]">Managed by Google and cannot be changed here.</p>
                  </div>
                  <div>
                    <label htmlFor="phone" className={LABEL_CLS}>Phone number</label>
                    <div className="flex h-11 overflow-hidden rounded-lg border border-[var(--ab-line)] bg-white focus-within:border-[var(--ab-brand)] focus-within:ring-4 focus-within:ring-[rgba(10,110,69,0.11)]">
                      <span className="flex items-center border-r border-[var(--ab-line)] bg-[#F7F6F2] px-3 text-[13px] font-bold text-[var(--ab-ink-soft)]">+977</span>
                      <input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" className="ab-focus min-w-0 flex-1 border-0 px-3.5 text-[14px] font-medium placeholder:text-[#AAA69D] focus:ring-0" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="98XXXXXXXX" />
                    </div>
                    <ErrorText>{errors.phone}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="location" className={LABEL_CLS}>City or district</label>
                    <input id="location" autoComplete="address-level2" className={INPUT_CLS} value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Kathmandu" />
                    <ErrorText>{errors.location}</ErrorText>
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="step-two-title">
                <p className="ab-eyebrow">Step 2</p>
                <h2 id="step-two-title" className="mt-2 text-xl font-black tracking-[-0.02em]">Academic information</h2>
                <p className="mt-1 text-[13px] text-[var(--ab-muted)]">This helps Abroadly separate admission requirements from visa requirements.</p>

                <div className="mt-7 grid gap-7 lg:grid-cols-2">
                  <div>
                    <p className={LABEL_CLS}>Have you taken an English language test?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Choice selected={form.english_test_taken === true} label="Yes" onSelect={() => setField("english_test_taken", true)} />
                      <Choice selected={form.english_test_taken === false} label="No" onSelect={() => setField("english_test_taken", false)} />
                    </div>
                    <ErrorText>{errors.english_test_taken}</ErrorText>
                  </div>

                  {form.english_test_taken === true && (
                    <div>
                      <p className={LABEL_CLS}>Which test did you take?</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                        {ENGLISH_TESTS.map((test) => <Choice key={test} selected={form.english_test_type === test} label={test} onSelect={() => setField("english_test_type", test)} />)}
                      </div>
                      <ErrorText>{errors.english_test_type}</ErrorText>
                    </div>
                  )}

                  {form.english_test_taken === false && (
                    <div>
                      <p className={LABEL_CLS}>What is your English-test plan?</p>
                      <div className="space-y-2">
                        <Choice selected={form.english_goal === "join_class"} label="I want to join a preparation class" onSelect={() => setField("english_goal", "join_class")} />
                        <Choice selected={form.english_goal === "not_looking"} label="I am not looking for a class right now" onSelect={() => setField("english_goal", "not_looking")} />
                        <Choice selected={form.english_goal === "book_test"} label="I am planning to book a test only" onSelect={() => setField("english_goal", "book_test")} />
                      </div>
                      <ErrorText>{errors.english_goal}</ErrorText>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {form.english_test_taken === true && (
                    <>
                      <div>
                        <label htmlFor="english_overall_score" className={LABEL_CLS}>Overall score</label>
                        <input id="english_overall_score" className={INPUT_CLS} value={form.english_overall_score} onChange={(e) => setField("english_overall_score", e.target.value)} placeholder="Example: 6.5 or 58" />
                        <ErrorText>{errors.english_overall_score}</ErrorText>
                      </div>
                      <div>
                        <label htmlFor="english_lowest_score" className={LABEL_CLS}>Lowest component score <span className="font-medium text-[var(--ab-muted-soft)]">(optional)</span></label>
                        <input id="english_lowest_score" className={INPUT_CLS} value={form.english_lowest_score} onChange={(e) => setField("english_lowest_score", e.target.value)} placeholder="Example: 6.0 or 50" />
                      </div>
                    </>
                  )}

                  {form.english_test_taken === false && form.english_goal === "join_class" && (
                    <div>
                      <label htmlFor="english_class_timing" className={LABEL_CLS}>Preferred class timing</label>
                      <select id="english_class_timing" className={INPUT_CLS} value={form.english_class_timing} onChange={(e) => setField("english_class_timing", e.target.value)}>
                        <option value="">Choose a time</option>
                        {CLASS_TIMES.map((time) => <option key={time}>{time}</option>)}
                      </select>
                      <ErrorText>{errors.english_class_timing}</ErrorText>
                    </div>
                  )}

                  {form.english_test_taken === false && form.english_goal === "book_test" && (
                    <div>
                      <label htmlFor="planned_english_test" className={LABEL_CLS}>Test you plan to book</label>
                      <select id="planned_english_test" className={INPUT_CLS} value={form.planned_english_test} onChange={(e) => setField("planned_english_test", e.target.value)}>
                        <option value="">Choose a test</option>
                        {ENGLISH_TESTS.map((test) => <option key={test}>{test}</option>)}
                      </select>
                      <ErrorText>{errors.planned_english_test}</ErrorText>
                    </div>
                  )}

                  <div>
                    <label htmlFor="education_level" className={LABEL_CLS}>Latest qualification</label>
                    <select id="education_level" className={INPUT_CLS} value={form.education_level} onChange={(e) => setField("education_level", e.target.value as EducationLevel)}>
                      <option value="">Choose your qualification</option>
                      {EDUCATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <ErrorText>{errors.education_level}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="qualification_year" className={LABEL_CLS}>Year of completion</label>
                    <select id="qualification_year" className={INPUT_CLS} value={form.qualification_year} onChange={(e) => setField("qualification_year", e.target.value)}>
                      <option value="">Choose a year</option>
                      {COMPLETION_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <ErrorText>{errors.qualification_year}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="score_type" className={LABEL_CLS}>Score type</label>
                    <select id="score_type" className={INPUT_CLS} value={form.score_type} onChange={(e) => setField("score_type", e.target.value as ScoreType)}>
                      <option value="">Choose score type</option>
                      {SCORE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <ErrorText>{errors.score_type}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="academic_score" className={LABEL_CLS}>Score or grade</label>
                    <input id="academic_score" className={INPUT_CLS} value={form.academic_score} onChange={(e) => setField("academic_score", e.target.value)} placeholder={form.score_type === "percentage" ? "Example: 72%" : form.score_type === "gpa" ? "Example: 3.25" : "Enter your result"} />
                    <ErrorText>{errors.academic_score}</ErrorText>
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="step-three-title">
                <p className="ab-eyebrow">Step 3</p>
                <h2 id="step-three-title" className="mt-2 text-xl font-black tracking-[-0.02em]">Destination and support</h2>
                <p className="mt-1 text-[13px] text-[var(--ab-muted)]">Choose what you are aiming for. You can refine this later in chat.</p>

                <div className="mt-7" ref={dropdownRef}>
                  <div className="flex items-center justify-between gap-4">
                    <p className={LABEL_CLS}>Interested countries</p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className={`ab-focus flex h-11 w-full items-center justify-between rounded-lg border border-[var(--ab-line)] bg-white px-3.5 text-[14px] font-medium text-[var(--ab-ink)] transition hover:border-[#D4D0C7] focus:border-[var(--ab-brand)] focus:ring-4 focus:ring-[rgba(10,110,69,0.11)] ${
                        isDropdownOpen ? "border-[var(--ab-brand)]" : ""
                      }`}
                    >
                      <span className={form.target_countries.length === 0 ? "text-[#AAA69D]" : "text-[var(--ab-ink)] font-semibold"}>
                        {form.target_countries.length === 0
                          ? "Select target countries..."
                          : `${form.target_countries.length} countr${form.target_countries.length === 1 ? "y" : "ies"} selected`}
                      </span>
                      <svg
                        className={`h-4 w-4 text-[var(--ab-muted)] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[var(--ab-line)] bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                        {COUNTRY_OPTIONS.map((country) => {
                          const selected = form.target_countries.includes(country);
                          return (
                            <button
                              key={country}
                              type="button"
                              onClick={() => toggleCountry(country)}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13.5px] font-semibold transition ${
                                selected
                                  ? "bg-[#F0F8F4] text-[var(--ab-ink)]"
                                  : "text-[var(--ab-ink-soft)] hover:bg-[#F7F6F2]"
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-[var(--ab-brand)] bg-[var(--ab-brand)] text-white" : "border-[#B8B3A9]"}`}>
                                  {selected && "✓"}
                                </span>
                                {country}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <ErrorText>{errors.target_countries}</ErrorText>

                  {/* Selected countries pills/chips below */}
                  {form.target_countries.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {form.target_countries.map((country) => (
                        <span
                          key={country}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--ab-line)] bg-[#F5F2EB] px-2.5 py-1 text-[12px] font-bold text-[var(--ab-ink)] shadow-[var(--shadow-xs)]"
                        >
                          {country}
                          <button
                            type="button"
                            onClick={() => toggleCountry(country)}
                            className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[var(--ab-muted)] hover:bg-[#E9E6DF] hover:text-[var(--ab-ink)]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="preferred_field" className={LABEL_CLS}>What do you want to study?</label>
                    <input id="preferred_field" className={INPUT_CLS} value={form.preferred_field} onChange={(e) => setField("preferred_field", e.target.value)} placeholder="Computer Science, Nursing, Business..." />
                    <ErrorText>{errors.preferred_field}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="intended_study_level" className={LABEL_CLS}>Intended study level</label>
                    <select id="intended_study_level" className={INPUT_CLS} value={form.intended_study_level} onChange={(e) => setField("intended_study_level", e.target.value)}>
                      <option value="">Choose a level</option>
                      {STUDY_LEVELS.map((level) => <option key={level}>{level}</option>)}
                    </select>
                    <ErrorText>{errors.intended_study_level}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="preferred_intake" className={LABEL_CLS}>Preferred intake</label>
                    <select id="preferred_intake" className={INPUT_CLS} value={form.preferred_intake} onChange={(e) => setField("preferred_intake", e.target.value)}>
                      <option value="">Choose an intake</option>
                      {INTAKES.map((intake) => <option key={intake}>{intake}</option>)}
                    </select>
                    <ErrorText>{errors.preferred_intake}</ErrorText>
                  </div>
                  <div>
                    <label htmlFor="budget_range" className={LABEL_CLS}>Approximate tuition budget <span className="font-medium text-[var(--ab-muted-soft)]">(optional)</span></label>
                    <select id="budget_range" className={INPUT_CLS} value={form.budget_range} onChange={(e) => setField("budget_range", e.target.value)}>
                      <option value="">Choose a range</option>
                      {BUDGETS.map((budget) => <option key={budget}>{budget}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="goals" className={LABEL_CLS}>Anything Abroadly should know? <span className="font-medium text-[var(--ab-muted-soft)]">(optional)</span></label>
                    <textarea id="goals" rows={3} className={`${INPUT_CLS} h-auto resize-none py-3`} value={form.goals} onChange={(e) => setField("goals", e.target.value)} placeholder="Example: I need affordable options and I am worried about a two-year study gap." />
                  </div>
                </div>

                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--ab-line)] bg-[#FAFAF8] p-4">
                  <input type="checkbox" className="mt-0.5 rounded border-[#B8B3A9] text-[var(--ab-brand)] focus:ring-[var(--ab-brand)]" checked={form.call_consent} onChange={(e) => setField("call_consent", e.target.checked)} />
                  <span>
                    <span className="block text-[13px] font-black text-[var(--ab-ink)]">I would like an optional counsellor callback</span>
                    <span className="mt-1 block text-[11.5px] leading-5 text-[var(--ab-muted)]">This is not required. Selecting it gives Abroadly permission to contact the phone number above for a no-pressure review.</span>
                  </span>
                </label>
              </section>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-[var(--ab-line)] bg-[#FAFAF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-[11px] leading-5 text-[var(--ab-muted-soft)]">Your answers are saved to your Google-verified profile.</p>
            <div className="flex gap-2">
              {step > 1 && (
                <button type="button" onClick={() => changeStep((step - 1) as Step)} className="ab-focus h-10 rounded-lg border border-[var(--ab-line)] bg-white px-4 text-[12.5px] font-black text-[var(--ab-ink)] transition hover:border-[#BBB6AB]">Previous</button>
              )}
              <button type="submit" disabled={submitting} className="ab-focus inline-flex h-10 min-w-[112px] items-center justify-center rounded-lg bg-[var(--ab-ink)] px-5 text-[12.5px] font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60">
                {step < 3 ? "Next" : submitting ? "Saving..." : "Save and continue"}
              </button>
            </div>
          </footer>
        </form>

        {apiError && <p className="mt-4 rounded-lg border border-[#F3C7C2] bg-[#FEF3F2] px-4 py-3 text-[12px] font-semibold text-[#B42318]">{apiError}</p>}
        <p className="mt-5 text-center text-[11px] text-[var(--ab-muted-soft)]">Already completed this before? <Link href="/chat" className="font-bold text-[var(--ab-ink)] hover:underline">Open chat</Link></p>
      </div>
    </main>
  );
}
