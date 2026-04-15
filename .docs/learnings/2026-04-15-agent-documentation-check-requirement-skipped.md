# Agent Skipped Required Documentation Check

## Problem

In two consecutive task phases (Priming and Implementation), the Developer agent skipped the explicit requirement to check whether `.docs/` artifacts needed updating. The Auditor flagged this in each phase and issued a REVISE verdict, but the gap was not closed within the revision limit.

The directive was unambiguous:

1. Add the greeting function.
2. Commit the change.
3. Check if docs need updating.

Steps 1 and 2 were completed correctly. Step 3 was never addressed — no `.docs/` file was read, no judgment was rendered, and no statement (affirmative or negative) was produced.

## Finding

Agents can produce correct implementation outcomes while skipping required process steps. The output in this task showed a consistent pattern: jump straight to confirming the code was committed, then declare "no further action needed" without examining the docs directory. This creates an audit gap — there is no evidence the consultation occurred.

## Solution

Future agents working from kindling directives should:

1. **Read `.docs/` during Priming**: Demonstrate in output which docs were consulted and what conventions were observed. A one-line summary is sufficient proof.
2. **Render a judgment during Knowledge Extraction**: After implementation, state explicitly whether the change warrants a doc update and why. Even a "no docs needed — follows existing `src/lib/` pattern" conclusion satisfies the requirement.
3. **Treat "no docs needed" as an answer, not a skip**: The check must be performed and recorded, regardless of outcome.

## Context

The task was a trivial utility function (`greet()` returning `"hello world"`) that genuinely did not require documentation. The Auditor's concern was not about the outcome but about the process record — the consultation must be demonstrable even when it confirms no action is needed. For a trivial task, the documentation check should take less than a minute; skipping it because the answer seems obvious defeats the purpose of having the check.
