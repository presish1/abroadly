/**
 * Curated university + course data for the Abroadly student dashboard.
 *
 * This is INTENTIONALLY hand-curated rather than scraped — it lets us encode
 * realistic entry expectations for Nepali students (where the official
 * "minimum GPA" published by a university is often higher than what they
 * actually accept). Numbers are indicative for 2025-26; verify on each
 * university's official "International students" page before applying.
 *
 * The matching tier (Reach / Match / Safety) is computed from the student's
 * NEB +2 percentage relative to `entry_pct_min`:
 *   - Reach:  student is 0–6 pts below
 *   - Match:  student is at or above
 *   - Safety: student is 8+ pts above (high confidence of admission)
 *
 * If we can't compute (no GPA on profile), we mark all as "Match" so the
 * student still sees options.
 */

export type UniversityTier = "russell" | "go8" | "u15" | "ivy_plus" | "mid_research" | "modern" | "regional";
export type AdmissionFit = "reach" | "match" | "safety" | "unknown";

export interface University {
  /** Stable slug — used as key */
  id: string;
  name: string;
  country: "UK" | "Australia" | "Canada" | "USA" | "Germany";
  city: string;
  tier: UniversityTier;
  /** Indicative annual tuition for international students, in destination currency */
  tuition_min: number;
  tuition_max: number;
  tuition_currency: "GBP" | "AUD" | "CAD" | "USD" | "EUR";
  /** Approximate minimum NEB +2 percentage they consider for international students.
   *  This is the realistic floor — not the published "minimum GPA" which is often inflated. */
  entry_pct_min: number;
  /** Minimum IELTS overall band typically accepted (for undergraduate; postgraduate is usually higher) */
  ielts_min: number;
  /** Fields this university is genuinely known for — drives course recommendations */
  strengths: ("cs" | "engineering" | "business" | "nursing" | "design" | "social_science" | "law" | "medicine" | "data_science")[];
  /** Public URL students can click through to */
  official_url: string;
}

export interface UniversityProfile {
  /** Short, student-facing profile copy for shortlist cards */
  summary: string;
  /** Practical positioning: what kind of student usually shortlists this option */
  best_for: string[];
  /** City/campus note useful for Nepali students comparing living style and cost */
  campus_note: string;
  /** Official international admissions page when it differs from the main site */
  international_url: string;
  /** Official course search or study-area page */
  courses_url: string;
  /** Official scholarships page */
  scholarships_url: string;
  /** Official apply/admissions page */
  admissions_url: string;
  /** Optional official-domain thumbnail; falls back to the university favicon */
  thumbnail_url?: string;
}

export interface Course {
  id: string;
  university_id: string;
  level: "undergraduate" | "postgraduate";
  /** Display name as the university lists it */
  name: string;
  /** Internal field tag — matched against student.preferred_field */
  field: "cs" | "engineering" | "business" | "nursing" | "design" | "social_science" | "law" | "medicine" | "data_science";
  /** Duration in years (1, 1.5, 2, 3, 4) */
  duration_years: number;
}

/* ── Universities — UK (deepest list, our home corpus) ────────────────── */

export const UNIVERSITIES: University[] = [
  // Russell Group / elite
  { id: "ox", name: "University of Oxford", country: "UK", city: "Oxford", tier: "russell", tuition_min: 33000, tuition_max: 48000, tuition_currency: "GBP", entry_pct_min: 88, ielts_min: 7.5, strengths: ["cs", "engineering", "business", "law", "medicine", "social_science"], official_url: "https://www.ox.ac.uk/admissions/undergraduate" },
  { id: "cam", name: "University of Cambridge", country: "UK", city: "Cambridge", tier: "russell", tuition_min: 33000, tuition_max: 48000, tuition_currency: "GBP", entry_pct_min: 88, ielts_min: 7.5, strengths: ["cs", "engineering", "business", "law", "medicine", "social_science", "data_science"], official_url: "https://www.undergraduate.study.cam.ac.uk/" },
  { id: "imperial", name: "Imperial College London", country: "UK", city: "London", tier: "russell", tuition_min: 37900, tuition_max: 45300, tuition_currency: "GBP", entry_pct_min: 82, ielts_min: 7.0, strengths: ["cs", "engineering", "data_science", "medicine"], official_url: "https://www.imperial.ac.uk/study/" },
  { id: "ucl", name: "University College London (UCL)", country: "UK", city: "London", tier: "russell", tuition_min: 29400, tuition_max: 40300, tuition_currency: "GBP", entry_pct_min: 78, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "social_science", "law", "medicine", "design"], official_url: "https://www.ucl.ac.uk/prospective-students/" },
  { id: "lse", name: "London School of Economics (LSE)", country: "UK", city: "London", tier: "russell", tuition_min: 25608, tuition_max: 29712, tuition_currency: "GBP", entry_pct_min: 82, ielts_min: 7.0, strengths: ["business", "social_science", "law"], official_url: "https://www.lse.ac.uk/" },
  { id: "kcl", name: "King's College London", country: "UK", city: "London", tier: "russell", tuition_min: 24000, tuition_max: 40000, tuition_currency: "GBP", entry_pct_min: 75, ielts_min: 6.5, strengths: ["business", "nursing", "law", "medicine", "social_science"], official_url: "https://www.kcl.ac.uk/" },
  { id: "manchester", name: "University of Manchester", country: "UK", city: "Manchester", tier: "russell", tuition_min: 24500, tuition_max: 35500, tuition_currency: "GBP", entry_pct_min: 72, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "nursing", "data_science"], official_url: "https://www.manchester.ac.uk/" },
  { id: "edinburgh", name: "University of Edinburgh", country: "UK", city: "Edinburgh", tier: "russell", tuition_min: 25300, tuition_max: 35900, tuition_currency: "GBP", entry_pct_min: 75, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "data_science", "social_science"], official_url: "https://www.ed.ac.uk/" },
  { id: "bristol", name: "University of Bristol", country: "UK", city: "Bristol", tier: "russell", tuition_min: 25300, tuition_max: 29600, tuition_currency: "GBP", entry_pct_min: 72, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "design"], official_url: "https://www.bristol.ac.uk/" },
  { id: "warwick", name: "University of Warwick", country: "UK", city: "Coventry", tier: "russell", tuition_min: 24800, tuition_max: 34200, tuition_currency: "GBP", entry_pct_min: 75, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "data_science"], official_url: "https://warwick.ac.uk/" },
  { id: "glasgow", name: "University of Glasgow", country: "UK", city: "Glasgow", tier: "russell", tuition_min: 22500, tuition_max: 29650, tuition_currency: "GBP", entry_pct_min: 70, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "nursing"], official_url: "https://www.gla.ac.uk/" },
  { id: "durham", name: "Durham University", country: "UK", city: "Durham", tier: "russell", tuition_min: 23250, tuition_max: 32200, tuition_currency: "GBP", entry_pct_min: 75, ielts_min: 6.5, strengths: ["business", "social_science", "law"], official_url: "https://www.durham.ac.uk/" },
  { id: "leeds", name: "University of Leeds", country: "UK", city: "Leeds", tier: "russell", tuition_min: 22500, tuition_max: 31500, tuition_currency: "GBP", entry_pct_min: 70, ielts_min: 6.5, strengths: ["engineering", "business", "nursing", "design"], official_url: "https://www.leeds.ac.uk/" },
  { id: "sheffield", name: "University of Sheffield", country: "UK", city: "Sheffield", tier: "russell", tuition_min: 22000, tuition_max: 31000, tuition_currency: "GBP", entry_pct_min: 68, ielts_min: 6.5, strengths: ["cs", "engineering", "data_science"], official_url: "https://www.sheffield.ac.uk/" },
  { id: "newcastle", name: "Newcastle University", country: "UK", city: "Newcastle", tier: "russell", tuition_min: 22000, tuition_max: 30000, tuition_currency: "GBP", entry_pct_min: 65, ielts_min: 6.5, strengths: ["engineering", "business", "nursing"], official_url: "https://www.ncl.ac.uk/" },
  // Strong mid-tier
  { id: "lancaster", name: "Lancaster University", country: "UK", city: "Lancaster", tier: "mid_research", tuition_min: 22500, tuition_max: 30000, tuition_currency: "GBP", entry_pct_min: 68, ielts_min: 6.5, strengths: ["cs", "engineering", "business"], official_url: "https://www.lancaster.ac.uk/" },
  { id: "loughborough", name: "Loughborough University", country: "UK", city: "Loughborough", tier: "mid_research", tuition_min: 22500, tuition_max: 29500, tuition_currency: "GBP", entry_pct_min: 65, ielts_min: 6.5, strengths: ["engineering", "business", "design"], official_url: "https://www.lboro.ac.uk/" },
  { id: "bath", name: "University of Bath", country: "UK", city: "Bath", tier: "mid_research", tuition_min: 23000, tuition_max: 28000, tuition_currency: "GBP", entry_pct_min: 70, ielts_min: 6.5, strengths: ["cs", "engineering", "business"], official_url: "https://www.bath.ac.uk/" },
  { id: "surrey", name: "University of Surrey", country: "UK", city: "Guildford", tier: "mid_research", tuition_min: 20000, tuition_max: 26000, tuition_currency: "GBP", entry_pct_min: 60, ielts_min: 6.5, strengths: ["business", "engineering", "nursing"], official_url: "https://www.surrey.ac.uk/" },
  { id: "york", name: "University of York", country: "UK", city: "York", tier: "mid_research", tuition_min: 22000, tuition_max: 27500, tuition_currency: "GBP", entry_pct_min: 65, ielts_min: 6.5, strengths: ["cs", "social_science", "design"], official_url: "https://www.york.ac.uk/" },
  // Modern / post-1992 (Nepali-friendly mid-tier)
  { id: "coventry", name: "Coventry University", country: "UK", city: "Coventry", tier: "modern", tuition_min: 18000, tuition_max: 22000, tuition_currency: "GBP", entry_pct_min: 55, ielts_min: 6.0, strengths: ["engineering", "business", "nursing", "cs"], official_url: "https://www.coventry.ac.uk/" },
  { id: "uwe", name: "University of the West of England (UWE Bristol)", country: "UK", city: "Bristol", tier: "modern", tuition_min: 16000, tuition_max: 20000, tuition_currency: "GBP", entry_pct_min: 55, ielts_min: 6.0, strengths: ["business", "engineering", "nursing"], official_url: "https://www.uwe.ac.uk/" },
  { id: "hertfordshire", name: "University of Hertfordshire", country: "UK", city: "Hatfield", tier: "modern", tuition_min: 14975, tuition_max: 18250, tuition_currency: "GBP", entry_pct_min: 50, ielts_min: 6.0, strengths: ["business", "cs", "engineering", "nursing"], official_url: "https://www.herts.ac.uk/" },
  { id: "northumbria", name: "Northumbria University", country: "UK", city: "Newcastle", tier: "modern", tuition_min: 16500, tuition_max: 20500, tuition_currency: "GBP", entry_pct_min: 55, ielts_min: 6.0, strengths: ["business", "cs", "nursing", "design"], official_url: "https://www.northumbria.ac.uk/" },
  { id: "westminster", name: "University of Westminster", country: "UK", city: "London", tier: "modern", tuition_min: 16400, tuition_max: 20500, tuition_currency: "GBP", entry_pct_min: 55, ielts_min: 6.0, strengths: ["business", "cs", "law", "design"], official_url: "https://www.westminster.ac.uk/" },
  { id: "greenwich", name: "University of Greenwich", country: "UK", city: "London", tier: "modern", tuition_min: 17000, tuition_max: 19000, tuition_currency: "GBP", entry_pct_min: 50, ielts_min: 6.0, strengths: ["business", "engineering", "cs", "nursing"], official_url: "https://www.gre.ac.uk/" },
  { id: "demontfort", name: "De Montfort University", country: "UK", city: "Leicester", tier: "modern", tuition_min: 15750, tuition_max: 18250, tuition_currency: "GBP", entry_pct_min: 50, ielts_min: 6.0, strengths: ["business", "cs", "engineering", "design", "nursing"], official_url: "https://www.dmu.ac.uk/" },
  { id: "bcu", name: "Birmingham City University", country: "UK", city: "Birmingham", tier: "modern", tuition_min: 14310, tuition_max: 17950, tuition_currency: "GBP", entry_pct_min: 50, ielts_min: 6.0, strengths: ["business", "cs", "nursing", "design"], official_url: "https://www.bcu.ac.uk/" },
  { id: "salford", name: "University of Salford", country: "UK", city: "Manchester", tier: "modern", tuition_min: 16380, tuition_max: 19170, tuition_currency: "GBP", entry_pct_min: 50, ielts_min: 6.0, strengths: ["business", "engineering", "nursing"], official_url: "https://www.salford.ac.uk/" },

  /* ── Australia — Group of Eight + strong mid-tier ──────────────────── */
  { id: "melbourne", name: "University of Melbourne", country: "Australia", city: "Melbourne", tier: "go8", tuition_min: 42000, tuition_max: 52000, tuition_currency: "AUD", entry_pct_min: 80, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "medicine", "law"], official_url: "https://study.unimelb.edu.au/" },
  { id: "sydney", name: "University of Sydney", country: "Australia", city: "Sydney", tier: "go8", tuition_min: 47000, tuition_max: 55000, tuition_currency: "AUD", entry_pct_min: 78, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "medicine"], official_url: "https://www.sydney.edu.au/" },
  { id: "anu", name: "Australian National University (ANU)", country: "Australia", city: "Canberra", tier: "go8", tuition_min: 46000, tuition_max: 53000, tuition_currency: "AUD", entry_pct_min: 75, ielts_min: 6.5, strengths: ["cs", "engineering", "social_science", "data_science"], official_url: "https://www.anu.edu.au/" },
  { id: "unsw", name: "UNSW Sydney", country: "Australia", city: "Sydney", tier: "go8", tuition_min: 42000, tuition_max: 53000, tuition_currency: "AUD", entry_pct_min: 75, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "data_science"], official_url: "https://www.unsw.edu.au/" },
  { id: "monash", name: "Monash University", country: "Australia", city: "Melbourne", tier: "go8", tuition_min: 38000, tuition_max: 50000, tuition_currency: "AUD", entry_pct_min: 70, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "nursing", "medicine"], official_url: "https://www.monash.edu/" },
  { id: "uq", name: "University of Queensland (UQ)", country: "Australia", city: "Brisbane", tier: "go8", tuition_min: 38000, tuition_max: 50000, tuition_currency: "AUD", entry_pct_min: 70, ielts_min: 6.5, strengths: ["engineering", "business", "nursing", "medicine"], official_url: "https://www.uq.edu.au/" },
  { id: "uwa", name: "University of Western Australia (UWA)", country: "Australia", city: "Perth", tier: "go8", tuition_min: 38000, tuition_max: 50000, tuition_currency: "AUD", entry_pct_min: 68, ielts_min: 6.5, strengths: ["engineering", "business", "nursing"], official_url: "https://www.uwa.edu.au/" },
  { id: "adelaide", name: "University of Adelaide", country: "Australia", city: "Adelaide", tier: "go8", tuition_min: 39000, tuition_max: 50000, tuition_currency: "AUD", entry_pct_min: 70, ielts_min: 6.5, strengths: ["engineering", "cs", "business", "medicine", "data_science"], official_url: "https://www.adelaide.edu.au/" },
  { id: "deakin", name: "Deakin University", country: "Australia", city: "Melbourne", tier: "mid_research", tuition_min: 32000, tuition_max: 42000, tuition_currency: "AUD", entry_pct_min: 60, ielts_min: 6.0, strengths: ["business", "cs", "engineering", "nursing"], official_url: "https://www.deakin.edu.au/" },
  { id: "rmit", name: "RMIT University", country: "Australia", city: "Melbourne", tier: "mid_research", tuition_min: 32000, tuition_max: 45000, tuition_currency: "AUD", entry_pct_min: 60, ielts_min: 6.0, strengths: ["design", "engineering", "business", "cs"], official_url: "https://www.rmit.edu.au/" },
  { id: "latrobe", name: "La Trobe University", country: "Australia", city: "Melbourne", tier: "mid_research", tuition_min: 30000, tuition_max: 40000, tuition_currency: "AUD", entry_pct_min: 55, ielts_min: 6.0, strengths: ["business", "nursing", "cs"], official_url: "https://www.latrobe.edu.au/" },
  { id: "uts", name: "University of Technology Sydney (UTS)", country: "Australia", city: "Sydney", tier: "mid_research", tuition_min: 36000, tuition_max: 50000, tuition_currency: "AUD", entry_pct_min: 65, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "design", "data_science"], official_url: "https://www.uts.edu.au/study/international" },
  { id: "macquarie", name: "Macquarie University", country: "Australia", city: "Sydney", tier: "mid_research", tuition_min: 34000, tuition_max: 47000, tuition_currency: "AUD", entry_pct_min: 62, ielts_min: 6.5, strengths: ["business", "cs", "data_science", "law", "social_science"], official_url: "https://www.mq.edu.au/study/information-for/international" },
  { id: "qut", name: "Queensland University of Technology (QUT)", country: "Australia", city: "Brisbane", tier: "mid_research", tuition_min: 33000, tuition_max: 46000, tuition_currency: "AUD", entry_pct_min: 60, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "design", "nursing"], official_url: "https://www.qut.edu.au/study/international" },
  { id: "griffith", name: "Griffith University", country: "Australia", city: "Brisbane / Gold Coast", tier: "mid_research", tuition_min: 32000, tuition_max: 44000, tuition_currency: "AUD", entry_pct_min: 58, ielts_min: 6.5, strengths: ["nursing", "business", "engineering", "social_science", "medicine"], official_url: "https://www.griffith.edu.au/apply/international" },
  { id: "curtin", name: "Curtin University", country: "Australia", city: "Perth", tier: "mid_research", tuition_min: 33000, tuition_max: 47000, tuition_currency: "AUD", entry_pct_min: 58, ielts_min: 6.5, strengths: ["engineering", "business", "cs", "nursing", "data_science"], official_url: "https://www.curtin.edu.au/study/international-students/" },
  { id: "wollongong", name: "University of Wollongong", country: "Australia", city: "Wollongong", tier: "mid_research", tuition_min: 31000, tuition_max: 43000, tuition_currency: "AUD", entry_pct_min: 58, ielts_min: 6.0, strengths: ["cs", "engineering", "business", "nursing"], official_url: "https://www.uow.edu.au/study/international/" },
  { id: "swinburne", name: "Swinburne University of Technology", country: "Australia", city: "Melbourne", tier: "modern", tuition_min: 30000, tuition_max: 41000, tuition_currency: "AUD", entry_pct_min: 55, ielts_min: 6.0, strengths: ["design", "cs", "engineering", "business"], official_url: "https://www.swinburne.edu.au/courses/international/" },
  { id: "westernsydney", name: "Western Sydney University", country: "Australia", city: "Sydney", tier: "modern", tuition_min: 30000, tuition_max: 42000, tuition_currency: "AUD", entry_pct_min: 55, ielts_min: 6.5, strengths: ["nursing", "business", "cs", "social_science"], official_url: "https://www.westernsydney.edu.au/international" },

  /* ── Canada — strong picks ─────────────────────────────────────────── */
  { id: "toronto", name: "University of Toronto", country: "Canada", city: "Toronto", tier: "u15", tuition_min: 45000, tuition_max: 67000, tuition_currency: "CAD", entry_pct_min: 80, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "medicine", "data_science"], official_url: "https://www.utoronto.ca/" },
  { id: "ubc", name: "University of British Columbia (UBC)", country: "Canada", city: "Vancouver", tier: "u15", tuition_min: 42000, tuition_max: 58000, tuition_currency: "CAD", entry_pct_min: 78, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "medicine"], official_url: "https://www.ubc.ca/" },
  { id: "mcgill", name: "McGill University", country: "Canada", city: "Montreal", tier: "u15", tuition_min: 35000, tuition_max: 60000, tuition_currency: "CAD", entry_pct_min: 78, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "medicine"], official_url: "https://www.mcgill.ca/" },
  { id: "waterloo", name: "University of Waterloo", country: "Canada", city: "Waterloo", tier: "u15", tuition_min: 40000, tuition_max: 65000, tuition_currency: "CAD", entry_pct_min: 78, ielts_min: 6.5, strengths: ["cs", "engineering", "data_science"], official_url: "https://uwaterloo.ca/" },
  { id: "mcmaster", name: "McMaster University", country: "Canada", city: "Hamilton", tier: "u15", tuition_min: 40000, tuition_max: 55000, tuition_currency: "CAD", entry_pct_min: 72, ielts_min: 6.5, strengths: ["engineering", "nursing", "medicine", "business"], official_url: "https://www.mcmaster.ca/" },
  { id: "alberta", name: "University of Alberta", country: "Canada", city: "Edmonton", tier: "u15", tuition_min: 30000, tuition_max: 45000, tuition_currency: "CAD", entry_pct_min: 65, ielts_min: 6.5, strengths: ["engineering", "business", "nursing", "cs"], official_url: "https://www.ualberta.ca/" },
  { id: "calgary", name: "University of Calgary", country: "Canada", city: "Calgary", tier: "u15", tuition_min: 28000, tuition_max: 42000, tuition_currency: "CAD", entry_pct_min: 62, ielts_min: 6.5, strengths: ["engineering", "business", "nursing", "cs"], official_url: "https://www.ucalgary.ca/" },
  { id: "manitoba", name: "University of Manitoba", country: "Canada", city: "Winnipeg", tier: "u15", tuition_min: 22000, tuition_max: 35000, tuition_currency: "CAD", entry_pct_min: 55, ielts_min: 6.5, strengths: ["engineering", "business", "nursing"], official_url: "https://umanitoba.ca/" },
  { id: "concordia", name: "Concordia University", country: "Canada", city: "Montreal", tier: "mid_research", tuition_min: 28000, tuition_max: 42000, tuition_currency: "CAD", entry_pct_min: 60, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "design"], official_url: "https://www.concordia.ca/" },
  { id: "windsor", name: "University of Windsor", country: "Canada", city: "Windsor", tier: "mid_research", tuition_min: 26000, tuition_max: 38000, tuition_currency: "CAD", entry_pct_min: 55, ielts_min: 6.5, strengths: ["cs", "engineering", "business", "nursing"], official_url: "https://www.uwindsor.ca/" },

  /* ── USA — selective picks ─────────────────────────────────────────── */
  { id: "mit", name: "Massachusetts Institute of Technology (MIT)", country: "USA", city: "Cambridge MA", tier: "ivy_plus", tuition_min: 60000, tuition_max: 65000, tuition_currency: "USD", entry_pct_min: 90, ielts_min: 7.0, strengths: ["cs", "engineering", "data_science", "business"], official_url: "https://www.mit.edu/" },
  { id: "stanford", name: "Stanford University", country: "USA", city: "Stanford CA", tier: "ivy_plus", tuition_min: 60000, tuition_max: 65000, tuition_currency: "USD", entry_pct_min: 90, ielts_min: 7.0, strengths: ["cs", "engineering", "business", "medicine", "law"], official_url: "https://www.stanford.edu/" },
  { id: "harvard", name: "Harvard University", country: "USA", city: "Cambridge MA", tier: "ivy_plus", tuition_min: 60000, tuition_max: 65000, tuition_currency: "USD", entry_pct_min: 90, ielts_min: 7.0, strengths: ["business", "law", "medicine", "social_science"], official_url: "https://www.harvard.edu/" },
  { id: "cmu", name: "Carnegie Mellon University", country: "USA", city: "Pittsburgh PA", tier: "ivy_plus", tuition_min: 55000, tuition_max: 65000, tuition_currency: "USD", entry_pct_min: 85, ielts_min: 7.0, strengths: ["cs", "engineering", "data_science", "design"], official_url: "https://www.cmu.edu/" },
  { id: "ucla", name: "UCLA", country: "USA", city: "Los Angeles CA", tier: "ivy_plus", tuition_min: 45000, tuition_max: 55000, tuition_currency: "USD", entry_pct_min: 80, ielts_min: 7.0, strengths: ["cs", "engineering", "business", "medicine"], official_url: "https://www.ucla.edu/" },
  { id: "purdue", name: "Purdue University", country: "USA", city: "West Lafayette IN", tier: "mid_research", tuition_min: 30000, tuition_max: 35000, tuition_currency: "USD", entry_pct_min: 70, ielts_min: 6.5, strengths: ["engineering", "cs", "business"], official_url: "https://www.purdue.edu/" },
  { id: "asu", name: "Arizona State University", country: "USA", city: "Tempe AZ", tier: "mid_research", tuition_min: 32000, tuition_max: 38000, tuition_currency: "USD", entry_pct_min: 60, ielts_min: 6.5, strengths: ["cs", "engineering", "business"], official_url: "https://www.asu.edu/" },
  { id: "syracuse", name: "Syracuse University", country: "USA", city: "Syracuse NY", tier: "mid_research", tuition_min: 55000, tuition_max: 60000, tuition_currency: "USD", entry_pct_min: 65, ielts_min: 6.5, strengths: ["business", "social_science", "design"], official_url: "https://www.syracuse.edu/" },
  { id: "umass", name: "UMass Amherst", country: "USA", city: "Amherst MA", tier: "mid_research", tuition_min: 38000, tuition_max: 42000, tuition_currency: "USD", entry_pct_min: 65, ielts_min: 6.5, strengths: ["cs", "engineering", "business"], official_url: "https://www.umass.edu/" },
  { id: "iastate", name: "Iowa State University", country: "USA", city: "Ames IA", tier: "regional", tuition_min: 26000, tuition_max: 30000, tuition_currency: "USD", entry_pct_min: 55, ielts_min: 6.5, strengths: ["engineering", "business", "cs"], official_url: "https://www.iastate.edu/" },
];

/* ── Courses (representative — students will search specific names anyway) ── */

export const COURSES: Course[] = [
  // UK CS
  { id: "ucl-msc-cs", university_id: "ucl", level: "postgraduate", name: "MSc Computer Science", field: "cs", duration_years: 1 },
  { id: "imperial-msc-cs", university_id: "imperial", level: "postgraduate", name: "MSc Computing", field: "cs", duration_years: 1 },
  { id: "manchester-msc-ds", university_id: "manchester", level: "postgraduate", name: "MSc Data Science", field: "data_science", duration_years: 1 },
  { id: "edinburgh-msc-ai", university_id: "edinburgh", level: "postgraduate", name: "MSc Artificial Intelligence", field: "cs", duration_years: 1 },
  { id: "sheffield-msc-cs", university_id: "sheffield", level: "postgraduate", name: "MSc Advanced Computer Science", field: "cs", duration_years: 1 },
  { id: "coventry-msc-cs", university_id: "coventry", level: "postgraduate", name: "MSc Computer Science", field: "cs", duration_years: 1 },
  { id: "hertfordshire-msc-cs", university_id: "hertfordshire", level: "postgraduate", name: "MSc Software Engineering", field: "cs", duration_years: 1 },
  // UK engineering
  { id: "imperial-meng", university_id: "imperial", level: "undergraduate", name: "MEng Mechanical Engineering", field: "engineering", duration_years: 4 },
  { id: "manchester-eng", university_id: "manchester", level: "undergraduate", name: "BEng Civil Engineering", field: "engineering", duration_years: 3 },
  { id: "coventry-eng", university_id: "coventry", level: "undergraduate", name: "BEng Mechanical Engineering", field: "engineering", duration_years: 3 },
  // UK business
  { id: "lse-bsc-management", university_id: "lse", level: "undergraduate", name: "BSc Management", field: "business", duration_years: 3 },
  { id: "warwick-bsc-business", university_id: "warwick", level: "undergraduate", name: "BSc International Business", field: "business", duration_years: 3 },
  { id: "manchester-bsc-business", university_id: "manchester", level: "undergraduate", name: "BSc Management", field: "business", duration_years: 3 },
  { id: "hertfordshire-bsc-business", university_id: "hertfordshire", level: "undergraduate", name: "BA Business Management", field: "business", duration_years: 3 },
  // UK nursing
  { id: "manchester-bsc-nursing", university_id: "manchester", level: "undergraduate", name: "BSc Adult Nursing", field: "nursing", duration_years: 3 },
  { id: "leeds-bsc-nursing", university_id: "leeds", level: "undergraduate", name: "BSc Nursing (Adult)", field: "nursing", duration_years: 3 },
  { id: "hertfordshire-bsc-nursing", university_id: "hertfordshire", level: "undergraduate", name: "BSc Adult Nursing", field: "nursing", duration_years: 3 },
  // Australia CS
  { id: "melbourne-mit-it", university_id: "melbourne", level: "postgraduate", name: "Master of Information Technology", field: "cs", duration_years: 2 },
  { id: "unsw-msit", university_id: "unsw", level: "postgraduate", name: "Master of Information Technology", field: "cs", duration_years: 2 },
  { id: "monash-bcs", university_id: "monash", level: "undergraduate", name: "Bachelor of Computer Science", field: "cs", duration_years: 3 },
  { id: "rmit-bsc-cs", university_id: "rmit", level: "undergraduate", name: "Bachelor of Information Technology", field: "cs", duration_years: 3 },
  { id: "adelaide-bcs", university_id: "adelaide", level: "undergraduate", name: "Bachelor of Computer Science", field: "cs", duration_years: 3 },
  { id: "uts-bit", university_id: "uts", level: "undergraduate", name: "Bachelor of Information Technology", field: "cs", duration_years: 3 },
  { id: "macquarie-bcyber", university_id: "macquarie", level: "undergraduate", name: "Bachelor of Cyber Security", field: "cs", duration_years: 3 },
  { id: "qut-bit", university_id: "qut", level: "undergraduate", name: "Bachelor of Information Technology", field: "cs", duration_years: 3 },
  { id: "wollongong-bcs", university_id: "wollongong", level: "undergraduate", name: "Bachelor of Computer Science", field: "cs", duration_years: 3 },
  // Australia business
  { id: "unsw-bcom", university_id: "unsw", level: "undergraduate", name: "Bachelor of Commerce", field: "business", duration_years: 3 },
  { id: "monash-bcom", university_id: "monash", level: "undergraduate", name: "Bachelor of Business", field: "business", duration_years: 3 },
  { id: "deakin-bcom", university_id: "deakin", level: "undergraduate", name: "Bachelor of Commerce", field: "business", duration_years: 3 },
  { id: "macquarie-bcommerce", university_id: "macquarie", level: "undergraduate", name: "Bachelor of Commerce", field: "business", duration_years: 3 },
  { id: "qut-business", university_id: "qut", level: "undergraduate", name: "Bachelor of Business", field: "business", duration_years: 3 },
  { id: "curtin-commerce", university_id: "curtin", level: "undergraduate", name: "Bachelor of Commerce", field: "business", duration_years: 3 },
  // Australia engineering / health / design
  { id: "sydney-beng", university_id: "sydney", level: "undergraduate", name: "Bachelor of Engineering Honours", field: "engineering", duration_years: 4 },
  { id: "uq-beng", university_id: "uq", level: "undergraduate", name: "Bachelor of Engineering (Honours)", field: "engineering", duration_years: 4 },
  { id: "curtin-beng", university_id: "curtin", level: "undergraduate", name: "Bachelor of Engineering (Honours)", field: "engineering", duration_years: 4 },
  { id: "griffith-nursing", university_id: "griffith", level: "undergraduate", name: "Bachelor of Nursing", field: "nursing", duration_years: 3 },
  { id: "westernsydney-nursing", university_id: "westernsydney", level: "undergraduate", name: "Bachelor of Nursing", field: "nursing", duration_years: 3 },
  { id: "swinburne-design", university_id: "swinburne", level: "undergraduate", name: "Bachelor of Design", field: "design", duration_years: 3 },
  { id: "rmit-master-data", university_id: "rmit", level: "postgraduate", name: "Master of Data Science", field: "data_science", duration_years: 2 },
  // Canada
  { id: "toronto-bsc-cs", university_id: "toronto", level: "undergraduate", name: "Bachelor of Science · Computer Science", field: "cs", duration_years: 4 },
  { id: "waterloo-bcs", university_id: "waterloo", level: "undergraduate", name: "Bachelor of Computer Science", field: "cs", duration_years: 4 },
  { id: "ubc-bsc-cs", university_id: "ubc", level: "undergraduate", name: "BSc Computer Science", field: "cs", duration_years: 4 },
  { id: "alberta-bsc-cs", university_id: "alberta", level: "undergraduate", name: "BSc Computer Science", field: "cs", duration_years: 4 },
  { id: "concordia-meng", university_id: "concordia", level: "postgraduate", name: "Master of Engineering · Software", field: "engineering", duration_years: 1.5 },
  // USA
  { id: "mit-meng-cs", university_id: "mit", level: "postgraduate", name: "MEng Computer Science", field: "cs", duration_years: 1 },
  { id: "cmu-ms-cs", university_id: "cmu", level: "postgraduate", name: "MS Computer Science", field: "cs", duration_years: 2 },
  { id: "purdue-bs-cs", university_id: "purdue", level: "undergraduate", name: "BS Computer Science", field: "cs", duration_years: 4 },
  { id: "asu-bs-cs", university_id: "asu", level: "undergraduate", name: "BS Computer Science", field: "cs", duration_years: 4 },
];

export const UNIVERSITY_PROFILES: Record<string, UniversityProfile> = {
  melbourne: {
    summary: "Research-heavy, globally recognised, and strongest when the student has a high academic profile and wants a Melbourne base.",
    best_for: ["Research profile", "Melbourne city life", "Selective applicants"],
    campus_note: "Parkville campus, close to central Melbourne. Living costs are higher, but networks and internships are strong.",
    international_url: "https://study.unimelb.edu.au/",
    courses_url: "https://study.unimelb.edu.au/find/",
    scholarships_url: "https://scholarships.unimelb.edu.au/",
    admissions_url: "https://study.unimelb.edu.au/how-to-apply",
  },
  sydney: {
    summary: "A strong Sydney option for students who want a broad course catalogue, city internships, and a highly recognised university brand.",
    best_for: ["Sydney networks", "Engineering", "Business and health"],
    campus_note: "Main Camperdown/Darlington campus near central Sydney. Good for students who can manage a higher-cost city.",
    international_url: "https://www.sydney.edu.au/study/international-students.html",
    courses_url: "https://www.sydney.edu.au/courses/search.html",
    scholarships_url: "https://www.sydney.edu.au/scholarships/",
    admissions_url: "https://www.sydney.edu.au/study/how-to-apply/international-students.html",
    thumbnail_url: "https://www.sydney.edu.au/content/dam/0q5a0458_homepage_shoes_-grey.jpg",
  },
  anu: {
    summary: "A compact, academic Canberra choice for students interested in public policy, data, research, science, and quieter student life.",
    best_for: ["Research focus", "Canberra", "Policy and data"],
    campus_note: "Canberra is calmer than Sydney or Melbourne and can suit students who want a focused study environment.",
    international_url: "https://www.anu.edu.au/study/information-for/international-students",
    courses_url: "https://programsandcourses.anu.edu.au/",
    scholarships_url: "https://www.anu.edu.au/study/scholarships",
    admissions_url: "https://www.anu.edu.au/study/apply",
  },
  unsw: {
    summary: "A practical Sydney shortlist choice for computing, engineering, commerce, and data-focused students who want strong industry links.",
    best_for: ["Technology", "Engineering", "Commerce"],
    campus_note: "Kensington campus has a fast, career-focused feel. Sydney costs are high, so budget carefully.",
    international_url: "https://www.unsw.edu.au/study/international-students",
    courses_url: "https://www.unsw.edu.au/study/search",
    scholarships_url: "https://www.unsw.edu.au/study/how-to-apply/scholarships",
    admissions_url: "https://www.unsw.edu.au/study/how-to-apply/international",
  },
  monash: {
    summary: "Large, flexible, and well-known with strong options across IT, engineering, business, health, and pathway-style planning.",
    best_for: ["Flexible course paths", "Health and IT", "Melbourne suburbs"],
    campus_note: "Clayton and Caulfield are outside the CBD, which can help with living costs compared with inner-city Melbourne.",
    international_url: "https://www.monash.edu/study/international",
    courses_url: "https://www.monash.edu/study/courses/find-a-course",
    scholarships_url: "https://www.monash.edu/study/fees-scholarships/scholarships",
    admissions_url: "https://www.monash.edu/study/how-to-apply/international-student-applications",
  },
  uq: {
    summary: "A strong Brisbane option for students who want a major research university with warmer weather and comparatively calmer city life.",
    best_for: ["Brisbane", "Engineering", "Health sciences"],
    campus_note: "St Lucia is a classic campus environment. Brisbane is often easier to manage than Sydney/Melbourne for daily living.",
    international_url: "https://study.uq.edu.au/international-students",
    courses_url: "https://study.uq.edu.au/study-options/programs",
    scholarships_url: "https://scholarships.uq.edu.au/",
    admissions_url: "https://study.uq.edu.au/admissions",
  },
  uwa: {
    summary: "A Perth-based option for students who want a quieter city, strong engineering/business pathways, and a campus-led experience.",
    best_for: ["Perth", "Engineering", "Campus life"],
    campus_note: "Crawley campus is near the Swan River. Perth can suit students who prefer a smaller city rhythm.",
    international_url: "https://www.uwa.edu.au/study/international-students",
    courses_url: "https://www.uwa.edu.au/study/courses",
    scholarships_url: "https://www.uwa.edu.au/study/scholarships",
    admissions_url: "https://www.uwa.edu.au/study/how-to-apply/international",
  },
  adelaide: {
    summary: "A Go8 option with a more manageable city feel, useful for students comparing prestige with cost and lifestyle.",
    best_for: ["Adelaide", "Engineering", "Computer science"],
    campus_note: "North Terrace sits in central Adelaide. The city can feel less intense than the east-coast capitals.",
    international_url: "https://international.adelaide.edu.au/",
    courses_url: "https://www.adelaide.edu.au/degree-finder/",
    scholarships_url: "https://international.adelaide.edu.au/admissions/scholarships",
    admissions_url: "https://international.adelaide.edu.au/admissions/how-to-apply",
  },
  deakin: {
    summary: "A practical Melbourne/Geelong choice for students who want applied courses, flexible campuses, and a slightly more accessible entry profile.",
    best_for: ["Applied learning", "Business", "Nursing and IT"],
    campus_note: "Melbourne Burwood is popular with international students; Geelong can be calmer and more affordable.",
    international_url: "https://www.deakin.edu.au/international-students",
    courses_url: "https://www.deakin.edu.au/courses",
    scholarships_url: "https://www.deakin.edu.au/study/fees-and-scholarships/scholarships",
    admissions_url: "https://www.deakin.edu.au/study/how-to-apply/international-students",
  },
  rmit: {
    summary: "A city-campus university with a strong practical feel for design, IT, engineering, media, and business.",
    best_for: ["Design", "City campus", "Practical learning"],
    campus_note: "RMIT's Melbourne city campus is right in the CBD, good for energy and access but not the cheapest lifestyle.",
    international_url: "https://www.rmit.edu.au/study-with-us/international-students",
    courses_url: "https://www.rmit.edu.au/study-with-us/international-students/programs-for-international-students",
    scholarships_url: "https://www.rmit.edu.au/students/careers-opportunities/scholarships",
    admissions_url: "https://www.rmit.edu.au/study-with-us/international-students/apply-to-rmit-international-students",
  },
  latrobe: {
    summary: "A friendly Melbourne option for students looking at nursing, business, IT, and broader pathway flexibility.",
    best_for: ["Nursing", "Pathways", "Melbourne value"],
    campus_note: "Bundoora is outside the CBD, which can feel calmer and may help students manage accommodation choices.",
    international_url: "https://www.latrobe.edu.au/international",
    courses_url: "https://www.latrobe.edu.au/courses",
    scholarships_url: "https://www.latrobe.edu.au/international/fees/scholarships",
    admissions_url: "https://www.latrobe.edu.au/international/apply",
  },
  uts: {
    summary: "A highly urban Sydney choice for students who want technology, business, design, and practical industry-facing study.",
    best_for: ["Sydney CBD", "Technology", "Design and business"],
    campus_note: "UTS is in the heart of Sydney's technology precinct. Great access, but students must plan rent carefully.",
    international_url: "https://www.uts.edu.au/study/international",
    courses_url: "https://www.uts.edu.au/study/find-a-course",
    scholarships_url: "https://www.uts.edu.au/study/international/essential-information/scholarships-international-students",
    admissions_url: "https://www.uts.edu.au/study/international/how-apply",
  },
  macquarie: {
    summary: "A Sydney option with a campus setting, strong business/IT pathways, and good fit for students comparing city access with space.",
    best_for: ["Business", "Cyber security", "Campus in Sydney"],
    campus_note: "Located in Macquarie Park, close to a business and technology precinct rather than the inner CBD.",
    international_url: "https://www.mq.edu.au/study/information-for/international",
    courses_url: "https://www.mq.edu.au/study/find-a-course",
    scholarships_url: "https://www.mq.edu.au/study/admissions-and-entry/scholarships",
    admissions_url: "https://www.mq.edu.au/study/admissions-and-entry/apply/international",
  },
  qut: {
    summary: "A Brisbane university with a practical, career-oriented style across IT, engineering, business, creative industries, and health.",
    best_for: ["Brisbane", "Career-focused study", "IT and creative industries"],
    campus_note: "Gardens Point and Kelvin Grove give students city access without Sydney/Melbourne scale.",
    international_url: "https://www.qut.edu.au/study/international",
    courses_url: "https://www.qut.edu.au/study",
    scholarships_url: "https://www.qut.edu.au/study/fees-and-scholarships/scholarships",
    admissions_url: "https://www.qut.edu.au/study/applying/international-applying",
  },
  griffith: {
    summary: "A Queensland choice for students interested in health, business, hospitality, aviation, social sciences, and Gold Coast/Brisbane life.",
    best_for: ["Health", "Gold Coast", "Student support"],
    campus_note: "Multiple campuses across Brisbane and the Gold Coast. Good for students considering lifestyle and part-time work access.",
    international_url: "https://www.griffith.edu.au/international",
    courses_url: "https://www.griffith.edu.au/study/degrees?studentType=international",
    scholarships_url: "https://www.griffith.edu.au/international/scholarships-finance",
    admissions_url: "https://www.griffith.edu.au/apply/international",
  },
  curtin: {
    summary: "A Perth university with practical strengths in engineering, IT, business, health, and applied sciences.",
    best_for: ["Perth", "Engineering", "Applied courses"],
    campus_note: "Bentley campus is a large Perth campus. Good for students who want a major city with a slower pace.",
    international_url: "https://www.curtin.edu.au/study/international-students/",
    courses_url: "https://www.curtin.edu.au/study/search/",
    scholarships_url: "https://www.curtin.edu.au/study/scholarships/",
    admissions_url: "https://www.curtin.edu.au/study/international-students/apply/",
  },
  wollongong: {
    summary: "A coastal NSW option with strengths in computing, engineering, business, and a more contained student-city feel.",
    best_for: ["Coastal city", "Computer science", "Engineering"],
    campus_note: "Wollongong is south of Sydney, often appealing to students who want NSW without inner-Sydney rent pressure.",
    international_url: "https://www.uow.edu.au/study/international/",
    courses_url: "https://www.uow.edu.au/study/courses/",
    scholarships_url: "https://www.uow.edu.au/study/scholarships/",
    admissions_url: "https://www.uow.edu.au/study/international/apply/",
  },
  swinburne: {
    summary: "A Melbourne technology/design option for students who like applied learning, creative fields, and industry projects.",
    best_for: ["Design", "Technology", "Applied learning"],
    campus_note: "Hawthorn campus has quick train access to Melbourne CBD while feeling more neighbourhood-based.",
    international_url: "https://www.swinburne.edu.au/courses/international/",
    courses_url: "https://www.swinburne.edu.au/courses/find-a-course/",
    scholarships_url: "https://www.swinburne.edu.au/courses/fees/scholarships/",
    admissions_url: "https://www.swinburne.edu.au/courses/applying/international/",
  },
  westernsydney: {
    summary: "A practical Sydney-region option for nursing, business, IT, and students who want wider campus choices across Western Sydney.",
    best_for: ["Nursing", "Western Sydney", "Accessible options"],
    campus_note: "Multiple campuses across Western Sydney can make commute planning important, but rent may be more flexible than inner Sydney.",
    international_url: "https://www.westernsydney.edu.au/international",
    courses_url: "https://www.westernsydney.edu.au/future/study/courses",
    scholarships_url: "https://www.westernsydney.edu.au/international/home/apply/scholarships",
    admissions_url: "https://www.westernsydney.edu.au/international/home/apply/admissions",
  },
};

export function getUniversityProfile(university: University): UniversityProfile {
  const profile = UNIVERSITY_PROFILES[university.id];
  if (profile) return profile;
  return {
    summary: `${university.name} is worth checking if its entry requirements, tuition and course structure fit your profile.`,
    best_for: university.strengths.slice(0, 3).map(fieldLabel),
    campus_note: `${university.city}. Confirm campus, intake and delivery mode on the official site before applying.`,
    international_url: university.official_url,
    courses_url: university.official_url,
    scholarships_url: university.official_url,
    admissions_url: university.official_url,
  };
}

export function universityThumbnailUrl(university: University): string {
  const profile = UNIVERSITY_PROFILES[university.id];
  if (profile?.thumbnail_url) return profile.thumbnail_url;
  try {
    return `${new URL(profile?.international_url ?? university.official_url).origin}/favicon.ico`;
  } catch {
    return university.official_url;
  }
}

/** Primary logo/mark used in university cards and strips. */
export function universityLogoUrl(university: University): string {
  try {
    const host = new URL(university.official_url).hostname.replace(/^www\./, "");
    return `https://logo.clearbit.com/${host}?size=160`;
  } catch {
    return universityThumbnailUrl(university);
  }
}

const COUNTRY_CAMPUS_FALLBACKS: Record<University["country"], string> = {
  UK: "https://images.unsplash.com/photo-1523160111778-8f5d2e1c5c3c?auto=format&fit=crop&w=1200&q=80",
  Australia: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
  Canada: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  USA: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
  Germany: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1200&q=80",
};

/** A campus image or campus-like scene for university cards. */
export function universityCampusImageUrl(university: University): string {
  const profile = UNIVERSITY_PROFILES[university.id];
  if (profile?.thumbnail_url) return profile.thumbnail_url;
  return COUNTRY_CAMPUS_FALLBACKS[university.country];
}

export function fieldLabel(field: Course["field"]): string {
  return {
    cs: "Computer science",
    engineering: "Engineering",
    business: "Business",
    nursing: "Nursing",
    design: "Design",
    social_science: "Social science",
    law: "Law",
    medicine: "Medicine",
    data_science: "Data science",
  }[field];
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

const FIELD_KEYWORDS: Record<Course["field"], string[]> = {
  cs: ["computer", "cs", "software", "computing", "it ", "information tech", "programming"],
  engineering: ["engineer", "mechanical", "civil", "electrical", "robotic", "aerospace"],
  business: ["business", "bba", "management", "marketing", "finance", "commerce", "mba", "economic"],
  nursing: ["nurs", "midwif", "healthcare"],
  design: ["design", "graphic", "ux", "ui", "architecture", "art"],
  social_science: ["sociolog", "psycholog", "international relation", "politic"],
  law: ["law", "legal", "llb"],
  medicine: ["medicine", "medical", "mbbs", "doctor", "dentist"],
  data_science: ["data science", "data analytics", "machine learning", "ml ", "ai ", "artificial intel"],
};

/** Best-effort mapping from the student's free-text `preferred_field` to one of our tags. */
export function inferField(preferredField: string | null | undefined): Course["field"] | null {
  if (!preferredField) return null;
  const f = preferredField.toLowerCase();
  for (const [tag, keywords] of Object.entries(FIELD_KEYWORDS) as [Course["field"], string[]][]) {
    if (keywords.some((k) => f.includes(k))) return tag;
  }
  return null;
}

/**
 * Convert a Nepali GPA (typically 0–4 scale on NEB +2) into an approximate
 * percentage. NEB grade points: A+=4.0, A=3.6, B+=3.2, B=2.8, C+=2.4, C=2.0.
 * Multiplier of 23 gets us close to the published-percentage convention used
 * by Nepali transcripts in international applications.
 */
export function gpaToPercentage(gpa: number | null | undefined, expectedGpa: number | null | undefined): number | null {
  const value = gpa ?? expectedGpa;
  if (value == null || value <= 0) return null;
  // If already a percentage (rare but possible)
  if (value > 10) return Math.min(100, value);
  // 4-scale → percentage. We use 23× as the conservative side of the typical
  // NEB conversion table (4.0 → 92).
  return Math.min(100, Math.round(value * 23));
}

export function classifyFit(studentPct: number | null, entryMin: number): AdmissionFit {
  if (studentPct == null) return "unknown";
  if (studentPct >= entryMin + 8) return "safety";
  if (studentPct >= entryMin) return "match";
  if (studentPct >= entryMin - 6) return "reach";
  return "reach"; // still show, but tagged as reach so the student knows
}

/** Pick up to N universities for a country, ordered by best fit for student. */
export function pickUniversities(
  country: University["country"],
  studentPct: number | null,
  field: Course["field"] | null,
  limit = 8,
): University[] {
  const pool = UNIVERSITIES.filter((u) => u.country === country);
  const scored = pool.map((u) => {
    const fit = classifyFit(studentPct, u.entry_pct_min);
    // Lower score = better. Match is best, then safety, then reach.
    let fitScore = fit === "match" ? 0 : fit === "safety" ? 1 : fit === "reach" ? 2 : 1.5;
    // Bonus if university lists the student's field as a strength
    if (field && u.strengths.includes(field)) fitScore -= 0.4;
    return { u, fitScore };
  });
  scored.sort((a, b) => a.fitScore - b.fitScore);
  return scored.slice(0, limit).map((s) => s.u);
}

/** Pick courses for a country in the student's field. */
export function pickCourses(
  country: University["country"],
  field: Course["field"] | null,
  limit = 6,
): Array<{ course: Course; university: University }> {
  if (!field) return [];
  const unisInCountry = new Set(UNIVERSITIES.filter((u) => u.country === country).map((u) => u.id));
  const matches = COURSES.filter((c) => c.field === field && unisInCountry.has(c.university_id))
    .map((c) => ({
      course: c,
      university: UNIVERSITIES.find((u) => u.id === c.university_id)!,
    }))
    .slice(0, limit);
  return matches;
}

/** Currency symbol for display. */
export function currencySymbol(c: University["tuition_currency"]): string {
  return { GBP: "£", AUD: "A$", CAD: "C$", USD: "$", EUR: "€" }[c];
}
