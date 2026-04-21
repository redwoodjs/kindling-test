# TypeScript: Enabling .ts Extension Imports

## Context
The project's test files import other modules without `.ts` extensions (e.g., `import { add } from "./math"`). With `moduleResolution: "bundler"` in `tsconfig.json`, this configuration requires `allowImportingTsExtensions: true` to pass type checking, even though `noEmit: true` is set.

## Decision
Added `allowImportingTsExtensions: true` to `tsconfig.json` to permit `.ts` extensions in import paths, which is required for the test suite to pass type check.

## Rationale
- **Module resolution "bundler"**: Strictly enforces import semantics and requires explicit opt-in for `.ts` extensions
- **noEmit: true**: Already present, which is the required companion flag for `allowImportingTsExtensions`
- **Test pattern**: The existing `math.test.ts` uses extensionless imports, establishing the project convention

## Implication
Future developers should be aware that test imports use extensionless paths. The TypeScript configuration still permits `.ts` extensions if needed, but the living convention omits them.
