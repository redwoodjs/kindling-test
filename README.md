# kindling-test

A test repository for [kindling](https://github.com/redwoodjs/kindling), RedwoodJS's AI-powered task orchestration system.

## Purpose

This repository serves as a target for kindling task runs. Kindling agents operate against it to validate orchestration workflows — investigating the repo, making changes, and producing artifacts as directed by the orchestrator.

## How it works

Kindling runs tasks inside a devcontainer (`.devcontainer/kindling/`, excluded from version control). An orchestrator breaks work into phases and dispatches directives to specialized agents — Writer, Reviewer, Compiler, and others — each with a defined role and tool scope. Agents commit their work directly to this repository.

The repository is intentionally minimal. Its contents at any point reflect whatever the active kindling task has produced.

## Repository

`redwoodjs/kindling-test` — owned by the [RedwoodJS](https://github.com/redwoodjs) organization.
