import { describe, it, beforeEach } from "node:test"
import assert from "node:assert"
import {
  computeMortgage,
  parseCurrency,
  formatCurrency,
  formatInteger,
  computeDownPaymentFromPercent,
  computeDownPaymentFromAmount,
  computePrincipal,
  getDownPaymentDisplay,
  calculateMonthlyPI,
  DOWN_PAYMENT_MAX_PERCENT,
  HOME_PRICE_MIN,
  HOME_PRICE_MAX,
  RATE_MIN,
  RATE_MAX,
  TERM_MIN,
  TERM_MAX,
  INSURANCE_MAX,
  TAX_MAX,
} from "./calculator.js"

// ---------------------------------------------------------------------------
// parseCurrency
// ---------------------------------------------------------------------------

describe("parseCurrency", () => {
  it("parses a plain integer string", () => {
    assert.strictEqual(parseCurrency("500000"), 500000)
  })

  it("parses a string with commas", () => {
    assert.strictEqual(parseCurrency("500,000"), 500000)
  })

  it("parses a string with a dollar sign", () => {
    assert.strictEqual(parseCurrency("$500000"), 500000)
  })

  it("parses a string with commas and dollar sign", () => {
    assert.strictEqual(parseCurrency("$500,000"), 500000)
  })

  it("parses a string with spaces", () => {
    assert.strictEqual(parseCurrency("$ 500, 000 "), 500000)
  })

  it("returns NaN for a purely non-numeric string", () => {
    assert.ok(Number.isNaN(parseCurrency("abc")))
  })

  it("returns NaN for an empty string", () => {
    assert.ok(Number.isNaN(parseCurrency("")))
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe("formatCurrency", () => {
  it("formats an integer with commas and dollar sign", () => {
    assert.strictEqual(formatCurrency(500000), "$500,000.00")
  })

  it("formats a large number with multiple commas", () => {
    assert.strictEqual(formatCurrency(12345678), "$12,345,678.00")
  })

  it("formats a small number without trailing zeros beyond cents", () => {
    const result = formatCurrency(1234.56)
    assert.ok(result.startsWith("$1,234.56") || result.startsWith("$1,234.5"))
  })

  it("formats zero as $0.00", () => {
    assert.strictEqual(formatCurrency(0), "$0.00")
  })
})

// ---------------------------------------------------------------------------
// computeDownPaymentFromPercent
// ---------------------------------------------------------------------------

describe("computeDownPaymentFromPercent", () => {
  it("computes 20% of 500,000 as 100,000", () => {
    assert.strictEqual(computeDownPaymentFromPercent(500000, 20), 100000)
  })

  it("computes 0% as 0", () => {
    assert.strictEqual(computeDownPaymentFromPercent(500000, 0), 0)
  })

  it("computes 100% as the full home price", () => {
    assert.strictEqual(computeDownPaymentFromPercent(500000, 100), 500000)
  })

  it("rounds fractional dollar amounts to the nearest cent", () => {
    // 10% of 333,333 = 33,333.30
    const result = computeDownPaymentFromPercent(333333, 10)
    assert.strictEqual(result, 33333.3)
  })
})

// ---------------------------------------------------------------------------
// computeDownPaymentFromAmount
// ---------------------------------------------------------------------------

describe("computeDownPaymentFromAmount", () => {
  it("returns the raw amount unchanged", () => {
    assert.strictEqual(computeDownPaymentFromAmount(100000), 100000)
  })

  it("returns zero for zero input", () => {
    assert.strictEqual(computeDownPaymentFromAmount(0), 0)
  })
})

// ---------------------------------------------------------------------------
// computePrincipal
// ---------------------------------------------------------------------------

describe("computePrincipal", () => {
  it("subtracts down payment from home price", () => {
    assert.strictEqual(computePrincipal(500000, 100000), 400000)
  })

  it("returns full home price when down payment is zero", () => {
    assert.strictEqual(computePrincipal(500000, 0), 500000)
  })

  it("returns zero when down payment equals home price", () => {
    assert.strictEqual(computePrincipal(500000, 500000), 0)
  })
})

// ---------------------------------------------------------------------------
// DOWN_PAYMENT_MAX_PERCENT constant
// ---------------------------------------------------------------------------

describe("DOWN_PAYMENT_MAX_PERCENT", () => {
  it("is 100", () => {
    assert.strictEqual(DOWN_PAYMENT_MAX_PERCENT, 100)
  })
})

// ---------------------------------------------------------------------------
// HOME_PRICE_MIN and HOME_PRICE_MAX constants
// ---------------------------------------------------------------------------

describe("home price bounds constants", () => {
  it("HOME_PRICE_MIN is greater than 0", () => {
    assert.ok(HOME_PRICE_MIN > 0)
  })

  it("HOME_PRICE_MAX is 100,000,000", () => {
    assert.strictEqual(HOME_PRICE_MAX, 100_000_000)
  })
})

// ---------------------------------------------------------------------------
// rate bounds constants
// ---------------------------------------------------------------------------

describe("interest rate bounds constants", () => {
  it("RATE_MIN is 0.1", () => {
    assert.strictEqual(RATE_MIN, 0.1)
  })

  it("RATE_MAX is 30", () => {
    assert.strictEqual(RATE_MAX, 30)
  })
})

// ---------------------------------------------------------------------------
// loan term bounds constants
// ---------------------------------------------------------------------------

describe("loan term bounds constants", () => {
  it("TERM_MIN is 1", () => {
    assert.strictEqual(TERM_MIN, 1)
  })

  it("TERM_MAX is 40", () => {
    assert.strictEqual(TERM_MAX, 40)
  })
})

// ---------------------------------------------------------------------------
// TAX_MAX and INSURANCE_MAX constants
// ---------------------------------------------------------------------------

describe("optional field bounds constants", () => {
  it("TAX_MAX is 100,000", () => {
    assert.strictEqual(TAX_MAX, 100_000)
  })

  it("INSURANCE_MAX is 100,000", () => {
    assert.strictEqual(INSURANCE_MAX, 100_000)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: default/incomplete inputs
// ---------------------------------------------------------------------------

describe("computeMortgage — incomplete required inputs", () => {
  it("returns hasError=true when home price is 0", () => {
    const result = computeMortgage({
      homePriceRaw: "0",
      dpRaw: "0",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "homePrice")
    assert.ok(result.errorMessage && result.errorMessage.length > 0)
  })

  it("returns hasError=true when home price is empty (NaN)", () => {
    const result = computeMortgage({
      homePriceRaw: "",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    // empty home price shows no errorField (requiredReady gate catches it before specific field error)
  })

  it("returns hasError=true when home price exceeds maximum", () => {
    const result = computeMortgage({
      homePriceRaw: "150000000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "homePrice")
  })

  it("returns hasError=true when down payment amount exceeds home price", () => {
    const result = computeMortgage({
      homePriceRaw: "300000",
      dpRaw: "400000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "downPayment")
    assert.ok(result.errorMessage && result.errorMessage.length > 0)
  })

  it("returns hasError=true when down payment amount is negative", () => {
    const result = computeMortgage({
      homePriceRaw: "300000",
      dpRaw: "-10000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "downPayment")
  })

  it("returns hasError=true when down payment percent exceeds 100", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "150",
      dpMode: "percent",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "downPayment")
  })

  it("returns hasError=true when interest rate is negative", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "-5",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "interestRate")
  })

  it("returns hasError=true when interest rate is zero", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "0",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "interestRate")
  })

  it("returns hasError=true when interest rate is below minimum threshold", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "0.05",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "interestRate")
  })

  it("returns hasError=true when interest rate exceeds 30%", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "35",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "interestRate")
  })

  it("returns hasError=true when loan term is less than 1 year", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 0.5,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "loanTerm")
  })

  it("returns hasError=true when loan term exceeds 40 years", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 45,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "loanTerm")
  })

  it("returns hasError=true when loan term is empty/undefined default", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 0, // zero as default for invalid state
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "loanTerm")
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: valid inputs — results are positive numbers
// ---------------------------------------------------------------------------

describe("computeMortgage — valid required inputs produce positive results", () => {
  let result: ReturnType<typeof computeMortgage>

  beforeEach(() => {
    result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
  })

  it("hasError is false", () => {
    assert.strictEqual(result.hasError, false)
  })

  it("monthlyPI is a positive finite number", () => {
    assert.ok(result.monthlyPI > 0, "monthlyPI must be positive")
    assert.ok(Number.isFinite(result.monthlyPI), "monthlyPI must be finite")
  })

  it("monthlyTotal is a positive finite number", () => {
    assert.ok(result.monthlyTotal > 0, "monthlyTotal must be positive")
    assert.ok(Number.isFinite(result.monthlyTotal), "monthlyTotal must be finite")
  })

  it("totalInterest is a positive finite number", () => {
    assert.ok(result.totalInterest > 0, "totalInterest must be positive")
    assert.ok(Number.isFinite(result.totalInterest), "totalInterest must be finite")
  })

  it("totalCost is a positive finite number", () => {
    assert.ok(result.totalCost > 0, "totalCost must be positive")
    assert.ok(Number.isFinite(result.totalCost), "totalCost must be finite")
  })

  it("principal equals home price minus down payment", () => {
    assert.strictEqual(result.principal, 400000)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: down payment 100% of home price
// ---------------------------------------------------------------------------

describe("computeMortgage — 100% down payment (no principal)", () => {
  let result: ReturnType<typeof computeMortgage>

  beforeEach(() => {
    result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100",
      dpMode: "percent",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
  })

  it("hasError is false (100% is allowed)", () => {
    assert.strictEqual(result.hasError, false)
  })

  it("principal is zero", () => {
    assert.strictEqual(result.principal, 0)
  })

  it("monthlyPI is zero", () => {
    assert.strictEqual(result.monthlyPI, 0)
  })

  it("totalInterest is zero", () => {
    assert.strictEqual(result.totalInterest, 0)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: down payment percent mode
// ---------------------------------------------------------------------------

describe("computeMortgage — down payment percent mode", () => {
  it("uses correct effective down payment (20% of 500,000)", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "20",
      dpMode: "percent",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.strictEqual(result.principal, 400000)
  })

  it("zero percent yields full principal", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "0",
      dpMode: "percent",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.strictEqual(result.principal, 500000)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: real-time recalculation (no submit needed)
// ---------------------------------------------------------------------------

describe("computeMortgage — recalculates on every call without errors", () => {
  it("changing rate produces a new monthlyPI without throwing", () => {
    const base = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    const updated = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "6",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    assert.notStrictEqual(base.monthlyPI, updated.monthlyPI)
    assert.ok(updated.monthlyPI > 0)
  })

  it("changing home price produces a new totalCost without throwing", () => {
    const base = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    const updated = computeMortgage({
      homePriceRaw: "600000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    assert.notStrictEqual(base.totalCost, updated.totalCost)
    assert.ok(updated.totalCost > 0)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: optional tax field
// ---------------------------------------------------------------------------

describe("computeMortgage — optional property tax field", () => {
  it("monthlyTax is 0 when field is empty", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.monthlyTax, 0)
  })

  it("monthlyTax is tax annual divided by 12", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "6000",
      insuranceRaw: "",
    })
    assert.strictEqual(result.monthlyTax, 500)
  })

  it("monthlyTax is 0 when field is invalid", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "abc",
      insuranceRaw: "",
    })
    assert.strictEqual(result.monthlyTax, 0)
  })

  it("monthlyTotal includes tax when field is filled", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "6000",
      insuranceRaw: "",
    })
    assert.ok(result.monthlyTotal > result.monthlyPI)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: optional insurance field
// ---------------------------------------------------------------------------

describe("computeMortgage — optional insurance field", () => {
  it("monthlyInsurance is 0 when field is empty", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.monthlyInsurance, 0)
  })

  it("monthlyInsurance is insurance annual divided by 12", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "1800",
    })
    assert.strictEqual(result.monthlyInsurance, 150)
  })

  it("monthlyInsurance is 0 when field is invalid", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "xyz",
    })
    assert.strictEqual(result.monthlyInsurance, 0)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: monthlyTotal = monthlyPI + monthlyTax + monthlyInsurance
// ---------------------------------------------------------------------------

describe("computeMortgage — monthlyTotal equals sum of components", () => {
  it("monthlyTotal equals monthlyPI + monthlyTax + monthlyInsurance", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "6000",
      insuranceRaw: "1800",
    })
    assert.strictEqual(
      result.monthlyTotal,
      result.monthlyPI + result.monthlyTax + result.monthlyInsurance,
    )
  })

  it("monthlyTotal equals monthlyPI when tax and insurance are empty", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.monthlyTotal, result.monthlyPI)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: totalCost = monthlyTotal * loanTermMonths
// ---------------------------------------------------------------------------

describe("computeMortgage — totalCost equals monthlyTotal times loan term months", () => {
  it("totalCost for 30-year loan", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.totalCost, Math.round(result.monthlyTotal * 30 * 12 * 100) / 100)
  })

  it("totalCost for 15-year loan", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 15,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.totalCost, Math.round(result.monthlyTotal * 15 * 12 * 100) / 100)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: totalInterest = totalCost - principal
// ---------------------------------------------------------------------------

describe("computeMortgage — totalInterest equals totalCost minus principal", () => {
  it("totalInterest is correct for a standard loan", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.totalInterest, result.totalCost - result.principal)
  })

  it("totalInterest is zero for 100% down payment", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100",
      dpMode: "percent",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.totalInterest, 0)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: long loan term — total interest can exceed principal
// ---------------------------------------------------------------------------

describe("computeMortgage — long loan term (40 years, 7%)", () => {
  it("total interest exceeds principal", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 40,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.ok(result.totalInterest > result.principal, "totalInterest must exceed principal for 40yr/7% loan")
    assert.ok(Number.isFinite(result.totalInterest), "totalInterest must be finite")
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: custom loan term values
// ---------------------------------------------------------------------------

describe("computeMortgage — custom loan term values", () => {
  it("25-year term computes without error", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 25,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.ok(result.monthlyPI > 0)
  })

  it("1-year term computes without error", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 1,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.ok(result.monthlyPI > 0)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: error precedence (first invalid field in form order)
// ---------------------------------------------------------------------------

describe("computeMortgage — error precedence follows form order", () => {
  it("home price error takes precedence over down payment error", () => {
    const result = computeMortgage({
      homePriceRaw: "-1",       // invalid
      dpRaw: "99999999",       // would also be invalid relative to -1 price
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.errorField, "homePrice")
  })

  it("down payment error takes precedence over interest rate error", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",   // valid
      dpRaw: "99999999",       // exceeds home price → down payment error
      dpMode: "amount",
      interestRateRaw: "-5",   // would also be invalid
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.errorField, "downPayment")
  })

  it("interest rate error takes precedence over loan term error", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "-1",   // invalid
      loanTermYears: 0.5,     // would also be invalid
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.errorField, "interestRate")
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: currency string with commas parses correctly
// ---------------------------------------------------------------------------

describe("computeMortgage — currency string with commas parses correctly", () => {
  it("home price field with commas parses to correct numeric value", () => {
    const result = computeMortgage({
      homePriceRaw: "$500,000",
      dpRaw: "$100,000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.strictEqual(result.principal, 400000)
  })

  it("tax field with commas and dollar sign parses correctly", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "$6,000",
      insuranceRaw: "",
    })
    assert.strictEqual(result.monthlyTax, 500)
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: non-numeric string inputs
// ---------------------------------------------------------------------------

describe("computeMortgage — non-numeric string inputs do not crash", () => {
  it("non-numeric home price field does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "abc",
        dpRaw: "100000",
        dpMode: "amount",
        interestRateRaw: "7",
        loanTermYears: 30,
        taxRaw: "",
        insuranceRaw: "",
      })
    })
  })

  it("non-numeric down payment does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "500000",
        dpRaw: "xyz",
        dpMode: "amount",
        interestRateRaw: "7",
        loanTermYears: 30,
        taxRaw: "",
        insuranceRaw: "",
      })
    })
  })

  it("non-numeric interest rate does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "500000",
        dpRaw: "100000",
        dpMode: "amount",
        interestRateRaw: "nope",
        loanTermYears: 30,
        taxRaw: "",
        insuranceRaw: "",
      })
    })
  })
})

// ---------------------------------------------------------------------------
// computeMortgage: values are never NaN or negative in non-error state
// ---------------------------------------------------------------------------

describe("computeMortgage — no NaN or negative values in non-error state", () => {
  it("no NaN in any result field for a valid loan", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "6000",
      insuranceRaw: "1800",
    })
    assert.ok(!Number.isNaN(result.monthlyPI), "monthlyPI must not be NaN")
    assert.ok(!Number.isNaN(result.monthlyTax), "monthlyTax must not be NaN")
    assert.ok(!Number.isNaN(result.monthlyInsurance), "monthlyInsurance must not be NaN")
    assert.ok(!Number.isNaN(result.monthlyTotal), "monthlyTotal must not be NaN")
    assert.ok(!Number.isNaN(result.totalCost), "totalCost must not be NaN")
    assert.ok(!Number.isNaN(result.totalInterest), "totalInterest must not be NaN")
    assert.ok(!Number.isNaN(result.principal), "principal must not be NaN")
  })

  it("no negative monthlyPI for a standard loan", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.ok(result.monthlyPI >= 0, "monthlyPI must not be negative")
  })

  it("no negative totalCost", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.ok(result.totalCost >= 0, "totalCost must not be negative")
  })
})

// ---------------------------------------------------------------------------
// getDownPaymentDisplay
// ---------------------------------------------------------------------------

describe("getDownPaymentDisplay", () => {
  it("returns amount-mode display string", () => {
    const display = getDownPaymentDisplay(100000, "amount", 500000)
    assert.ok(display.includes("100000") || display.includes("100,000"))
  })

  it("returns percent-mode display string", () => {
    const display = getDownPaymentDisplay(100000, "percent", 500000)
    assert.ok(display.includes("20") || display.includes("20.0"))
  })

  it("handles zero home price without throwing", () => {
    assert.doesNotThrow(() => {
      getDownPaymentDisplay(100000, "percent", 0)
    })
  })

  // ── Down payment toggle conversion (RFC Scenario) ─────────────────────────

  it("amount mode: $100,000 on $500,000 converts to 20% in percent mode", () => {
    // When user toggles from Amount → Percent, the display shows the percentage
    const display = getDownPaymentDisplay(100000, "percent", 500000)
    assert.ok(display.includes("20"), `Expected "20" in display, got: ${display}`)
  })

  it("percent mode: 20% of $500,000 converts to $100,000 in amount mode", () => {
    // computeDownPaymentFromPercent gives the effective dollar amount
    const amount = computeDownPaymentFromPercent(500000, 20)
    const display = getDownPaymentDisplay(amount, "amount", 500000)
    assert.ok(
      display.includes("100000") || display.includes("100,000"),
      `Expected "$100,000" in display, got: ${display}`,
    )
  })

  it("home price change in percent mode recomputes effective down payment", () => {
    // 20% of $500,000 = $100,000; 20% of $400,000 = $80,000
    const dp500k = computeDownPaymentFromPercent(500000, 20)
    const dp400k = computeDownPaymentFromPercent(400000, 20)
    assert.strictEqual(dp500k, 100000, "20% of $500k must be $100k")
    assert.strictEqual(dp400k, 80000, "20% of $400k must be $80k")
    // The display percentage stays 20% (only dollar amount recomputes)
    const display500k = getDownPaymentDisplay(dp500k, "percent", 500000)
    const display400k = getDownPaymentDisplay(dp400k, "percent", 400000)
    assert.ok(display500k.includes("20"), `Expected 20% for $500k, got: ${display500k}`)
    assert.ok(display400k.includes("20"), `Expected 20% for $400k, got: ${display400k}`)
  })

  it("zero percent down payment yields full principal in both modes", () => {
    const dpAmount = computeDownPaymentFromPercent(500000, 0)
    assert.strictEqual(dpAmount, 0)
    const principal = computePrincipal(500000, dpAmount)
    assert.strictEqual(principal, 500000)
  })
})

// ---------------------------------------------------------------------------
// calculateMonthlyPI — zero interest rate and boundary cases
// ---------------------------------------------------------------------------

describe("calculateMonthlyPI — zero interest rate and boundary conditions", () => {
  it("returns a valid number (not NaN) when annual rate is 0%", () => {
    const result = calculateMonthlyPI(400000, 0, 30)
    assert.ok(!Number.isNaN(result), "Monthly PI must not be NaN at 0% rate")
    assert.ok(result > 0, "Monthly PI must be positive")
  })

  it("returns equal monthly payments (no interest) at 0% rate for 30-year loan", () => {
    // 400,000 / (30 * 12) = 400,000 / 360 = 1,111.11...
    const result = calculateMonthlyPI(400000, 0, 30)
    assert.strictEqual(result, Math.round((400000 / 360) * 100) / 100)
  })

  it("returns equal monthly payments at 0% rate for 15-year loan", () => {
    // 400,000 / (15 * 12) = 400,000 / 180 = 2,222.22...
    const result = calculateMonthlyPI(400000, 0, 15)
    assert.strictEqual(result, Math.round((400000 / 180) * 100) / 100)
  })

  it("returns valid number at RATE_MIN (0.1%)", () => {
    const result = calculateMonthlyPI(400000, RATE_MIN, 30)
    assert.ok(!Number.isNaN(result), "Monthly PI must not be NaN at minimum rate")
    assert.ok(result > 0, "Monthly PI must be positive at minimum rate")
    // At 0.1%, the monthly payment is slightly higher than at 0% due to interest
    assert.ok(result > 400000 / 360, "Monthly PI at 0.1% must exceed the 0% result (interest accrues)")
  })

  it("returns valid number at RATE_MAX (30%)", () => {
    const result = calculateMonthlyPI(400000, RATE_MAX, 30)
    assert.ok(!Number.isNaN(result), "Monthly PI must not be NaN at maximum rate")
    assert.ok(result > 0, "Monthly PI must be positive at maximum rate")
  })

  it("returns valid number at TERM_MIN (1 year)", () => {
    const result = calculateMonthlyPI(400000, 7, TERM_MIN)
    assert.ok(!Number.isNaN(result), "Monthly PI must not be NaN at minimum term")
    assert.ok(result > 0, "Monthly PI must be positive at minimum term")
  })

  it("returns valid number at TERM_MAX (40 years)", () => {
    const result = calculateMonthlyPI(400000, 7, TERM_MAX)
    assert.ok(!Number.isNaN(result), "Monthly PI must not be NaN at maximum term")
    assert.ok(result > 0, "Monthly PI must be positive at maximum term")
  })

  it("returns NaN when term is 0 (division guard)", () => {
    const result = calculateMonthlyPI(400000, 7, 0)
    assert.ok(Number.isNaN(result), "Monthly PI must be NaN when term is 0")
  })

  it("returns 0 when principal is 0 (100% down payment path)", () => {
    const result = calculateMonthlyPI(0, 7, 30)
    assert.strictEqual(result, 0, "Monthly PI must be 0 when there is no principal")
  })
})

// ---------------------------------------------------------------------------
// formatInteger
// ---------------------------------------------------------------------------

describe("formatInteger", () => {
  it("formats an integer with comma separators and no decimals", () => {
    assert.strictEqual(formatInteger(400000), "$400,000")
  })

  it("formats a large number with multiple commas", () => {
    assert.strictEqual(formatInteger(1234567), "$1,234,567")
  })

  it("formats zero as $0", () => {
    assert.strictEqual(formatInteger(0), "$0")
  })
})

// ---------------------------------------------------------------------------
// formatCurrency — exact rounding behavior
// ---------------------------------------------------------------------------

describe("formatCurrency — exact two-decimal-place rounding", () => {
  it("formats a number with exactly two decimal places", () => {
    assert.strictEqual(formatCurrency(1234.56), "$1,234.56")
  })

  it("rounds half-up to two decimal places", () => {
    // Math.round(123.455 * 100) / 100 = 123.46
    assert.strictEqual(formatCurrency(123.455), "$123.46")
  })

  it("does not show trailing zeros beyond two decimal places", () => {
    const result = formatCurrency(500)
    // Should be $500.00
    assert.ok(result.startsWith("$500"), `Expected $500.xx format, got: ${result}`)
  })
})

// ---------------------------------------------------------------------------
// Real-time recalculation — changing inputs without throwing
// ---------------------------------------------------------------------------

describe("computeMortgage — real-time recalculation (no submit button)", () => {
  it("changing the interest rate produces a different monthlyPI without throwing", () => {
    const base = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    const updated = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "6",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    assert.strictEqual(base.hasError, false)
    assert.strictEqual(updated.hasError, false)
    assert.notStrictEqual(base.monthlyPI, updated.monthlyPI, "Monthly PI must change when rate changes")
    assert.ok(updated.monthlyPI < base.monthlyPI, "Lower rate should produce lower monthly payment")
  })

  it("changing the home price produces a different totalCost without throwing", () => {
    const base = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    const updated = computeMortgage({
      homePriceRaw: "600000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    assert.strictEqual(base.hasError, false)
    assert.strictEqual(updated.hasError, false)
    assert.ok(updated.totalCost > base.totalCost, "Higher home price should produce higher total cost")
  })

  it("changing the loan term produces a different monthlyPI without throwing", () => {
    const thirtyYear = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    const fifteenYear = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 15,
      taxRaw: "",
      insuranceRaw: "",
    })

    assert.strictEqual(thirtyYear.hasError, false)
    assert.strictEqual(fifteenYear.hasError, false)
    assert.ok(
      fifteenYear.monthlyPI > thirtyYear.monthlyPI,
      "15-year loan should have a higher monthly PI than 30-year",
    )
  })

  it("changing down payment mode from percent to amount does not cause errors", () => {
    // In percent mode: 20% of $500,000 = $100,000
    const percentMode = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "20",
      dpMode: "percent",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    // In amount mode: $100,000
    const amountMode = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    assert.strictEqual(percentMode.hasError, false)
    assert.strictEqual(amountMode.hasError, false)
    assert.strictEqual(percentMode.monthlyPI, amountMode.monthlyPI,
      "Same effective down payment should produce the same monthly PI")
  })

  it("down payment 100% produces monthly PI of $0 and total interest of $0", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100",
      dpMode: "percent",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })

    assert.strictEqual(result.hasError, false)
    assert.strictEqual(result.monthlyPI, 0, "Monthly PI must be $0 when down payment is 100%")
    assert.strictEqual(result.totalInterest, 0, "Total interest must be $0 when there is no principal")
    assert.strictEqual(result.principal, 0, "Principal must be $0 when down payment equals home price")
  })
})

// ---------------------------------------------------------------------------
// Exclusion note behavior (tax and insurance both zero)
// ---------------------------------------------------------------------------

describe("computeMortgage — exclusion note (tax and insurance both empty)", () => {
  it("monthlyTotal equals monthlyPI when both tax and insurance are empty", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.monthlyTotal, result.monthlyPI,
      "monthlyTotal must equal monthlyPI when tax and insurance are empty")
  })

  it("monthlyTotal exceeds monthlyPI when tax is provided", () => {
    const withoutTax = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "6000",
      insuranceRaw: "",
    })
    assert.ok(
      withoutTax.monthlyTotal > withoutTax.monthlyPI,
      "monthlyTotal must exceed monthlyPI when tax is provided",
    )
  })

  it("monthlyTotal exceeds monthlyPI when insurance is provided", () => {
    const withoutInsurance = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "1800",
    })
    assert.ok(
      withoutInsurance.monthlyTotal > withoutInsurance.monthlyPI,
      "monthlyTotal must exceed monthlyPI when insurance is provided",
    )
  })

  it("totalCost is finite when all required inputs are valid", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "6000",
      insuranceRaw: "1800",
    })
    assert.ok(Number.isFinite(result.totalCost), "totalCost must be finite")
    assert.ok(Number.isFinite(result.totalInterest), "totalInterest must be finite")
    assert.ok(Number.isFinite(result.principal), "principal must be finite")
  })
})

// ---------------------------------------------------------------------------
// Currency parsing round-trip
// ---------------------------------------------------------------------------

describe("parseCurrency — round-trip with formatCurrency", () => {
  it("parseCurrency($500,000) then formatCurrency returns the same value", () => {
    const parsed = parseCurrency("$500,000")
    const formatted = formatCurrency(parsed)
    assert.strictEqual(formatted, "$500,000.00")
  })

  it("parseCurrency($6,000) for tax field yields monthly tax of $500", () => {
    const tax = parseCurrency("$6,000")
    const monthlyTax = tax / 12
    assert.strictEqual(monthlyTax, 500)
  })

  it("parseCurrency($1,800) for insurance field yields monthly insurance of $150", () => {
    const insurance = parseCurrency("$1,800")
    const monthlyInsurance = insurance / 12
    assert.strictEqual(monthlyInsurance, 150)
  })

  it("parseCurrency strips spaces before dollar sign", () => {
    const parsed = parseCurrency("$ 500, 000")
    assert.strictEqual(parsed, 500000)
  })

  it("parseCurrency handles mixed formatting from user input", () => {
    assert.strictEqual(parseCurrency("500000"), 500000)
    assert.strictEqual(parseCurrency("$500000"), 500000)
    assert.strictEqual(parseCurrency("$ 500,000"), 500000)
    assert.strictEqual(parseCurrency("  $  500,000  "), 500000)
  })
})

// ---------------------------------------------------------------------------
// Error precedence by form field order
// ---------------------------------------------------------------------------

describe("computeMortgage — error field precedence matches form order", () => {
  it("home price zero takes precedence over empty down payment", () => {
    // home price "0" triggers homePrice error (form field 1)
    const result = computeMortgage({
      homePriceRaw: "0",
      dpRaw: "",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, true)
    assert.strictEqual(result.errorField, "homePrice",
      "homePrice error must take precedence over other field errors")
  })

  it("down payment > home price takes precedence over rate error", () => {
    // dp $400k > home $300k → downPayment error (form field 2) before rate
    const result = computeMortgage({
      homePriceRaw: "300000",
      dpRaw: "400000",
      dpMode: "amount",
      interestRateRaw: "-5",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.errorField, "downPayment",
      "downPayment error must take precedence over interestRate error")
  })

  it("rate below minimum takes precedence over loan term error", () => {
    // rate 0.05 < RATE_MIN → interestRate error (form field 3) before loanTerm
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "0.05",
      loanTermYears: 0.5,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.errorField, "interestRate",
      "interestRate error must take precedence over loanTerm error")
  })

  it("loan term out of bounds is the last field to show error", () => {
    // All other fields valid → loan term error (form field 4) is shown
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 45,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.errorField, "loanTerm",
      "loanTerm error must be shown when all other fields are valid")
  })
})

// ---------------------------------------------------------------------------
// Non-numeric inputs — controlled input behavior (no crash)
// ---------------------------------------------------------------------------

describe("computeMortgage — controlled input: non-numeric strings do not crash", () => {
  it("non-numeric home price string does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "abc",
        dpRaw: "100000",
        dpMode: "amount",
        interestRateRaw: "7",
        loanTermYears: 30,
        taxRaw: "",
        insuranceRaw: "",
      })
    })
  })

  it("non-numeric down payment string does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "500000",
        dpRaw: "xyz",
        dpMode: "amount",
        interestRateRaw: "7",
        loanTermYears: 30,
        taxRaw: "",
        insuranceRaw: "",
      })
    })
  })

  it("non-numeric interest rate string does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "500000",
        dpRaw: "100000",
        dpMode: "amount",
        interestRateRaw: "nope",
        loanTermYears: 30,
        taxRaw: "",
        insuranceRaw: "",
      })
    })
  })

  it("non-numeric tax field does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "500000",
        dpRaw: "100000",
        dpMode: "amount",
        interestRateRaw: "7",
        loanTermYears: 30,
        taxRaw: "abc",
        insuranceRaw: "",
      })
    })
  })

  it("non-numeric insurance field does not throw", () => {
    assert.doesNotThrow(() => {
      computeMortgage({
        homePriceRaw: "500000",
        dpRaw: "100000",
        dpMode: "amount",
        interestRateRaw: "7",
        loanTermYears: 30,
        taxRaw: "",
        insuranceRaw: "xyz",
      })
    })
  })
})

// ---------------------------------------------------------------------------
// Long loan term: total interest can exceed principal
// ---------------------------------------------------------------------------

describe("computeMortgage — long loan term at high rate (interest > principal)", () => {
  it("40-year loan at 7% produces total interest greater than principal", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 40,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.ok(
      result.totalInterest > result.principal,
      `totalInterest ($${result.totalInterest}) must exceed principal ($${result.principal}) for 40yr/7% loan`,
    )
    assert.ok(
      result.totalInterest < result.totalCost,
      "totalInterest must be less than totalCost",
    )
  })

  it("30-year loan at 7% also produces meaningful total interest", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "",
      insuranceRaw: "",
    })
    assert.strictEqual(result.hasError, false)
    assert.ok(result.totalInterest > 0, "totalInterest must be positive for 30yr/7% loan")
  })

  it("all monetary values are finite and non-negative in valid non-error state", () => {
    const result = computeMortgage({
      homePriceRaw: "500000",
      dpRaw: "100000",
      dpMode: "amount",
      interestRateRaw: "7",
      loanTermYears: 30,
      taxRaw: "6000",
      insuranceRaw: "1800",
    })
    assert.strictEqual(result.hasError, false)
    assert.ok(!Number.isNaN(result.monthlyPI), "monthlyPI must not be NaN")
    assert.ok(!Number.isNaN(result.monthlyTotal), "monthlyTotal must not be NaN")
    assert.ok(!Number.isNaN(result.totalCost), "totalCost must not be NaN")
    assert.ok(!Number.isNaN(result.totalInterest), "totalInterest must not be NaN")
    assert.ok(!Number.isNaN(result.principal), "principal must not be NaN")
    assert.ok(result.monthlyPI >= 0, "monthlyPI must not be negative")
    assert.ok(result.totalCost >= 0, "totalCost must not be negative")
    assert.ok(result.totalInterest >= 0, "totalInterest must not be negative")
  })
})

