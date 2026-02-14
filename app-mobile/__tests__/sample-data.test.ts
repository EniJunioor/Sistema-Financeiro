import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  ACCOUNT_TYPE_LABELS,
  INVESTMENT_TYPE_LABELS,
  GOAL_TYPE_LABELS,
  SAMPLE_TRANSACTIONS,
  SAMPLE_ACCOUNTS,
  SAMPLE_INVESTMENTS,
  SAMPLE_GOALS,
} from "../lib/sample-data";

describe("CATEGORIES", () => {
  it("should have at least 5 categories", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it("each category should have id, name, icon, and color", () => {
    CATEGORIES.forEach((cat) => {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toBeTruthy();
    });
  });

  it("should have unique IDs", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ACCOUNT_TYPE_LABELS", () => {
  it("should have labels for checking, savings, credit_card, investment", () => {
    expect(ACCOUNT_TYPE_LABELS.checking).toBeTruthy();
    expect(ACCOUNT_TYPE_LABELS.savings).toBeTruthy();
    expect(ACCOUNT_TYPE_LABELS.credit_card).toBeTruthy();
    expect(ACCOUNT_TYPE_LABELS.investment).toBeTruthy();
  });
});

describe("INVESTMENT_TYPE_LABELS", () => {
  it("should have labels for stock, fund, etf, crypto, bond", () => {
    expect(INVESTMENT_TYPE_LABELS.stock).toBeTruthy();
    expect(INVESTMENT_TYPE_LABELS.fund).toBeTruthy();
    expect(INVESTMENT_TYPE_LABELS.etf).toBeTruthy();
    expect(INVESTMENT_TYPE_LABELS.crypto).toBeTruthy();
    expect(INVESTMENT_TYPE_LABELS.bond).toBeTruthy();
  });
});

describe("GOAL_TYPE_LABELS", () => {
  it("should have labels for savings, spending_limit, investment", () => {
    expect(GOAL_TYPE_LABELS.savings).toBeTruthy();
    expect(GOAL_TYPE_LABELS.spending_limit).toBeTruthy();
    expect(GOAL_TYPE_LABELS.investment).toBeTruthy();
  });
});

describe("SAMPLE_TRANSACTIONS", () => {
  it("should have sample transactions", () => {
    expect(SAMPLE_TRANSACTIONS.length).toBeGreaterThan(0);
  });

  it("each transaction should have required fields", () => {
    SAMPLE_TRANSACTIONS.forEach((tx) => {
      expect(tx.id).toBeTruthy();
      expect(tx.description).toBeTruthy();
      expect(tx.amount).toBeGreaterThan(0);
      expect(["income", "expense", "transfer"]).toContain(tx.type);
      expect(tx.date).toBeTruthy();
    });
  });
});

describe("SAMPLE_ACCOUNTS", () => {
  it("should have sample accounts", () => {
    expect(SAMPLE_ACCOUNTS.length).toBeGreaterThan(0);
  });

  it("each account should have required fields", () => {
    SAMPLE_ACCOUNTS.forEach((acc) => {
      expect(acc.id).toBeTruthy();
      expect(acc.name).toBeTruthy();
      expect(["checking", "savings", "credit_card", "investment"]).toContain(
        acc.type
      );
    });
  });
});

describe("SAMPLE_INVESTMENTS", () => {
  it("should have sample investments", () => {
    expect(SAMPLE_INVESTMENTS.length).toBeGreaterThan(0);
  });

  it("each investment should have required fields", () => {
    SAMPLE_INVESTMENTS.forEach((inv) => {
      expect(inv.id).toBeTruthy();
      expect(inv.symbol).toBeTruthy();
      expect(inv.name).toBeTruthy();
      expect(inv.quantity).toBeGreaterThan(0);
      expect(inv.averagePrice).toBeGreaterThan(0);
      expect(inv.currentPrice).toBeGreaterThan(0);
    });
  });
});

describe("SAMPLE_GOALS", () => {
  it("should have sample goals", () => {
    expect(SAMPLE_GOALS.length).toBeGreaterThan(0);
  });

  it("each goal should have required fields", () => {
    SAMPLE_GOALS.forEach((goal) => {
      expect(goal.id).toBeTruthy();
      expect(goal.name).toBeTruthy();
      expect(goal.targetAmount).toBeGreaterThan(0);
      expect(goal.currentAmount).toBeGreaterThanOrEqual(0);
    });
  });
});
