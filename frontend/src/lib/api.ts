// Typed client for the Abroadly backend.

const BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "/api";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export type EducationLevel = "plus_two" | "a_levels" | "bba" | "bachelors" | "other";
export type Decision = "proceed" | "low_confidence" | "out_of_scope" | "escalate";

export interface StudentCreate {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  education_level: EducationLevel;
  gpa?: number;
  expected_gpa?: number;
  target_countries?: string[];
  goals?: string;
  preferred_field?: string;
}

export interface CompleteProfilePayload {
  full_name: string;
  phone: string;
  location?: string;
  education_level: EducationLevel;
  gpa?: number;
  expected_gpa?: number;
  qualification_year: number;
  score_type: "gpa" | "percentage" | "cgpa_10" | "grade" | "other";
  academic_score: string;
  english_test_taken: boolean;
  english_test_type?: string;
  english_overall_score?: string;
  english_lowest_score?: string;
  english_goal?: "join_class" | "not_looking" | "book_test";
  english_class_timing?: string;
  planned_english_test?: string;
  target_countries: string[];
  goals?: string;
  preferred_field: string;
  intended_study_level: string;
  preferred_intake: string;
  budget_range?: string;
  call_consent: boolean;
}

export interface StudentUpdatePayload {
  full_name?: string;
  phone?: string;
  location?: string | null;
  education_level?: EducationLevel;
  gpa?: number | null;
  expected_gpa?: number | null;
  target_countries?: string[];
  goals?: string | null;
  preferred_field?: string | null;
  profile_photo_url?: string | null;
}

export interface StudentOut {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  education_level: EducationLevel;
  gpa: number | null;
  expected_gpa: number | null;
  qualification_year: number | null;
  score_type: string | null;
  academic_score: string | null;
  english_test_taken: boolean | null;
  english_test_type: string | null;
  english_overall_score: string | null;
  english_lowest_score: string | null;
  english_goal: string | null;
  english_class_timing: string | null;
  planned_english_test: string | null;
  target_countries: string[];
  goals: string | null;
  preferred_field: string | null;
  intended_study_level: string | null;
  preferred_intake: string | null;
  budget_range: string | null;
  ai_paused: boolean;
  profile_completed: boolean;
  call_consent: boolean;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatSource {
  chunk_id: string;
  source_type: string;
  score: number;
  title: string | null;
}

export interface ChatResponse {
  request_id: string;
  trace_id: string;
  decision: Decision;
  confidence: number;
  answer: string | null;
  clarifying_question: string | null;
  clarification_needed: boolean;
  sources: ChatSource[];
  reason: string;
  // Backend-authoritative signals (all optional — old responses omit them safely)
  answer_length?: "short" | "medium" | "long" | null;
  offer_counselor?: boolean;
  offer_reason?: "qualified" | "question" | null;
  offer_counselor_tier?: "soft" | "medium" | "strong" | null;
  lead_status?: string | null;
  lead_score?: number | null;
  handoff_target?: string | null;
}

export type ChatRole = "user" | "assistant" | "counselor";

export interface ChatTurn {
  id: string;
  role: ChatRole;
  content: string;
  eval_decision: string | null;
  created_at: string;
}

export interface UploadResponse {
  filename: string;
  message: string;
  document: StudentDocument | null;
}

export interface StudentDocument {
  filename: string;
  doc_id: string;
  doc_type: string;
  ext: string;
  is_image: boolean;
  size_bytes: number;
  uploaded_at: string;
}

export interface GoogleAuthResponse {
  student: StudentOut;
  is_new_student: boolean;
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------
export async function createStudent(payload: StudentCreate): Promise<StudentOut> {
  return handle<StudentOut>(
    await fetch(`${BASE}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function getStudent(id: string): Promise<StudentOut> {
  return handle<StudentOut>(await fetch(`${BASE}/students/${id}`));
}

export async function updateStudent(
  id: string,
  payload: StudentUpdatePayload
): Promise<StudentOut> {
  return handle<StudentOut>(
    await fetch(`${BASE}/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function getCurrentStudent(): Promise<StudentOut> {
  return handle<StudentOut>(
    await fetch(`${BASE}/auth/me`, {
      credentials: "include",
    })
  );
}

export async function completeGoogleProfile(
  payload: CompleteProfilePayload
): Promise<StudentOut> {
  return handle<StudentOut>(
    await fetch(`${BASE}/auth/profile`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function logoutStudent(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

export async function chat(
  student_id: string,
  message: string,
  trace_id?: string,
  source?: string,
  session_typed_count?: number,
): Promise<ChatResponse> {
  return handle<ChatResponse>(
    await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id, message, trace_id, source, session_typed_count }),
    })
  );
}

export interface SignalEvent {
  event_type: string;
  doc_type?: string;
}

export interface SignalResponse {
  lead_score: number;
  lead_status: string;
  points_awarded: number;
}

export async function signalStudent(
  student_id: string,
  event: SignalEvent,
): Promise<SignalResponse> {
  return handle<SignalResponse>(
    await fetch(`${BASE}/students/${student_id}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
  );
}

export async function uploadFile(
  student_id: string,
  file: File,
  docType?: string,
  displayFilename?: string
): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("student_id", student_id);
  fd.append("file", file);
  if (docType) fd.append("doc_type", docType);
  if (displayFilename) fd.append("display_filename", displayFilename);
  return handle<UploadResponse>(
    await fetch(`${BASE}/upload`, { method: "POST", body: fd })
  );
}

export async function getStudentDocuments(student_id: string): Promise<StudentDocument[]> {
  return handle<StudentDocument[]>(
    await fetch(`${BASE}/upload/${student_id}/documents`)
  );
}

export function getStudentDocumentDownloadUrl(studentId: string, docId: string): string {
  return `${BASE}/upload/${studentId}/documents/${docId}/download`;
}

export async function getChatHistory(
  student_id: string,
  limit = 50
): Promise<ChatTurn[]> {
  return handle<ChatTurn[]>(
    await fetch(`${BASE}/chat/history/${student_id}?limit=${limit}`)
  );
}

export type ServiceRequestType = "counselor_call" | "test_booking" | "class_booking";

export interface ServiceRequestPayload {
  request_type: ServiceRequestType;
  phone?: string;
  test_type?: string;
  preferred_time?: string;
}

export async function requestService(
  student_id: string,
  payload: ServiceRequestPayload,
): Promise<StudentOut> {
  return handle<StudentOut>(
    await fetch(`${BASE}/students/${student_id}/request-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function requestCounselorCall(
  student_id: string,
  phone?: string
): Promise<StudentOut> {
  return requestService(student_id, {
    request_type: "counselor_call",
    phone,
  });
}

export function googleLoginUrl(): string {
  return `${BASE}/auth/google/login`;
}

export async function exchangeGoogleCode(
  code: string,
  state: string
): Promise<GoogleAuthResponse> {
  return handle<GoogleAuthResponse>(
    await fetch(`${BASE}/auth/google/exchange`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    })
  );
}

// Keep old names for backward compat with existing stubs
export const sendChat = (payload: { student_id: string; message: string; source?: string }) =>
  chat(payload.student_id, payload.message, undefined, payload.source);
export const uploadDoc = uploadFile;

export async function uploadProfilePhoto(studentId: string, file: File): Promise<{ profile_photo_url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return handle<{ profile_photo_url: string }>(
    await fetch(`${BASE}/upload/${studentId}/profile-photo`, {
      method: "POST",
      body: fd,
    })
  );
}
