"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getStudentDocuments, type StudentDocument, getStudent, updateStudent, type StudentOut } from "@/lib/api";
import { ESSENTIAL_SLOTS, computeDocReadiness } from "@/lib/document-catalog";
import { StudentQuickTabs } from "@/components/student-quick-tabs";
interface ProfileFormState {
  full_name: string;
  phone: string;
  location: string;
  education_level: any;
  gpa: string;
  expected_gpa: string;
  preferred_field: string;
  target_countries: string[];
  goals: string;
}

function profileFormFromStudent(student: StudentOut): ProfileFormState {
  return {
    full_name: student.full_name || "",
    phone: student.phone || "",
    location: student.location || "",
    education_level: student.education_level || "plus_two",
    gpa: student.gpa == null ? "" : String(student.gpa),
    expected_gpa: student.expected_gpa == null ? "" : String(student.expected_gpa),
    preferred_field: student.preferred_field || "",
    target_countries: student.target_countries || [],
    goals: student.goals || "",
  };
}

function optionalProfileNumber(val: number | string | null | undefined): number | undefined | null {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  return isNaN(num) ? undefined : num;
}

export default function ChatProfilePage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sid = typeof window !== "undefined" ? localStorage.getItem("abroadly_student_id") : null;
    if (!sid) { router.replace("/onboarding"); return; }
    setStudentId(sid);
    getStudent(sid).then((s) => {
      setStudent(s);
      setForm(profileFormFromStudent(s));
    }).catch(console.error).finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!student) return;
    getStudentDocuments(student.id).then(setDocuments).catch(console.error);
  }, [student]);

  const docReadiness = useMemo(() => computeDocReadiness(documents), [documents]);
  const essentialsDone = docReadiness.essentialsDone;
  const essentialsTotal = docReadiness.essentialsTotal;

  if (loading || !student || !form) {
    return (
      <div className="chat-layout">
        <StudentQuickTabs active="profile" uploadedCount={0} documentTotal={ESSENTIAL_SLOTS.length} />
        <section className="chat-main flex items-center justify-center text-[13px] text-[#6B655C]">Loading…</section>
      </div>
    );
  }

  function setField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setForm((prev) => prev ? ({ ...prev, [field]: value }) : prev);
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSaved(false);
  }

  function toggleCountry(country: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const selected = prev.target_countries.includes(country);
      return {
        ...prev,
        target_countries: selected
          ? prev.target_countries.filter((item) => item !== country)
          : [...prev.target_countries, country],
      };
    });
    setErrors((prev) => ({ ...prev, target_countries: "" }));
    setSaved(false);
  }

  function validateProfileForm(): boolean {
    if (!form) return false;
    const next: Partial<Record<keyof ProfileFormState, string>> = {};
    const gpa = optionalProfileNumber(form.gpa);
    const expectedGpa = optionalProfileNumber(form.expected_gpa);

    if (!form.full_name.trim()) next.full_name = "Full name is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (gpa === undefined || (gpa !== null && (gpa < 0 || gpa > 4.5))) {
      next.gpa = "Use a GPA between 0 and 4.5.";
    }
    if (expectedGpa === undefined || (expectedGpa !== null && (expectedGpa < 0 || expectedGpa > 4.5))) {
      next.expected_gpa = "Use an expected GPA between 0 and 4.5.";
    }
    if (form.target_countries.length === 0) {
      next.target_countries = "Select at least one target country.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!validateProfileForm() || !form) return;

    const gpa = optionalProfileNumber(form.gpa);
    const expectedGpa = optionalProfileNumber(form.expected_gpa);
    setSaving(true);
    setApiError("");
    setSaved(false);
    try {
      const updated = await updateStudent(student!.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim() || null,
        education_level: form.education_level,
        gpa: gpa === undefined ? null : gpa,
        expected_gpa: expectedGpa === undefined ? null : expectedGpa,
        target_countries: form.target_countries,
        preferred_field: form.preferred_field.trim() || null,
        goals: form.goals.trim() || null,
      });
      setStudent(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const INPUT_CLS = "w-full rounded-md border border-[#E8E5DD] bg-[#FAF9F6] px-3.5 py-3 text-[14px] font-semibold text-[#1B1916] placeholder:text-[#A8A29A] focus:border-[#0A6E45] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0A6E45]/12 transition-colors";
  const LABEL_CLS = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.06em] text-[#6B655C]";
  const ERROR_CLS = "mt-1.5 text-[12px] font-bold text-[#B42318]";
  const COUNTRIES = ["USA", "UK", "Australia", "Canada"];

  return (
    <div className="chat-layout">
      <StudentQuickTabs active="profile" uploadedCount={essentialsDone} documentTotal={essentialsTotal} />

      <section className="chat-main docs-main overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 lg:px-10 lg:py-12">
          <header className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Profile</p>
            <h1 className="mt-1 text-[26px] font-black tracking-[-0.02em] text-[#1B1916]">Your Study Profile</h1>
            <p className="mt-1.5 text-[14px] text-[#6B655C] max-w-xl">
              Keep your details updated to ensure Abroadly gives you the most accurate and personalized guidance for your journey.
            </p>
          </header>

          <form onSubmit={saveProfile} className="space-y-8 rounded-xl border border-[#E8E5DD] bg-white p-6 shadow-[0_4px_18px_rgba(34,27,75,0.05)] sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Full name</label>
                <input className={INPUT_CLS} value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} placeholder="Legal name" />
                {errors.full_name && <p className={ERROR_CLS}>{errors.full_name}</p>}
              </div>
              <div>
                <label className={LABEL_CLS}>Phone</label>
                <input className={INPUT_CLS} value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="e.g. +977..." />
                {errors.phone && <p className={ERROR_CLS}>{errors.phone}</p>}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Education Level</label>
                <select className={INPUT_CLS} value={form.education_level} onChange={(e) => setField("education_level", e.target.value as any)}>
                  <option value="high_school">High School (12th)</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="masters">Master's Degree</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>City / District</label>
                <input className={INPUT_CLS} value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Where are you located?" />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Current GPA</label>
                <input className={INPUT_CLS} type="number" step="0.01" value={form.gpa} onChange={(e) => setField("gpa", e.target.value)} placeholder="e.g. 3.4" />
                {errors.gpa && <p className={ERROR_CLS}>{errors.gpa}</p>}
              </div>
              <div>
                <label className={LABEL_CLS}>Expected GPA</label>
                <input className={INPUT_CLS} type="number" step="0.01" value={form.expected_gpa} onChange={(e) => setField("expected_gpa", e.target.value)} placeholder="Optional" />
                {errors.expected_gpa && <p className={ERROR_CLS}>{errors.expected_gpa}</p>}
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Field of Interest</label>
              <input className={INPUT_CLS} value={form.preferred_field} onChange={(e) => setField("preferred_field", e.target.value)} placeholder="e.g. Computer Science, Business..." />
            </div>

            <div>
              <label className={LABEL_CLS}>Target Countries</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {COUNTRIES.map((c) => {
                  const active = form.target_countries.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCountry(c)}
                      className={`ab-focus flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-bold transition ${active ? "border-[#0A6E45] bg-[#E8F2EC] text-[#0A6E45]" : "border-[#E8E5DD] bg-white text-[#6B655C] hover:border-[#D8D3C8] hover:bg-[#FAF9F6]"}`}
                    >
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${active ? "border-[#0A6E45] bg-[#0A6E45]" : "border-[#C9C3B8]"}`}>
                        {active && <svg viewBox="0 0 10 10" className="h-2 w-2 text-white" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      {c}
                    </button>
                  );
                })}
              </div>
              {errors.target_countries && <p className={ERROR_CLS}>{errors.target_countries}</p>}
            </div>

            <div>
              <label className={LABEL_CLS}>Your Goals</label>
              <textarea className={`${INPUT_CLS} min-h-[100px] resize-y`} value={form.goals} onChange={(e) => setField("goals", e.target.value)} placeholder="What are you hoping to achieve by studying abroad?" />
            </div>

            {apiError && (
              <div className="rounded-md border border-[#F5C2BC] bg-[#FFF4F2] px-4 py-3 text-[13px] font-semibold text-[#B42318]">
                {apiError}
              </div>
            )}

            <div className="flex items-center justify-end gap-4 border-t border-[#E8E5DD] pt-6">
              {saved && <span className="text-[13px] font-bold text-[#0A6E45]">✓ Profile saved successfully!</span>}
              <button
                type="submit"
                disabled={saving}
                className="ab-focus rounded-md bg-[#0A6E45] px-6 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#085A38] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
