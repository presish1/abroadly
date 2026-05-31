/* Single source of truth for the document model used by both
 * /chat/documents (the full-screen page) and the chat sidebar's
 * compact checklist. Keep this file the only catalog. */

export type DocSlot = {
  id: string;
  label: string;
  /** Short label for tight spaces (sidebar). Defaults to label. */
  shortLabel?: string;
  desc: string;
  accept: string;
  sampleSlug?: string;
  samplePages?: number;
  requirements: string[];
  tip: string;
};

export type OptionalDocSlot = DocSlot & { group: string };

export const ESSENTIAL_SLOTS: DocSlot[] = [
  {
    id: "grade_sheet",
    label: "Grade sheet / Transcript",
    shortLabel: "Transcript",
    desc: "Your most recent academic record (NEB, A-Level, Bachelors).",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Most recent official transcript or grade sheet.",
      "All subjects with marks/grades visible.",
      "School/college stamp and signature if printed.",
    ],
    tip: "If it's a +2 mark sheet, both year-one and year-two pages help us check your GPA accurately.",
  },
  {
    id: "citizenship",
    label: "Citizenship",
    desc: "Front + back of your Nepali citizenship card.",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Both sides of the citizenship card.",
      "Clear, no glare, all four corners visible.",
      "Issue date and citizenship number legible.",
    ],
    tip: "Phone photos work fine — daylight, flat surface, no flash.",
  },
  {
    id: "passport",
    label: "Passport",
    desc: "Bio-data page (the one with your photo).",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Bio-data page with photo and personal details.",
      "Expiry date at least 12 months in the future.",
      "If renewing soon, mention it in chat so we plan ahead.",
    ],
    tip: "If you don't have one yet, that's okay — we'll guide you through the application later.",
  },
  {
    id: "sop",
    label: "Statement of Purpose (SOP)",
    shortLabel: "SOP",
    desc: "Your draft personal statement. We'll review structure & tone.",
    accept: ".pdf,.doc,.docx,.txt",
    sampleSlug: "sop",
    samplePages: 3,
    requirements: [
      "1–2 pages, focused on why this course in this country.",
      "Specific examples, not generic ambition.",
      "Honest about gaps — they're easier to address than to hide.",
    ],
    tip: "First draft is fine. The AI will suggest edits, not rewrite it for you.",
  },
  {
    id: "recommendation",
    label: "Recommendation letter",
    shortLabel: "Recommendation",
    desc: "From a teacher, professor, or supervisor who knows your work.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "recommendation",
    samplePages: 1,
    requirements: [
      "On official letterhead with signature.",
      "From someone who taught/supervised you directly.",
      "Specific anecdotes beat vague praise.",
    ],
    tip: "Two LORs is typical — academic + work, or two academic.",
  },
  {
    id: "financial",
    label: "Financial documents",
    shortLabel: "Financial proof",
    desc: "Bank balance, income proofs, sponsor docs.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "bank-balance",
    samplePages: 1,
    requirements: [
      "Bank balance certificate from your sponsor's bank.",
      "Income proof of the sponsor (salary, business, rental, pension — whichever applies).",
      "Cover at least the first year's tuition + living costs.",
    ],
    tip: "More income-proof types are in the Additional section below — upload whichever match your case.",
  },
  {
    id: "ielts",
    label: "IELTS / PTE / TOEFL",
    shortLabel: "English test",
    desc: "Your English-test result. Upload as soon as you have it.",
    accept: ".pdf,.jpg,.jpeg,.png",
    requirements: [
      "Official score report (TRF for IELTS, score report for others).",
      "All four module scores visible.",
      "Test date within the last 2 years.",
    ],
    tip: "No score yet? Tell the AI when you plan to test — it'll plan your timeline around it.",
  },
  {
    id: "other",
    label: "Other / Cover letter",
    shortLabel: "Other",
    desc: "Anything else — visa cover letter, custom docs.",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    sampleSlug: "visa-cover",
    samplePages: 1,
    requirements: [
      "Visa cover letter, itinerary, or anything case-specific.",
      "If unsure where it belongs, drop it here and we'll re-categorise.",
    ],
    tip: "When in doubt, upload here — better to have it on file than miss a step.",
  },
];

export const OPTIONAL_SLOTS: OptionalDocSlot[] = [
  // Income proofs
  { group: "Income proofs", id: "income_rental", label: "Rental income certificate",
    desc: "If your sponsor has rental income.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-rental", samplePages: 1,
    requirements: ["Ward-issued certificate stating annual rental income.", "Matching rental agreement helps."],
    tip: "Common when the sponsor owns shutters or a flat that's rented out." },
  { group: "Income proofs", id: "income_agriculture", label: "Agriculture income certificate",
    desc: "Ward verification of farming income.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-agriculture", samplePages: 1,
    requirements: ["Ward-issued certificate stating annual agriculture income.", "Land ownership doc strengthens it."],
    tip: "Important for rural sponsors — visa officers expect this if the sponsor lists farming." },
  { group: "Income proofs", id: "income_business", label: "Business income statement",
    desc: "PAN, business registration + income.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-business", samplePages: 2,
    requirements: ["Business PAN/VAT certificate.", "Annual income statement, ideally CA-attested.", "Business registration."],
    tip: "If sponsor is self-employed, this is the strongest income proof you can give." },
  { group: "Income proofs", id: "income_pension", label: "Pension income certificate",
    desc: "For retired-government-employee sponsors.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-pension", samplePages: 1,
    requirements: ["Pension book or government pension slip.", "Last 6–12 months of pension credits."],
    tip: "Often combined with rental or other income to hit the funding threshold." },
  { group: "Income proofs", id: "income_abroad", label: "Abroad income (remittance)",
    desc: "If sponsor works overseas.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-abroad", samplePages: 2,
    requirements: ["Employment contract from the foreign employer.", "Last 6 months of salary slips.", "Remittance receipts into Nepali bank."],
    tip: "Pair with the sponsor's foreign work visa/permit copy." },
  { group: "Income proofs", id: "income_salary", label: "Salary income statement",
    desc: "Monthly salary from Nepali employer.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-salary", samplePages: 1,
    requirements: ["Employer letter on letterhead with monthly salary.", "Last 3 months of salary slips."],
    tip: "Add the sponsor's tax-clearance certificate if available — it strengthens the case." },
  { group: "Income proofs", id: "income_lease", label: "Lease income certificate",
    desc: "Income from long-term lease arrangements.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "income-lease", samplePages: 1,
    requirements: ["Ward-issued lease income certificate.", "Underlying lease agreement."],
    tip: "Less common than rental, but valid for agricultural/commercial land." },
  { group: "Income proofs", id: "educational_loan", label: "Educational loan letter",
    desc: "Bank approval-in-principle for a study loan.",
    accept: ".pdf",
    sampleSlug: "educational-loan", samplePages: 2,
    requirements: ["Bank letter approving the loan amount.", "Repayment terms and collateral noted."],
    tip: "Strong supplement when sponsor income alone doesn't cover total cost." },

  // Affidavits
  { group: "Affidavits of support", id: "affidavit_general", label: "Applicant's affidavit of support",
    desc: "Sponsor's commitment to fund your studies.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "affidavit-support", samplePages: 2,
    requirements: ["Notarised statement of financial support.", "Sponsor's identity proof attached."],
    tip: "Usually paired with the bank balance and income certificates." },
  { group: "Affidavits of support", id: "affidavit_children", label: "Support affidavit (children)",
    desc: "Parent → child support affidavit.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "affidavit-children", samplePages: 1,
    requirements: ["Parent's notarised statement of support."],
    tip: "Common when one parent is the primary sponsor." },
  { group: "Affidavits of support", id: "affidavit_husband", label: "Support affidavit (spouse)",
    desc: "Spouse-funded applicants.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "affidavit-husband", samplePages: 1,
    requirements: ["Spouse's notarised statement of support.", "Marriage certificate must also be on file."],
    tip: "Pair this with the marriage certificate in the next group." },

  // Relationship
  { group: "Relationship & marriage", id: "marriage_cert", label: "Marriage certificate",
    desc: "If you're married or claiming spouse support.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "marriage-cert", samplePages: 1,
    requirements: ["Official marriage certificate.", "English translation if the original is in Nepali."],
    tip: "Required for dependent visas and spouse-sponsored applications." },
  { group: "Relationship & marriage", id: "relationship_cert", label: "Relationship certificate",
    desc: "Proves your relationship to your sponsor.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "relationship-cert", samplePages: 1,
    requirements: ["Ward-issued certificate stating the relationship.", "Both names and relationship type clearly stated."],
    tip: "Essential when sponsor is anyone other than your direct parent." },
  { group: "Relationship & marriage", id: "defacto", label: "De-facto relationship doc",
    desc: "Unmarried partner / long-term relationship cases.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "defacto", samplePages: 2,
    requirements: ["Statutory declaration from both partners.", "Shared evidence (lease, bills, photos)."],
    tip: "Mostly relevant for Australia and similar destinations that recognise de-facto." },

  // Visa extras
  { group: "Visa application extras", id: "itinerary", label: "Travel itinerary",
    desc: "Indicative flight/travel plan.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "itinerary", samplePages: 1,
    requirements: ["Indicative dates of travel.", "Intended port of entry."],
    tip: "Don't book tickets until the visa is granted." },
  { group: "Visa application extras", id: "stat_dec", label: "Statutory declaration",
    desc: "Genuine-temporary-entrant declaration where required.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "stat-dec", samplePages: 1,
    requirements: ["Notarised declaration as per destination country format."],
    tip: "Australia specifically asks for this for some visa subclasses." },
  { group: "Visa application extras", id: "moi", label: "Means of identification (MOI)",
    desc: "Self-identification declaration.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "moi", samplePages: 1,
    requirements: ["Notarised declaration linking variant spellings of your name."],
    tip: "Important if your name appears differently across documents (e.g. transcript vs passport)." },

  // Australia-specific
  { group: "Australia-specific", id: "ward_au", label: "Ward documents (Australia)",
    desc: "Bundle ward-issued docs Australia expects.",
    accept: ".pdf,.jpg,.jpeg,.png",
    sampleSlug: "ward-au", samplePages: 2,
    requirements: ["Ward income, relationship, and identity certificates."],
    tip: "Australia DHA expects ward-issued docs even when you have other proofs — include them anyway." },

  // Professional
  { group: "Professional", id: "cv", label: "CV / Résumé",
    desc: "Your study and work history.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "cv", samplePages: 1,
    requirements: ["Reverse-chronological work + education history.", "1–2 pages, no photos."],
    tip: "Even if not asked for, several countries expect it for skilled or postgrad applications." },
  { group: "Professional", id: "experience_letter", label: "Work experience letter",
    desc: "For applicants with work history.",
    accept: ".pdf,.doc,.docx",
    sampleSlug: "experience-letter", samplePages: 1,
    requirements: ["On official letterhead with HR signature.", "Role, dates, and responsibilities specified."],
    tip: "Important for MBA and postgrad applications — and visa applications that ask about work history." },
];

export const ALL_SLOTS: DocSlot[] = [...ESSENTIAL_SLOTS, ...OPTIONAL_SLOTS];

/** Build a (doc_type → most recent doc) map from a flat list of uploads. */
export function buildUploadIndex<T extends { doc_type: string; uploaded_at: string }>(
  documents: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const d of documents) {
    const existing = map.get(d.doc_type);
    if (!existing || new Date(d.uploaded_at) > new Date(existing.uploaded_at)) {
      map.set(d.doc_type, d);
    }
  }
  return map;
}

/** Counts for the readiness strip — single source of truth. */
export function computeDocReadiness<T extends { doc_type: string; uploaded_at: string }>(
  documents: T[],
) {
  const index = buildUploadIndex(documents);
  const essentialsDone = ESSENTIAL_SLOTS.filter((s) => index.has(s.id)).length;
  const optionalDone = OPTIONAL_SLOTS.filter((s) => index.has(s.id)).length;
  const totalSlots = ESSENTIAL_SLOTS.length + OPTIONAL_SLOTS.length;
  const totalDone = essentialsDone + optionalDone;
  const pct = totalSlots === 0 ? 0 : Math.round((totalDone / totalSlots) * 100);
  return {
    index,
    essentialsTotal: ESSENTIAL_SLOTS.length,
    essentialsDone,
    optionalTotal: OPTIONAL_SLOTS.length,
    optionalDone,
    totalSlots,
    totalDone,
    pct,
    nextEssential: ESSENTIAL_SLOTS.find((s) => !index.has(s.id)) ?? null,
  };
}
