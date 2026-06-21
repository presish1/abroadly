"use client";

import { useEffect, useMemo, useState } from "react";
import {
  requestService,
  type ServiceRequestType,
  type StudentOut,
} from "@/lib/api";

const TESTS = ["IELTS", "PTE", "TOEFL"];
const TIMES = ["Morning", "Afternoon", "Evening"];

function cleanTiming(value: string | null | undefined): string {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("afternoon")) return "Afternoon";
  if (normalized.includes("evening")) return "Evening";
  return "Morning";
}

function defaultTest(student: StudentOut): string {
  const value = student.planned_english_test || student.english_test_type || "IELTS";
  const match = TESTS.find((test) => value.toLowerCase().includes(test.toLowerCase()));
  return match || "IELTS";
}

export function ServiceRequestModal({
  student,
  requestType,
  preferredTest,
  onClose,
  onConfirmed,
}: {
  student: StudentOut;
  requestType: Extract<ServiceRequestType, "test_booking" | "class_booking">;
  preferredTest?: string;
  onClose: () => void;
  onConfirmed?: (student: StudentOut) => void;
}) {
  const initialTest = useMemo(() => {
    const inferred = TESTS.find((item) => preferredTest?.toLowerCase().includes(item.toLowerCase()));
    return inferred || defaultTest(student);
  }, [preferredTest, student]);
  const initialTime = useMemo(() => cleanTiming(student.english_class_timing), [student]);
  const [test, setTest] = useState(initialTest);
  const [time, setTime] = useState(initialTime);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClass = requestType === "class_booking";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await requestService(student.id, {
        request_type: requestType,
        phone: student.phone || undefined,
        test_type: test,
        preferred_time: time,
      });
      setConfirmed(true);
      onConfirmed?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not save this request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" aria-label="Close booking" onClick={onClose} className="service-modal-overlay" />
      <section className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
        <button type="button" onClick={onClose} aria-label="Close" className="ab-focus service-modal-close">
          <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4" fill="none">
            <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {confirmed ? (
          <div className="py-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ECF5EF] text-[#0A6E45]">
              <svg viewBox="0 0 20 20" aria-hidden className="h-6 w-6" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="m6.5 10 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 id="service-modal-title" className="mt-4 text-[18px] font-extrabold text-[#1B1916]">Request confirmed</h2>
            <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-6 text-[#6B655C]">
              We saved your {test} preference for {time.toLowerCase()}. The Abroadly team will confirm the exact slot by phone.
            </p>
            <button type="button" onClick={onClose} className="ab-focus mt-5 w-full rounded-lg bg-[#1B1916] px-4 py-3 text-[13px] font-bold text-white hover:bg-black">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#0A6E45]">
              {isClass ? "Free preparation class" : "English test plan"}
            </p>
            <h2 id="service-modal-title" className="mt-2 pr-8 text-[19px] font-extrabold tracking-[-0.02em] text-[#1B1916]">
              {isClass ? "Confirm your free class" : "Confirm your test booking"}
            </h2>
            <p className="mt-2 text-[12.5px] leading-6 text-[#6B655C]">
              We used your onboarding answers. Check the two details below, then confirm once.
            </p>

            <div className="mt-5 grid gap-4">
              <fieldset>
                <legend className="text-[11px] font-bold text-[#3F3A33]">Test</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TESTS.map((value) => (
                    <button key={value} type="button" aria-pressed={test === value} onClick={() => setTest(value)} className={`ab-focus service-choice ${test === value ? "is-selected" : ""}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-[11px] font-bold text-[#3F3A33]">Preferred time</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TIMES.map((value) => (
                    <button key={value} type="button" aria-pressed={time === value} onClick={() => setTime(value)} className={`ab-focus service-choice ${time === value ? "is-selected" : ""}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {student.phone ? (
              <p className="mt-4 rounded-lg bg-[#F4F2EC] px-3 py-2.5 text-[11px] text-[#6B655C]">
                Confirmation number <span className="font-bold text-[#1B1916]">{student.phone}</span>
              </p>
            ) : (
              <p className="mt-4 rounded-lg bg-[#FFF5E6] px-3 py-2.5 text-[11px] text-[#8A5A00]">Add a phone number in your profile before confirming.</p>
            )}

            {error && <p className="mt-3 text-[11px] font-semibold text-[#B42318]">{error}</p>}
            <button type="button" onClick={confirm} disabled={submitting || !student.phone} className="ab-focus mt-5 w-full rounded-lg bg-[#1B1916] px-4 py-3 text-[13px] font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45">
              {submitting ? "Confirming..." : "Confirm booking"}
            </button>
          </>
        )}
      </section>
    </>
  );
}
