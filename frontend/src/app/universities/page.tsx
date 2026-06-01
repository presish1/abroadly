"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentQuickTabs } from "@/components/student-quick-tabs";
import { ESSENTIAL_SLOTS } from "@/lib/document-catalog";
import {
  COURSES,
  UNIVERSITIES,
  classifyFit,
  currencySymbol,
  fieldLabel,
  getUniversityProfile,
  gpaToPercentage,
  inferField,
  pickCourses,
  pickUniversities,
  universityThumbnailUrl,
  type AdmissionFit,
  type Course,
  type University,
} from "@/lib/university-data";
import { COUNTRY_PROFILES, resolveTargetCountries, type CountryCode } from "@/lib/country-data";
import {
  getCurrentStudent,
  getStudent,
  getStudentDocuments,
  type StudentDocument,
  type StudentOut,
} from "@/lib/api";

type FitFilter = "all" | AdmissionFit;

const FIT_COPY: Record<AdmissionFit, { label: string; className: string; note: string }> = {
  match: {
    label: "Match",
    className: "border-[#BFE2CF] bg-[#E8F2EC] text-[#0A6E45]",
    note: "Profile is around the likely entry bar.",
  },
  safety: {
    label: "Safe pick",
    className: "border-[#CED7F2] bg-[#EEF1FA] text-[#1F3D78]",
    note: "Profile is comfortably above the likely entry bar.",
  },
  reach: {
    label: "Reach",
    className: "border-[#F0D89A] bg-[#FBF4E6] text-[#8A5A00]",
    note: "Possible, but needs a stronger case or backup.",
  },
  unknown: {
    label: "Needs GPA",
    className: "border-[#E8E5DD] bg-[#F4F2EC] text-[#6B655C]",
    note: "Add GPA for a sharper fit tag.",
  },
};

const MOCK_STUDENT = {
  id: "preview",
  full_name: "Piyush Sharma",
  email: "student@example.com",
  phone: "",
  location: "Kathmandu",
  education_level: "plus_two",
  gpa: 3.25,
  expected_gpa: null,
  target_countries: ["Australia", "United Kingdom"],
  goals: "Study computer science abroad with realistic budget planning.",
  preferred_field: "Computer Science",
  ai_paused: false,
  profile_completed: true,
  call_consent: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as StudentOut;

const MOCK_DOCS = [
  { doc_type: "grade_sheet" },
  { doc_type: "passport" },
  { doc_type: "ielts" },
] as unknown as StudentDocument[];

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M6.5 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9.5M9 3h4v4M8 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function uniInitials(name: string): string {
  const stop = new Set(["of", "the", "and", "for"]);
  const letters = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word) && !stop.has(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return letters || "U";
}

function OfficialThumb({ university, size = "large" }: { university: University; size?: "small" | "large" }) {
  const [failed, setFailed] = useState(false);
  const profile = getUniversityProfile(university);
  const classes =
    size === "small"
      ? "h-9 w-9 rounded-[10px] p-1.5"
      : "h-14 w-14 rounded-[14px] p-2";

  if (failed) {
    return (
      <span className={`flex shrink-0 items-center justify-center border border-[#E8E5DD] bg-[#F4F2EC] text-[12px] font-black text-[#3F3A33] ${classes}`}>
        {uniInitials(university.name)}
      </span>
    );
  }

  return (
    <img
      src={universityThumbnailUrl(university)}
      alt={`${university.name} official site thumbnail`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 border border-[#E8E5DD] bg-white object-contain ${classes}`}
      title={`Thumbnail from ${new URL(profile.international_url).hostname.replace(/^www\./, "")}`}
    />
  );
}

function FitBadge({ fit }: { fit: AdmissionFit }) {
  const copy = FIT_COPY[fit];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.05em] ${copy.className}`}>
      {copy.label}
    </span>
  );
}

function tierLabel(tier: University["tier"]): string {
  return {
    russell: "Russell Group",
    go8: "Group of Eight",
    u15: "U15",
    ivy_plus: "Ivy Plus",
    mid_research: "Research university",
    modern: "Modern university",
    regional: "Regional option",
  }[tier];
}

function courseFieldLabel(field: Course["field"] | null): string {
  return field ? fieldLabel(field) : "your field";
}

function formatDuration(years: number): string {
  if (years === 1) return "1 year";
  if (years === 1.5) return "18 months";
  return `${years} years`;
}

function loadPreferredCountry(countries: CountryCode[]): CountryCode {
  if (countries.includes("Australia")) return "Australia";
  return countries[0] ?? "UK";
}

function buildCourseRows(country: CountryCode, field: Course["field"] | null) {
  if (field) return pickCourses(country as University["country"], field, 12);

  const unisById = new Map(UNIVERSITIES.map((u) => [u.id, u]));
  return COURSES.flatMap((course) => {
    const university = unisById.get(course.university_id);
    if (!university || university.country !== country) return [];
    return [{ course, university }];
  }).slice(0, 12);
}

function UniversityCard({
  university,
  studentPct,
  preferredField,
  onAsk,
}: {
  university: University;
  studentPct: number | null;
  preferredField: string | null;
  onAsk: (query: string) => void;
}) {
  const fit = classifyFit(studentPct, university.entry_pct_min);
  const profile = getUniversityProfile(university);

  return (
    <article className="group rounded-[18px] border border-[#E4E2DD] bg-white p-4 shadow-[0_1px_2px_rgba(15,15,15,0.04)] transition hover:-translate-y-0.5 hover:border-[#CFCBC3] hover:shadow-[0_14px_34px_-22px_rgba(15,15,15,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <OfficialThumb university={university} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10.5px] font-black uppercase tracking-[0.08em] text-[#6E6A62]">{tierLabel(university.tier)}</p>
              <span className="h-1 w-1 rounded-full bg-[#D9D7D1]" />
              <p className="text-[11px] font-semibold text-[#6B655C]">{university.city}</p>
            </div>
            <h2 className="mt-1 text-[17px] font-black leading-[1.18] tracking-[-0.02em] text-[#171612]">{university.name}</h2>
          </div>
        </div>
        <FitBadge fit={fit} />
      </div>

      <p className="mt-4 text-[13px] leading-[1.65] text-[#3F3A33]">{profile.summary}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[12px] border border-[#EFECE4] bg-[#FAFAF8] p-3">
          <p className="text-[9.5px] font-black uppercase tracking-[0.08em] text-[#8A847B]">Tuition / yr</p>
          <p className="mt-1 text-[13px] font-black text-[#171612]">
            {currencySymbol(university.tuition_currency)}
            {(university.tuition_min / 1000).toFixed(0)}k-{(university.tuition_max / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="rounded-[12px] border border-[#EFECE4] bg-[#FAFAF8] p-3">
          <p className="text-[9.5px] font-black uppercase tracking-[0.08em] text-[#8A847B]">IELTS</p>
          <p className="mt-1 text-[13px] font-black text-[#171612]">{university.ielts_min}+ overall</p>
        </div>
        <div className="rounded-[12px] border border-[#EFECE4] bg-[#FAFAF8] p-3">
          <p className="text-[9.5px] font-black uppercase tracking-[0.08em] text-[#8A847B]">Entry feel</p>
          <p className="mt-1 text-[13px] font-black text-[#171612]">{university.entry_pct_min}% approx</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.best_for.map((item) => (
          <span key={item} className="rounded-full border border-[#E8E5DD] bg-[#FAFAF8] px-2.5 py-1 text-[11px] font-bold text-[#3F3A33]">
            {item}
          </span>
        ))}
      </div>

      <p className="mt-3 rounded-[12px] border border-[#EFECE4] bg-[#FAFAF8] px-3 py-2.5 text-[12px] leading-[1.55] text-[#6B655C]">
        {profile.campus_note}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onAsk(
              `Review ${university.name} for me. I want to study ${preferredField ?? "my field"}. Explain fit, entry requirements, fees, scholarships, risks, and whether I should shortlist it.`,
            )
          }
          className="ab-focus inline-flex min-h-9 items-center gap-2 rounded-[9px] bg-[#2D2B27] px-3.5 text-[12px] font-black text-white transition hover:bg-[#111111]"
        >
          Ask Abroadly <ArrowRightIcon />
        </button>
        <a href={university.official_url} target="_blank" rel="noreferrer noopener" className="ab-focus inline-flex min-h-9 items-center gap-2 rounded-[9px] border border-[#D9D7D1] bg-white px-3.5 text-[12px] font-bold text-[#2D2B27] transition hover:border-[#111111]">
          Official site <OpenIcon />
        </a>
        <a href={profile.admissions_url} target="_blank" rel="noreferrer noopener" className="ab-focus inline-flex min-h-9 items-center gap-2 rounded-[9px] border border-[#D9D7D1] bg-white px-3.5 text-[12px] font-bold text-[#2D2B27] transition hover:border-[#111111]">
          Apply <OpenIcon />
        </a>
        <a href={profile.courses_url} target="_blank" rel="noreferrer noopener" className="ab-focus inline-flex min-h-9 items-center gap-2 rounded-[9px] border border-[#D9D7D1] bg-white px-3.5 text-[12px] font-bold text-[#2D2B27] transition hover:border-[#111111]">
          Courses <OpenIcon />
        </a>
        <a href={profile.scholarships_url} target="_blank" rel="noreferrer noopener" className="ab-focus inline-flex min-h-9 items-center gap-2 rounded-[9px] border border-[#D9D7D1] bg-white px-3.5 text-[12px] font-bold text-[#2D2B27] transition hover:border-[#111111]">
          Scholarships <OpenIcon />
        </a>
      </div>

      <p className="mt-3 text-[11px] leading-[1.45] text-[#8A847B]">{FIT_COPY[fit].note} Always confirm exact requirements on the official pages.</p>
    </article>
  );
}

function CoursePanel({
  country,
  field,
  courses,
  onAsk,
}: {
  country: CountryCode;
  field: Course["field"] | null;
  courses: Array<{ course: Course; university: University }>;
  onAsk: (query: string) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-5 lg:self-start">
      <div className="rounded-[18px] border border-[#E4E2DD] bg-white p-4 shadow-[0_1px_2px_rgba(15,15,15,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-black uppercase tracking-[0.08em] text-[#6E6A62]">Courses</p>
            <h2 className="mt-1 text-[17px] font-black tracking-[-0.02em] text-[#171612]">
              {courseFieldLabel(field)} in {COUNTRY_PROFILES[country].name}
            </h2>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F1F0EC] text-[#2D2B27]">
            <SearchIcon />
          </span>
        </div>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-[#6B655C]">
          Representative course names to start your search. Use the official course page before applying.
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          {courses.map(({ course, university }) => {
            const profile = getUniversityProfile(university);
            return (
              <div key={course.id} className="rounded-[14px] border border-[#EFECE4] bg-[#FAFAF8] p-3">
                <div className="flex items-start gap-2.5">
                  <OfficialThumb university={university} size="small" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black leading-snug tracking-[-0.01em] text-[#171612]">{course.name}</p>
                    <p className="mt-0.5 text-[11.5px] font-semibold text-[#6B655C]">{university.name}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white px-2 py-1 text-[10.5px] font-bold text-[#3F3A33]">{course.level === "postgraduate" ? "Postgraduate" : "Undergraduate"}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10.5px] font-bold text-[#3F3A33]">{formatDuration(course.duration_years)}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10.5px] font-bold text-[#3F3A33]">{fieldLabel(course.field)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onAsk(`Is ${course.name} at ${university.name} a good fit for me? Explain entry requirements, fees, career value, and visa risks for a Nepali student.`)}
                    className="ab-focus inline-flex items-center gap-1.5 rounded-[8px] bg-[#2D2B27] px-2.5 py-1.5 text-[11px] font-black text-white transition hover:bg-[#111111]"
                  >
                    Ask <ArrowRightIcon />
                  </button>
                  <a href={profile.courses_url} target="_blank" rel="noreferrer noopener" className="ab-focus inline-flex items-center gap-1.5 rounded-[8px] border border-[#D9D7D1] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#2D2B27] transition hover:border-[#111111]">
                    Official course search <OpenIcon />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default function UniversitiesPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentOut | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<CountryCode>("Australia");
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        let current: StudentOut | null = null;
        const sid = window.localStorage.getItem("abroadly_student_id");
        if (sid) {
          current = await getStudent(sid);
        } else {
          current = await getCurrentStudent().catch(() => null);
          if (current) window.localStorage.setItem("abroadly_student_id", current.id);
        }

        if (!mounted) return;
        if (!current) {
          setStudent(MOCK_STUDENT);
          setDocuments(MOCK_DOCS);
          setActiveCountry("Australia");
          return;
        }

        const docs = await getStudentDocuments(current.id).catch(() => [] as StudentDocument[]);
        const supported = resolveTargetCountries(current.target_countries);
        setStudent(current);
        setDocuments(docs);
        setActiveCountry(loadPreferredCountry(supported));
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Could not load universities.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onAsk = useCallback(
    (query: string) => {
      router.push(`/chat?send=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const supportedCountries = useMemo(
    () => (student ? resolveTargetCountries(student.target_countries) : ["Australia" as CountryCode]),
    [student],
  );

  const docTypes = useMemo(() => new Set(documents.map((doc) => doc.doc_type)), [documents]);
  const essentialDocCount = useMemo(
    () => ESSENTIAL_SLOTS.filter((slot) => docTypes.has(slot.id)).length,
    [docTypes],
  );

  const firstName = student?.full_name?.split(" ")[0] ?? "there";
  const studentPct = student ? gpaToPercentage(student.gpa, student.expected_gpa) : null;
  const field = student ? inferField(student.preferred_field) : null;
  const pickedUniversities = useMemo(
    () => pickUniversities(activeCountry as University["country"], studentPct, field, 18),
    [activeCountry, studentPct, field],
  );
  const courseRows = useMemo(() => buildCourseRows(activeCountry, field), [activeCountry, field]);
  const filteredUniversities = useMemo(
    () =>
      pickedUniversities.filter((university) => {
        if (fitFilter === "all") return true;
        return classifyFit(studentPct, university.entry_pct_min) === fitFilter;
      }),
    [fitFilter, pickedUniversities, studentPct],
  );
  const visibleFilters: FitFilter[] = studentPct ? ["all", "match", "safety", "reach"] : ["all", "unknown"];

  if (loading) {
    return (
      <div className="chat-layout">
        <StudentQuickTabs active="universities" />
        <main className="chat-main flex items-center justify-center bg-[#F4F2EC] text-sm font-semibold text-[#6B655C]">
          Loading university profiles...
        </main>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="chat-layout">
        <StudentQuickTabs active="universities" />
        <main className="chat-main flex items-center justify-center bg-[#F4F2EC] px-6">
          <div className="max-w-md rounded-[18px] border border-[#E4E2DD] bg-white p-6 shadow-[0_1px_2px_rgba(15,15,15,0.04)]">
            <h1 className="text-lg font-black tracking-[-0.02em] text-[#171612]">Could not load universities</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B655C]">{error || "Please open chat and try again."}</p>
            <Link href="/chat" className="ab-focus mt-4 inline-flex min-h-9 items-center gap-2 rounded-[9px] bg-[#2D2B27] px-3.5 text-sm font-black text-white">
              Open chat <ArrowRightIcon />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <StudentQuickTabs
        active="universities"
        firstName={firstName}
        uploadedCount={essentialDocCount}
        documentTotal={ESSENTIAL_SLOTS.length}
        phoneRequired={!student.phone?.trim()}
        callConsented={student.call_consent}
      />

      <main className="chat-main overflow-y-auto bg-[#F4F2EC]">
        <div className="mx-auto max-w-[1440px] px-5 py-5 lg:px-8">
          <header className="rounded-[18px] border border-[#E4E2DD] bg-[#FAFAF8] px-5 py-4 shadow-[0_1px_2px_rgba(15,15,15,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[25px] font-black leading-tight tracking-[-0.03em] text-[#171612]">
                  Universities
                </h1>
                <p className="mt-1 text-[13px] font-semibold text-[#6B655C]">
                  {COUNTRY_PROFILES[activeCountry].name} shortlist, courses, fees and official links.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {supportedCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      setActiveCountry(country);
                      setFitFilter("all");
                    }}
                    className={`ab-focus min-h-9 rounded-[9px] border px-3.5 text-[12px] font-black transition ${
                      activeCountry === country
                        ? "border-[#2D2B27] bg-[#2D2B27] text-white"
                        : "border-[#D9D7D1] bg-white text-[#2D2B27] hover:border-[#111111]"
                    }`}
                  >
                    {COUNTRY_PROFILES[country].name}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {visibleFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setFitFilter(filter)}
                  className={`ab-focus min-h-8 rounded-full border px-3 text-[11.5px] font-black transition ${
                    fitFilter === filter
                      ? "border-[#2D2B27] bg-[#2D2B27] text-white"
                      : "border-[#D9D7D1] bg-white text-[#3F3A33] hover:border-[#111111]"
                  }`}
                >
                  {filter === "all" ? "All picks" : FIT_COPY[filter].label}
                </button>
              ))}
            </div>
            <p className="text-[11.5px] font-semibold text-[#6B655C]">
              {filteredUniversities.length} universities · {courseRows.length} course starters
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
            <section className="grid gap-3">
              {filteredUniversities.map((university) => (
                <UniversityCard
                  key={university.id}
                  university={university}
                  studentPct={studentPct}
                  preferredField={student.preferred_field}
                  onAsk={onAsk}
                />
              ))}
            </section>

            <CoursePanel country={activeCountry} field={field} courses={courseRows} onAsk={onAsk} />
          </div>

          <footer className="py-6 text-center text-[11px] leading-5 text-[#8A847B]">
            Abroadly helps you compare options, but final decisions must be verified on official university and government portals.
          </footer>
        </div>
      </main>
    </div>
  );
}
