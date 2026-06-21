# Popup Evaluation Layers

Use the layers in order. Mark each `PASS`, `FAIL`, or `NOT APPLICABLE`. A lower-layer failure blocks approval of higher layers.

## Layer 0 — Trigger validity

- Does the user action clearly justify an interruption?
- Is the popup shown only in the correct eligibility and authentication state?
- Are duplicate, stale, or conflicting popups prevented?
- Would inline disclosure or navigation serve the user better?

Gate: refuse to open when the trigger is ambiguous, already completed, or missing required context.

## Layer 1 — Intent and content

- Does the title state the outcome rather than a generic category?
- Does supporting copy explain why the popup appeared and what happens next?
- Is there exactly one visually dominant action?
- Are labels specific to the requested document, booking, counselor, or account action?

## Layer 2 — Interaction and accessibility

- Is the dialog labeled with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`?
- Does focus move into the popup, remain trapped, and return to the trigger?
- Do Escape, backdrop click, and the close button behave consistently and safely?
- Are touch targets at least 44px and keyboard focus visible?
- Is background scroll locked without losing the previous body state?

## Layer 3 — State machine

- Are idle, validating, loading, success, error, and retry states defined?
- Are double submissions prevented?
- Do errors state the cause and recovery action near the problem?
- Does cancellation preserve or warn about unsaved input?

## Layer 4 — Visual and responsive geometry

- Does the popup remain inside `100dvh` with safe-area padding and internal overflow?
- Is text readable without clipping at 375px, 768px, and desktop widths?
- Does the scrim isolate the foreground at roughly 40–60% opacity?
- Are spacing, radius, shadows, icons, and motion consistent with the product system?
- Does reduced-motion mode remove nonessential movement?

## Layer 5 — Integration and regression

- Does confirmation write to the real API/store and restore accurately after reload?
- Does closing clean up listeners, locks, temporary URLs, and transient state?
- Do deep links and browser navigation remain predictable?
- Are trigger → submit → success, trigger → cancel, error → retry, Escape, and mobile overflow paths verified?
- Do build, type, lint, and relevant tests pass?
