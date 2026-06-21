---
name: popup-ui-evaluator
description: Evaluate, design, implement, or repair production popups, dialogs, modal forms, drawers, sheets, upload prompts, booking prompts, and confirmation flows. Use when a popup is missing, opens at the wrong time, has unclear copy or actions, clips on mobile, loses focus, fails to persist its result, or needs a reusable accessible interaction contract.
---

# Popup UI Evaluator

Apply a refusal-first layered evaluation before changing popup styling. Treat a popup as a stateful product flow, not an isolated card.

## Workflow

1. Locate every trigger, open state, close path, submitted side effect, and success/error state.
2. Read [references/eval-layers.md](references/eval-layers.md) and score all six layers.
3. Refuse to render the popup when Layer 0 fails. Prefer inline content or navigation when a modal interrupts a primary flow without clear benefit.
4. Fix failed layers from lowest number to highest because later layers depend on earlier validity.
5. Reuse one shared dialog primitive for focus trapping, focus restoration, Escape handling, backdrop behavior, scroll locking, stacking, and animation.
6. Keep popup-specific components responsible only for domain copy, fields, validation, async calls, and success content.
7. Verify the real trigger-to-result path at desktop and 375px mobile widths. Do not approve a popup from a static screenshot alone.

## Implementation Contract

- Require one explicit title connected with `aria-labelledby`.
- Keep one primary action. Make secondary dismissal visually subordinate.
- Provide a visible close affordance unless dismissal would discard required unsaved data.
- Trap keyboard focus while open, restore it to the trigger on close, close on Escape when safe, and lock background scroll.
- Use a 44px minimum touch target and visible `:focus-visible` styling.
- Render errors beside the affected action or field with a concrete recovery path.
- Disable repeated submission and show loading, success, empty, and failure states.
- Use a centered dialog on larger screens and a bottom/right sheet on small screens only when content density benefits from it.
- Keep the panel inside `100dvh`, use internal scrolling for overflow, and preserve safe-area padding.
- Animate only opacity and transform for 150–300ms; respect reduced motion.
- Persist successful domain actions through the actual backend or application store. A success screen without durable state fails Layer 5.

## Output

Report failed layers briefly, implement the smallest coherent fix, and list the interaction paths verified. Do not describe a popup as working when only compilation was tested.
