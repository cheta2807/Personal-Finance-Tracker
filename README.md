# Mintbook · Personal Finance Tracker

A personal finance dashboard built with **React 19, Django 5.2, and MySQL 8.4**. Designed for desktop and mobile, with account isolation, budgets, interactive charts, and a recruiter-friendly demo.

## Live showcase

[Open Mintbook](https://cheta2807.github.io/Personal-Finance-Tracker/)

The GitHub Pages edition is a **React demo with sample data saved in your browser**. The full account version uses Django and MySQL and needs backend hosting. The demo is explicitly labeled inside the app. Never describe the Pages demo as connected to MySQL.

## Features

- Dashboard with monthly balance, income, expenses, and savings rate
- Six-month cash flow chart and category spending breakdown
- Add, edit, delete, search, and filter transactions
- Monthly budgets and remaining-spend progress
- Registration, login, logout, hashed passwords, and session authentication
- MySQL persistence with records scoped to each account
- JSON backup export and validated, atomic import
- Import compatible backups from the original Mintbook tracker
- Responsive navigation, keyboard-accessible dialogs, empty/error/loading states
- Demo workspace with realistic sample records and a reset button

All amounts use Indian rupees (INR), displayed with ₹ and Indian digit grouping (for example, ₹1,23,456.78). Values are stored as integer paise. Existing saved amounts and backups keep their numeric values; no exchange-rate conversion is applied. Browser demo records are separate from signed-in account records. Authentication does not automatically import demo records.

## Architecture

```text
Browser → React → Django JSON API → MySQL
                  session + CSRF    per-user records
```

React uses Vite, Recharts, and Lucide icons. Django serves the production React build and API from the same origin. WhiteNoise serves assets; Gunicorn runs Django. No CORS or tokens in localStorage are needed.

## Fastest local start: Docker

Install Docker with Compose, then run from the repository root:

```sh
cp .env.example .env
```

Fill in the three empty secrets in `.env`. Generate a different value for each using:

```sh
python -c "import secrets; print(secrets.token_hex(32))"
```

Then start:

```sh
docker compose up --build
```

Open **http://localhost:8000**. Choose **Sign in → Create an account** for real MySQL-backed records, or explore the sample demo. `DJANGO_DEBUG=true` enables local HTTP cookies; production must use HTTPS and `false`.

To stop: `docker compose down`. MySQL data stays in the named volume. Removing that volume deletes the database.

## Development without Docker for the app

Requirements: Python 3.12, Node.js 24, MySQL 8.4, MySQL client development libraries and a C compiler for mysqlclient.

1. Create a MySQL database named `mintbook` and a dedicated user with privileges on that database. Tests also need privileges on `test_mintbook`.
2. Set environment variables from `.env.example`, plus `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD`. Django does **not** automatically load `.env` outside Docker Compose; export these variables into your shell.
3. From the repository root:

```sh
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.lock
python backend/manage.py migrate
python backend/manage.py runserver 0.0.0.0:8000
```

In another terminal:

```sh
npm ci --prefix frontend
npm run dev --prefix frontend
```

Open http://localhost:5173. Vite proxies `/api` to Django on port 8000. Include this origin in `DJANGO_CSRF_TRUSTED_ORIGINS`.

## Tests

With MySQL running and environment variables set:

```sh
python backend/manage.py test ledger --noinput
npm test --prefix frontend
npm run build --prefix frontend
```

Backend tests cover authentication, CSRF, cross-user access, financial validation, budget upserts, password hashing, login throttling, and atomic backup import. Frontend tests cover integer money, summaries, year boundaries, and backup validation. GitHub Actions runs these checks against MySQL.

## Publish for recruiters

See [DEPLOYMENT.md](DEPLOYMENT.md) for two paths:

1. **GitHub Pages demo**: deploy the included root `index.html` and `assets/`. Works on your existing Pages URL without a server. Account login is disabled and the app clearly explains why.
2. **Full React + Django + MySQL app**: deploy the Docker image and a persistent MySQL database behind HTTPS. Registration and cross-device account storage work here.

## Project structure

```text
frontend/src/          React interface, charts, API client, finance logic
backend/config/        Django settings and routes
backend/ledger/        Models, migrations, API, tests
index.html + assets/   Built React demo for GitHub Pages
Dockerfile             Production React + Django image
compose.yaml           App + MySQL local setup
.github/workflows/     MySQL-backed CI checks
```

## Practical limits

This is a portfolio project, without bank linking, email verification, password reset, or multi-currency conversion. Back up important records. The bundled server uses one Gunicorn worker with an in-process authentication rate limiter; configure shared caching and an edge rate limiter before scaling out. Google Fonts is used for typography, with system font fallbacks. No financial advice is provided.
