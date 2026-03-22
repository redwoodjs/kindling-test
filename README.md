# kindling-test

Sandbox repository for testing and developing [kindling](https://github.com/redwoodjs/kindling) — the AI task force automation tool used within the RedwoodJS project.

## Purpose

This repo serves as a controlled environment for exercising kindling workflows. It intentionally starts near-empty so that kindling task forces can be run against it without interfering with production repositories.

## Usage

Tasks are dispatched via kindling. The devcontainer configuration for kindling lives at `.devcontainer/kindling/` (not tracked — see `.gitignore`).

To launch a kindling task against this repo:

```bash
kindling launch <task-description>
```

## Notes

- This repository has no application code of its own.
- Contents change as kindling tasks are run and their output is committed here.
- Do not treat any committed artifacts as canonical — they are task outputs for testing purposes.
