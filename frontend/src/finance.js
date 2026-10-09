export const categories = [
  "Housing",
  "Food",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Salary",
  "Other",
];
export const colors = {
  Housing: "#294e42",
  Food: "#a3bd75",
  Transport: "#e3b774",
  Shopping: "#a794c4",
  Health: "#7cafa2",
  Entertainment: "#dd9180",
  Salary: "#6a9a6b",
  Other: "#bcc7bc",
};
export const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n / 100);
export function paise(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value)))
    throw Error("Use a positive amount with up to two decimal places.");
  const n = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(n) || n <= 0 || n > 100000000000)
    throw Error("Amount must be between ₹0.01 and ₹1,00,00,00,000.");
  return n;
}
export function validate(data) {
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.transactions) ||
    data.transactions.length > 10000 ||
    !data.budgets ||
    typeof data.budgets !== "object" ||
    Array.isArray(data.budgets) ||
    Object.keys(data.budgets).length > 1200
  )
    throw Error("Invalid backup format.");
  const ids = new Set();
  for (const t of data.transactions) {
    if (
      !t ||
      typeof t.id !== "string" ||
      !t.id ||
      ids.has(t.id) ||
      typeof t.description !== "string" ||
      !t.description.trim() ||
      t.description.length > 100 ||
      !["income", "expense"].includes(t.type) ||
      !categories.includes(t.category) ||
      !Number.isSafeInteger(t.amount) ||
      t.amount <= 0 ||
      t.amount > 100000000000 ||
      typeof t.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(t.date) ||
      t.date.startsWith("0000") ||
      !Number.isFinite(Date.parse(t.date)) ||
      new Date(t.date).toISOString().slice(0, 10) !== t.date
    )
      throw Error("Invalid transaction in backup.");
    ids.add(t.id);
  }
  for (const [m, n] of Object.entries(data.budgets))
    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(m) ||
      m.startsWith("0000") ||
      !Number.isSafeInteger(n) ||
      n <= 0 ||
      n > 100000000000
    )
      throw Error("Invalid budget in backup.");
  return data;
}
export function summary(records, month) {
  let income = 0,
    expense = 0;
  for (const t of records.filter((t) => t.date.startsWith(month))) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}
export function monthsTo(month, count = 6) {
  const [year, m] = month.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(year, m - count + i, 1);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0")].join(
      "-",
    );
  });
}
export function demoData() {
  const transactions = [];
  const month = today().slice(0, 7);
  const months = monthsTo(month);
  for (const [i, m] of months.entries()) {
    const entries = [
      [
        "Monthly salary",
        "Salary",
        "income",
        [390000, 430000, 420000, 480000, 470000, 520000][i],
        1,
      ],
      ["Freelance design", "Other", "income", 65000 + i * 2500, 3],
      ["Apartment rent", "Housing", "expense", 145000, 2],
      ["Whole Foods Market", "Food", "expense", 8450 + i * 100, 4],
      ["Coffee & catch-up", "Food", "expense", 1850, 5],
      ["City transit pass", "Transport", "expense", 7200, 6],
      ["A little wardrobe refresh", "Shopping", "expense", 12900, 7],
      ["Spotify Premium", "Entertainment", "expense", 1199, 8],
      ["Weekend dinner", "Food", "expense", 6450, 9],
      ["Gym membership", "Health", "expense", 4500, 10],
      ["Monthly groceries", "Food", "expense", 23100 + i * 1500, 11],
    ];
    for (const [
      j,
      [description, category, type, amount, day],
    ] of entries.entries())
      transactions.push({
        id: `demo-${i}-${j}`,
        description,
        category,
        type,
        amount,
        date: `${m}-${String(day).padStart(2, "0")}`,
      });
  }
  return {
    version: 1,
    transactions,
    budgets: Object.fromEntries(months.map((m) => [m, 300000])),
  };
}
