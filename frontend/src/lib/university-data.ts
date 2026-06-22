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
  /** Optional high-quality or transparent logo override URL */
  logo_url?: string;
  /** Optional high-resolution campus photo override URL */
  campus_image_url?: string;
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
  // --- Australia ---
  melbourne: {
    summary: "Research-heavy, globally recognised, and strongest when the student has a high academic profile and wants a Melbourne base.",
    best_for: ["Research profile", "Melbourne city life", "Selective applicants"],
    campus_note: "Parkville campus, close to central Melbourne. Living costs are higher, but networks and internships are strong.",
    international_url: "https://study.unimelb.edu.au/",
    courses_url: "https://study.unimelb.edu.au/find/",
    scholarships_url: "https://scholarships.unimelb.edu.au/",
    admissions_url: "https://study.unimelb.edu.au/how-to-apply",
    campus_image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/University_of_Melbourne_crest_logo.svg/256px-University_of_Melbourne_crest_logo.svg.png"
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
    campus_image_url: "https://images.unsplash.com/photo-1595113311144-2425a927d74b?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/University_of_Sydney_logo.svg/256px-University_of_Sydney_logo.svg.png"
  },
  anu: {
    summary: "A compact, academic Canberra choice for students interested in public policy, data, research, science, and quieter student life.",
    best_for: ["Research focus", "Canberra", "Policy and data"],
    campus_note: "Canberra is calmer than Sydney or Melbourne and can suit students who want a focused study environment.",
    international_url: "https://www.anu.edu.au/study/information-for/international-students",
    courses_url: "https://programsandcourses.anu.edu.au/",
    scholarships_url: "https://www.anu.edu.au/study/scholarships",
    admissions_url: "https://www.anu.edu.au/study/apply",
    campus_image_url: "https://images.unsplash.com/photo-1627556704353-016ad90c9b98?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Australian_National_University_logo.svg/256px-Australian_National_University_logo.svg.png"
  },
  unsw: {
    summary: "A practical Sydney shortlist choice for computing, engineering, commerce, and data-focused students who want strong industry links.",
    best_for: ["Technology", "Engineering", "Commerce"],
    campus_note: "Kensington campus has a fast, career-focused feel. Sydney costs are high, so budget carefully.",
    international_url: "https://www.unsw.edu.au/study/international-students",
    courses_url: "https://www.unsw.edu.au/study/search",
    scholarships_url: "https://www.unsw.edu.au/study/how-to-apply/scholarships",
    admissions_url: "https://www.unsw.edu.au/study/how-to-apply/international",
    campus_image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/UNSW_Sydney_coat_of_arms.svg/256px-UNSW_Sydney_coat_of_arms.svg.png"
  },
  monash: {
    summary: "Large, flexible, and well-known with strong options across IT, engineering, business, health, and pathway-style planning.",
    best_for: ["Flexible course paths", "Health and IT", "Melbourne suburbs"],
    campus_note: "Clayton and Caulfield are outside the CBD, which can help with living costs compared with inner-city Melbourne.",
    international_url: "https://www.monash.edu/study/international",
    courses_url: "https://www.monash.edu/study/courses/find-a-course",
    scholarships_url: "https://www.monash.edu/study/fees-scholarships/scholarships",
    admissions_url: "https://www.monash.edu/study/how-to-apply/international-student-applications",
    campus_image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Monash_University_logo.svg/256px-Monash_University_logo.svg.png"
  },
  uq: {
    summary: "A strong Brisbane option for students who want a major research university with warmer weather and comparatively calmer city life.",
    best_for: ["Brisbane", "Engineering", "Health sciences"],
    campus_note: "St Lucia is a classic campus environment. Brisbane is often easier to manage than Sydney/Melbourne for daily living.",
    international_url: "https://study.uq.edu.au/international-students",
    courses_url: "https://study.uq.edu.au/study-options/programs",
    scholarships_url: "https://scholarships.uq.edu.au/",
    admissions_url: "https://study.uq.edu.au/admissions",
    campus_image_url: "https://images.unsplash.com/photo-1607237138185-3d7c54e15992?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/The_University_of_Queensland_logo.svg/256px-The_University_of_Queensland_logo.svg.png"
  },
  uwa: {
    summary: "A Perth-based option for students who want a quieter city, strong engineering/business pathways, and a campus-led experience.",
    best_for: ["Perth", "Engineering", "Campus life"],
    campus_note: "Crawley campus is near the Swan River. Perth can suit students who prefer a smaller city rhythm.",
    international_url: "https://www.uwa.edu.au/study/international-students",
    courses_url: "https://www.uwa.edu.au/study/courses",
    scholarships_url: "https://www.uwa.edu.au/study/scholarships",
    admissions_url: "https://www.uwa.edu.au/study/how-to-apply/international",
    campus_image_url: "https://images.unsplash.com/photo-1592284619077-d779f0f90769?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/The_University_of_Western_Australia_crest.svg/256px-The_University_of_Western_Australia_crest.svg.png"
  },
  adelaide: {
    summary: "A Go8 option with a more manageable city feel, useful for students comparing prestige with cost and lifestyle.",
    best_for: ["Adelaide", "Engineering", "Computer science"],
    campus_note: "North Terrace sits in central Adelaide. The city can feel less intense than the east-coast capitals.",
    international_url: "https://international.adelaide.edu.au/",
    courses_url: "https://www.adelaide.edu.au/degree-finder/",
    scholarships_url: "https://international.adelaide.edu.au/admissions/scholarships",
    admissions_url: "https://international.adelaide.edu.au/admissions/how-to-apply",
    campus_image_url: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/University_of_Adelaide_logo.svg/256px-University_of_Adelaide_logo.svg.png"
  },
  deakin: {
    summary: "A practical Melbourne/Geelong choice for students who want applied courses, flexible campuses, and a slightly more accessible entry profile.",
    best_for: ["Applied learning", "Business", "Nursing and IT"],
    campus_note: "Melbourne Burwood is popular with international students; Geelong can be calmer and more affordable.",
    international_url: "https://www.deakin.edu.au/international-students",
    courses_url: "https://www.deakin.edu.au/courses",
    scholarships_url: "https://www.deakin.edu.au/study/fees-and-scholarships/scholarships",
    admissions_url: "https://www.deakin.edu.au/study/how-to-apply/international-students",
    campus_image_url: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Deakin_University_logo.svg/256px-Deakin_University_logo.svg.png"
  },
  rmit: {
    summary: "A city-campus university with a strong practical feel for design, IT, engineering, media, and business.",
    best_for: ["Design", "City campus", "Practical learning"],
    campus_note: "RMIT's Melbourne city campus is right in the CBD, good for energy and access but not the cheapest lifestyle.",
    international_url: "https://www.rmit.edu.au/study-with-us/international-students",
    courses_url: "https://www.rmit.edu.au/study-with-us/international-students/programs-for-international-students",
    scholarships_url: "https://www.rmit.edu.au/students/careers-opportunities/scholarships",
    admissions_url: "https://www.rmit.edu.au/study-with-us/international-students/apply-to-rmit-international-students",
    campus_image_url: "https://images.unsplash.com/photo-1498243691581-b148c5c44725?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/RMIT_University_logo.svg/256px-RMIT_University_logo.svg.png"
  },
  latrobe: {
    summary: "A friendly Melbourne option for students looking at nursing, business, IT, and broader pathway flexibility.",
    best_for: ["Nursing", "Pathways", "Melbourne value"],
    campus_note: "Bundoora is outside the CBD, which can feel calmer and may help students manage accommodation choices.",
    international_url: "https://www.latrobe.edu.au/international",
    courses_url: "https://www.latrobe.edu.au/courses",
    scholarships_url: "https://www.latrobe.edu.au/international/fees/scholarships",
    admissions_url: "https://www.latrobe.edu.au/international/apply",
    campus_image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/La_Trobe_University_logo.svg/256px-La_Trobe_University_logo.svg.png"
  },
  uts: {
    summary: "A highly urban Sydney choice for students who want technology, business, design, and practical industry-facing study.",
    best_for: ["Sydney CBD", "Technology", "Design and business"],
    campus_note: "UTS is in the heart of Sydney's technology precinct. Great access, but students must plan rent carefully.",
    international_url: "https://www.uts.edu.au/study/international",
    courses_url: "https://www.uts.edu.au/study/find-a-course",
    scholarships_url: "https://www.uts.edu.au/study/international/essential-information/scholarships-international-students",
    admissions_url: "https://www.uts.edu.au/study/international/how-apply",
    campus_image_url: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/University_of_Technology_Sydney_logo.svg/256px-University_of_Technology_Sydney_logo.svg.png"
  },
  macquarie: {
    summary: "A Sydney option with a campus setting, strong business/IT pathways, and good fit for students comparing city access with space.",
    best_for: ["Business", "Cyber security", "Campus in Sydney"],
    campus_note: "Located in Macquarie Park, close to a business and technology precinct rather than the inner CBD.",
    international_url: "https://www.mq.edu.au/study/information-for/international",
    courses_url: "https://www.mq.edu.au/study/find-a-course",
    scholarships_url: "https://www.mq.edu.au/study/admissions-and-entry/scholarships",
    admissions_url: "https://www.mq.edu.au/study/admissions-and-entry/apply/international",
    campus_image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Macquarie_University_logo.svg/256px-Macquarie_University_logo.svg.png"
  },
  qut: {
    summary: "A Brisbane university with a practical, career-oriented style across IT, engineering, business, creative industries, and health.",
    best_for: ["Brisbane", "Career-focused study", "IT and creative industries"],
    campus_note: "Gardens Point and Kelvin Grove give students city access without Sydney/Melbourne scale.",
    international_url: "https://www.qut.edu.au/study/international",
    courses_url: "https://www.qut.edu.au/study",
    scholarships_url: "https://www.qut.edu.au/study/fees-and-scholarships/scholarships",
    admissions_url: "https://www.qut.edu.au/study/applying/international-applying",
    campus_image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Queensland_University_of_Technology_logo.svg/256px-Queensland_University_of_Technology_logo.svg.png"
  },
  griffith: {
    summary: "A Queensland choice for students interested in health, business, hospitality, aviation, social sciences, and Gold Coast/Brisbane life.",
    best_for: ["Health", "Gold Coast", "Student support"],
    campus_note: "Multiple campuses across Brisbane and the Gold Coast. Good for students considering lifestyle and part-time work access.",
    international_url: "https://www.griffith.edu.au/international",
    courses_url: "https://www.griffith.edu.au/study/degrees?studentType=international",
    scholarships_url: "https://www.griffith.edu.au/international/scholarships-finance",
    admissions_url: "https://www.griffith.edu.au/apply/international",
    campus_image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Griffith_University_logo.svg/256px-Griffith_University_logo.svg.png"
  },
  curtin: {
    summary: "A Perth university with practical strengths in engineering, IT, business, health, and applied sciences.",
    best_for: ["Perth", "Engineering", "Applied courses"],
    campus_note: "Bentley campus is a large Perth campus. Good for students who want a major city with a slower pace.",
    international_url: "https://www.curtin.edu.au/study/international-students/",
    courses_url: "https://www.curtin.edu.au/study/search/",
    scholarships_url: "https://www.curtin.edu.au/study/scholarships/",
    admissions_url: "https://www.curtin.edu.au/study/international-students/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1564982722883-e07f9c24573c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Curtin_University_logo.svg/256px-Curtin_University_logo.svg.png"
  },
  wollongong: {
    summary: "A coastal NSW option with strengths in computing, engineering, business, and a more contained student-city feel.",
    best_for: ["Coastal city", "Computer science", "Engineering"],
    campus_note: "Wollongong is south of Sydney, often appealing to students who want NSW without inner-Sydney rent pressure.",
    international_url: "https://www.uow.edu.au/study/international/",
    courses_url: "https://www.uow.edu.au/study/courses/",
    scholarships_url: "https://www.uow.edu.au/study/scholarships/",
    admissions_url: "https://www.uow.edu.au/study/international/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/University_of_Wollongong_logo.svg/256px-University_of_Wollongong_logo.svg.png"
  },
  swinburne: {
    summary: "A Melbourne technology/design option for students who like applied learning, creative fields, and industry projects.",
    best_for: ["Design", "Technology", "Applied learning"],
    campus_note: "Hawthorn campus has quick train access to Melbourne CBD while feeling more neighbourhood-based.",
    international_url: "https://www.swinburne.edu.au/courses/international/",
    courses_url: "https://www.swinburne.edu.au/courses/find-a-course/",
    scholarships_url: "https://www.swinburne.edu.au/courses/fees/scholarships/",
    admissions_url: "https://www.swinburne.edu.au/courses/applying/international/",
    campus_image_url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Swinburne_University_of_Technology_logo.svg/256px-Swinburne_University_of_Technology_logo.svg.png"
  },
  westernsydney: {
    summary: "A practical Sydney-region option for nursing, business, IT, and students who want wider campus choices across Western Sydney.",
    best_for: ["Nursing", "Western Sydney", "Accessible options"],
    campus_note: "Multiple campuses across Western Sydney can make commute planning important, but rent may be more flexible than inner Sydney.",
    international_url: "https://www.westernsydney.edu.au/international",
    courses_url: "https://www.westernsydney.edu.au/future/study/courses",
    scholarships_url: "https://www.westernsydney.edu.au/international/home/apply/scholarships",
    admissions_url: "https://www.westernsydney.edu.au/international/home/apply/admissions",
    campus_image_url: "https://images.unsplash.com/photo-1525920980995-f8a382bf42c5?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Western_Sydney_University_logo.svg/256px-Western_Sydney_University_logo.svg.png"
  },

  // --- United Kingdom (UK) ---
  ox: {
    summary: "Collegiate model, intensive tutorial system, and unrivaled global prestige for highly academic achievers.",
    best_for: ["Academic excellence", "Tutorial system", "Historic prestige"],
    campus_note: "Oxford city. Historic colleges spread across the town. High living costs, but world-class library and academic networks.",
    international_url: "https://www.ox.ac.uk/admissions/undergraduate",
    courses_url: "https://www.ox.ac.uk/admissions/undergraduate/courses",
    scholarships_url: "https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding/oxford-support",
    admissions_url: "https://www.ox.ac.uk/admissions/undergraduate/applying-to-oxford",
    campus_image_url: "https://images.unsplash.com/photo-1548625361-155deee223c0?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/f/ff/Oxford-University-Logo.svg/256px-Oxford-University-Logo.svg.png"
  },
  cam: {
    summary: "Collegiate setup with a deep focus on science, mathematics, and computing research alongside prestigious traditions.",
    best_for: ["Scientific research", "Collegiate tradition", "Elite networks"],
    campus_note: "Cambridge city. Quiet, cycle-friendly town along the River Cam. High living costs but beautiful architectural campuses.",
    international_url: "https://www.undergraduate.study.cam.ac.uk/",
    courses_url: "https://www.undergraduate.study.cam.ac.uk/courses",
    scholarships_url: "https://www.undergraduate.study.cam.ac.uk/fees-and-funding/financial-support",
    admissions_url: "https://www.undergraduate.study.cam.ac.uk/applying",
    campus_image_url: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/University_of_Cambridge_coat_of_arms_official.svg/256px-University_of_Cambridge_coat_of_arms_official.svg.png"
  },
  imperial: {
    summary: "A global powerhouse dedicated strictly to science, engineering, business, and medicine in central London.",
    best_for: ["Engineering / STEM", "London connections", "High-salary outcomes"],
    campus_note: "South Kensington, London. Surrounded by world-class museums. Extremely high living costs, but intense industrial links.",
    international_url: "https://www.imperial.ac.uk/study/",
    courses_url: "https://www.imperial.ac.uk/study/courses/",
    scholarships_url: "https://www.imperial.ac.uk/study/fees-and-funding/",
    admissions_url: "https://www.imperial.ac.uk/study/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1564982722883-e07f9c24573c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Imperial_College_London_logo.svg/256px-Imperial_College_London_logo.svg.png"
  },
  ucl: {
    summary: "London's global university, offering a highly comprehensive curriculum with a research-intensive approach in Bloomsbury.",
    best_for: ["Interdisciplinary study", "London campus life", "Broad course choices"],
    campus_note: "Bloomsbury, central London. Classic urban campus integrated into the city. High living costs but very international student population.",
    international_url: "https://www.ucl.ac.uk/prospective-students/",
    courses_url: "https://www.ucl.ac.uk/prospective-students/undergraduate/degrees",
    scholarships_url: "https://www.ucl.ac.uk/scholarships",
    admissions_url: "https://www.ucl.ac.uk/prospective-students/undergraduate/application-and-entry",
    campus_image_url: "https://images.unsplash.com/photo-1525920980995-f8a382bf42c5?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/University_College_London_logo.svg/256px-University_College_London_logo.svg.png"
  },
  lse: {
    summary: "A world-renowned institution specializing exclusively in social sciences, economics, and business management in central London.",
    best_for: ["Economics / Finance", "Global policy networks", "Central London location"],
    campus_note: "Holborn, central London. Small, highly energetic urban campus near financial and legal hubs. High living costs.",
    international_url: "https://www.lse.ac.uk/",
    courses_url: "https://www.lse.ac.uk/study-at-lse/Undergraduate",
    scholarships_url: "https://www.lse.ac.uk/study-at-lse/Undergraduate/fees-and-funding",
    admissions_url: "https://www.lse.ac.uk/study-at-lse/Undergraduate/How-to-apply",
    campus_image_url: "https://images.unsplash.com/photo-1526244437225-c63d0edd3a04?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/London_School_of_Economics_logo.svg/256px-London_School_of_Economics_logo.svg.png"
  },
  kcl: {
    summary: "A distinguished university with campuses throughout central London, heavily recognized for medicine, law, and business.",
    best_for: ["Medical studies", "Law / Social Science", "Historic London campus"],
    campus_note: "Strand and Guy's campuses in central London. Excellent clinical connections and historic library assets.",
    international_url: "https://www.kcl.ac.uk/",
    courses_url: "https://www.kcl.ac.uk/study/undergraduate",
    scholarships_url: "https://www.kcl.ac.uk/study/undergraduate/fees-and-funding",
    admissions_url: "https://www.kcl.ac.uk/study/undergraduate/apply",
    campus_image_url: "https://images.unsplash.com/photo-1513829096960-ef02213d2579?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/King%27s_College_London_logo.svg/256px-King%27s_College_London_logo.svg.png"
  },
  manchester: {
    summary: "Largest single-site UK university with outstanding industrial history, particularly strong in engineering, computer science, and business.",
    best_for: ["Engineering / STEM", "Student city life", "Employability"],
    campus_note: "Manchester city. Large, integrated campus just south of the city center. Vibrant student community, moderate living costs.",
    international_url: "https://www.manchester.ac.uk/",
    courses_url: "https://www.manchester.ac.uk/study/undergraduate/courses/",
    scholarships_url: "https://www.manchester.ac.uk/study/undergraduate/fees-funding/scholarships-awards/",
    admissions_url: "https://www.manchester.ac.uk/study/undergraduate/applications/",
    campus_image_url: "https://images.unsplash.com/photo-1569974498991-d3c12a504f9f?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/The_University_of_Manchester_logo.svg/256px-The_University_of_Manchester_logo.svg.png"
  },
  edinburgh: {
    summary: "One of Scotland's ancient universities, highly prestigious for computer science, artificial intelligence, and arts.",
    best_for: ["AI and computing", "Scottish architecture", "Research prestige"],
    campus_note: "Edinburgh city. Historic, stone-facade buildings integrated into the Scottish capital. High student satisfaction, cooler weather.",
    international_url: "https://www.ed.ac.uk/",
    courses_url: "https://www.ed.ac.uk/studying/undergraduate/degrees",
    scholarships_url: "https://www.ed.ac.uk/student-funding/undergraduate",
    admissions_url: "https://www.ed.ac.uk/studying/undergraduate/applying",
    campus_image_url: "https://images.unsplash.com/photo-1606166325012-909ff726ada8?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/University_of_Edinburgh_logo.svg/256px-University_of_Edinburgh_logo.svg.png"
  },
  bristol: {
    summary: "A highly selective Russell Group university located in a creative, progressive city with top-tier engineering and tech outcomes.",
    best_for: ["STEM / CS", "Creative city vibes", "High admission standards"],
    campus_note: "Clifton area, Bristol. Beautiful hilly campus integrated with historic suburbs. Moderate-to-high living costs.",
    international_url: "https://www.bristol.ac.uk/",
    courses_url: "https://www.bristol.ac.uk/study/undergraduate/search/",
    scholarships_url: "https://www.bristol.ac.uk/fees-funding/awards/",
    admissions_url: "https://www.bristol.ac.uk/study/undergraduate/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/University_of_Bristol_logo.svg/256px-University_of_Bristol_logo.svg.png"
  },
  warwick: {
    summary: "A modern campus-based Russell Group university with top-tier business school (WBS) and highly rated math/CS research.",
    best_for: ["Business school", "Mathematics / Data", "Green campus life"],
    campus_note: "Outskirts of Coventry. Large, self-contained green campus with excellent modern facilities and sports complexes.",
    international_url: "https://warwick.ac.uk/",
    courses_url: "https://warwick.ac.uk/study/undergraduate/courses/",
    scholarships_url: "https://warwick.ac.uk/study/undergraduate/fees/scholarships/",
    admissions_url: "https://warwick.ac.uk/study/undergraduate/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1559135197-8a45ea74d367?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/University_of_Warwick_logo.svg/256px-University_of_Warwick_logo.svg.png"
  },
  glasgow: {
    summary: "Historic university with stunning gothic architecture, offering excellent engineering, nursing, and science programs in Scotland's biggest city.",
    best_for: ["Nursing / Health", "STEM studies", "Gothic campus scenery"],
    campus_note: "West End, Glasgow. A gorgeous, castle-like main campus. Glasgow is extremely friendly and has moderate living costs.",
    international_url: "https://www.gla.ac.uk/",
    courses_url: "https://www.gla.ac.uk/undergraduate/degrees/",
    scholarships_url: "https://www.gla.ac.uk/undergraduate/scholarships/",
    admissions_url: "https://www.gla.ac.uk/undergraduate/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1592398579471-7b0f7e4b4737?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/University_of_Glasgow_logo.svg/256px-University_of_Glasgow_logo.svg.png"
  },
  durham: {
    summary: "A prestigious collegiate university located in a historic cathedral town, emphasizing tradition, small-group teaching, and sport.",
    best_for: ["Collegiate lifestyle", "Social sciences / Law", "High entry standards"],
    campus_note: "Durham city. Compact collegiate campus centered around a medieval castle. Safe, quiet, and highly community-focused.",
    international_url: "https://www.durham.ac.uk/",
    courses_url: "https://www.durham.ac.uk/study/undergraduate/courses/",
    scholarships_url: "https://www.durham.ac.uk/study/fees-and-funding/scholarships-and-bursaries/",
    admissions_url: "https://www.durham.ac.uk/study/undergraduate/how-to-apply/",
    campus_image_url: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Durham_University_logo.svg/256px-Durham_University_logo.svg.png"
  },
  leeds: {
    summary: "A highly popular single-site city campus university known for engineering, design, and top-tier student union experiences.",
    best_for: ["Design / Engineering", "Energetic campus life", "Student support"],
    campus_note: "Leeds city center. Walkable single-site campus with an incredible library network. Affordable living in a major student town.",
    international_url: "https://www.leeds.ac.uk/",
    courses_url: "https://courses.leeds.ac.uk/",
    scholarships_url: "https://www.leeds.ac.uk/undergraduate-fees-funding/doc/scholarships",
    admissions_url: "https://www.leeds.ac.uk/undergraduate-applying",
    campus_image_url: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/University_of_Leeds_logo.svg/256px-University_of_Leeds_logo.svg.png"
  },
  sheffield: {
    summary: "Renowned for engineering and manufacturing partnerships, with a world-class student union in a green, friendly city.",
    best_for: ["Engineering / CS", "Outstanding student union", "Affordable living"],
    campus_note: "Sheffield city. Integrated campus with modern engineering complexes. Very close to the Peak District park; highly affordable.",
    international_url: "https://www.sheffield.ac.uk/",
    courses_url: "https://www.sheffield.ac.uk/undergraduate/courses",
    scholarships_url: "https://www.sheffield.ac.uk/undergraduate/fees-funding",
    admissions_url: "https://www.sheffield.ac.uk/undergraduate/apply",
    campus_image_url: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/University_of_Sheffield_logo.svg/256px-University_of_Sheffield_logo.svg.png"
  },
  newcastle: {
    summary: "A historic civic university located right in the center of Newcastle, popular for engineering and nursing.",
    best_for: ["Nursing / Health", "Engineering", "City center campus"],
    campus_note: "Newcastle city center. Beautiful red brick campus. Low living costs and highly energetic city culture.",
    international_url: "https://www.ncl.ac.uk/",
    courses_url: "https://www.ncl.ac.uk/undergraduate/degrees/",
    scholarships_url: "https://www.ncl.ac.uk/undergraduate/fees-funding/scholarships-bursaries/",
    admissions_url: "https://www.ncl.ac.uk/undergraduate/applications/",
    campus_image_url: "https://images.unsplash.com/photo-1568790308560-fc429f17a9a2?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Newcastle_University_logo.svg/256px-Newcastle_University_logo.svg.png"
  },
  lancaster: {
    summary: "Collegiate campus with high student satisfaction and excellent business school rankings in the northwest of England.",
    best_for: ["Business school", "Collegiate community", "Rural scenery"],
    campus_note: "Lancaster outskirts. Self-contained campus. Safe collegiate communities, lower cost of living.",
    international_url: "https://www.lancaster.ac.uk/",
    courses_url: "https://www.lancaster.ac.uk/study/undergraduate/courses/",
    scholarships_url: "https://www.lancaster.ac.uk/study/fees-and-funding/scholarships-and-bursaries/",
    admissions_url: "https://www.lancaster.ac.uk/study/undergraduate/how-to-apply/",
    campus_image_url: "https://images.unsplash.com/photo-1607237138185-3d7c54e15992?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Lancaster_University_logo.svg/256px-Lancaster_University_logo.svg.png"
  },
  loughborough: {
    summary: "Voted top in the UK for sport and campus community, offering strong engineering, business, and design degrees.",
    best_for: ["Sports sciences", "Engineering", "Active campus life"],
    campus_note: "Loughborough town. Massive single-site green campus with elite athletic infrastructure and green spaces.",
    international_url: "https://www.lboro.ac.uk/",
    courses_url: "https://www.lboro.ac.uk/study/undergraduate/courses/",
    scholarships_url: "https://www.lboro.ac.uk/study/undergraduate/fees-funding/scholarships/",
    admissions_url: "https://www.lboro.ac.uk/study/undergraduate/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Loughborough_University_logo.svg/256px-Loughborough_University_logo.svg.png"
  },
  bath: {
    summary: "Highly ranked for placement opportunities, sports, and technical subjects in a beautiful historic Roman spa town.",
    best_for: ["Industrial placements", "STEM subjects", "Safe historic town"],
    campus_note: "Claverton Down, Bath. Modern hilltop campus with outstanding sports village overlooking a historic UNESCO city.",
    international_url: "https://www.bath.ac.uk/",
    courses_url: "https://www.bath.ac.uk/courses/undergraduate/",
    scholarships_url: "https://www.bath.ac.uk/topics/undergraduate-scholarships-bursaries-and-other-funding/",
    admissions_url: "https://www.bath.ac.uk/guides/applying-for-undergraduate-courses/",
    campus_image_url: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/University_of_Bath_logo.svg/256px-University_of_Bath_logo.svg.png"
  },
  surrey: {
    summary: "Outstanding professional placement statistics, strong business programs, and closeness to London with a green campus.",
    best_for: ["Professional placements", "Business / Hospitality", "London proximity"],
    campus_note: "Guildford. Picturesque lakeside campus near a historic market town. Close to London (35 mins by train).",
    international_url: "https://www.surrey.ac.uk/",
    courses_url: "https://www.surrey.ac.uk/undergraduate",
    scholarships_url: "https://www.surrey.ac.uk/fees-and-funding/scholarships-and-bursaries",
    admissions_url: "https://www.surrey.ac.uk/apply",
    campus_image_url: "https://images.unsplash.com/photo-1627556704353-016ad90c9b98?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/University_of_Surrey_logo.svg/256px-University_of_Surrey_logo.svg.png"
  },
  york: {
    summary: "Collegiate research-intensive university in a historic walled city, known for computer science, social policy, and creative arts.",
    best_for: ["Social sciences", "Safe collegiate campus", "Creative design"],
    campus_note: "Heslington, York. Beautiful lakeside campus with colleges centered around a historic city. Very safe atmosphere.",
    international_url: "https://www.york.ac.uk/",
    courses_url: "https://www.york.ac.uk/study/undergraduate/courses/",
    scholarships_url: "https://www.york.ac.uk/study/undergraduate/fees-funding/scholarships/",
    admissions_url: "https://www.york.ac.uk/study/undergraduate/applying/",
    campus_image_url: "https://images.unsplash.com/photo-1492538368577-505f89740112?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/University_of_York_logo.svg/256px-University_of_York_logo.svg.png"
  },
  coventry: {
    summary: "One of the UK's leading modern universities, focused on employability, modern labs, and an integrated city campus.",
    best_for: ["Practical engineering", "Affordable city living", "Career support"],
    campus_note: "Coventry city center. Integrated city campus with state-of-the-art student center and tech hubs. Affordable living costs.",
    international_url: "https://www.coventry.ac.uk/",
    courses_url: "https://www.coventry.ac.uk/study-at-coventry/course-search/",
    scholarships_url: "https://www.coventry.ac.uk/international-students-hub/finance/scholarships-and-discounts/",
    admissions_url: "https://www.coventry.ac.uk/study-at-coventry/apply-now/",
    campus_image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Coventry_University_logo.svg/256px-Coventry_University_logo.svg.png"
  },
  uwe: {
    summary: "A large modern university in Bristol, prioritizing partnerships, practice-led courses, and excellent graduate employment rates.",
    best_for: ["Practice-led learning", "Business connections", "Vibrant city base"],
    campus_note: "Frenchay campus, Bristol. Large modern site with excellent labs and transport links to downtown Bristol.",
    international_url: "https://www.uwe.ac.uk/",
    courses_url: "https://www.uwe.ac.uk/courses",
    scholarships_url: "https://www.uwe.ac.uk/courses/funding/scholarships",
    admissions_url: "https://www.uwe.ac.uk/study/applying-to-uwe-bristol",
    campus_image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/UWE_Bristol_logo.svg/256px-UWE_Bristol_logo.svg.png"
  },
  hertfordshire: {
    summary: "A modern university located just outside London, offering practical business, IT, and health science courses at a budget price.",
    best_for: ["Budget UK study", "IT / CS labs", "London commuter options"],
    campus_note: "Hatfield. Modern campuses with excellent computing facilities. Close to London (20 mins by train), lower costs.",
    international_url: "https://www.herts.ac.uk/",
    courses_url: "https://www.herts.ac.uk/courses",
    scholarships_url: "https://www.herts.ac.uk/international/fees,-funding-and-scholarships/scholarships",
    admissions_url: "https://www.herts.ac.uk/apply",
    campus_image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/University_of_Hertfordshire_logo.svg/256px-University_of_Hertfordshire_logo.svg.png"
  },
  northumbria: {
    summary: "A practice-heavy modern university in Newcastle, with strong industry ties in business, IT, nursing, and architecture.",
    best_for: ["Nursing / Health", "Business management", "Vibrant student town"],
    campus_note: "Newcastle city center. Modern architecture and library structures. Affordable living and great transport access.",
    international_url: "https://www.northumbria.ac.uk/",
    courses_url: "https://www.northumbria.ac.uk/study-at-northumbria/courses/",
    scholarships_url: "https://www.northumbria.ac.uk/study-at-northumbria/fees-funding/international-scholarships/",
    admissions_url: "https://www.northumbria.ac.uk/study-at-northumbria/how-to-apply/",
    campus_image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Northumbria_University_logo.svg/256px-Northumbria_University_logo.svg.png"
  },
  westminster: {
    summary: "Located in the heart of London, offering highly globalized classrooms in media, law, and design.",
    best_for: ["Media / Design", "Central London", "Multicultural environment"],
    campus_note: "Regent Street and Harrow, London. Historic urban sites right in the commercial and fashion heart of London.",
    international_url: "https://www.westminster.ac.uk/",
    courses_url: "https://www.westminster.ac.uk/courses",
    scholarships_url: "https://www.westminster.ac.uk/study/fees-and-funding/scholarships",
    admissions_url: "https://www.westminster.ac.uk/study/how-to-apply",
    campus_image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/University_of_Westminster_logo.svg/256px-University_of_Westminster_logo.svg.png"
  },
  greenwich: {
    summary: "Stunning historic campus location along the River Thames, offering popular business and computing degrees in London.",
    best_for: ["Business / Commerce", "London campus setting", "Practical IT"],
    campus_note: "Greenwich, London. Main campus is a UNESCO World Heritage site with historic architecture on the riverbank.",
    international_url: "https://www.gre.ac.uk/",
    courses_url: "https://www.gre.ac.uk/study/courses",
    scholarships_url: "https://www.gre.ac.uk/finance/funding-your-studies/scholarships-and-bursaries",
    admissions_url: "https://www.gre.ac.uk/study/apply",
    campus_image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/University_of_Greenwich_logo.svg/256px-University_of_Greenwich_logo.svg.png"
  },
  demontfort: {
    summary: "Known for design and creative industries in Leicester, with strong career coaching and accessible entry limits.",
    best_for: ["Creative arts", "Employability support", "Accessible entry"],
    campus_note: "Leicester. Integrated city campus near a multicultural, budget-friendly town. Excellent design studios.",
    international_url: "https://www.dmu.ac.uk/",
    courses_url: "https://www.dmu.ac.uk/study/courses/undergraduate-courses/undergraduate-courses.aspx",
    scholarships_url: "https://www.dmu.ac.uk/international/fees-and-scholarships/scholarships.aspx",
    admissions_url: "https://www.dmu.ac.uk/international/how-to-apply/how-to-apply.aspx",
    campus_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/De_Montfort_University_logo.svg/256px-De_Montfort_University_logo.svg.png"
  },
  bcu: {
    summary: "A modern, industry-focused city university located in the heart of Birmingham, known for design and business.",
    best_for: ["Creative subjects", "Birmingham CBD access", "Career mentoring"],
    campus_note: "Birmingham city center. Modern campus buildings with advanced media centers. Low-to-moderate living costs.",
    international_url: "https://www.bcu.ac.uk/",
    courses_url: "https://www.bcu.ac.uk/courses",
    scholarships_url: "https://www.bcu.ac.uk/international/fees/scholarships",
    admissions_url: "https://www.bcu.ac.uk/about-us/maps-and-campuses/how-to-apply",
    campus_image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Birmingham_City_University_logo.svg/256px-Birmingham_City_University_logo.svg.png"
  },
  salford: {
    summary: "A practical university located near MediaCityUK in Manchester, ideal for media, engineering, and nursing.",
    best_for: ["Media / Broadcast", "Engineering", "Manchester networks"],
    campus_note: "Salford, adjacent to Manchester. Modern campus with direct links to BBC/ITV centers. Affordable living.",
    international_url: "https://www.salford.ac.uk/",
    courses_url: "https://www.salford.ac.uk/search/courses",
    scholarships_url: "https://www.salford.ac.uk/international/scholarships",
    admissions_url: "https://www.salford.ac.uk/international/apply",
    campus_image_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/University_of_Salford_logo.svg/256px-University_of_Salford_logo.svg.png"
  },

  // --- Canada (CAN) ---
  toronto: {
    summary: "Canada's top research powerhouse, highly selective, with three campuses across a multicultural city.",
    best_for: ["STEM / CS", "Global prestige", "Research facilities"],
    campus_note: "Downtown Toronto (St. George campus). Historic architecture in a busy metropolis. High living costs.",
    international_url: "https://www.utoronto.ca/",
    courses_url: "https://future.utoronto.ca/academics/programs/",
    scholarships_url: "https://future.utoronto.ca/finances/scholarships/",
    admissions_url: "https://future.utoronto.ca/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1568790308560-fc429f17a9a2?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/University_of_Toronto_shield.svg/256px-University_of_Toronto_shield.svg.png"
  },
  ubc: {
    summary: "A spectacular coastal campus with a top global rank, strong in engineering, computer science, and business.",
    best_for: ["Ocean-side campus", "Engineering", "International networks"],
    campus_note: "Vancouver (Point Grey). Stunning campus bordered by beaches and forests. High living costs.",
    international_url: "https://www.ubc.ca/",
    courses_url: "https://you.ubc.ca/programs/",
    scholarships_url: "https://you.ubc.ca/financial-planning/scholarships-awards-international-students/",
    admissions_url: "https://you.ubc.ca/applying-ubc/",
    campus_image_url: "https://images.unsplash.com/photo-1627556704353-016ad90c9b98?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/University_of_British_Columbia_logo.svg/256px-University_of_British_Columbia_logo.svg.png"
  },
  mcgill: {
    summary: "Prestigious bilingual city setting with outstanding medical, engineering, and science credentials.",
    best_for: ["STEM research", "Historic campus", "Montreal life"],
    campus_note: "Montreal, Quebec. Historic stone campus at the foot of Mount Royal. High city quality, bilingual setting.",
    international_url: "https://www.mcgill.ca/",
    courses_url: "https://www.mcgill.ca/undergraduate-admissions/programs",
    scholarships_url: "https://www.mcgill.ca/undergraduate-admissions/funding",
    admissions_url: "https://www.mcgill.ca/undergraduate-admissions/apply",
    campus_image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/McGill_University_CoA.svg/256px-McGill_University_CoA.svg.png"
  },
  waterloo: {
    summary: "Famous globally for its massive co-op program, yielding incredible employment outcomes in computer science and tech.",
    best_for: ["Co-op program", "Tech / CS careers", "Entrepreneurship"],
    campus_note: "Waterloo, Ontario. Modern, tech-focused campus in Canada's tech hub. Moderate living costs.",
    international_url: "https://uwaterloo.ca/",
    courses_url: "https://uwaterloo.ca/future-students/programs",
    scholarships_url: "https://uwaterloo.ca/future-students/financing/scholarships",
    admissions_url: "https://uwaterloo.ca/future-students/admissions/how-apply",
    campus_image_url: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/University_of_Waterloo_logo.svg/256px-University_of_Waterloo_logo.svg.png"
  },
  mcmaster: {
    summary: "A top research university in Ontario, highly ranked for health sciences and engineering.",
    best_for: ["Health sciences", "Engineering", "Intimate campus"],
    campus_note: "Hamilton, Ontario. Traditional, tree-lined collegiate campus. Lower living costs than nearby Toronto.",
    international_url: "https://www.mcmaster.ca/",
    courses_url: "https://future.mcmaster.ca/programs/",
    scholarships_url: "https://future.mcmaster.ca/financial-aid/",
    admissions_url: "https://future.mcmaster.ca/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/McMaster_University_logo.svg/256px-McMaster_University_logo.svg.png"
  },
  alberta: {
    summary: "A major research university in Edmonton with vast resource networks and excellent engineering and IT pathways.",
    best_for: ["STEM research", "Alberta resource networks", "Affordable province"],
    campus_note: "Edmonton. Large campus overlooking the river. Cold winters, but highly supportive city and lower taxes.",
    international_url: "https://www.ualberta.ca/",
    courses_url: "https://www.ualberta.ca/en/programs/index.html",
    scholarships_url: "https://www.ualberta.ca/en/admissions-programs/tuition-and-scholarships/index.html",
    admissions_url: "https://www.ualberta.ca/en/admissions-programs/apply/index.html",
    campus_image_url: "https://images.unsplash.com/photo-1616512659455-111d3367649f?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/University_of_Alberta_logo.svg/256px-University_of_Alberta_logo.svg.png"
  },
  calgary: {
    summary: "Located near the Rocky Mountains, offering strong corporate ties, engineering, and tech in Canada's energy hub.",
    best_for: ["Energy / Tech", "Mountain access", "Industry ties"],
    campus_note: "Calgary, Alberta. Modern, sunlit campus. Growing tech city with highly affordable housing options.",
    international_url: "https://www.ucalgary.ca/",
    courses_url: "https://www.ucalgary.ca/future-students/undergraduate/explore-programs",
    scholarships_url: "https://www.ucalgary.ca/registrar/finances/awards",
    admissions_url: "https://www.ucalgary.ca/future-students/undergraduate/apply",
    campus_image_url: "https://images.unsplash.com/photo-1523580494863-6f30312245d5?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/University_of_Calgary_logo.svg/256px-University_of_Calgary_logo.svg.png"
  },
  manitoba: {
    summary: "Highly affordable tuition rates among the U15 research group, offering solid engineering and business pathways.",
    best_for: ["Affordable tuition", "Pragmatic pathway", "Winnipeg center"],
    campus_note: "Winnipeg, Manitoba. Safe collegiate campus. Very cold winters, but very friendly and low-cost city.",
    international_url: "https://umanitoba.ca/",
    courses_url: "https://umanitoba.ca/explore/programs-of-study",
    scholarships_url: "https://umanitoba.ca/financial-aid-and-awards",
    admissions_url: "https://umanitoba.ca/explore/admissions-requirements",
    campus_image_url: "https://images.unsplash.com/photo-1541829019-21873760d09b?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/University_of_Manitoba_logo.svg/256px-University_of_Manitoba_logo.svg.png"
  },
  concordia: {
    summary: "A progressive, downtown Montreal university, famous for practical business, software engineering, and design.",
    best_for: ["Design / Software", "Downtown lifestyle", "Creative community"],
    campus_note: "Downtown Montreal. Modern buildings integrated with the city center. Vibrant, multi-cultural atmosphere.",
    international_url: "https://www.concordia.ca/",
    courses_url: "https://www.concordia.ca/academics/undergraduate.html",
    scholarships_url: "https://www.concordia.ca/offices/faao.html",
    admissions_url: "https://www.concordia.ca/admissions/undergraduate/apply.html",
    campus_image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Concordia_University_logo.svg/256px-Concordia_University_logo.svg.png"
  },
  windsor: {
    summary: "Located on the US-Canada border, offering strong automotive engineering, computing, and business degrees.",
    best_for: ["Automotive / STEM", "Border connections", "Affordable Ontario study"],
    campus_note: "Windsor, Ontario (facing Detroit). Green campus with lower accommodation costs than Toronto.",
    international_url: "https://www.uwindsor.ca/",
    courses_url: "https://www.uwindsor.ca/156/programs",
    scholarships_url: "https://www.uwindsor.ca/studentawards/",
    admissions_url: "https://www.uwindsor.ca/registrar/540/how-to-apply",
    campus_image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/University_of_Windsor_logo.svg/256px-University_of_Windsor_logo.svg.png"
  },

  // --- United States of America (USA) ---
  mit: {
    summary: "World-leading institute for computing, robotics, and engineering with an intense, entrepreneurial campus culture.",
    best_for: ["STEM / Tech elite", "Entrepreneurship", "Research resources"],
    campus_note: "Cambridge, Massachusetts. Modern architectural buildings along the Charles River. High living costs.",
    international_url: "https://www.mit.edu/",
    courses_url: "http://catalog.mit.edu/schools/",
    scholarships_url: "https://sfs.mit.edu/undergraduate-financial-aid/",
    admissions_url: "https://mitadmissions.org/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1564982722883-e07f9c24573c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/256px-MIT_logo.svg.png"
  },
  stanford: {
    summary: "Located in Silicon Valley, providing unmatched ties to the tech startup ecosystem and venture capital.",
    best_for: ["Tech startups", "CS elite", "Silicon Valley vibes"],
    campus_note: "Stanford, California. Beautiful mission-style sandstone buildings. Sunlit, warm, and highly elite.",
    international_url: "https://www.stanford.edu/",
    courses_url: "https://exploredegrees.stanford.edu/",
    scholarships_url: "https://financialaid.stanford.edu/",
    admissions_url: "https://admission.stanford.edu/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1508215885820-4585e56135c8?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Seal_of_Stanford_University.svg/256px-Seal_of_Stanford_University.svg.png"
  },
  harvard: {
    summary: "Oldest US university with massive library networks, huge global brand recognition, and highly selective entrance requirements.",
    best_for: ["Global networks", "Liberal arts / Sciences", "Brand recognition"],
    campus_note: "Cambridge, Massachusetts. Historic Harvard Yard campus near Boston. High living costs but unmatched resources.",
    international_url: "https://www.harvard.edu/",
    courses_url: "https://handbook.fas.harvard.edu/",
    scholarships_url: "https://college.harvard.edu/financial-aid",
    admissions_url: "https://college.harvard.edu/admissions/apply",
    campus_image_url: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_University_shield.svg/256px-Harvard_University_shield.svg.png"
  },
  cmu: {
    summary: "Renowned globally as a pioneer in computer science, artificial intelligence, robotics, and design.",
    best_for: ["AI / Robotics", "Computer Science", "Creative technology"],
    campus_note: "Pittsburgh, Pennsylvania. Walkable urban campus. Energetic, intensely focused tech community.",
    international_url: "https://www.cmu.edu/",
    courses_url: "https://www.cmu.edu/hub/registrar/course-info/",
    scholarships_url: "https://www.cmu.edu/admission/financial-aid",
    admissions_url: "https://www.cmu.edu/admission/apply",
    campus_image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Carnegie_Mellon_University_wordmark.svg/256px-Carnegie_Mellon_University_wordmark.svg.png"
  },
  ucla: {
    summary: "Top public research university in Los Angeles, combining academic rigor with iconic California culture.",
    best_for: ["LA networks", "CS / Engineering", "Sports / Vibe"],
    campus_note: "Westwood, Los Angeles. Safe, leafy campus near Beverly Hills. Sunny weather, high living costs.",
    international_url: "https://www.ucla.edu/",
    courses_url: "https://catalog.registrar.ucla.edu/",
    scholarships_url: "https://www.financialaid.ucla.edu/",
    admissions_url: "https://admission.ucla.edu/apply",
    campus_image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/UCLA_logo.svg/256px-UCLA_logo.svg.png"
  },
  purdue: {
    summary: "Known for aerospace, engineering, and tech, offering high-value outcomes in a supportive college town.",
    best_for: ["Engineering", "STEM values", "Manageable budget"],
    campus_note: "West Lafayette, Indiana. Classic Midwestern college town. Excellent labs and lower living expenses.",
    international_url: "https://www.purdue.edu/",
    courses_url: "https://catalog.purdue.edu/",
    scholarships_url: "https://www.purdue.edu/sfa/",
    admissions_url: "https://www.purdue.edu/admissions/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1584697964400-2af6a2f6204c?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Purdue_Boilermakers_logo.svg/256px-Purdue_Boilermakers_logo.svg.png"
  },
  asu: {
    summary: "Ranked #1 for innovation, offering a massive curriculum with advanced labs and flexible entry requirements.",
    best_for: ["Innovation / Tech", "Warm weather", "Accessible entry"],
    campus_note: "Tempe, Arizona. Sunlit, sprawling desert campus. Excellent modern infrastructure and lively student culture.",
    international_url: "https://www.asu.edu/",
    courses_url: "https://catalog.asu.edu/",
    scholarships_url: "https://students.asu.edu/financialaid",
    admissions_url: "https://admission.asu.edu/apply",
    campus_image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Arizona_State_University_logo.svg/256px-Arizona_State_University_logo.svg.png"
  },
  syracuse: {
    summary: "Known for private university networks, strong business management, social science, and communications.",
    best_for: ["Business / Management", "Alumni network", "Campus pride"],
    campus_note: "Syracuse, New York. Hilltop campus with beautiful architecture. Cold winters, strong school spirit.",
    international_url: "https://www.syracuse.edu/",
    courses_url: "https://course-catalog.syracuse.edu/",
    scholarships_url: "https://www.syracuse.edu/admissions/cost-aid/",
    admissions_url: "https://www.syracuse.edu/admissions/apply/",
    campus_image_url: "https://images.unsplash.com/photo-1607237138185-3d7c54e15992?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Syracuse_Orange_logo.svg/256px-Syracuse_Orange_logo.svg.png"
  },
  umass: {
    summary: "Flagship public campus in Massachusetts, highly rated for computer science research and food services.",
    best_for: ["Computer Science", "STEM options", "New England town"],
    campus_note: "Amherst, Massachusetts. Beautiful, safe New England college town. Very high student dining ratings.",
    international_url: "https://www.umass.edu/",
    courses_url: "https://www.umass.edu/registrar/courses",
    scholarships_url: "https://www.umass.edu/financialaid/",
    admissions_url: "https://www.umass.edu/admissions/apply",
    campus_image_url: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/UMass_Amherst_logo.svg/256px-UMass_Amherst_logo.svg.png"
  },
  iastate: {
    summary: "Known for engineering, agriculture, and science, offering lower tuition rates and excellent post-grad outcomes.",
    best_for: ["Engineering values", "Affordable living", "Traditional campus"],
    campus_note: "Ames, Iowa. Large, green, park-like campus. Affordable, friendly Midwestern community.",
    international_url: "https://www.iastate.edu/",
    courses_url: "https://catalog.iastate.edu/azcourses/",
    scholarships_url: "https://www.financialaid.iastate.edu/",
    admissions_url: "https://www.admissions.iastate.edu/apply",
    campus_image_url: "https://images.unsplash.com/photo-1592284619077-d779f0f90769?auto=format&fit=crop&w=1200&q=80",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Iowa_State_Cyclones_logo.svg/256px-Iowa_State_Cyclones_logo.svg.png"
  }
};;

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
  const profile = UNIVERSITY_PROFILES[university.id];
  if (profile?.logo_url) return profile.logo_url;
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
  if (profile?.campus_image_url) return profile.campus_image_url;
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
