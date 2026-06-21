import type { StudentOut } from "@/lib/api";
import { ESSENTIAL_SLOTS } from "@/lib/document-catalog";

export type ChatEngagementDecision =
  | { kind: "document"; slotId: string; label: string; reason: "context" | "milestone" }
  | { kind: "class"; test: string; reason: "context" | "milestone" };

export interface ChatEngagementMemory {
  version: 1;
  lastPromptTurn: number;
  documentPrompts: Record<string, { turn: number; shownAt: number }>;
  classPrompt: { turn: number; shownAt: number } | null;
  classBooked: boolean;
}

interface EngagementInput {
  userMessage: string;
  totalUserTurns: number;
  uploadedDocTypes: ReadonlySet<string>;
  student: StudentOut | null;
  memory: ChatEngagementMemory;
  now?: number;
}

const MEMORY_PREFIX = "abroadly_chat_engagement_v1";
const GLOBAL_PROMPT_GAP = 2;
const REPEAT_AFTER_TURNS = 8;
const REPEAT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const ENGLISH_TOPIC = /\b(ielts|pte|toefl|duolingo|english (?:test|score|band|language)|language test|mock test|band score)\b/i;
const ENGLISH_DOCUMENT = /\b(upload|share|attach|send|review|check|report|result|certificate|document)\b/i;

const DOCUMENT_INTENTS: Array<{ slotId: string; pattern: RegExp }> = [
  { slotId: "sop", pattern: /\b(sop|statement of purpose|personal statement)\b/i },
  { slotId: "financial", pattern: /\b(bank|budget|financial|finance|funds?|funding|sponsor|loan|income proof)\b/i },
  { slotId: "passport", pattern: /\b(passport|visa document|bio.?data page)\b/i },
  { slotId: "citizenship", pattern: /\b(citizenship|national id|identity document)\b/i },
  { slotId: "recommendation", pattern: /\b(recommendation|reference letter|\blor\b)\b/i },
  { slotId: "grade_sheet", pattern: /\b(gpa|grade|marks?|marksheet|transcript|eligib|qualif|admission|universit|college|course requirement)\w*\b/i },
];

export function emptyChatEngagementMemory(): ChatEngagementMemory {
  return {
    version: 1,
    lastPromptTurn: -100,
    documentPrompts: {},
    classPrompt: null,
    classBooked: false,
  };
}

export function readChatEngagementMemory(studentId: string): ChatEngagementMemory {
  if (typeof window === "undefined") return emptyChatEngagementMemory();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${MEMORY_PREFIX}:${studentId}`) || "null");
    if (parsed?.version !== 1) return emptyChatEngagementMemory();
    return {
      ...emptyChatEngagementMemory(),
      ...parsed,
      documentPrompts: parsed.documentPrompts || {},
    };
  } catch {
    return emptyChatEngagementMemory();
  }
}

export function writeChatEngagementMemory(studentId: string, memory: ChatEngagementMemory): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${MEMORY_PREFIX}:${studentId}`, JSON.stringify(memory));
  } catch {
    // Engagement memory is an enhancement; chat must keep working without storage.
  }
}

function slotForId(slotId: string) {
  return ESSENTIAL_SLOTS.find((slot) => slot.id === slotId) || null;
}

function nextMissingEssential(uploaded: ReadonlySet<string>) {
  return ESSENTIAL_SLOTS.find((slot) => !uploaded.has(slot.id)) || null;
}

function canRepeat(prompt: { turn: number; shownAt: number } | undefined | null, turn: number, now: number): boolean {
  if (!prompt) return true;
  return turn - prompt.turn >= REPEAT_AFTER_TURNS && now - prompt.shownAt >= REPEAT_AFTER_MS;
}

function inferredTest(student: StudentOut | null, message: string): string {
  if (/\bpte\b/i.test(message)) return "PTE";
  if (/\btoefl\b/i.test(message)) return "TOEFL";
  const profileTest = student?.planned_english_test || student?.english_test_type || "IELTS";
  if (/pte/i.test(profileTest)) return "PTE";
  if (/toefl/i.test(profileTest)) return "TOEFL";
  return "IELTS";
}

function contextualDocument(message: string, uploaded: ReadonlySet<string>): string | null {
  if (ENGLISH_TOPIC.test(message) && ENGLISH_DOCUMENT.test(message) && !uploaded.has("ielts")) {
    return "ielts";
  }
  if (/\b(document|paperwork|checklist|what do i need|what should i prepare)\b/i.test(message)) {
    return nextMissingEssential(uploaded)?.id || null;
  }
  for (const intent of DOCUMENT_INTENTS) {
    if (intent.pattern.test(message) && !uploaded.has(intent.slotId)) return intent.slotId;
  }
  return null;
}

function classIsRelevant(student: StudentOut | null): boolean {
  if (!student) return true;
  if (student.english_goal === "not_looking") return false;
  return student.english_goal === "join_class" || student.english_test_taken !== true;
}

export function decideChatEngagement(input: EngagementInput): ChatEngagementDecision | null {
  const now = input.now ?? Date.now();
  const message = input.userMessage.trim();
  const turn = Math.max(0, input.totalUserTurns);
  if (!message || turn - input.memory.lastPromptTurn < GLOBAL_PROMPT_GAP) return null;

  const documentSlotId = contextualDocument(message, input.uploadedDocTypes);
  if (documentSlotId) {
    const slot = slotForId(documentSlotId);
    const previous = input.memory.documentPrompts[documentSlotId];
    if (slot && canRepeat(previous, turn, now)) {
      return { kind: "document", slotId: slot.id, label: slot.shortLabel || slot.label, reason: "context" };
    }
  }

  if (ENGLISH_TOPIC.test(message) && !input.memory.classBooked && canRepeat(input.memory.classPrompt, turn, now)) {
    return { kind: "class", test: inferredTest(input.student, message), reason: "context" };
  }

  const documentPromptCount = Object.keys(input.memory.documentPrompts).length;
  if (turn >= 2 && input.uploadedDocTypes.size === 0 && documentPromptCount === 0) {
    const slot = slotForId("grade_sheet");
    if (slot) return { kind: "document", slotId: slot.id, label: slot.shortLabel || slot.label, reason: "milestone" };
  }

  if (
    turn >= 4
    && !input.memory.classBooked
    && !input.memory.classPrompt
    && classIsRelevant(input.student)
    && (documentPromptCount > 0 || input.uploadedDocTypes.size > 0)
  ) {
    return { kind: "class", test: inferredTest(input.student, message), reason: "milestone" };
  }

  return null;
}

export function recordChatEngagement(
  memory: ChatEngagementMemory,
  decision: ChatEngagementDecision,
  turn: number,
  now = Date.now(),
): ChatEngagementMemory {
  if (decision.kind === "document") {
    return {
      ...memory,
      lastPromptTurn: turn,
      documentPrompts: {
        ...memory.documentPrompts,
        [decision.slotId]: { turn, shownAt: now },
      },
    };
  }
  return {
    ...memory,
    lastPromptTurn: turn,
    classPrompt: { turn, shownAt: now },
  };
}

export function recordClassBooked(memory: ChatEngagementMemory): ChatEngagementMemory {
  return { ...memory, classBooked: true };
}
