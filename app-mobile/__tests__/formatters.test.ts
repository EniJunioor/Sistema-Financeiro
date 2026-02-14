import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercentage,
  generateId,
  getCurrentMonthYear,
} from "../lib/formatters";

describe("formatCurrency", () => {
  it("should format positive values as BRL currency", () => {
    const result = formatCurrency(1500.5);
    expect(result).toContain("1.500");
    expect(result).toContain("R$");
  });

  it("should format zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
    expect(result).toContain("R$");
  });

  it("should format negative values", () => {
    const result = formatCurrency(-250);
    expect(result).toContain("250");
  });
});

describe("formatPercentage", () => {
  it("should format positive percentage with + sign", () => {
    const result = formatPercentage(12.5);
    expect(result).toContain("12");
    expect(result).toContain("%");
  });

  it("should format negative percentage", () => {
    const result = formatPercentage(-5.3);
    expect(result).toContain("5");
    expect(result).toContain("%");
  });

  it("should format zero percentage", () => {
    const result = formatPercentage(0);
    expect(result).toContain("0");
    expect(result).toContain("%");
  });
});

describe("generateId", () => {
  it("should generate a non-empty string", () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(5);
  });

  it("should generate unique IDs", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});

describe("getCurrentMonthYear", () => {
  it("should return a string with month and year", () => {
    const result = getCurrentMonthYear();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(3);
    // Should contain the year
    const year = new Date().getFullYear().toString();
    expect(result).toContain(year);
  });
});
