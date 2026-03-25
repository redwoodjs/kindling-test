/**
 * Returns the current date formatted as YYYY-MM-DD.
 * Uses the local system timezone.
 * Always returns a valid ISO 8601 date string with consistent format.
 * @returns Current date in YYYY-MM-DD format (e.g., "2026-03-25")
 */
export function getCurrentDateFormatted(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
