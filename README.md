# kindling-test

Sandbox repository for testing and developing [kindling](https://github.com/justinvdm/kindling) — the AI task force automation tool used within the RedwoodJS project.

## Purpose

This repo serves as a controlled environment for exercising kindling workflows. It intentionally starts near-empty so that kindling task forces can be run against it without interfering with production repositories.

## Usage

Tasks are dispatched via the kindling CLI. Configuration at `.devcontainer/kindling/` is excluded from version control (see `.gitignore`).

To launch a kindling task against this repo:

```bash
kindling launch "Describe the task here"
```

See `kindling docs quickstart` for the full getting-started guide.

## Notes

- This repository has no application code of its own.
- Contents change as kindling tasks are run and their output is committed here.
- Do not treat any committed artifacts as canonical — they are task outputs for testing purposes.
