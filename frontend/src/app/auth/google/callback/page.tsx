"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeGoogleCode, googleLoginUrl } from "@/lib/api";

function GoogleCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = search.get("code");
    const state = search.get("state");
    const oauthError = search.get("error");

    if (oauthError) {
      setError("Google sign-in was cancelled or denied.");
      return;
    }
    if (!code || !state) {
      setError("Google sign-in returned without the required code.");
      return;
    }

    let cancelled = false;
    exchangeGoogleCode(code, state)
      .then((res) => {
        if (cancelled) return;
        if (res.student) {
          localStorage.setItem("abroadly_student_id", res.student.id);
          router.replace(res.student.profile_completed ? "/chat" : "/onboarding/details");
          return;
        }
        if (res.requires_profile && res.pending_profile) {
          localStorage.removeItem("abroadly_student_id");
          router.replace("/onboarding/details");
          return;
        }
        setError("Google sign-in did not return a usable profile. Please try again.");
      })
      .catch(() => {
        if (!cancelled) setError("Google sign-in failed. Please try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [router, search]);

  if (!error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-5 text-[#21143d]">
        <section className="w-full max-w-md rounded-lg border border-[#ded8ee] bg-white p-6 text-center shadow-sm animate-pulse">
          <div className="mx-auto h-11 w-11 rounded-md bg-[#ded8ee]" />
          <div className="mx-auto mt-6 h-6 w-36 rounded-md bg-[#ded8ee]" />
          <div className="mx-auto mt-4 h-3.5 w-64 rounded bg-[#ded8ee]" />
          <div className="mx-auto mt-2 h-3.5 w-44 rounded bg-[#ded8ee]" />
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-5 text-[#21143d]">
      <section className="w-full max-w-md rounded-lg border border-[#ded8ee] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-[#673de6] text-sm font-black text-white">
          A
        </div>
        <h1 className="mt-5 text-2xl font-black">Sign-in needs another try</h1>
        <p className="mt-3 text-sm leading-6 text-[#6a607f]">{error}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={googleLoginUrl()}
            className="ab-focus rounded-md bg-[#673de6] px-5 py-3 text-sm font-black text-white transition hover:bg-[#5025d1]"
          >
            Try Google again
          </Link>
          <Link
            href="/onboarding"
            className="ab-focus rounded-md border border-[#d9d3ea] bg-white px-5 py-3 text-sm font-black text-[#342456] transition hover:border-[#673de6]"
          >
            Back to sign-in
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-5 text-[#21143d]">
          <section className="w-full max-w-md rounded-lg border border-[#ded8ee] bg-white p-6 text-center shadow-sm animate-pulse">
            <div className="mx-auto h-11 w-11 rounded-md bg-[#ded8ee]" />
            <div className="mx-auto mt-6 h-6 w-36 rounded-md bg-[#ded8ee]" />
            <div className="mx-auto mt-4 h-3.5 w-64 rounded bg-[#ded8ee]" />
            <div className="mx-auto mt-2 h-3.5 w-44 rounded bg-[#ded8ee]" />
          </section>
        </main>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
