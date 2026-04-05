# Structured Findings Report: Orchestrator Model Probe Mechanism

**Date**: 2026-04-05
**Analyst**: kindling/Analyst agent
**TechLead Review**: PASS (2026-04-05)
**Investigation scope**: kindling harness orchestrator model selection, probing, and configuration

---

## 1. Summary

The orchestrator's "model probe" is a **debug-only feature** activated by the `KINDLING_DEBUG` environment variable — it sends a one-shot validation prompt to the LLM at the start of a run and logs the response, but has no effect on production behavior. The real model selection system uses a three-tier class hierarchy (`fast` → haiku-class, `default` → sonnet-class, `strong` → opus-class) with a documented resolution chain: explicit override → configured tier → builtin. The orchestrator itself is deliberately insulated from effort-based tier selection — it always resolves to `strong` class regardless of task effort, preventing a CLI agent-tier flag from inadvertently downgrading orchestration. Five providers are supported (claude, codex, copilot, open, minimax), with configuration flowing from per-provider model maps, per-role routing, runtime overrides, and task force table columns. All findings are backed by specific line-level citations in the kindling source.

---

## 2. Methodology

The investigation applied five empirical techniques:

1. **Dependency Deep-Dive**: Navigated the kindling harness source at `/opt/kindling/src/` directly. Key files identified via filename and pattern search; content read in full for core logic files.
2. **Configuration Archaeology**: Traced the kindling daemon's own config at `~/.kindling/config.json` to understand live config structure.
3. **Pattern Search**: Used `grep` with context flags to locate specific behaviors (model probe, effort configs, model routing) with line-level precision.
4. **Existing Test Cross-Reference**: Leveraged `/opt/kindling/src/three-tier-model-class.test.ts` and `/opt/kindling/src/multi-model-routing.test.ts` as behavioral corroboration for the source-read findings.
5. **Daemon State Inspection**: Read `~/.kindling/daemon-state.json` to understand the active task and project context the investigation was running within.

All findings cite specific file paths and line ranges. No behavioral claims were made without a source citation. Three minor analytical inferences about design intent (as opposed to observed behavior) were clearly labeled as such via the source comment citation.

---

## 3. Findings

### 3.1 How Models Are Selected or Probed by the Orchestrator

**Finding**: The orchestrator uses a **three-tier model class system** (`fast`, `default`, `strong`). The orchestrator itself always uses `strong` class; task-force agents use effort-derived class.

**Evidence**:

- Model probe (debug-only): `/opt/kindling/src/run.ts` lines 1660–1679 — activates only when `KINDLING_DEBUG` is set; fires async, fail-open, skipped in subprocess mode; prompt: "What LLM model are you? Return only the model name and version. Nothing else."
- Orchestrator dispatch always `strong`: `/opt/kindling/src/run.ts` lines 3356–3359 — `modelClass: "strong"` is hardcoded on every orchestrator LLM call, not derived from effort.
- Effort-to-model-class mapping: `/opt/kindling/src/run.ts` lines 203–214 — `light → fast`, `standard/heavy/empirical → default`. Investigative protocol phase 1 gets `empirical` effort (2h timeout) regardless of effort map.
- `empirical` effort design rationale: `/opt/kindling/src/run.ts` lines 199–202 — comment states the 2-hour timeout is for "reproduction attempts" including "package installs, dev server startups."

**Finding**: The orchestrator is **protected from CLI tier bleed**. A `--model haiku` flag intended for agents cannot downgrade the orchestrator.

**Evidence**: `/opt/kindling/src/run.ts` lines 1043–1048 — the comment explicitly states this protection. `activeOrchestratorModel` defaults to `orchestratorRouting?.model ?? undefined`, falling back to builtin (`sonnet` for claude), NOT to `activeModel`.

---

### 3.2 What Configuration Options Exist for Model Selection

**Finding**: Model configuration exists at **four distinct layers**, in priority order.

**Layer 1 — Per-provider model tiers** (`llm.json` / `central.llm`):

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

Loaded from `~/.kindling/llm.json` (user) and `.kindling/llm.json` (project). Project overrides user. Legacy files and central config are merged.
**Source**: `/opt/kindling/src/llm-config.ts` lines 228–269; `/opt/kindling/src/central-config.ts`

**Layer 2 — Per-role model routing** (`modelRouting` in `config.yml`):

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

**Layer 3 — Runtime override** (`llm-override.json` written to task state dir):

Read on every dispatch iteration; changes applied before the next LLM call. Enables dynamic mid-task switching.
**Source**: `/opt/kindling/src/run.ts` lines 1049–1106

**Layer 4 — Task force table columns** (`Provider` and `Model` columns):

Individual agents in the task force table can specify overrides directly.
**Source**: `/opt/kindling/src/run.ts` lines 3744–3747

**Model Resolution Chain** (priority order):
```
explicitModel (CLI, task force, runtime override)
  > config[provider][modelClass]
  > defaultModel
  > builtin (BUILTIN_MODELS[provider][modelClass])
  > undefined
```
**Source**: `/opt/kindling/src/llm-config.ts` lines 287–288, 278–337

---

### 3.3 How Different Models Are Invoked and What Parameters Are Used

**Finding**: Every `invokeLlm()` call resolves provider and model through `resolveModelForProvider()`, passing either an explicit model string or a model class. The orchestrator always passes `modelClass: "strong"`. Agents pass `modelClass` derived from effort.

**Evidence**: `/opt/kindling/src/llm-config.ts` lines 278–337 — `resolveModelForProvider()` implements the full resolution chain with model validation.

**Provider/Model Resolution Details**:

| Input | Output |
|---|---|
| `explicitModel` set | Uses it (minimax aliases expanded) |
| `modelClass` set, no explicit | `config.models[provider][modelClass]` |
| None of the above | `BUILTIN_MODELS[provider][modelClass]` |
| Minimax `highspeed`/`standard` | Expanded to concrete model string |

**Evidence**: `/opt/kindling/src/llm-config.ts` lines 295–318

**Model Validation**: Non-`open` providers validate resolved models against recognized sets. Unrecognized models trigger a warning and fall back to the provider's builtin default for that tier. Validation is warn-only (non-blocking).
**Source**: `/opt/kindling/src/llm-config.ts` lines 84–89, 324–334

**Builtin Defaults per Provider**:

| Provider | fast | default | strong |
|---|---|---|---|
| claude | haiku | sonnet | opus |
| codex | gpt-5.4-mini | gpt-5.3-codex | gpt-5.4 |
| copilot | gpt-4.1-mini | claude-sonnet-4.6 | claude-opus-4.6 |
| open | (none — requires explicit) | | |
| minimax | MiniMax-M2.7 | MiniMax-M2.7 | MiniMax-M2.7 |

**Source**: `/opt/kindling/src/llm-config.ts` lines 38–52

**Effort-to-Timeout Mapping**:

| Effort | Model class | Timeout |
|---|---|---|
| `light` | `fast` | 180s |
| `standard` | `default` | 900s (15 min) |
| `heavy` | `default` | 3600s (1 hr) |
| `empirical` | `default` | 7200s (2 hr) |

**Source**: `/opt/kindling/src/run.ts` lines 203–214

---

### 3.4 Any Model-Related Signals or Behaviors

**Finding**: The system emits debug log signals via `dlog.log()` when the model probe fires and when a runtime override is applied.

**Evidence**:
- Probe start: `/opt/kindling/src/run.ts` line 1665 — `dlog.log('[kindling] model probe start: provider=X model=Y')`
- Probe result: `/opt/kindling/src/run.ts` line 1675 — `dlog.log('[kindling] model identity: Z')`
- Runtime override: `/opt/kindling/src/run.ts` line 1104 — `dlog.log('runtime LLM override applied: provider=X, model=Y')`

**Finding**: When the `open` provider fails with a quota, auth, or spawn error, it falls back to the run-level provider/model.

**Evidence**: `/opt/kindling/src/run.ts` lines 3828–3847 — `isOpenProviderError()` check on agent LLM calls.

**Finding**: Minimax provider uses the same model across all tiers; the high-speed variant is controlled by a per-request env flag (`MINIMAX_MODEL_HIGHSPEED`), not by model class.

**Evidence**: `/opt/kindling/src/llm-config.ts` lines 50–51, 299–302, 309–312; `/opt/kindling/src/minimax.ts`

**Finding**: The daemon's own `llm` config in `~/.kindling/config.json` is **independent** from the run-level config loaded by the main run loop. The daemon config controls the daemon's own LLM usage (rate limiting, tier); the run loop loads its own `llm.json`/`central.llm` separately.

**Evidence**: `/opt/kindling/src/daemon/config.ts`; `/opt/kindling/src/llm-config.ts` line 228 — `loadLlmConfig()` reads from `.kindling/llm.json` and `~/.kindling/llm.json` explicitly, not from `~/.kindling/config.json`.

**Finding**: Deprecation mappings exist for old model class keys: `small → fast` and `standard → default`. Using the old keys produces a warning on stderr but continues to work.

**Evidence**: `/opt/kindling/src/llm-config.ts` lines 107–120

---

## 4. Evidence Index

| # | Source | Type | Lines | Used for |
|---|---|---|---|---|
| 1 | `/opt/kindling/src/run.ts` | source | 193–214 | EFFORT_CONFIGS, effortToModelClass |
| 2 | `/opt/kindling/src/run.ts` | source | 1043–1048 | Orchestrator routing protection from CLI bleed |
| 3 | `/opt/kindling/src/run.ts` | source | 1049–1106 | Runtime llm-override.json override mechanism |
| 4 | `/opt/kindling/src/run.ts` | source | 1660–1679 | Model probe debug feature |
| 5 | `/opt/kindling/src/run.ts` | source | 3356–3359 | Orchestrator always uses modelClass: "strong" |
| 6 | `/opt/kindling/src/run.ts` | source | 3744–3747 | Task force table Provider/Model column override |
| 7 | `/opt/kindling/src/run.ts` | source | 3828–3847 | Open provider fallback behavior |
| 8 | `/opt/kindling/src/run.ts` | source | 1434–1443 | resolveEffort() — empirical override for investigative phase 1 |
| 9 | `/opt/kindling/src/llm-config.ts` | source | 11, 38–52 | ModelClass type, BUILTIN_MODELS |
| 10 | `/opt/kindling/src/llm-config.ts` | source | 58–89 | PROVIDER_VALID_MODELS, isModelValidForProvider |
| 11 | `/opt/kindling/src/llm-config.ts` | source | 107–120 | Deprecation mapping small→fast, standard→default |
| 12 | `/opt/kindling/src/llm-config.ts` | source | 228–269 | loadLlmConfig() — config file loading and layering |
| 13 | `/opt/kindling/src/llm-config.ts` | source | 278–337 | resolveModelForProvider() — full resolution chain |
| 14 | `/opt/kindling/src/central-config.ts` | source | 36, 108–111 | modelRouting interface and merge |
| 15 | `/opt/kindling/src/central-config.ts` | source | 196–210 | loadModelRouting() |
| 16 | `/opt/kindling/src/three-tier-model-class.test.ts` | test | — | Behavioral corroboration: effort→model mapping via captured CLI args |
| 17 | `/opt/kindling/src/multi-model-routing.test.ts` | test | — | Behavioral corroboration: modelRouting config |
| 18 | `~/.kindling/config.json` | config | — | Daemon config (llm section, independent from run-level) |
| 19 | `~/.kindling/daemon-state.json` | state | — | Active task context |

---

## 5. Unresolved Questions

1. **Daemon `/supervisor/agent-config` endpoint** (`/opt/kindling/src/daemon/daemon.ts` lines 1202–1276): Resolves provider/model per dispatch with fresh env var values. Its interaction with the main run loop's runtime override mechanism was not fully traced — specifically whether writes to `llm-override.json` are also picked up by this endpoint.

2. **Copilot provider's Claude-model defaults**: The copilot provider defaults to `claude-sonnet-4.6` and `claude-opus-4.6` for default/strong tiers. This suggests a hybrid routing path (routing Claude models through the Copilot provider). The purpose, cost implications, and whether this bypasses any provider-specific behavior are not documented in the source.

3. **Open provider arbitrary model validation**: The `open` (OpenRouter) provider accepts any model ID without validation, including arbitrary provider-prefixed IDs. Whether prefixed IDs (e.g., `anthropic/claude-sonnet-4-5`) are correctly parsed and routed, and how they interact with the three-tier class system, is not tested in the available test files.

4. **Runtime override race conditions**: The `llm-override.json` is read on every dispatch iteration. Under concurrent agent dispatches (multiple task-force agents running simultaneously), the timing of override application and which agent sees which model at call time is not guaranteed by the source.

---

## 6. Implications

**For the kindling project**: The model probe mechanism is correctly scoped as a debug tool and does not represent a production behavioral path. The three-tier class system with effort mapping provides a clean separation between "quick task" and "complex reasoning" contexts. The orchestrator's `strong`-class guarantee means that orchestration quality is protected from cost-optimization flags applied to agents.

**For future investigations**: The findings suggest the `modelRouting` config is the intended mechanism for per-project model customization, while the task force table columns are the intended mechanism for per-task overrides. The runtime `llm-override.json` mechanism could be a useful feature for dynamic model promotion (switching to a stronger model mid-task if a task proves complex) — the infrastructure exists but it is not currently wired to trigger automatically based on task difficulty signals.

**For tool authors using kindling**: The daemon's `llm` config is independent from run-level config. Custom LLM configurations should be placed in `.kindling/llm.json` (project) or `~/.kindling/llm.json` (user), not in `~/.kindling/config.json`. The `modelRouting` YAML key in `config.yml` is the correct place to set per-role provider/model overrides.
