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

const selectClass =
  "ab-focus min-h-12 cursor-pointer appearance-none rounded-full border border-slate-200 bg-white py-3 pl-5 pr-11 text-[16px] font-bold text-slate-800 shadow-sm transition hover:border-[#0044FF]/50 focus:border-[#0044FF] focus:ring-4 focus:ring-[#0044FF]/15 sm:text-[17px]";

const OPTION_CLASS = "bg-white text-slate-900";

export function HeroIntentForm() {
  const [degree, setDegree] = useState("");
  const [country, setCountry] = useState("");
  const [signInOpen, setSignInOpen] = useState(false);

  const start = () => {
    try {
      if (degree && country) {
        localStorage.setItem("abroadly_intent", JSON.stringify({ degree, country }));
      }
    } catch {
      /* storage blocked — sign-in still proceeds */
    }
    setSignInOpen(true);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* selector sentence */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-[18px] font-medium text-slate-700 shadow-xl sm:px-8 sm:text-[20px]">
        <span>I want to study</span>

        <div className="relative">
          <label className="sr-only" htmlFor="hero-degree">Degree</label>
          <select
            id="hero-degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className={selectClass}
            style={{ appearance: "none", WebkitAppearance: "none", backgroundImage: "none" }}
          >
            <option value="" disabled className={OPTION_CLASS}>Select degree</option>
            {DEGREES.map((d) => (
              <option key={d} value={d} className={OPTION_CLASS}>{d}</option>
            ))}
          </select>
          <Chevron />
        </div>

        <span className="text-slate-400">in</span>

        <div className="relative">
          <label className="sr-only" htmlFor="hero-country">Country</label>
          <select
            id="hero-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={selectClass}
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
        className="ab-focus inline-flex h-14 items-center justify-center rounded-full bg-[#0044FF] px-10 text-[18px] font-bold text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-600 duration-300"
      >
        Start learning
      </button>

      <GoogleSignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
