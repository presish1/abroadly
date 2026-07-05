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
    <main className="relative min-h-screen flex flex-col md:flex-row items-stretch text-[#1B1916] font-sans bg-[#090D16] overflow-x-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 ab-grid opacity-10 mix-blend-overlay"></div>

        {/* Ambient glowing orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[150px]"></div>
        <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] rounded-full bg-purple-600/5 blur-[130px]"></div>
      </div>

      {/* Left Side: Brand Text Overlay & Mock UI Widget (Hidden on Mobile) */}
      <section className="hidden md:flex md:w-[48%] lg:w-[50%] xl:w-[55%] flex-col justify-between p-12 lg:p-16 text-white select-none z-10 relative">
        {/* Top: Logo & Name */}
        <Link href="/" className="inline-flex items-center gap-3 text-white font-extrabold text-[22px] tracking-tight hover:opacity-90 transition group">
          <div className="relative">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
            <img src="/images/abroadly-logo.svg" alt="Abroadly" className="relative h-9 w-9 object-contain bg-white rounded-lg p-1.5 shadow-md" />
          </div>
          <span className="font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Abroadly</span>
        </Link>

        {/* Middle/Bottom: Premium Typography & Widget */}
        <div className="my-auto max-w-lg lg:max-w-xl py-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-[#7DDBB1] mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Welcome to Abroadly.online</span>
          </div>

          <h1 className="text-[42px] lg:text-[48px] xl:text-[54px] font-extrabold leading-[1.1] tracking-tight text-white">
            Your personal path to <br />
            <span className="bg-gradient-to-r from-[#7DDBB1] via-teal-300 to-blue-400 bg-clip-text text-transparent">global education.</span>
          </h1>

          <p className="mt-5 text-[15px] lg:text-[16px] text-slate-300 leading-relaxed font-medium max-w-md">
            Verify your email, setup your study preferences once, and unlock precise admits matched to your academic record.
          </p>

          {/* Floating Card Widget */}
          <div className="mt-10 p-6 rounded-2xl bg-white/[0.03] backdrop-blur-lg border border-white/10 shadow-2xl relative overflow-hidden group/widget">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <GraduationCap className="h-4.5 w-4.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Intake</p>
                  <h4 className="text-sm font-bold text-white">Admissions matching</h4>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Active</span>
            </div>

            {/* Setup Progress */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-300">Profile Completion</span>
                  <span className="text-emerald-400">25%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[25%] h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-300">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center">
                  <span className="text-emerald-400 font-bold mb-0.5">Step 1</span>
                  <span className="text-slate-400 font-semibold">Sign in</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center opacity-60">
                  <span className="text-slate-400 font-bold mb-0.5">Step 2</span>
                  <span className="text-slate-400 font-semibold">Preferences</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center opacity-60">
                  <span className="text-slate-400 font-bold mb-0.5">Step 3</span>
                  <span className="text-slate-400 font-semibold">Match Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-4">
          <p>&copy; {new Date().getFullYear()} Abroadly.online &middot; Free & Open Source</p>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Safe & Secure SSL
          </span>
        </div>
      </section>

      {/* Right Side: Centered/Floating glassmorphic card */}
      <section className="flex-1 flex items-center justify-center p-4 sm:p-10 lg:p-16 xl:p-24 z-10">
        <div className="w-full max-w-[460px] bg-white/[0.95] backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 flex flex-col justify-between border border-white/20 relative overflow-hidden">
          {/* Decorative gradient border highlight */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500"></div>

          <div>
            {/* Back Button */}
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="ab-focus inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition group/back">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover/back:-translate-x-1" />
                <span>Back to home</span>
              </Link>
            </div>

            {/* Mobile Logo Header */}
            <div className="flex items-center gap-3 md:hidden mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <img src="/images/abroadly-logo.svg" alt="Abroadly" className="h-8 w-8 object-contain bg-white rounded-lg p-1.5 shadow-sm" />
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
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 opacity-20 blur group-hover/gbutton:opacity-30 transition duration-300"></div>
              <GoogleSignInButton
                variant="outline"
                label="Continue with Google"
                caption="No password needed — email verification"
                className="relative w-full justify-center py-6 border-[#ded8ee] hover:border-emerald-500 hover:bg-slate-50/50 shadow-sm"
              />
            </div>

            <div className="mt-6 flex items-start gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-[12px] leading-relaxed text-slate-500 font-medium">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Abroadly secures your session using Google authentication. We never see your password, and store only the fields you choose to share.
              </span>
            </div>

            {/* Up Next List */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-3.5">Up next in profile setup</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[#1B1916]">
                {nextChips.map((chip, idx) => {
                  let icon = <Check className="h-3.5 w-3.5 text-emerald-600" />;
                  if (idx === 0) icon = <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />;
                  if (idx === 1) icon = <MapPin className="h-3.5 w-3.5 text-emerald-600" />;
                  if (idx === 2) icon = <Target className="h-3.5 w-3.5 text-emerald-600" />;
                  if (idx === 3) icon = <Check className="h-3.5 w-3.5 text-emerald-600" />;

                  return (
                    <div
                      key={chip}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex items-center gap-2.5 hover:border-slate-200 transition"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                        {icon}
                      </span>
                      <span className="font-semibold text-slate-700">{chip}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[12.5px] text-slate-400 border-t border-slate-100 pt-5 font-semibold">
            Already onboarded?{" "}
            <Link
              href="/chat"
              className="ab-focus rounded font-black text-[#1B1916] underline underline-offset-4 hover:text-emerald-600 transition"
            >
              Open chat &rarr;
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
