"use client";

import { useState } from "react";
import { GoogleSignInModal } from "@/components/google-sign-in-modal";

/* Hero call-to-action: pick a degree + country, then sign in with Google.
 * The choice is stashed in localStorage so onboarding can pre-fill it. */

const DEGREES = ["Bachelor's", "Master's", "PhD", "MBA", "Diploma"];

const COUNTRIES: { value: string; label: string }[] = [
  { value: "United Kingdom", label: "the UK" },
  { value: "United States", label: "the USA" },
  { value: "Australia", label: "Australia" },
  { value: "Canada", label: "Canada" },
];

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
      fill="none"
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

const selectClass =
  "ab-focus min-h-12 cursor-pointer appearance-none rounded-[14px] border border-slate-200 bg-[#F8FAFC] py-3 pl-4 pr-11 text-[16px] font-bold text-slate-800 shadow-sm transition hover:border-[#0044FF]/45 focus:border-[#0044FF] focus:bg-white focus:ring-4 focus:ring-[#0044FF]/15 sm:rounded-full sm:bg-white sm:pl-5 sm:text-[17px]";

const OPTION_CLASS = "bg-white text-slate-900";

export function HeroIntentForm() {
  const [degree, setDegree] = useState("");
  const [country, setCountry] = useState("");

  const start = () => {
    try {
      if (degree && country) {
        localStorage.setItem("abroadly_intent", JSON.stringify({ degree, country }));
      }
    } catch {
      /* storage blocked — sign-in still proceeds */
    }
    // Direct redirect to Google Auth
    window.location.href = "/api/auth/google/login";
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-6">
      {/* selector sentence */}
      <div className="flex w-full max-w-[24rem] flex-col items-stretch justify-center gap-2.5 rounded-[22px] border border-slate-200 bg-white/95 px-3.5 py-3.5 text-[15px] font-semibold text-slate-700 shadow-[0_22px_55px_-34px_rgba(15,23,42,0.45)] sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-3 sm:rounded-full sm:px-6 sm:py-4 sm:text-[20px]">
        <span className="text-center leading-tight sm:text-left">I want to study</span>

        <div className="relative w-full sm:w-auto">
          <label className="sr-only" htmlFor="hero-degree">Degree</label>
          <select
            id="hero-degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className={`${selectClass} w-full sm:w-auto`}
            style={{ appearance: "none", WebkitAppearance: "none", backgroundImage: "none" }}
          >
            <option value="" disabled className={OPTION_CLASS}>Select degree</option>
            {DEGREES.map((d) => (
              <option key={d} value={d} className={OPTION_CLASS}>{d}</option>
            ))}
          </select>
          <Chevron />
        </div>

        <span className="text-center text-[13px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[20px] sm:normal-case sm:tracking-normal">in</span>

        <div className="relative w-full sm:w-auto">
          <label className="sr-only" htmlFor="hero-country">Country</label>
          <select
            id="hero-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={`${selectClass} w-full sm:w-auto`}
            style={{ appearance: "none", WebkitAppearance: "none", backgroundImage: "none" }}
          >
            <option value="" disabled className={OPTION_CLASS}>Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value} className={OPTION_CLASS}>{c.label}</option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>

      <button
        onClick={start}
        className="ab-focus inline-flex min-h-[52px] w-full max-w-[24rem] items-center justify-center gap-3 rounded-full bg-[#0044FF] px-8 text-[16px] font-bold text-white shadow-xl shadow-blue-500/25 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-600 active:scale-[0.99] sm:h-14 sm:w-auto sm:max-w-none sm:text-[18px]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          <GoogleMark />
        </span>
        Start learning
      </button>
    </div>
  );
}
