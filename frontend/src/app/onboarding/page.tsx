import Link from "next/link";
import { GoogleSignInButton } from "../google-sign-in-button";

const nextChips = [
  "Education + GPA",
  "Target country",
  "Field & goals",
  "Saved once",
];

export default function OnboardingPage() {
  return (
    <main 
      className="relative min-h-screen flex flex-col md:flex-row items-stretch text-[var(--ab-ink)] font-sans bg-cover bg-center overflow-x-hidden"
      style={{ 
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1920&q=80')" 
      }}
    >
      {/* Left Side: Brand Text Overlay (Floating look, hidden on Mobile) */}
      <section className="hidden md:flex md:w-[50%] lg:w-[55%] xl:w-[60%] flex-col justify-between p-10 lg:p-16 text-white select-none z-10">
        {/* Top: Logo & Name */}
        <Link href="/" className="inline-flex items-center gap-2.5 text-white font-extrabold text-[22px] tracking-tight hover:opacity-90 transition">
          <img src="/images/abroadly-logo.svg" alt="Abroadly" className="h-8 w-8 object-contain bg-white rounded-lg p-1" />
          <span>Abroadly</span>
        </Link>

        {/* Middle/Bottom: Premium Text Overlay */}
        <div className="my-auto max-w-lg lg:max-w-xl py-12">
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#7DDBB1] mb-4 block">
            Welcome to Abroadly
          </span>
          <h1 className="text-[40px] lg:text-[50px] xl:text-[56px] font-black leading-tight tracking-[-0.035em] text-white">
            Your personal path to global education.
          </h1>
          <p className="mt-6 text-[15px] lg:text-[17px] text-white/80 leading-relaxed font-medium max-w-md">
            Verify your email, setup your study preferences once, and unlock precise admits matched to your academic record.
          </p>
        </div>

        {/* Bottom: Footer Info */}
        <p className="text-[11px] text-white/40">
          &copy; {new Date().getFullYear()} Abroadly.online &middot; All rights reserved.
        </p>
      </section>

      {/* Right Side: Centered/Floating card */}
      <section className="flex-1 flex items-center justify-center p-4 sm:p-10 lg:p-16 xl:p-24 z-10">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 flex flex-col justify-between border border-slate-100/50">
          <div>
            {/* Back Button */}
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="ab-focus inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ab-muted)] hover:text-[var(--ab-ink)] transition">
                &larr; Back to home
              </Link>
            </div>

            {/* Mobile Logo Header */}
            <div className="flex items-center gap-2 md:hidden mb-6">
              <img src="/images/abroadly-logo.svg" alt="Abroadly" className="h-8 w-8 object-contain bg-slate-50 rounded-lg p-1" />
              <span className="text-[18px] font-black tracking-tight text-[var(--ab-ink)]">Abroadly</span>
            </div>

            <h2 className="text-[28px] font-black tracking-[-0.03em] text-[var(--ab-ink)]">Sign in</h2>
            <p className="mt-2 text-[13.5px] font-semibold text-[var(--ab-muted)] leading-relaxed">
              New to Abroadly? We&apos;ll create your profile automatically.
            </p>

            {/* Google Sign-in Card */}
            <div className="mt-8">
              <GoogleSignInButton
                variant="outline"
                label="Continue with Google"
                caption="No password needed — email verification"
                className="w-full justify-center py-6 border-[#ded8ee] hover:border-[#673de6]"
              />
            </div>

            <p className="mt-5 text-[12px] leading-relaxed text-[var(--ab-muted)] font-medium">
              Abroadly secures your session using Google authentication. We never see your password, and store only the fields you choose to share.
            </p>

            {/* Up Next List */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ab-muted)] mb-3">Up next in profile setup</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[var(--ab-ink)]">
                {nextChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 flex items-center gap-2"
                  >
                    <span className="text-[#0A6E45] font-black">✓</span> {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[12px] text-[var(--ab-muted-soft)] border-t border-slate-100 pt-4 font-medium">
            Already onboarded?{" "}
            <Link
              href="/chat"
              className="ab-focus rounded font-black text-[var(--ab-ink)] underline underline-offset-2 hover:text-black"
            >
              Open chat &rarr;
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
