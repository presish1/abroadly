import Link from "next/link";
import { GoogleSignInButton } from "../google-sign-in-button";
import { ArrowLeft, Check, Sparkles, GraduationCap, MapPin, Target, ShieldCheck } from "lucide-react";

const nextChips = [
  "Education + GPA",
  "Target country",
  "Field & goals",
  "Saved once",
];

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen flex flex-col md:flex-row items-stretch text-[#1B1916] font-sans bg-[#FAF9F6] overflow-x-hidden">
      {/* Background decorative elements matching hero layout */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle radial light gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/60 via-[#FAF9F6] to-[#FAF9F6]"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 ab-grid opacity-[0.04] mix-blend-multiply"></div>

        {/* Soft glowing ambient orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[150px]"></div>
      </div>

      {/* Left Side: Brand Text Overlay & Mock UI Widget (Hidden on Mobile) */}
      <section className="hidden md:flex md:w-[48%] lg:w-[50%] xl:w-[55%] flex-col justify-between p-12 lg:p-16 text-[#1B1916] select-none z-10 relative">
        {/* Top: Logo & Name */}
        <Link href="/" className="inline-flex items-center gap-3 text-[#1B1916] font-extrabold text-[22px] tracking-tight hover:opacity-90 transition group">
          <div className="relative">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 opacity-20 blur-sm group-hover:opacity-40 transition duration-300"></div>
            <img src="/images/abroadly-logo.svg" alt="Abroadly" className="relative h-9 w-9 object-contain bg-white rounded-lg p-1.5 shadow-sm border border-[#E8E5DD]" />
          </div>
          <span className="font-extrabold tracking-tight text-[#1B1916]">Abroadly</span>
        </Link>

        {/* Middle/Bottom: Premium Typography & Widget */}
        <div className="my-auto max-w-lg lg:max-w-xl py-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 border border-blue-100 text-blue-600 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
            <span>Welcome to Abroadly.online</span>
          </div>

          <h1 className="text-[42px] lg:text-[48px] xl:text-[54px] font-extrabold leading-[1.1] tracking-tight text-[#1b1916]">
            Your personal path to <br />
            <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">global education.</span>
          </h1>

          <p className="mt-5 text-[15px] lg:text-[16px] text-slate-500 leading-relaxed font-semibold max-w-md">
            Verify your email, setup your study preferences once, and unlock precise admits matched to your academic record.
          </p>

          {/* Floating Card Widget */}
          <div className="mt-10 p-6 rounded-2xl bg-white border border-[#E8E5DD] shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group/widget">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <GraduationCap className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Intake</p>
                  <h4 className="text-sm font-bold text-[#1B1916]">Admissions matching</h4>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>
            </div>

            {/* Setup Progress */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500">Profile Completion</span>
                  <span className="text-blue-600">25%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E8E5DD] rounded-full overflow-hidden">
                  <div className="w-[25%] h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500">
                <div className="p-2 rounded-lg bg-[#FAF9F6] border border-[#EFECE4] flex flex-col items-center">
                  <span className="text-blue-600 font-bold mb-0.5">Step 1</span>
                  <span className="text-[#1B1916] font-semibold">Sign in</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-100 flex flex-col items-center opacity-60">
                  <span className="text-slate-400 font-bold mb-0.5">Step 2</span>
                  <span className="text-slate-400 font-semibold">Preferences</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-100 flex flex-col items-center opacity-60">
                  <span className="text-slate-400 font-bold mb-0.5">Step 3</span>
                  <span className="text-slate-400 font-semibold">Match Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-[#E8E5DD] pt-4">
          <p>&copy; {new Date().getFullYear()} Abroadly.online &middot; Free & Open Source</p>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Safe & Secure SSL
          </span>
        </div>
      </section>

      {/* Right Side: Centered/Floating glassmorphic card */}
      <section className="flex-1 flex items-center justify-center p-4 sm:p-10 lg:p-16 xl:p-24 z-10">
        <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.045)] p-6 sm:p-8 md:p-10 flex flex-col justify-between border border-[#E8E5DD] relative overflow-hidden">
          {/* Decorative blue top highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#0044FF]"></div>

          <div>
            {/* Back Button */}
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="ab-focus inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition group/back">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover/back:-translate-x-1" />
                <span>Back to home</span>
              </Link>
            </div>

            {/* Mobile Logo Header */}
            <div className="flex items-center gap-3 md:hidden mb-8 bg-[#FAF9F6] p-3 rounded-xl border border-[#EFECE4]">
              <img src="/images/abroadly-logo.svg" alt="Abroadly" className="h-8 w-8 object-contain bg-white rounded-lg p-1.5 shadow-sm border border-[#E8E5DD]" />
              <div>
                <span className="text-[17px] font-black tracking-tight text-[#1B1916]">Abroadly</span>
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">Free study planning</p>
              </div>
            </div>

            <h2 className="text-[30px] font-black tracking-tight text-[#1B1916] leading-none">Sign in</h2>
            <p className="mt-3 text-[14px] font-semibold text-slate-500 leading-relaxed">
              New to Abroadly? We&apos;ll create your profile after the one-time setup.
            </p>

            {/* Google Sign-in Card */}
            <div className="mt-8 relative group/gbutton">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 opacity-10 blur group-hover/gbutton:opacity-20 transition duration-300"></div>
              <GoogleSignInButton
                variant="outline"
                label="Continue with Google"
                caption="No password needed — email verification"
                className="relative w-full justify-center py-6 border-[#ded8ee] hover:border-blue-500 hover:bg-[#FAF9F6]/50 shadow-sm"
              />
            </div>

            <div className="mt-6 flex items-start gap-2.5 bg-[#FAF9F6]/60 p-3.5 rounded-xl border border-[#EFECE4] text-[12px] leading-relaxed text-slate-500 font-medium">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Abroadly secures your session using Google authentication. We never see your password, and store only the fields you choose to share.
              </span>
            </div>

            {/* Up Next List */}
            <div className="mt-8 border-t border-[#EFECE4] pt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-3.5">Up next in profile setup</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[#1B1916]">
                {nextChips.map((chip, idx) => {
                  let icon = <Check className="h-3.5 w-3.5 text-blue-600" />;
                  if (idx === 0) icon = <GraduationCap className="h-3.5 w-3.5 text-blue-600" />;
                  if (idx === 1) icon = <MapPin className="h-3.5 w-3.5 text-blue-600" />;
                  if (idx === 2) icon = <Target className="h-3.5 w-3.5 text-blue-600" />;
                  if (idx === 3) icon = <Check className="h-3.5 w-3.5 text-emerald-600" />;

                  let badgeBg = idx === 3 ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100";

                  return (
                    <div
                      key={chip}
                      className="rounded-xl border border-[#E8E5DD] bg-[#FAF9F6]/80 p-3 flex items-center gap-2.5 hover:border-slate-300 transition"
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border shadow-sm ${badgeBg}`}>
                        {icon}
                      </span>
                      <span className="font-semibold text-slate-700">{chip}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[12.5px] text-slate-400 border-t border-[#EFECE4] pt-5 font-semibold">
            Already onboarded?{" "}
            <Link
              href="/chat"
              className="ab-focus rounded font-black text-[#1B1916] underline underline-offset-4 hover:text-[#0044FF] transition"
            >
              Open chat &rarr;
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
