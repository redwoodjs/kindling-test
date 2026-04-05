# Orchestrator Model Probe and Selection Mechanism

**Date**: 2026-04-05
**Source**: Investigation of `/opt/kindling/src/` (kindling harness source)

---

## What Is the "Model Probe"?

The model probe is a **debug-only feature** — it is not a production mechanism. It activates only when `KINDLING_DEBUG` is set and sends a single synchronous prompt to the active LLM asking "What LLM model are you? Return only the model name and version. Nothing else." The result is written to debug logs. Probe failures are silently ignored (fail-open design). The probe is skipped in subprocess mode to avoid consuming fake-claude response slots in tests.

**Source**: `/opt/kindling/src/run.ts` lines 1660–1679

---

## The Three Model Classes

Every model selection resolves to one of three classes:

| Class | Task-force agents | Orchestrator | Builtin (claude) |
|-------|-------------------|-------------|-----------------|
| `fast` | `light` effort | never | `haiku` |
| `default` | `standard`, `heavy`, `empirical` effort | never | `sonnet` |
| `strong` | never | always | `opus` |

**Key property**: The orchestrator is intentionally isolated from effort-based tier selection. A CLI flag like `--model haiku` (intended for agents) cannot downgrade the orchestrator — the orchestrator always resolves to `strong` class or its explicit override.

**Source**: `/opt/kindling/src/llm-config.ts` lines 11, 38–52; `/opt/kindling/src/run.ts` lines 203–214, 3357–3359

---

## Model Resolution Chain

For any LLM invocation, the resolved model follows this priority:

```
explicitModel (CLI flag, task force table, runtime override)
  > config[provider][modelClass]
  > defaultModel
  > builtin (BUILTIN_MODELS[provider][modelClass])
  > undefined
```

**Source**: `/opt/kindling/src/llm-config.ts` lines 287–288, 278–337

---

## Configuration Mechanisms

### 1. Per-Provider Model Config (`llm.json` / `central.llm`)

```json
{
  "llm": {
    "defaultProvider": "claude",
    "models": {
      "claude": { "fast": "haiku", "default": "sonnet", "strong": "opus" }
    }
  }
}
```

Config is loaded from two layers: user (`~/.kindling/llm.json`) and project (`.kindling/llm.json`). Project overrides user. Legacy files and central config are merged.

**Source**: `/opt/kindling/src/llm-config.ts` lines 228–269; `/opt/kindling/src/central-config.ts`

### 2. Per-Role Model Routing (`modelRouting`)

Allows different provider/model pairs per task-force role (e.g., different models for `developer` vs `reviewer` vs `orchestrator`):

```yaml
modelRouting:
  orchestrator:
    provider: claude
    model: sonnet
  developer:
    provider: open
    model: deepseek/deepseek-chat
```

**Source**: `/opt/kindling/src/central-config.ts` lines 36, 108–111, 196–210

### 3. Runtime Override (`llm-override.json`)

A file written to the task state directory can dynamically change provider/model mid-task without restarting. Read on every dispatch iteration, applied before the next LLM call.

**Source**: `/opt/kindling/src/run.ts` lines 1049–1106

### 4. Task Force Table Columns

Agents in the Task Force table can specify `Provider` and `Model` columns directly. These override the active/default for that agent.

**Source**: `/opt/kindling/src/run.ts` lines 3744–3747

---

## Five Supported Providers

| Provider | Builtin fast | Builtin default | Builtin strong |
|----------|-------------|-----------------|----------------|
| `claude` | haiku | sonnet | opus |
| `codex` | gpt-5.4-mini | gpt-5.3-codex | gpt-5.4 |
| `copilot` | gpt-4.1-mini | claude-sonnet-4.6 | claude-opus-4.6 |
| `open` | (none) | (none) | (none) |
| `minimax` | MiniMax-M2.7 | MiniMax-M2.7 | MiniMax-M2.7 |

The `open` provider (OpenRouter) accepts arbitrary model IDs with no validation. The `minimax` provider uses the same model across all tiers; the high-speed variant is controlled by a per-request env flag, not by tier.

**Source**: `/opt/kindling/src/llm-config.ts` lines 38–52, 58–89

---

## Effort Levels and Timeouts

| Effort | Model class | Timeout |
|--------|-------------|---------|
| `light` | `fast` | 180s |
| `standard` | `default` | 900s |
| `heavy` | `default` | 3600s |
| `empirical` | `default` | 7200s |

The `empirical` effort is specifically for investigative protocol phase 1, where package installs, dev server startups, and reproduction scripts take significant time. It maps to `default` model (not `strong`) with a 2-hour timeout.

**Source**: `/opt/kindling/src/run.ts` lines 193–214, 1434–1443

---

## Model Validation

Non-`open` providers validate resolved models against a recognized set. Unrecognized models trigger a warning and fall back to the provider's builtin default for that tier. Validation is non-blocking (warn-only).

**Source**: `/opt/kindling/src/llm-config.ts` lines 84–89, 324–334

---

## Daemon Config (`~/.kindling/config.json`)

The daemon's `llm` section defines the default provider and per-tier model mappings used by the kindling daemon itself (rate limiting, tier, etc.):

```json
{
  "llm": {
    "defaultProvider": "claude",
    "models": {
      "claude": { "fast": "haiku", "default": "sonnet", "strong": "sonnet" }
    }
  }
}
```

Note: The daemon config may differ from the run-level config. The run loop reads its own `llm.json` / `central.llm` independently.

**Source**: `/home/vscode/.kindling/config.json`; `/opt/kindling/src/llm-config.ts`; `/opt/kindling/src/daemon/config.ts`
