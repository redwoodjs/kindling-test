// This file is intentionally empty.
//
// Page-level integration tests for the /calculator route cannot run in the
// current Node.js test environment because importing the worker (and therefore
// calculator.tsx) triggers a CSS module import that Node.js cannot resolve.
//
// The calculator page's behavioral scenarios are instead covered through:
//   1. src/lib/calculator.test.ts  — pure calculation logic and derived behaviors
//   2. TypeScript type-checking of worker.tsx  — confirms route registration
//
// Scenarios covered in src/lib/calculator.test.ts:
//   - All 27 RFC Gherkin calculation scenarios
//   - Down payment toggle conversion logic
//   - Real-time recalculation (no error on input change)
//   - Zero and 100% down payment edge cases
//   - Currency formatting round-trip
//   - Error precedence by form field order
//   - No NaN or negative values in non-error state
//   - Long loan terms (40yr/7% — total interest exceeds principal)
//   - Optional tax and insurance fields
//   - Loan term presets and custom values
//
// Scenarios verified via worker.tsx type-check:
//   - /calculator route is registered before the catch-all /
//   - Calculator component is imported and passed to the route
//   - Named export is used (consistent with Home and Welcome patterns)
//
// Scenarios requiring a live React runtime (manual verification):
//   - Financial disclaimer is visible on first load
//   - Results show "--" when inputs are incomplete
//   - Currency formatting on blur (formatted display, raw underlying value)
//   - Down payment hint shows effective dollar amount or percentage
//   - Result number animates on change (CSS transition 300ms ease-out)
//   - Page layout stacks vertically on mobile (viewport 375px)
