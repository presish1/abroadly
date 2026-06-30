"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { Check, LoaderCircle, Save, Trash2 } from "lucide-react";
import { getStudentDocuments, type StudentDocument, getStudent, updateStudent, uploadProfilePhoto, requestAccountDeletion, type StudentOut } from "@/lib/api";
import { ESSENTIAL_SLOTS, computeDocReadiness } from "@/lib/document-catalog";
import { StudentQuickTabs } from "@/components/student-quick-tabs";
import { CounsellorSupportCard } from "@/components/counsellor-support-card";
import { compressImageToTarget } from "@/lib/image-compress";
interface ProfileFormState {
  full_name: string;
  phone: string;
  location: string;
  education_level: any;
  gpa: string;
  preferred_field: string;
  goals: string;
}

function profileFormFromStudent(student: StudentOut): ProfileFormState {
  return {
    full_name: student.full_name || "",
    phone: student.phone || "",
    location: student.location || "",
    education_level: student.education_level || "plus_two",
    gpa: student.gpa == null ? "" : String(student.gpa),
    preferred_field: student.preferred_field || "",
    goals: student.goals || "",
  };
}

function optionalProfileNumber(val: number | string | null | undefined): number | undefined | null {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(val);
  return isNaN(num) ? undefined : num;
}

function yesNoLabel(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not set";
}

function educationLabel(value: string | null | undefined): string {
  switch (value) {
    case "plus_two":
      return "+2 / Class 12";
    case "a_levels":
      return "A-Levels";
    case "bba":
      return "Diploma / BBA";
    case "bachelors":
      return "Bachelor's degree";
    case "other":
      return "Other qualification";
    default:
      return "Not set";
  }
}

function scoreTypeLabel(value: string | null | undefined): string {
  switch (value) {
    case "gpa":
      return "GPA";
    case "percentage":
      return "Percentage";
    case "cgpa_10":
      return "CGPA / 10";
    case "grade":
      return "Letter grade";
    case "other":
      return "Other";
    default:
      return "Not set";
  }
}

function englishGoalLabel(value: string | null | undefined): string {
  switch (value) {
    case "join_class":
      return "Join class";
    case "not_looking":
      return "Not looking";
    case "book_test":
      return "Book test";
    default:
      return "Not set";
  }
}

function firstItem(value: string | null | undefined): string {
  return value?.trim() || "Not set";
}

function phoneDigits(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

export default function ChatProfilePage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormState, string>>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirmPhone, setDeleteConfirmPhone] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  useEffect(() => {
    const sid = typeof window !== "undefined" ? localStorage.getItem("abroadly_student_id") : null;
    if (!sid) { router.replace("/onboarding"); return; }
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
  const essentialsPct = Math.round((essentialsDone / Math.max(essentialsTotal, 1)) * 100);

  if (loading || !student || !form) {
    return (
      <div className="chat-layout">
        <StudentQuickTabs active="profile" uploadedCount={0} documentTotal={ESSENTIAL_SLOTS.length} />
        <section className="chat-main flex items-center justify-center text-[13px] text-[#6B655C]">Loading…</section>
      </div>
    );
  }

  const profilePct = Math.round(
    (
      [
        student.full_name,
        student.phone,
        student.location,
        student.education_level,
        student.qualification_year,
        student.academic_score,
        student.english_test_taken === null ? "" : "x",
        student.english_test_taken ? student.english_test_type : student.english_goal,
        student.target_countries?.length,
        student.preferred_field,
        student.intended_study_level,
        student.preferred_intake,
        student.budget_range,
        student.goals,
      ].filter((item) => Boolean(item)).length / 14
    ) * 100
  );
  const headerNote = student.profile_completed
    ? "Your profile is already onboarded. This page is for keeping it precise."
    : "Finish the basics once, then keep refining the same record over time.";
  const englishLine = student.english_test_taken
    ? [student.english_test_type, student.english_overall_score ? `Overall ${student.english_overall_score}` : null, student.english_lowest_score ? `Lowest ${student.english_lowest_score}` : null]
        .filter(Boolean)
        .join(" · ")
    : [englishGoalLabel(student.english_goal), student.english_class_timing, student.planned_english_test].filter(Boolean).join(" · ");
  const targetCountries = student.target_countries || [];
  const budgetLabel = student.budget_range || "Not set";
  const studyLevelLabel = student.intended_study_level || "Not set";
  const intakeLabel = student.preferred_intake || "Not set";
  const initials = (student.full_name || "AB")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  function setField<K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) {
    setForm((prev) => prev ? ({ ...prev, [field]: value }) : prev);
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSaved(false);
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !student) return;
    setUploadingPhoto(true);
    setApiError("");
    try {
      const fileToUpload = await compressImageToTarget(file, 250 * 1024);
      const res = await uploadProfilePhoto(student.id, fileToUpload);
      setStudent((prev) => (prev ? { ...prev, profile_photo_url: res.profile_photo_url } : prev));
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function validateProfileForm(): boolean {
    if (!form) return false;
    const next: Partial<Record<keyof ProfileFormState, string>> = {};
    const gpa = optionalProfileNumber(form.gpa);

    if (!form.full_name.trim()) next.full_name = "Full name is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (gpa === undefined || (gpa !== null && (gpa < 0 || gpa > 4.5))) {
      next.gpa = "Use a GPA between 0 and 4.5.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!validateProfileForm() || !form) return;

    const gpa = optionalProfileNumber(form.gpa);
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

  const deletionPending = student.account_status === "pending_deletion" || Boolean(student.deletion_requested_at) || deleteRequested;
  const storedPhoneDigits = phoneDigits(student.phone);
  const confirmPhoneDigits = phoneDigits(deleteConfirmPhone);
  const deletePhoneMatches = Boolean(storedPhoneDigits) && confirmPhoneDigits === storedPhoneDigits;
  const deletePhoneMismatch = Boolean(deleteConfirmPhone.trim()) && Boolean(storedPhoneDigits) && !deletePhoneMatches;

  async function handleDeletionRequest() {
    const currentStudent = student;
    if (!currentStudent) return;

    if (!storedPhoneDigits) {
      setDeleteError("Add your phone number before requesting deletion.");
      return;
    }
    if (!deletePhoneMatches) {
      setDeleteError("The phone number does not match this account.");
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError("");
    try {
      const updated = await requestAccountDeletion(currentStudent.id, deleteConfirmPhone);
      setStudent(updated);
      setForm(profileFormFromStudent(updated));
      setDeleteConfirmPhone("");
      setDeleteRequested(true);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Could not mark the account for deletion.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

    const INPUT_CLS = "w-full rounded-md border border-[#E8E5DD] bg-[#FAF9F6] px-3.5 py-3 text-base md:text-[14px] font-semibold text-[#1B1916] placeholder:text-[#A8A29A] focus:border-[#0A6E45] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0A6E45]/12 transition-colors";
  const LABEL_CLS = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.06em] text-[#6B655C]";
  const ERROR_CLS = "mt-1.5 text-[12px] font-bold text-[#B42318]";

  return (
    <div className="chat-layout profile-page">
      <StudentQuickTabs active="profile" uploadedCount={essentialsDone} documentTotal={essentialsTotal} />

      <section className="chat-main docs-main overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="overflow-hidden rounded-[22px] border border-[#E8E5DD] bg-white shadow-[0_18px_42px_-28px_rgba(31,27,75,0.18)]">
            <div className="border-b border-[#E8E5DD] bg-[#FBFAF7] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A6E45]">Profile</p>
                  <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em] text-[#1B1916] sm:text-[36px]">
                    {student.full_name}'s study profile
                  </h1>
                  <p className="mt-2 text-[14px] leading-7 text-[#6B655C]">{headerNote}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[#E8E5DD] bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">Progress</p>
                    <p className="mt-1 text-[24px] font-black leading-none text-[#1B1916]">{profilePct}%</p>
                    <p className="mt-1 text-[11px] text-[#6B655C]">Profile completeness</p>
                  </div>
                  <div className="rounded-[18px] border border-[#E8E5DD] bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">Docs</p>
                    <p className="mt-1 text-[24px] font-black leading-none text-[#1B1916]">{essentialsDone}<span className="text-[#A8A29A]">/{essentialsTotal}</span></p>
                    <p className="mt-1 text-[11px] text-[#6B655C]">{essentialsPct}% uploaded</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="border-b border-[#E8E5DD] bg-[#FCFBF8] p-5 xl:border-b-0 xl:border-r">
                <div className="space-y-4">
                  <section className="rounded-[20px] border border-[#E8E5DD] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Study passport</p>
                        <h2 className="mt-1 text-[18px] font-black tracking-[-0.02em] text-[#1B1916]">What we already know</h2>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF7F1] text-[11px] font-black text-[#0A6E45]">{profilePct}%</div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-[#E8E5DD] bg-[#FBFAF7] p-3">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="ab-focus group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#E8E5DD] bg-white text-[15px] font-black text-[#0A6E45] transition hover:border-[#0A6E45]"
                        aria-label="Upload profile photo"
                      >
                        {uploadingPhoto ? (
                          <span className="text-[10px] font-black text-[#0A6E45]">• • •</span>
                        ) : student.profile_photo_url ? (
                          <img src={student.profile_photo_url} alt={student.full_name} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#0A6E45]">Profile photo</p>
                        <p className="mt-1 text-[12px] font-semibold text-[#1B1916]">
                          {student.profile_photo_url ? "Update your photo" : "Add a clear face shot"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6B655C]">Face photo helps keep your profile recognizable.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="ab-focus inline-flex shrink-0 items-center justify-center rounded-full bg-[#0A6E45] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#085636] disabled:opacity-50"
                      >
                          {uploadingPhoto ? "Uploading..." : student.profile_photo_url ? "Change" : "Upload"}
                      </button>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <div className="mt-4 space-y-3">
                      {[
                        ["Name", student.full_name],
                        ["Phone", student.phone],
                        ["Location", student.location],
                        ["Education", educationLabel(student.education_level)],
                        ["Study level", studyLevelLabel],
                        ["Countries", targetCountries.length ? `${targetCountries.length} selected` : "Not set"],
                        ["Budget", budgetLabel],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4 border-b border-dashed border-[#EFEAE0] pb-2 last:border-b-0 last:pb-0">
                          <span className="text-[12px] font-semibold text-[#6B655C]">{label}</span>
                          <span className="text-right text-[12.5px] font-bold text-[#1B1916]">{firstItem(value)}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[20px] border border-[#E8E5DD] bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Next best fixes</p>
                    <div className="mt-3 space-y-2">
                        {[
                          student.phone?.trim() ? null : "Add your phone number",
                          form.gpa.trim() ? null : "Review your GPA",
                          form.preferred_field.trim() ? null : "Set your study field",
                      ].filter(Boolean).map((item) => (
                        <div key={item as string} className="flex items-center gap-2 rounded-[16px] bg-[#FAF9F6] px-3 py-2 text-[12px] font-semibold text-[#3F3A33]">
                          <span className="h-2 w-2 rounded-full bg-[#0A6E45]" />
                          {item}
                        </div>
                      ))}
                        {![
                          student.phone?.trim() ? null : "Add your phone number",
                          form.gpa.trim() ? null : "Review your GPA",
                          form.preferred_field.trim() ? null : "Set your study field",
                      ].filter(Boolean).length && (
                        <p className="rounded-[16px] bg-[#EEF7F1] px-3 py-3 text-[12px] font-semibold text-[#0A6E45]">Everything important is filled. Keep it updated when things change.</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[20px] border border-[#E8E5DD] bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Shortcuts</p>
                    <div className="mt-3 grid gap-2">
                      <a href="/chat/documents" className="ab-focus rounded-[16px] border border-[#E8E5DD] px-3 py-2.5 text-[12px] font-bold text-[#1B1916] transition hover:border-[#0A6E45] hover:bg-[#FAF9F6]">Manage documents</a>
                      <a href="/universities" className="ab-focus rounded-[16px] border border-[#E8E5DD] px-3 py-2.5 text-[12px] font-bold text-[#1B1916] transition hover:border-[#0A6E45] hover:bg-[#FAF9F6]">Browse universities</a>
                    </div>
                  </section>
                </div>
              </aside>

              <section className="p-5 sm:p-6 lg:p-7">
                <div className="max-w-3xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Edit profile</p>
                      <h2 className="mt-1 text-[22px] font-black tracking-[-0.03em] text-[#1B1916]">Only the essentials are editable here</h2>
                      <p className="mt-1.5 text-[13.5px] leading-6 text-[#6B655C]">
                        The rest of your onboarding data stays visible in the sidebar, so this stays clean and focused.
                      </p>
                      </div>
                      <div className="hidden rounded-full border border-[#D7E7DD] bg-[#EEF7F1] px-3 py-1.5 text-[11px] font-bold text-[#0A6E45] md:inline-flex">
                        {deletionPending ? "Pending deletion" : saved ? "Saved" : "Live profile"}
                      </div>
                  </div>

                  <form onSubmit={saveProfile} className="mt-6 space-y-7 pb-16">
                    <button
                      type="submit"
                      disabled={saving}
                      className="ab-focus profile-save-float"
                      aria-live="polite"
                    >
                      {saving ? (
                        <LoaderCircle aria-hidden className="animate-spin" />
                      ) : saved ? (
                        <Check aria-hidden />
                      ) : (
                        <Save aria-hidden />
                      )}
                      {saving ? "Saving..." : saved ? "Saved" : "Save profile"}
                    </button>

                    <div className="rounded-[20px] border border-[#EFECE4] bg-[#FCFBF8] p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Identity</p>
                          <p className="mt-1 text-[12.5px] text-[#6B655C]">How the assistant should address you.</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#8A847B]">Profile basics</span>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLS}>Full name</label>
                          <input className={INPUT_CLS} value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} placeholder="Legal name" />
                          {errors.full_name && <p className={ERROR_CLS}>{errors.full_name}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Phone</label>
                          <input className={INPUT_CLS} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="e.g. +977..." />
                          {errors.phone && <p className={ERROR_CLS}>{errors.phone}</p>}
                        </div>
                        <div>
                          <label className={LABEL_CLS}>City / district</label>
                          <input className={INPUT_CLS} value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Where are you located?" />
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Education level</label>
                          <select className={INPUT_CLS} value={form.education_level} onChange={(e) => setField("education_level", e.target.value as any)}>
                            <option value="high_school">High School (12th)</option>
                            <option value="bachelors">Bachelor's Degree</option>
                            <option value="masters">Master's Degree</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-[20px] border border-[#EFECE4] bg-[#FCFBF8] p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Academics</p>
                        <p className="mt-1 text-[12.5px] text-[#6B655C]">We use this to judge fit and suggest realistic universities.</p>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className={LABEL_CLS}>Current GPA</label>
                            <input className={INPUT_CLS} type="number" inputMode="decimal" step="0.01" value={form.gpa} onChange={(e) => setField("gpa", e.target.value)} placeholder="e.g. 3.4" />
                            {errors.gpa && <p className={ERROR_CLS}>{errors.gpa}</p>}
                          </div>
                          <div className="rounded-[16px] border border-[#EFECE4] bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">Qualification year</p>
                            <p className="mt-1.5 text-[13px] font-semibold text-[#1B1916]">{student.qualification_year ? String(student.qualification_year) : "Not set"}</p>
                          </div>
                          <div className="rounded-[16px] border border-[#EFECE4] bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">Score style</p>
                            <p className="mt-1.5 text-[13px] font-semibold text-[#1B1916]">{scoreTypeLabel(student.score_type)}</p>
                          </div>
                          <div className="rounded-[16px] border border-[#EFECE4] bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">Academic score</p>
                            <p className="mt-1.5 text-[13px] font-semibold text-[#1B1916]">{student.academic_score || "Not set"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[#EFECE4] bg-[#FCFBF8] p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Destination & goals</p>
                        <p className="mt-1 text-[12.5px] text-[#6B655C]">This is the part that shapes recommendations the most.</p>

                        <div className="mt-4 space-y-4">
                            <div>
                              <label className={LABEL_CLS}>Target countries</label>
                              <div className="flex flex-wrap gap-2">
                                {targetCountries.length ? (
                                  targetCountries.map((country) => (
                                    <span key={country} className="inline-flex rounded-md border border-[#D7E7DD] bg-[#EEF7F1] px-3 py-2 text-[12px] font-bold text-[#0A6E45]">
                                      {country}
                                    </span>
                                  ))
                                ) : (
                                  <span className="rounded-md border border-[#E8E5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#8A847B]">
                                    Not set yet
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-[11.5px] leading-5 text-[#6B655C]">
                                Destination changes are handled during onboarding so recommendations stay consistent.
                              </p>
                            </div>

                          <div>
                            <label className={LABEL_CLS}>Preferred field</label>
                            <input className={INPUT_CLS} value={form.preferred_field} onChange={(e) => setField("preferred_field", e.target.value)} placeholder="Computer Science, Nursing, Business..." />
                          </div>

                          <div>
                            <label className={LABEL_CLS}>Goals</label>
                            <textarea className={`${INPUT_CLS} min-h-[120px] resize-y`} value={form.goals} onChange={(e) => setField("goals", e.target.value)} placeholder="What are you hoping to achieve by studying abroad?" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden">
                      <p className="mb-3 text-[10px] font-bold uppercase text-[#0A6E45]">Support</p>
                      <CounsellorSupportCard
                        student={student}
                        onUpdated={(updated) => {
                          setStudent(updated);
                          setForm(profileFormFromStudent(updated));
                        }}
                        variant="row"
                      />
                    </div>

                    <div className="rounded-[20px] border border-[#EFECE4] bg-[#FCFBF8] p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A6E45]">Student summary</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          ["Countries", targetCountries.length ? `${targetCountries.length} selected` : "Not set"],
                          ["Field", firstItem(student.preferred_field)],
                          ["English", student.english_test_taken ? firstItem(student.english_test_type) : firstItem(student.english_goal)],
                          ["Intake", intakeLabel],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-[16px] border border-[#EFECE4] bg-white px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A847B]">{label}</p>
                            <p className="mt-1.5 text-[13px] font-semibold text-[#1B1916]">{value}</p>
                          </div>
                        ))}
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[#F3D5D0] bg-[#FFF8F7] p-5">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#B42318] ring-1 ring-[#F3D5D0]">
                            <Trash2 aria-hidden className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#B42318]">Delete account</p>
                            <h3 className="mt-1 text-[15px] font-black text-[#1B1916]">
                              {deletionPending ? "Deletion request received" : "Request account deletion"}
                            </h3>
                            <p className="mt-1 text-[12.5px] leading-5 text-[#6B655C]">
                              {deletionPending
                                ? "Your account is marked for deletion. The admin team can still review it before cleanup."
                                : "This will mark your account for deletion. It does not immediately remove your profile, chat history, or documents."}
                            </p>
                            {!deletionPending && (
                              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                <div>
                                  <label className={LABEL_CLS} htmlFor="delete-confirm-phone">Type your phone number to confirm</label>
                                  <input
                                    id="delete-confirm-phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    className={INPUT_CLS}
                                    value={deleteConfirmPhone}
                                    onChange={(event) => {
                                      setDeleteConfirmPhone(event.target.value);
                                      setDeleteError("");
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") event.preventDefault();
                                    }}
                                    placeholder={student.phone || "Add phone first"}
                                  />
                                  {(deleteError || deletePhoneMismatch) && (
                                    <p className={ERROR_CLS}>{deleteError || "The phone number does not match this account."}</p>
                                  )}
                                  {!storedPhoneDigits && (
                                    <p className="mt-1.5 text-[12px] font-semibold text-[#8A847B]">Save your phone number first, then you can confirm deletion.</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={handleDeletionRequest}
                                  disabled={deleteSubmitting || !deletePhoneMatches}
                                  className="ab-focus inline-flex min-h-11 items-center justify-center rounded-md border border-[#D92D20] bg-white px-4 text-[12px] font-bold text-[#B42318] transition hover:bg-[#FFF1F0] disabled:cursor-not-allowed disabled:border-[#E8E5DD] disabled:text-[#A8A29A]"
                                >
                                  {deleteSubmitting ? "Marking..." : "Mark for deletion"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {apiError && (
                      <div className="rounded-[16px] border border-[#F5C2BC] bg-[#FFF4F2] px-4 py-3 text-[13px] font-semibold text-[#B42318]">
                        {apiError}
                      </div>
                    )}

                    <div className="flex gap-3 border-t border-[#E8E5DD] pt-5 sm:items-center">
                      <div className="flex items-center gap-3 text-[13px]">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF7F1] text-[#0A6E45]">✓</span>
                        <div>
                          <p className="font-bold text-[#1B1916]">{saved ? "Saved" : "Ready to update"}</p>
                          <p className="text-[#6B655C]">Your profile changes apply immediately to chat and recommendations.</p>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
