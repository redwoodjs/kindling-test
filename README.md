# kindling-test

A sandbox repository for testing [kindling](https://github.com/justinvdm/kindling) — an AI task automation tool that delegates software work to agent task forces running in isolated devcontainers.

## What this is

This repository serves as a blank-slate test target. We run kindling tasks against it to validate task execution, agent behavior, and workflow mechanics without affecting production codebases.

## Using this repo with kindling

From a local clone of this repository:

```sh
kindling launch "your task description here"
```

kindling starts a devcontainer, clones the repo inside it, and runs the task in the background. To stream output in real time:

```sh
kindling launch -f "your task description here"
```

Check progress:

```sh
kindling report
kindling log
```

## Installing kindling

```sh
curl -sfL https://github.com/justinvdm/kindling/releases/latest/download/install.sh | sh
```

See the [kindling documentation](https://github.com/justinvdm/kindling) for the full CLI reference and configuration guide.
