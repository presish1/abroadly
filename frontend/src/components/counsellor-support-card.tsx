"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight, LoaderCircle, PhoneCall } from "lucide-react";
import { useState } from "react";
import { requestCounselorCall, type StudentOut } from "@/lib/api";

interface CounsellorSupportCardProps {
  student: StudentOut;
  onUpdated?: (student: StudentOut) => void;
  variant?: "card" | "row";
}

export function CounsellorSupportCard({
  student,
  onUpdated,
  variant = "card",
}: CounsellorSupportCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function requestCall() {
    if (!student.phone || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await requestCounselorCall(student.id, student.phone);
      onUpdated?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send your request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isRow = variant === "row";
  const shellClass = isRow
    ? "border border-[#E8E5DD] bg-white px-4 py-4"
    : "border border-[#D7E7DD] bg-[#F5FAF7] px-4 py-4 shadow-[0_8px_24px_rgba(10,110,69,0.06)]";

  return (
    <section className={`counsellor-support-card rounded-[14px] ${shellClass}`} aria-labelledby={`support-title-${variant}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E8F2EC] text-[#0A6E45]">
          <PhoneCall aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase text-[#0A6E45]">Human support</p>
          <h2 id={`support-title-${variant}`} className="mt-0.5 text-[15px] font-extrabold text-[#1B1916]">Need human help?</h2>
          <p className="mt-1 text-[12.5px] leading-5 text-[#6B655C]">Ask for a free, no-pressure callback to review your situation.</p>
        </div>
      </div>

      {student.call_consent ? (
        <div className="mt-3 flex min-h-11 items-center gap-2 rounded-[10px] border border-[#CFE4D7] bg-white px-3 text-[12.5px] font-bold text-[#0A6E45]" role="status">
          <CheckCircle2 aria-hidden className="h-4 w-4" />
          Request received
        </div>
      ) : !student.phone ? (
        <Link href="/chat/profile" className="ab-focus mt-3 flex min-h-11 items-center justify-between rounded-[10px] bg-[#1B1916] px-3.5 text-[12.5px] font-bold text-white">
          Add phone to request a call
          <ChevronRight aria-hidden className="h-4 w-4" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={requestCall}
          disabled={submitting}
          className="ab-focus mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0A6E45] px-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#075B39] disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" /> : <PhoneCall aria-hidden className="h-4 w-4" />}
          {submitting ? "Sending request..." : error ? "Try again" : "Request a call"}
        </button>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-5 text-[#B42318]" role="alert">
          <AlertCircle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </section>
  );
}
