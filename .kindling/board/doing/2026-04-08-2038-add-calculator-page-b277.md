---
status: doing
labels: []
created: "2026-04-08T18:39:24.207Z"
started: "2026-04-08T18:39:24.207Z"
completed: null
github-pr: null
github-comments: true
no-pr: false
depends-on: []
---

## Brief

Add Calculator Page

## Checklist

## Progress Log













- [2026-04-08T20:24:14.434Z] [harness] (cycle progress)
- [2026-04-08T20:21:52.472Z] [harness] (cycle progress)
- [2026-04-08T20:14:43.677Z] [harness] (cycle progress)
- [2026-04-08T20:10:00.932Z] [harness] (cycle progress)
- [2026-04-08T20:09:59.687Z] [developer] Addressed review feedback:

> The RFC's Invariant #2 specifies down payment must be `>= 0`. In amount mode, `dpRaw` is not validated against zero or negative values. A negative dollar amount (e.g., `-50000`) would pass the `!Number.isNaN(dpRaw)` check and would not be caught by the `dpRaw > hp` check. It would silently produce an incorrect principal. Fix: add a guard before the `dpRaw > hp` check — if `dpRaw < 0` in amount mode, return the error pattern used for other down payment errors.

Added a `dpRaw < 0` guard inside the amount-mode branch, before the existing `dpRaw > hp` check. The error returns `errorField: "downPayment"` and the message "Down payment cannot be negative." Type check and tests remain clean.

---

> Line 511 of `calculator.tsx` reads `value={focusedField === "interestRate" ? interestRate : interestRate}` — a tautology. The RFC does not specify blur-formatting for the interest rate field, so the correct behavior is simply `value={interestRate}`. This should be simplified.

Replaced the tautological ternary with `value={interestRate}`. The interest rate field has no blur-formatting requirement per the RFC, so no conditional logic is needed. The change is one line.
- [2026-04-08T20:08:41.242Z] [harness] (cycle progress)
- [2026-04-08T20:06:29.361Z] [harness] (cycle progress)
- [2026-04-08T19:02:00.374Z] [harness] (cycle progress)
- [2026-04-08T18:59:14.805Z] [harness] (cycle progress)
- [2026-04-08T18:55:33.241Z] [harness] (cycle progress)
- [2026-04-08T18:50:35.904Z] [harness] (cycle progress)
- [2026-04-08T18:47:13.620Z] [harness] (cycle progress)
- [2026-04-08T18:42:07.201Z] [harness] (cycle progress)
