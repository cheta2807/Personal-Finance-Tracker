import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Plus,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Wallet,
  Search,
  ChevronRight,
  Download,
  Upload,
  LogOut,
  X,
  Pencil,
  Trash2,
  Menu,
  Leaf,
  House,
  Utensils,
  Car,
  ShoppingBag,
  Heart,
  Music,
  Briefcase,
  Ellipsis,
  ShieldCheck,
  RotateCcw,
  Check,
  LoaderCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  categories,
  colors,
  today,
  money,
  paise,
  validate,
  summary,
  monthsTo,
  demoData,
} from "./finance.js";
import { api, staticDemo } from "./api.js";
const demoKey = "mintbook-react-demo-v2";
const icons = {
  Housing: House,
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Health: Heart,
  Entertainment: Music,
  Salary: Briefcase,
  Other: Ellipsis,
};
const pages = [
  ["Overview", LayoutDashboard],
  ["Transactions", ArrowLeftRight],
  ["Budgets", Wallet],
  ["Insights", ChartNoAxesCombined],
];
function readDemo() {
  try {
    const stored = localStorage.getItem(demoKey);
    return stored ? validate(JSON.parse(stored)) : demoData();
  } catch {
    return demoData();
  }
}
function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} className="modal">
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function TransactionForm({ entry, onSave, onClose }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const v = Object.fromEntries(new FormData(e.currentTarget));
      await onSave({
        ...v,
        description: v.description.trim(),
        amount: paise(v.amount),
        id: entry?.id,
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={entry ? "Edit transaction" : "A new money moment"}
      onClose={onClose}
    >
      <p className="muted">A few details now. A clearer picture later.</p>
      <form onSubmit={submit}>
        <label>
          Description
          <input
            name="description"
            defaultValue={entry?.description}
            required
            maxLength={100}
            placeholder="e.g. Weekly groceries"
            autoFocus
          />
        </label>
        <div className="form-grid">
          <label>
            Type
            <select name="type" defaultValue={entry?.type || "expense"}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label>
            Amount · INR
            <input
              name="amount"
              inputMode="decimal"
              defaultValue={entry ? (entry.amount / 100).toFixed(2) : ""}
              placeholder="0.00"
              required
            />
          </label>
          <label>
            Category
            <select name="category" defaultValue={entry?.category || "Food"}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              name="date"
              defaultValue={entry?.date || today()}
              required
              min="0001-01-01"
              max="9999-12-31"
            />
          </label>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy ? "Saving…" : "Save transaction"}
          <Check size={16} />
        </button>
      </form>
    </Modal>
  );
}
function AuthForm({ onAuth, onClose }) {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onAuth(
        register ? "register" : "login",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        register ? "Your next chapter starts here" : "Welcome back to Mintbook"
      }
      onClose={onClose}
    >
      {staticDemo ? (
        <div className="demo-explainer">
          <ShieldCheck size={36} />
          <h3>You’re exploring the public demo</h3>
          <p>
            This GitHub Pages showcase runs in your browser. Account sign-in is
            available when the Django and MySQL version is deployed.
          </p>
          <button className="button primary full" onClick={onClose}>
            Continue exploring
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <p className="muted">Your own space for a healthier money routine.</p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Your name
                <input
                  name="name"
                  required
                  maxLength={60}
                  autoComplete="given-name"
                />
              </label>
            )}
            <label>
              Username
              <input
                name="username"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={register ? 10 : 1}
                maxLength={128}
                autoComplete={register ? "new-password" : "current-password"}
              />
            </label>
            {register && (
              <p className="field-note">
                Use at least 10 characters. Avoid common passwords.
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button disabled={busy} className="button primary full">
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>
          <button
            className="auth-switch"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </>
      )}
    </Modal>
  );
}
export default function App() {
  const [data, setData] = useState(readDemo),
    [user, setUser] = useState(null),
    [ready, setReady] = useState(staticDemo),
    [page, setPage] = useState("Overview"),
    [month, setMonth] = useState(today().slice(0, 7)),
    [search, setSearch] = useState(""),
    [type, setType] = useState(""),
    [category, setCategory] = useState(""),
    [editor, setEditor] = useState(null),
    [auth, setAuth] = useState(false),
    [budgetModal, setBudgetModal] = useState(false),
    [message, setMessage] = useState(""),
    [menu, setMenu] = useState(false),
    [busy, setBusy] = useState(false),
    [limitRows, setLimitRows] = useState(15);
  const fileRef = useRef();
  useEffect(() => {
    if (staticDemo) return;
    let active = true;
    (async () => {
      try {
        const s = await api("session");
        if (s.user) {
          const next = await api("data");
          if (active) {
            setData(validate(next));
            setUser(s.user);
          }
        }
      } catch (e) {
        if (active) setMessage(e.message);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setLimitRows(15);
  }, [month, search, type, category, page]);
  function localSave(next) {
    validate(next);
    try {
      localStorage.setItem(demoKey, JSON.stringify(next));
    } catch {
      throw Error(
        "Browser storage is unavailable or full. Export your data and free some space.",
      );
    }
    setData(next);
  }
  async function refresh() {
    setData(validate(await api("data")));
  }
  async function saveEntry(entry) {
    if (user) {
      await api(
        entry.id ? "transactions/" + entry.id : "transactions",
        entry.id ? "PUT" : "POST",
        entry,
      );
      await refresh();
    } else {
      const next = { ...entry, id: entry.id || crypto.randomUUID() };
      localSave({
        ...data,
        transactions: entry.id
          ? data.transactions.map((t) => (t.id === entry.id ? next : t))
          : [...data.transactions, next],
      });
    }
    setMonth(entry.date.slice(0, 7));
    setMessage("Transaction saved. A little more clarity.");
  }
  async function deleteEntry(entry) {
    if (!confirm(`Delete “${entry.description}”?`)) return;
    setBusy(true);
    try {
      if (user) {
        await api("transactions/" + entry.id, "DELETE");
        await refresh();
      } else
        localSave({
          ...data,
          transactions: data.transactions.filter((t) => t.id !== entry.id),
        });
      setMessage("Transaction deleted.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function authenticate(path, values) {
    await api("session");
    const result = await api(path, "POST", values);
    const next = await api("data");
    setData(validate(next));
    setUser(result.user);
    setSearch("");
    setType("");
    setCategory("");
    setMessage("You’re signed in. Your records are saved to your account.");
  }
  async function signOut() {
    setBusy(true);
    try {
      await api("logout", "POST", {});
      setUser(null);
      setData(readDemo());
      setMessage("Signed out. You’re now viewing sample demo data.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `mintbook-${user ? "backup" : "demo"}-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Backup downloaded. Keep it somewhere private.");
  }
  async function importBackup(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 5000000) throw Error("Use a backup smaller than 5 MB.");
      const next = validate(JSON.parse(await file.text()));
      if (
        !confirm(
          "Replace all current transactions and budgets with this backup?",
        )
      )
        return;
      if (user) {
        setData(validate(await api("import", "POST", next)));
      } else localSave(next);
      setMessage("Backup imported successfully.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const totals = summary(data.transactions, month),
    previous = summary(data.transactions, monthsTo(month, 2)[0]);
  const monthly = data.transactions.filter((t) => t.date.startsWith(month));
  const filtered = monthly
    .filter(
      (t) =>
        t.description.toLowerCase().includes(search.toLowerCase()) &&
        (!type || t.type === type) &&
        (!category || t.category === category),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const budget = data.budgets[month] || 0,
    percent = budget ? Math.round((totals.expense / budget) * 100) : 0;
  const spending = categories
    .map((name) => ({
      name,
      value: monthly
        .filter((t) => t.type === "expense" && t.category === name)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.value)
    .sort((a, b) => b.value - a.value);
  const trend = monthsTo(month).map((m) => {
    const s = summary(data.transactions, m);
    return {
      name: new Date(m + "-02").toLocaleDateString("en-US", { month: "short" }),
      Income: s.income / 100,
      Expenses: s.expense / 100,
    };
  });
  const monthName = new Date(month + "-02").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const savingsRate = totals.income
    ? Math.round((totals.balance / totals.income) * 100)
    : 0;
  const chart = (
    <section className="panel cashflow">
      <div className="panel-heading">
        <div>
          <h2>Money in. Money out.</h2>
          <p>Your cash flow over the last six months</p>
        </div>
        <div className="legend">
          <span>
            <i style={{ background: "#345e49" }} />
            Income
          </span>
          <span>
            <i style={{ background: "#b9cf8b" }} />
            Expenses
          </span>
        </div>
      </div>
      <div
        className="area-chart"
        role="img"
        aria-label="Six-month income and expense chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend}
            margin={{ top: 15, right: 12, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#608966" stopOpacity={0.17} />
                <stop offset="100%" stopColor="#608966" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 5"
              vertical={false}
              stroke="#edf0e8"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#91988b", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#91988b", fontSize: 10 }}
              tickFormatter={(v) =>
                new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(v)
              }
            />
            <Tooltip
              formatter={(v) => money(Math.round(Number(v) * 100))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e6eadd",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="Income"
              stroke="#345e49"
              fill="url(#incomeFill)"
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="Expenses"
              stroke="#a9c17f"
              fill="transparent"
              strokeWidth={2.5}
              strokeDasharray="5 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
  const breakdown = (
    <section className="panel breakdown">
      <div className="panel-heading">
        <div>
          <h2>Where it all goes</h2>
          <p>Spending by category</p>
        </div>
        <span className="tiny-pill">THIS MONTH</span>
      </div>
      {spending.length ? (
        <>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spending}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={86}
                  paddingAngle={4}
                  stroke="none"
                >
                  {spending.map((c) => (
                    <Cell key={c.name} fill={colors[c.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label">
              <small>Total spent</small>
              <strong>{money(totals.expense)}</strong>
            </div>
          </div>
          <div className="category-legend">
            {spending.map((c) => (
              <div key={c.name}>
                <span>
                  <i style={{ background: colors[c.name] }} />
                  {c.name}
                </span>
                <b>{Math.round((c.value / totals.expense) * 100)}%</b>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-chart">
          <ChartNoAxesCombined />
          <p>Your first expense will start the story.</p>
        </div>
      )}
    </section>
  );
  const budgetCard = (
    <section className="budget-card">
      <div className="panel-heading">
        <span className="eyebrow">A PLAN FOR YOUR MONTH</span>
        <Wallet size={19} />
      </div>
      <h2>
        A little structure.
        <br />A little more freedom.
      </h2>
      <div className="budget-numbers">
        <strong>{money(totals.expense)}</strong>
        <span>of {budget ? money(budget) : "no budget set"}</span>
      </div>
      <progress
        value={Math.min(percent, 100)}
        max={100}
        aria-label="Monthly budget usage"
      />
      <div className="budget-caption">
        <span>
          {budget
            ? totals.expense > budget
              ? `${money(totals.expense - budget)} over budget`
              : `${money(budget - totals.expense)} left to spend`
            : "Set your spending intention"}
        </span>
        <b>{budget ? percent + "%" : "—"}</b>
      </div>
      <button
        className="button budget-button"
        onClick={() => setBudgetModal(true)}
      >
        {budget ? "Adjust monthly budget" : "Set monthly budget"}
        <ArrowUpRight size={16} />
      </button>
    </section>
  );
  const transactionTable = (
    <section className="panel transactions">
      <div className="panel-heading">
        <div>
          <h2>
            {page === "Overview" ? "Recent transactions" : "Your transactions"}
          </h2>
          <p>Little moments. The bigger picture.</p>
        </div>
        {page === "Overview" ? (
          <button
            className="text-button"
            onClick={() => setPage("Transactions")}
          >
            View all
            <ArrowRight size={15} />
          </button>
        ) : (
          <span className="tiny-pill">{filtered.length} RECORDS</span>
        )}
      </div>
      {page === "Transactions" && (
        <div className="filters">
          <label className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a transaction…"
              aria-label="Search transactions"
            />
          </label>
          <select
            aria-label="Transaction type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
          <select
            aria-label="Category filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>TRANSACTION</th>
              <th>CATEGORY</th>
              <th>DATE</th>
              <th>AMOUNT</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(page === "Overview"
              ? monthly
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 5)
              : filtered.slice(0, limitRows)
            ).map((t) => {
              const Icon = icons[t.category];
              return (
                <tr key={t.id}>
                  <td>
                    <div className="transaction-name">
                      <span
                        className="category-icon"
                        style={{
                          background: colors[t.category] + "20",
                          color: colors[t.category],
                        }}
                      >
                        <Icon size={17} />
                      </span>
                      <div>
                        {t.description}
                        <small>
                          {t.type === "income" ? "Money in" : "Money out"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-tag">{t.category}</span>
                  </td>
                  <td className="date-cell">
                    {new Date(t.date + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </td>
                  <td
                    className={
                      t.type === "income" ? "amount positive" : "amount"
                    }
                  >
                    {t.type === "income" ? "+" : "−"}
                    {money(t.amount)}
                  </td>
                  <td className="actions">
                    <button
                      aria-label={"Edit " + t.description}
                      onClick={() => setEditor(t)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      disabled={busy}
                      aria-label={"Delete " + t.description}
                      onClick={() => deleteEntry(t)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(page === "Overview" ? !monthly.length : !filtered.length) && (
        <div className="empty-chart">
          <ArrowLeftRight />
          <h3>No transactions here yet</h3>
          <p>Add a transaction or adjust your filters.</p>
          <button className="button secondary" onClick={() => setEditor({})}>
            Add transaction
            <Plus size={15} />
          </button>
        </div>
      )}
      {page === "Transactions" && filtered.length > limitRows && (
        <button
          className="load-more"
          onClick={() => setLimitRows((n) => n + 15)}
        >
          Show more transactions
        </button>
      )}
    </section>
  );
  return (
    <div className="app-shell">
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Overview");
          }}
        >
          <span className="brand-mark">
            <Leaf size={22} />
          </span>
          mintbook<span className="brand-dot">.</span>
        </a>
        <p className="nav-label">YOUR WORKSPACE</p>
        <nav>
          {pages.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "nav-item active" : "nav-item"}
              onClick={() => {
                setPage(name);
                setMenu(false);
              }}
            >
              <Icon size={18} />
              {name}
              {page === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-art">
            <Leaf size={35} />
            <span>✦</span>
          </div>
          <span className="eyebrow">GROW AT YOUR OWN PACE</span>
          <h3>
            Good habits.
            <br />
            Brighter tomorrows.
          </h3>
          <p>
            Every small step counts.
            <br />
            You’re in the right place.
          </p>
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={16} />
          <span>{user ? "Your personal account" : "A space to explore"}</span>
        </div>
        <button
          className="profile"
          onClick={() => (user ? signOut() : setAuth(true))}
          disabled={busy || !ready}
        >
          <span className="avatar">
            {user ? user.name[0].toUpperCase() : "D"}
          </span>
          <span>
            <b>{user ? user.name : "Demo workspace"}</b>
            <small>{user ? "Sign out" : "Sample data · Try it out"}</small>
          </span>
          {user ? <LogOut size={16} /> : <ChevronRight size={17} />}
        </button>
      </aside>
      {menu && (
        <button
          className="menu-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <main>
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{page}</b>
          </div>
          <div>
            <span className="status-dot" />
            <span className="status-text">
              {user ? "Connected to your account" : "You’re exploring the demo"}
            </span>
            {!user && (
              <button
                className="signin"
                onClick={() => setAuth(true)}
                disabled={!ready}
              >
                Sign in
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </header>
        <div className="content" inert={!ready}>
          <section className="welcome">
            <div>
              <p className="eyebrow">A FRESH PERSPECTIVE ON YOUR FINANCES</p>
              <h1>
                {page === "Overview" ? (
                  <>
                    Your money. <em>A little clearer.</em>
                  </>
                ) : page === "Transactions" ? (
                  <>
                    Every detail. <em>In one place.</em>
                  </>
                ) : page === "Budgets" ? (
                  <>
                    Spend with purpose. <em>Live a little.</em>
                  </>
                ) : (
                  <>
                    Find the patterns. <em>Make progress.</em>
                  </>
                )}
              </h1>
              <p>
                {user ? `Welcome back, ${user.name}. ` : ""}
                {page === "Overview"
                  ? "Small steps today, more possibilities tomorrow. Let’s make it count."
                  : page === "Transactions"
                    ? "Keep track of the everyday moments that add up."
                    : page === "Budgets"
                      ? "Make a plan that leaves room for the things you love."
                      : "A closer look at the habits shaping your financial life."}
              </p>
            </div>
            <button
              className="button primary"
              disabled={!ready || busy}
              onClick={() => setEditor({})}
            >
              <Plus size={17} />
              Add transaction
            </button>
          </section>
          {!ready && (
            <p className="notice">
              <LoaderCircle size={16} />
              Connecting to your account…
            </p>
          )}
          {message && (
            <div className="notice" role="status">
              <span>{message}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="section-bar">
            <h2>
              {page === "Overview"
                ? "Your monthly snapshot"
                : page === "Transactions"
                  ? "Transaction history"
                  : page === "Budgets"
                    ? "Your monthly spending plan"
                    : "The bigger picture"}
              <span className="section-line" />
            </h2>
            <label className="month-picker">
              <span className="sr-only">Select month</span>
              <input
                type="month"
                value={month}
                min="0001-01"
                max="9999-12"
                onChange={(e) => {
                  if (e.target.value) setMonth(e.target.value);
                }}
              />
            </label>
          </div>
          {(page === "Overview" || page === "Insights") && (
            <section className="stats">
              <article className="stat stat-dark">
                <div>
                  <span>Net balance</span>
                  <span className="stat-icon">
                    <Wallet size={19} />
                  </span>
                </div>
                <h2>{money(totals.balance)}</h2>
                <p>
                  <span className="stat-mini">
                    {totals.balance >= 0 ? "↗" : "↘"}
                  </span>
                  Income minus expenses this month
                </p>
                <div className="stat-decoration" />
              </article>
              <article className="stat">
                <div>
                  <span>Total income</span>
                  <span className="stat-icon green">
                    <ArrowDownLeft size={20} />
                  </span>
                </div>
                <h2>{money(totals.income)}</h2>
                <p>
                  <span className="comparison">
                    {previous.income
                      ? `${totals.income >= previous.income ? "+" : ""}${Math.round(((totals.income - previous.income) / previous.income) * 100)}%`
                      : "—"}
                  </span>
                  vs. previous month
                </p>
              </article>
              <article className="stat">
                <div>
                  <span>Total expenses</span>
                  <span className="stat-icon peach">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <h2>{money(totals.expense)}</h2>
                <p>
                  <span className="expense-dot" /> Across {spending.length}{" "}
                  spending categories
                </p>
              </article>
              <article className="stat">
                <div>
                  <span>Savings rate</span>
                  <span className="stat-icon lavender">
                    <Leaf size={20} />
                  </span>
                </div>
                <h2>{totals.income ? savingsRate + "%" : "—"}</h2>
                <p>
                  {totals.income
                    ? `${money(totals.balance)} of income remaining`
                    : "Add income to see your savings rate"}
                </p>
              </article>
            </section>
          )}
          {page === "Overview" && (
            <>
              <div className="chart-grid">
                {chart}
                {breakdown}
              </div>
              <div className="bottom-grid">
                {transactionTable}
                <div className="right-column">
                  {budgetCard}
                  <div className="little-note">
                    <span>✦</span>
                    <p>
                      Financial wellness is a journey.
                      <br />
                      <b>You don’t have to have it all figured out.</b>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          {page === "Transactions" && transactionTable}
          {page === "Budgets" && (
            <div className="budget-page">
              <div>{budgetCard}</div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Your plan for {monthName}</h2>
                    <p>Compare your spending with your monthly intention.</p>
                  </div>
                </div>
                <div className="budget-detail">
                  <span>
                    Monthly limit
                    <strong>{budget ? money(budget) : "Not set"}</strong>
                  </span>
                  <span>
                    Spent so far<strong>{money(totals.expense)}</strong>
                  </span>
                  <span>
                    Remaining
                    <strong>
                      {budget ? money(budget - totals.expense) : "—"}
                    </strong>
                  </span>
                </div>
                <h3>Previous budgets</h3>
                <div className="budget-history">
                  {Object.entries(data.budgets)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 12)
                    .map(([m, n]) => (
                      <button key={m} onClick={() => setMonth(m)}>
                        <span>{m}</span>
                        <strong>{money(n)}</strong>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  {!Object.keys(data.budgets).length && (
                    <p className="muted">
                      Set your first monthly budget to get started.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}
          {page === "Insights" && (
            <>
              <div className="chart-grid">
                {chart}
                {breakdown}
              </div>
              <section className="panel insight-summary">
                <Leaf size={30} />
                <div>
                  <h2>
                    {totals.balance >= 0
                      ? "Make space for your next goal"
                      : "A moment to recalibrate"}
                  </h2>
                  <p>
                    {totals.income
                      ? `You have ${money(totals.balance)} remaining from this month’s income. ${spending[0] ? spending[0].name + " is your largest spending category." : ""}`
                      : "Add your income and expenses to discover your financial patterns."}
                  </p>
                </div>
              </section>
            </>
          )}
          <footer>
            <span>
              <Leaf size={13} />A little clarity goes a long way.
              <span className="footer-currency">All amounts in INR.</span>
            </span>
            <div>
              {!user && (
                <button
                  disabled={busy || !ready}
                  onClick={() => {
                    if (confirm("Reset the demo to fresh sample data?")) {
                      try {
                        localSave(demoData());
                        setMonth(today().slice(0, 7));
                        setMessage("Demo reset. Ready for a fresh look.");
                      } catch (e) {
                        setMessage(e.message);
                      }
                    }
                  }}
                >
                  <RotateCcw size={13} />
                  Reset demo
                </button>
              )}
              <button disabled={!ready || busy} onClick={exportBackup}>
                <Download size={13} />
                Export
              </button>
              <button
                disabled={!ready || busy}
                onClick={() => fileRef.current.click()}
              >
                <Upload size={13} />
                Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={importBackup}
              />
            </div>
          </footer>
        </div>
      </main>
      {editor && (
        <TransactionForm
          entry={editor.id ? editor : null}
          onClose={() => setEditor(null)}
          onSave={saveEntry}
        />
      )}
      {auth && (
        <AuthForm onClose={() => setAuth(false)} onAuth={authenticate} />
      )}
      {budgetModal && (
        <BudgetForm
          current={budget}
          month={monthName}
          onClose={() => setBudgetModal(false)}
          onSave={async (n) => {
            if (user) {
              await api("budget", "PUT", { month, amount: n });
              await refresh();
            } else
              localSave({ ...data, budgets: { ...data.budgets, [month]: n } });
            setMessage("Your monthly budget is saved.");
          }}
        />
      )}
    </div>
  );
}
function BudgetForm({ current, month, onSave, onClose }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Give your month a little direction" onClose={onClose}>
      <p className="muted">Set a total spending budget for {month}.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave(paise(new FormData(e.currentTarget).get("amount")));
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Monthly budget · INR
          <input
            name="amount"
            inputMode="decimal"
            defaultValue={current ? (current / 100).toFixed(2) : ""}
            required
            placeholder="e.g. 3000.00"
            autoFocus
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy ? "Saving…" : "Save budget"}
          <Check size={16} />
        </button>
      </form>
    </Modal>
  );
}
