# kindling-test

A test repository for kindling, an automated agent orchestration system developed by the RedwoodJS team.

## What this is

Kindling is a task force system that decomposes development tasks into directed agent workflows. Each task runs as a branch (`kindling/YYYY-MM-DD-NNNN-task-description`), with specialized agents — Writer, Reviewer, Compiler, and others — executing phases of the work autonomously under orchestrator direction.

This repository serves as a sandbox for testing kindling task execution, branch workflows, and agent output quality.

## Getting started

Kindling runs inside a dev container. To get started:

1. Clone the repository.
2. Open it in a dev container-compatible editor (VS Code with the Dev Containers extension, or GitHub Codespaces).
3. The kindling tooling is available inside the container at `.devcontainer/kindling/`.

## Repository structure

The repository is in an early state. As kindling tasks run, branches and pull requests accumulate here, demonstrating the system's output across a range of task types.

## Goals

- Validate kindling's agent orchestration against real repository tasks.
- Establish baseline quality benchmarks for agent-authored code and documentation.
- Serve as a reference for how kindling branches, commits, and pull requests are structured.
