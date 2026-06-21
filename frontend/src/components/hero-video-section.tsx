"use client";

import Link from "next/link";

export function HeroVideoSection() {
  return (
    <section className="ab-video-section" aria-labelledby="english-class-title">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ab-eyebrow justify-center">Learn before you commit</p>
          <h2 id="english-class-title" className="ab-display-2 mt-3 text-[#17151D]">
            Start with a clearer English plan.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-[#706A7B]">
            Watch the short introduction. Upload 8 documents to your profile to claim a free English proficiency class built around your preferred test and schedule.
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
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Link
            href="/onboarding"
            className="ab-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-[#4C3CE8] px-6 text-[14px] font-extrabold text-white shadow-[0_14px_30px_-14px_rgba(76,60,232,0.72)] transition hover:-translate-y-0.5 hover:bg-[#3D2DDA] active:translate-y-0"
          >
            Get a free English proficiency class
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3 w-3 shrink-0">
              <path d="M6.5 3L11.5 8L6.5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-[12px] font-semibold text-[#8B8499]">No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
