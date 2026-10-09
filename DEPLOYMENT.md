# Share Mintbook with recruiters

## Option A: GitHub Pages — immediate public demo

The root `index.html` and `assets/` contain the compiled React demo. Upload them together along with the source folders and documentation to your `Personal-Finance-Tracker` repository. Do not upload `node_modules`, `.venv`, `.env`, or your database.

In **Settings → Pages**, select **Deploy from a branch**, **main**, and **/ (root)**. Once GitHub finishes deploying, open:

https://cheta2807.github.io/Personal-Finance-Tracker/

This edition runs entirely in the browser with sample data. It demonstrates the new design and finance interactions. It does not execute Python or connect to MySQL; account sign-in is intentionally unavailable.

To rebuild the demo after changing React source:

```sh
cd frontend
npm ci
# macOS/Linux:
VITE_DEMO_ONLY=true npm run build
# PowerShell: $env:VITE_DEMO_ONLY="true"; npm run build
```

Copy everything from `frontend/dist/` to the repository root, replacing `index.html` and `assets/`. Commit both source and generated files. The root package.json provides the shortcut `npm run build:demo` from macOS, Linux, or Windows.

## Option B: Full app — React + Django + MySQL

Use a hosting provider or VPS that supports the supplied Dockerfile and a persistent MySQL 8 database. Backend/database hosting may have a charge; GitHub Pages cannot run them.

1. Provision MySQL 8.4 with a database `mintbook` and a dedicated user. Restrict network access to the app server, and enable regular database backups.
2. Deploy the repository Dockerfile as a web service. It builds React and serves the app and API from one origin on port **8000**. Leave `VITE_DEMO_ONLY=false` for this build (the Dockerfile does this).
3. Set private environment variables in the host's dashboard:

| Variable | Value |
| --- | --- |
| `DJANGO_SECRET_KEY` | A unique random secret, at least 64 characters |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | Your actual hostname, without scheme or path |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Your actual `https://hostname` |
| `MYSQL_HOST` | Database host/private address |
| `MYSQL_PORT` | Database port, normally `3306` |
| `MYSQL_DATABASE` | `mintbook` |
| `MYSQL_USER` | Dedicated app database user |
| `MYSQL_PASSWORD` | The app database password |
| `DJANGO_TRUST_PROXY` | `true` only if your HTTPS proxy replaces `X-Forwarded-Proto` |

4. Route HTTPS traffic to port 8000 through the host's managed proxy. HTTP is redirected to HTTPS with production settings. Use the public HTTPS `/api/health/` endpoint for readiness checks. Migrations run at container startup.
5. Open the public HTTPS URL, create two test accounts, and confirm their records stay separate. Test a transaction and browser reload. Set this URL as the GitHub repository's Website link once verified.

For a self-managed VPS, Docker Compose can run both services. Set `.env` for the actual domain and production settings, add an HTTPS reverse proxy, and restrict the app port to that proxy. The database is not exposed publicly by the supplied Compose configuration.

## Moving old data

Export JSON from the original tracker before replacing the old site. In the new app, choose **Import**, select the backup, and confirm replacement. For account storage, sign in before importing. Imports replace all transactions and budgets for the current workspace only. Different domains use different browser storage.

## What the repository upload does

Uploading source to GitHub does not provision a Python server or MySQL database. The root React demo can go live through Pages; the account version requires the hosting steps above. Keep demo and production links labeled accurately in your résumé.
