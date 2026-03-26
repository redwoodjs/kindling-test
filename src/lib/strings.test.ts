import { describe, it } from "node:test"
import assert from "node:assert"
import { capitalize } from "./strings.ts"

describe("capitalize", () => {
  it("returns an empty string when given an empty string", () => {
    assert.strictEqual(capitalize(""), "")
  })

  it("uppercases a single lowercase letter", () => {
    assert.strictEqual(capitalize("a"), "A")
  })

  it("returns a single uppercase letter unchanged", () => {
    assert.strictEqual(capitalize("A"), "A")
  })

  it("returns a single digit unchanged", () => {
    assert.strictEqual(capitalize("1"), "1")
  })

  it("returns a single symbol unchanged", () => {
    assert.strictEqual(capitalize("!"), "!")
  })

  it("uppercases the first letter of an all-lowercase word", () => {
    assert.strictEqual(capitalize("hello"), "Hello")
  })

  it("leaves the remaining letters unchanged when capitalizing", () => {
    assert.strictEqual(capitalize("hello"), "Hello")
    assert.strictEqual(capitalize("hELLO"), "HELLO")
  })

  it("returns an already-capitalized word unchanged", () => {
    assert.strictEqual(capitalize("Hello"), "Hello")
  })

  it("uppercases only the first letter of a lowercase-first mixed-case word", () => {
    assert.strictEqual(capitalize("hELLo"), "HELLo")
  })

  it("returns a string starting with a digit unchanged", () => {
    assert.strictEqual(capitalize("42abc"), "42abc")
  })

  it("returns a string starting with a symbol unchanged", () => {
    assert.strictEqual(capitalize("!hello"), "!hello")
  })

  it("returns a whitespace-only string unchanged", () => {
    assert.strictEqual(capitalize("   "), "   ")
  })

  it("returns a string starting with a space unchanged", () => {
    assert.strictEqual(capitalize(" hello"), " hello")
  })

  it("affects only the first character of a multi-word phrase", () => {
    assert.strictEqual(capitalize("hello world"), "Hello world")
  })

  it("does not capitalize words beyond the first", () => {
    assert.strictEqual(capitalize("foo bar baz"), "Foo bar baz")
  })

  it("uppercases a leading lowercase Unicode accented letter", () => {
    assert.strictEqual(capitalize("über"), "Über")
  })

  it("returns a string starting with an uppercase Unicode letter unchanged", () => {
    assert.strictEqual(capitalize("Über"), "Über")
  })

  it("returns an all-uppercase word unchanged", () => {
    assert.strictEqual(capitalize("HELLO"), "HELLO")
  })
})
