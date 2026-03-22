# kindling-test

A sandbox repository for testing [kindling](https://github.com/redwoodjs/kindling) — the AI agent task force orchestration system used by RedwoodJS.

## Purpose

This repository serves as a test environment where kindling task forces can be launched, evaluated, and iterated on. It is intentionally kept minimal so that kindling agents have a clean, controlled surface to work against.

## What is kindling?

Kindling is an AI-powered orchestration layer that coordinates task forces of specialized agents (Writer, Reviewer, Compile, etc.) to complete software engineering and documentation tasks autonomously. Each agent has a defined role, toolset, and directive. An Orchestrator agent manages the task force lifecycle, routes work between agents, and integrates their outputs.

## Usage

This repository is managed by kindling. To run a task against it:

```bash
kindling launch - <<EOF
<your task description>
EOF
```

Kindling will create a branch, dispatch agents, and open a pull request when the task is complete.

## Repository structure

The repository is empty by design. Kindling agents populate it with artifacts as tasks are executed.
