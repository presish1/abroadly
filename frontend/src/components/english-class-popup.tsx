"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, Gift } from "lucide-react";

const SESSION_KEY = "ab_eng_popup_session";

function getIsDismissed(): boolean {
  if (typeof sessionStorage !== "undefined") {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }
  return false;
}

function markDismissed() {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
}

/* ── Drag/swipe to dismiss hook ─────────────────────────────────────── */
function useDragDismiss(onDismiss: () => void, centered = true) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // FIX: prevent drag-dismiss when clicking buttons or links (ensures X button works properly)
    if ((e.target as HTMLElement).closest("button, a")) return;
    startX.current = e.clientX;
    isDragging.current = true;
    if (ref.current) { 
      ref.current.style.transition = "none"; 
      ref.current.setPointerCapture(e.pointerId); 
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !ref.current) return;
    const dx = e.clientX - startX.current;
    if (dx > 0) {
      ref.current.style.transform = centered ? `translateX(calc(-50% + ${dx}px))` : `translateX(${dx}px)`;
      ref.current.style.opacity = String(Math.max(0, 1 - dx / 180));
    }
  }, [centered]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !ref.current) return;
    isDragging.current = false;
    const dx = e.clientX - startX.current;
    if (dx > 90) {
      ref.current.style.transition = "all 0.28s ease";
      ref.current.style.transform = centered ? `translateX(calc(-50% + 500px))` : `translateX(500px)`;
      ref.current.style.opacity = "0";
      setTimeout(onDismiss, 300);
    } else {
      ref.current.style.transition = "all 0.28s ease";
      ref.current.style.transform = centered ? "translateX(-50%)" : "translateX(0)";
      ref.current.style.opacity = "1";
    }
  }, [onDismiss, centered]);

  return { ref, handlePointerDown, handlePointerMove, handlePointerUp };
}

/* ── Shared popup icon ───────────────────────────────────────────────── */
function BookIcon({ small = false }: { small?: boolean }) {
  const size = small ? "h-8 w-8" : "h-10 w-10";
  const icon = small ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600`}>
      <svg className={icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    </div>
  );
}

/* ── Full popup (landing page) ───────────────────────────────────────── */
export function EnglishClassPopup() {
  const [show, setShow] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const autoDismissRef = useRef<NodeJS.Timeout | null>(null);

  const { ref, handlePointerDown, handlePointerMove, handlePointerUp } = useDragDismiss(() => {
    setShow(false);
    markDismissed();
  });

  useEffect(() => {
    if (getIsDismissed()) return;
    
    // Show after a random delay: between 10 to 25 seconds
    const randomDelay = Math.floor(Math.random() * 15000) + 10000;
    
    const showTimer = setTimeout(() => {
      setShow(true);
      
      // Auto-disappear after 12 seconds
      autoDismissRef.current = setTimeout(() => {
        setShow(false);
        markDismissed();
      }, 12000);
    }, randomDelay);

    return () => {
      clearTimeout(showTimer);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, []);

  const handleClose = () => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setShow(false);
    markDismissed();
  };

  const handleClaim = () => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setClaimed(true);
    setTimeout(() => {
      setShow(false);
      markDismissed();
    }, 2200);
  };

  if (!show) return null;

  return (
    <div
      ref={ref}
      className="fixed bottom-6 left-1/2 z-[1000] w-[92%] max-w-sm touch-pan-y select-none"
      style={{ transform: "translateX(-50%)" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/90 p-6 backdrop-blur-md shadow-[0_20px_50px_rgba(10,110,69,0.12),0_4px_16px_rgba(0,0,0,0.06)] animate-[abFadeUp_0.45s_ease-out]">
        {/* X close */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {claimed ? (
          <div className="py-2 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900">You're in!</h3>
            <p className="mt-1 text-sm text-slate-500">We'll reach out to schedule your free class.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <BookIcon />
              <h3 className="font-bold text-slate-900 text-[17px] leading-tight">Free English Class</h3>
            </div>

            <p className="text-[13.5px] text-slate-600 mb-5 leading-relaxed">
              Claim a free IELTS/PTE/TOEFL proficiency class tailored to your target university.
            </p>

            <button
              onClick={handleClaim}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0044FF] py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-600 active:scale-95"
            >
              <Gift aria-hidden="true" className="h-4 w-4" /> Claim my free class
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Compact popup (chat page) ───────────────────────────────────────── */
export function EnglishClassPopupCompact({
  variant = "floating",
  onClaim,
  onOpenDocuments,
}: {
  variant?: "floating" | "sidebar";
  onClaim?: () => void;
  onOpenDocuments?: () => void;
}) {
  const [show, setShow] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const autoDismissRef = useRef<NodeJS.Timeout | null>(null);

  const { ref, handlePointerDown, handlePointerMove, handlePointerUp } = useDragDismiss(() => {
    setShow(false);
    markDismissed();
  }, false); // false = not centered, swipe from right edge

  useEffect(() => {
    if (getIsDismissed()) return;
    
    // Show after a random delay: between 10 to 25 seconds
    const randomDelay = Math.floor(Math.random() * 15000) + 10000;
    
    const showTimer = setTimeout(() => {
      setShow(true);
      
      // Auto-disappear after 12 seconds
      autoDismissRef.current = setTimeout(() => {
        setShow(false);
        markDismissed();
      }, 12000);
    }, randomDelay);

    return () => {
      clearTimeout(showTimer);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, []);

  const handleClose = () => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setShow(false);
    markDismissed();
  };

  const handleClaim = () => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setClaimed(true);
    setTimeout(() => {
      setShow(false);
      markDismissed();
      if (onClaim) {
        onClaim();
      } else if (onOpenDocuments) {
        onOpenDocuments();
      } else {
        window.location.href = "/chat/documents";
      }
    }, 1800);
  };

  if (!show) return null;

  if (variant === "sidebar") {
    return (
      <div className="relative w-full rounded-[20px] border border-[#E8E5DD] bg-white p-4 shadow-sm animate-[abFadeUp_0.4s_ease-out] mt-auto mb-3 select-none">
        {/* X close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {claimed ? (
          <div className="py-1 text-center">
            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-slate-900">You're in!</p>
            <p className="text-xs text-slate-500 mt-0.5">We'll reach out soon.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2.5 pr-5">
              <BookIcon small />
              <div>
                <p className="text-[13px] font-bold text-slate-900 leading-snug">Free English Class</p>
                <p className="mt-0.5 text-[11.5px] text-slate-500 leading-relaxed">
                  Claim a free IELTS/PTE/TOEFL proficiency class tailored to your target university.
                </p>
              </div>
            </div>

            <button
              onClick={handleClaim}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0044FF] py-2 text-[12px] font-bold text-white shadow-md shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-600 active:scale-95"
            >
              <Gift aria-hidden="true" className="h-3.5 w-3.5" /> Claim free class
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="fixed top-20 left-4 z-[1000] w-[calc(100vw-2rem)] max-w-xs touch-pan-y select-none sm:top-24 sm:left-6 md:hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="overflow-hidden rounded-[20px] border border-white/60 bg-white/90 p-4 backdrop-blur-md shadow-[0_20px_50px_rgba(10,110,69,0.1),0_4px_16px_rgba(0,0,0,0.04)] animate-[abFadeUp_0.4s_ease-out]">
        {/* X close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {claimed ? (
          <div className="py-1 text-center">
            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-slate-900">You're in!</p>
            <p className="text-xs text-slate-500 mt-0.5">We'll reach out soon.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2.5 pr-5">
              <BookIcon small />
              <div>
                <p className="text-[13px] font-bold text-slate-900 leading-snug">Free English Class</p>
                <p className="mt-0.5 text-[11.5px] text-slate-500 leading-relaxed">
                  Claim a free IELTS/PTE/TOEFL proficiency class tailored to your target university.
                </p>
              </div>
            </div>

            <button
              onClick={handleClaim}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0044FF] py-2 text-[12px] font-bold text-white shadow-md shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-600 active:scale-95"
            >
              <Gift aria-hidden="true" className="h-3.5 w-3.5" /> Claim free class
            </button>
          </>
        )}
      </div>
    </div>
  );
}
