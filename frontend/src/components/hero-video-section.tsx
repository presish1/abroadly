"use client";

import { useState } from "react";
import { GoogleSignInModal } from "@/components/google-sign-in-modal";

export function HeroVideoSection() {
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <section className="ab-video-section" aria-labelledby="english-class-title">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ab-eyebrow justify-center">Learn before you commit</p>
          <h2 id="english-class-title" className="ab-display-2 mt-3 text-[#17151D]">
            Start with a clearer English plan.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-[#706A7B]">
            Watch the short introduction, then claim a free English proficiency class built around your preferred test and schedule.
          </p>
        </div>

        <div className="ab-video-stage mx-auto mt-9 max-w-4xl">
          <div className="ab-video-frame">
            <iframe
              src="https://www.youtube-nocookie.com/embed/L2KzVm-oTdg?autoplay=1&mute=1&loop=1&playlist=L2KzVm-oTdg&playsinline=1&rel=0&modestbranding=1"
              title="English proficiency class introduction"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <span className="ab-video-muted-badge" aria-label="Video starts muted">
            <svg viewBox="0 0 20 20" aria-hidden fill="none">
              <path d="M4 8h3l4-3v10l-4-3H4V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="m14 8 3 4m0-4-3 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Starts muted
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <button
            type="button"
            onClick={() => setSignInOpen(true)}
            className="ab-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-[#4C3CE8] px-6 text-[14px] font-extrabold text-white shadow-[0_14px_30px_-14px_rgba(76,60,232,0.72)] transition hover:-translate-y-0.5 hover:bg-[#3D2DDA] active:translate-y-0"
          >
            Get a free English proficiency class
            <svg viewBox="0 0 18 18" aria-hidden className="h-4 w-4" fill="none">
              <path d="M4 9h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-[11.5px] font-semibold text-[#8B8595]">Google sign-in · no payment required</p>
        </div>
      </div>

      <GoogleSignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </section>
  );
}
