# Developer Agent: Structured Output Is the Evidence

## Problem

A Developer agent produced a correct implementation (commit `29fbe39`) but its agent output contained no file path, no function signature, no diff, and no commit SHA. The Auditor could not verify the work had been done and issued a REVISE verdict.

The disconnect between performed work and reported evidence allowed the task to reach completion while still failing the audit.

## Finding

In a structured protocol, **the output is the audit trail**. The Auditor cannot see what the Developer did inside its session — only what the Developer wrote in its response. A prose claim ("implemented in the shared utilities module") with no verifiable artifact is indistinguishable from a fabricated conclusion, regardless of whether the underlying work is correct.

## Required Output Elements

For any implementation phase, the Developer's structured output should include at minimum one of:

- The file path and a snippet of the added/changed code
- A `git diff` or `git show` of the relevant changes
- The commit SHA confirming the change was persisted

These artifacts must appear in the agent's written response, not merely exist in the session state.

## Context

The fast-track protocol has no RFC, no review gate, and minimal documentation requirements — but it still requires the same evidence standard. A fast protocol skips process overhead; it does not skip accountability.
