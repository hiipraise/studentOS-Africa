import { describe, expect, it } from "vitest";
import { escapeRegExp } from "../src/lib/escape";
import { parseBool, parsePage, parsePageSize, parseSearchText } from "../src/lib/safe-query";

describe("safe query parsing", () => {
it("uses safe defaults and caps extreme pagination input", () => {
  expect(parsePage("abc")).toBe(1);
  expect(parsePage("-2")).toBe(1);
  expect(parsePage("999999999999999999999")).toBe(1);
  expect(parsePageSize("100000")).toBe(50);
});

it("bounds search input and escapes regex text", () => {
  expect(parseSearchText("  hello\n  world  ")).toBe("hello world");
  expect(escapeRegExp("(a+)+$")).toBe("\\(a\\+\\)\\+\\$");
  const expression = new RegExp(escapeRegExp("(a+)+$"));
  expect(expression.test("(a+)+$")).toBe(true);
  expect(expression.test("aaaaaaaaaaaaaaaaaaaaaaaa!")).toBe(false);
  expect(parseSearchText("😀学生")).toBe("😀学生");
  expect(parseSearchText("x".repeat(150))).toHaveLength(100);
});

it("rejects unknown boolean filters", () => {
  expect(parseBool("true")).toBe(true);
  expect(parseBool("false")).toBe(false);
  expect(parseBool("1")).toBeUndefined();
});
});
