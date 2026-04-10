/**
 * Calculator module — pure arithmetic utilities.
 *
 * Provides binary `add` and `subtract` functions with no side effects.
 *
 * Note on floating-point precision: JavaScript uses IEEE 754 double-precision
 * floating-point for its `number` type, which can produce surprising results
 * for certain decimal values (e.g., `0.1 + 0.2 !== 0.3`). This is a known
 * limitation of the language and is not corrected here — callers requiring
 * exact decimal arithmetic should use a dedicated decimal library.
 */

/**
 * Adds two numbers.
 * @param a - first addend
 * @param b - second addend
 * @returns the sum a + b
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * Subtracts the second number from the first.
 * @param a - minuend
 * @param b - subtrahend
 * @returns the difference a - b
 */
export function subtract(a: number, b: number): number {
  return a - b
}