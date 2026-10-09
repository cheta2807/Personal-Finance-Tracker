import test from "node:test";
import assert from "node:assert/strict";
import { paise, validate, summary, demoData, monthsTo } from "./finance.js";
test("money stays in integer paise and rejects invalid input", () => {
  assert.equal(paise("0.29"), 29);
  assert.equal(paise("1234.56"), 123456);
  for (const n of ["0", "-1", "1.001", "NaN", "1e5", "1000000001"])
    assert.throws(() => paise(n));
});
test("month windows cross year boundaries", () => {
  assert.deepEqual(monthsTo("2026-02", 3), ["2025-12", "2026-01", "2026-02"]);
});
test("summary isolates selected month and transaction types", () => {
  assert.deepEqual(
    summary(
      [
        { date: "2026-01-01", type: "income", amount: 20000 },
        { date: "2026-01-02", type: "expense", amount: 3201 },
        { date: "2025-12-31", type: "expense", amount: 999 },
      ],
      "2026-01",
    ),
    { income: 20000, expense: 3201, balance: 16799 },
  );
});
test("demo backups round trip and reject corrupt records", () => {
  const d = demoData();
  assert.deepEqual(validate(JSON.parse(JSON.stringify(d))), d);
  for (const patch of [
    { date: "2026-02-30" },
    { date: "0000-01-01" },
    { amount: 0 },
    { amount: 1.1 },
    { type: "invalid" },
    { description: " " },
  ]) {
    const bad = structuredClone(d);
    Object.assign(bad.transactions[0], patch);
    assert.throws(() => validate(bad));
  }
  const duplicate = structuredClone(d);
  duplicate.transactions.push(duplicate.transactions[0]);
  assert.throws(() => validate(duplicate));
  assert.throws(() => validate({ ...d, budgets: { "2026-13": 123 } }));
});
