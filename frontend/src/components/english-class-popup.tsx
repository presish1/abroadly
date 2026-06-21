"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

export function EnglishClassPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show popup after 8 seconds of engagement
    const timer = setTimeout(() => {
      // Only show if they haven't seen it recently
      setShow(true);
      // Fire confetti from the bottom center when it pops up
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.9 },
        colors: ['#0044FF', '#4C3CE8', '#FFCC00', '#EA4335', '#34A853'],
        zIndex: 9999
      });
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 animate-[abFadeUp_0.5s_ease-out]">
      <button 
        onClick={() => setShow(false)}
        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        aria-label="Close popup"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 text-[17px] leading-tight">Free English Class</h3>
      </div>
      
      <p className="text-sm text-slate-600 mb-5">
        Upload 8 documents to your profile to claim a free IELTS/PTE/TOEFL proficiency class tailored to your target university.
      </p>
      
      <Link
        href="/onboarding"
        onClick={() => setShow(false)}
        className="flex w-full items-center justify-center rounded-full bg-[#0044FF] py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-600"
      >
        Claim my free class
      </Link>
    </div>
  );
}
