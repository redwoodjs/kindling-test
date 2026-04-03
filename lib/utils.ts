/**
 * Date formatting utilities.
 *
 * Time-dependent functions use a factory + injectable clock pattern so tests
 * can provide deterministic dates without patching globals.
 */

// CLOCK holds the default time source. Tests can reassign CLOCK.now to a
// fixed-value getter for isolated, fast assertions.
export const CLOCK = { now: () => new Date() };

/**
 * Creates a date formatter backed by the given time source.
 *
 * @param getDate  A no-argument function returning a Date. Defaults to the
 *                 module-level CLOCK, which itself defaults to `() => new Date()`.
 *                 Swap it out in tests for a fixed-value getter.
 */
export function createDateFormatter(
  getDate: () => Date = () => CLOCK.now(),
): () => string {
  return (): string => {
    return getDate().toISOString().slice(0, 10);
  };
}

/** Pre-built formatter backed by the real system clock. */
export const formatDate = createDateFormatter();
