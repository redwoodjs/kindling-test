# kindling-test

A sandbox repository for testing [kindling](https://github.com/redwoodjs/kindling) — the AI-powered task automation system for RedwoodJS projects.

## Purpose

This repository is used to run kindling tasks against a clean, controlled environment. It has no application code of its own. Kindling agents operate on this repo to validate task execution, documentation generation, and agentic workflows.

## Setup

Kindling runs inside a devcontainer. To get started:

1. Open this repository in VS Code with the Dev Containers extension installed.
2. When prompted, reopen in container.
3. Kindling tooling will be available inside the container.

> The `.devcontainer/kindling/` directory is excluded from version control. It is provisioned by the devcontainer setup.

## Usage

Once inside the devcontainer, use the kindling CLI to launch tasks:

```bash
kindling launch "<task description>"
```

Kindling will orchestrate a task force of agents to plan, implement, and review the requested work against this repository.

## Notes

- This is a test sandbox. Contents may be reset or overwritten by automated kindling runs.
- All commits in this repository are authored by kindling agents unless otherwise noted.
