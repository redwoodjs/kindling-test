# kindling-test

Test and sandbox repository for [kindling](https://github.com/redwoodjs/kindling) — an agentic task force system used by the RedwoodJS team.

## What this is

This repository serves as a target environment for kindling task runs. Kindling launches a task force of specialized agents (Writer, Reviewer, Compiler, etc.) against a repository, orchestrating them to complete development tasks autonomously.

Tasks run here are for testing and validating kindling behavior — not for shipping production code.

## How kindling works

Kindling creates a branch per task (`kindling/YYYY-MM-DD-HHMM-<task>-<id>`), dispatches agents via a devcontainer environment, and produces commits, PRs, and reports as output.

The `.devcontainer/kindling/` directory holds the runtime configuration for the agent environment and is excluded from version control.

## Usage

This repository has no application code. To run a kindling task against it:

```bash
cat <worklog-or-brief-path> | kindling launch -
```

Or reference the repository directly in a kindling task description.
