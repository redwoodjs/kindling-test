# Test Runner CSS Module Error

**Date**: 2026-04-08
**Source**: `src/app/pages/calculator.test.ts` / `calculator.tsx`

---

## The Problem

When a test file imports from a `.tsx` component that imports a CSS Modules file (`.module.css`), the Node.js test runner (`node --import tsx --test`) fails with:

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".css"
```

The failure occurs because `tsx` resolves the `.tsx` import and encounters the `import styles from "./foo.module.css"` statement, which the Node.js ESM loader cannot handle.

This is distinct from the Vite dev server and build pipeline, which handle CSS Modules correctly via the Vite plugin layer.

---

## The Pattern

Existing project tests do not trigger this because:
- `src/app/pages/health.ts` — plain `.ts` API handler, no JSX, no CSS
- `src/lib/ping.ts` — plain `.ts` utility, no JSX, no CSS
- `src/app/status.ts` — plain `.ts` API handler, no JSX, no CSS

All existing test files import from `.ts` source files only.

---

## The Workaround

Isolate pure logic — any functions that do not depend on React, JSX, or CSS — into a **separate `.ts` file** (not `.tsx`).

```
calculator.tsx     ← React component, "use client", imports CSS
calculator.logic.ts  ← pure functions, no CSS, imported by both component and tests
calculator.test.ts  ← imports only from calculator.logic.ts (no CSS exposure)
```

This pattern applies to any component in this project that uses CSS Modules and has non-trivial logic worth unit-testing.

---

## What Does NOT Work

- Mocking the CSS import in tests — the module resolution is blocked before any mock fires
- Renaming the CSS import — the loader error is structural, not naming-based
- Using `tsx` with `--loader` overrides — the Node.js ESM loader API does not support CSS file extensions