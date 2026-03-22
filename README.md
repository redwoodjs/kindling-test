# kindling-test

Our sandbox repository for testing [kindling](https://github.com/redwoodjs/kindling), the AI-powered task automation tool for the RedwoodJS ecosystem.

## Overview

We use this repository as a test environment for kindling — an orchestrator-driven agent system that coordinates task forces of specialized AI agents to execute development tasks. We experiment with kindling workflows here, validate agent behavior, and explore what the tooling can do.

## Setup

**Prerequisites**: A working devcontainer environment (VS Code + Docker, or GitHub Codespaces).

1. Clone the repository.
2. Open in a devcontainer — kindling and its dependencies are configured automatically.
3. Verify the setup:

```bash
kindling --version
```

## Usage

We run a task by piping a worklog or directive to kindling:

```bash
cat .notes/worklogs/my-task.md | kindling launch -
```

Or we describe a task inline:

```bash
kindling launch "describe what you want done here"
```

We refer to the kindling documentation for full usage, agent configuration, and task force setup.

## Contributing

This is our test repository — contributions are typically informal experiments. When we add a reproducible test case or fixture, we keep it scoped and document what it is testing in a comment or commit message.
