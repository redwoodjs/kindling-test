import { describe, it, expect } from 'vitest';
import { getCurrentDateFormatted } from './dateFormat';

describe('getCurrentDateFormatted', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getCurrentDateFormatted();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns exactly 10 characters', () => {
    const result = getCurrentDateFormatted();
    expect(result.length).toBe(10);
  });

  it('has hyphens at positions 4 and 7', () => {
    const result = getCurrentDateFormatted();
    expect(result[4]).toBe('-');
    expect(result[7]).toBe('-');
  });

  it('contains only digits and hyphens', () => {
    const result = getCurrentDateFormatted();
    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      if (i === 4 || i === 7) {
        expect(char).toBe('-');
      } else {
        expect(/\d/.test(char)).toBe(true);
      }
    }
  });

  it('returns the current date', () => {
    const result = getCurrentDateFormatted();
    const today = new Date();
    const expectedYear = today.getFullYear().toString();
    const expectedMonth = String(today.getMonth() + 1).padStart(2, '0');
    const expectedDay = String(today.getDate()).padStart(2, '0');
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    expect(result).toBe(expected);
  });

  it('returns consistent format across multiple calls', () => {
    const result1 = getCurrentDateFormatted();
    const result2 = getCurrentDateFormatted();

    expect(result1).toBe(result2);
    expect(result1).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result2).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('year component is 4 digits', () => {
    const result = getCurrentDateFormatted();
    const year = result.substring(0, 4);
    expect(/^\d{4}$/.test(year)).toBe(true);
    expect(parseInt(year, 10)).toBeGreaterThanOrEqual(2000);
  });

  it('month component is 2 digits between 01 and 12', () => {
    const result = getCurrentDateFormatted();
    const month = result.substring(5, 7);
    const monthNum = parseInt(month, 10);
    expect(/^\d{2}$/.test(month)).toBe(true);
    expect(monthNum).toBeGreaterThanOrEqual(1);
    expect(monthNum).toBeLessThanOrEqual(12);
  });

  it('day component is 2 digits between 01 and 31', () => {
    const result = getCurrentDateFormatted();
    const day = result.substring(8, 10);
    const dayNum = parseInt(day, 10);
    expect(/^\d{2}$/.test(day)).toBe(true);
    expect(dayNum).toBeGreaterThanOrEqual(1);
    expect(dayNum).toBeLessThanOrEqual(31);
  });
});
