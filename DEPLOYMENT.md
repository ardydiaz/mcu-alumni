# Deploying the MCU Alumni system (staging / production)

This guide is for whoever sets up and maintains a server copy of the MCU Alumni website and Alumni Portal,
for example the staging site.

The app is one Node.js process. The backend (Express, port `6002` by default) serves the API at `/api/v1`,
uploaded files at `/uploads`, and the built React frontend for every other URL. The database is MySQL.

---

## 1. Requirements

- **Node.js 18.11 or newer** (20 LTS recommended) and npm
- **MySQL 8** (or MariaDB 10.6+) with an empty database for this site
- A reverse proxy (nginx, IIS or Apache) for HTTPS. The app already trusts one proxy hop (`trust proxy`), so
  rate limits see the real visitor IP.
- Access to the MCU **Microsoft Entra ID** app used for staff sign-in and outgoing email (ask ICT)

---

## 2. First-time setup

### 2.1 Get the code and install

```bash
git clone <repository-url> mcu-alumni-staging
cd mcu-alumni-staging
npm install
```

### 2.2 Create the database

With `NODE_ENV=production` the app does **not** create the database for you:

```sql
CREATE DATABASE mcu_alumni_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mcu_alumni'@'localhost' IDENTIFIED BY '<strong password>';
GRANT ALL PRIVILEGES ON mcu_alumni_staging.* TO 'mcu_alumni'@'localhost';
```

### 2.3 Configure `backend/.env`

Copy `backend/.env.example` to `backend/.env`, then set:

| Setting | Staging value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `PORT` | `6002` | Port the proxy forwards to |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | your MySQL | `DB_NAME=mcu_alumni_staging` |
| `DB_SYNC` | `safe` | **Keep `safe`.** It creates the base tables on a fresh database. Never use `alter` on a server. |
| `JWT_ACCESS_SECRET` `JWT_REFRESH_SECRET` | new random values | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Do not reuse the development values. |
| `FRONTEND_URL` | `https://<staging address>` | Used in every email link (verification, invitations, password reset) |
| `SEED_ADMIN_EMAIL` `SEED_ADMIN_FULLNAME` | e.g. `apdiaz@mcu.edu.ph` | The first Super Admin; signs in with Microsoft 365 |
| `M365_ENABLED` `M365_TENANT_ID` `M365_CLIENT_ID` `M365_CLIENT_SECRET` | from ICT | Staff sign-in |
| `M365_REDIRECT_URI` | `https://<staging address>/api/v1/auth/m365/callback` | **Also add this exact URI in the Entra app** (Authentication → Redirect URIs) |
| `M365_ALLOWED_DOMAINS` | `mcu.edu.ph` | |
| `MAIL_FROM` `MAIL_FROM_NAME` | see section 5 | Leave `MAIL_FROM` empty to log emails instead of sending them |
| `MESSAGE_NOTIFY_TO` | a test mailbox on staging | Receives "Leave us a message" notifications |
| `UPLOAD_DIR` | `uploads` | Photos and cover images are stored in `backend/uploads/` |
| `CAPTCHA_ENABLED` | `true` (default) | Built-in security check (distorted 5-digit code) on Register, Forgot password, Resend verification, "Leave us a message" and "Notify me". No outside service. Each code works once and expires after 10 minutes; used codes are remembered in memory, so run a single backend process. |

Never commit `backend/.env`, and never paste its secrets into chats or tickets.

### 2.4 Migrations and seeder

```bash
npm run migrate -w backend          # applies the 16 migrations: "Applied 16 migration(s)"
npm run seed -w backend             # base tables, first Super Admin, starting content: "Seeding complete"
npm run migrate:status -w backend   # every migration should show "applied"
```

**Migrations** (`backend/src/database/migrations/`) are applied in this order and recorded in the
`schema_migrations` table:

| # | Migration | Adds |
|---|---|---|
| 01 | `20260925-01-create-roles` | Roles (Super Admin, Administrator, Faculty, Student) |
| 02 | `20260925-02-users-microsoft-roles` | Microsoft 365 sign-in fields on staff users |
| 03 | `20260925-03-users-pending-status` | Staff access requests (pending) |
| 04 | `20260929-04-create-slides` | Homepage slider |
| 05 | `20261008-05-tracer-graduate-profile` | Graduate Tracer fields |
| 06 | `20261008-06-create-alumni-accounts` | Alumni Portal accounts |
| 07 | `20261012-07-tracer-account-link` | Tracer answers linked to portal accounts |
| 08 | `20261012-08-create-events` | Events calendar |
| 09 | `20261016-09-create-alumni-profiles` | Alumni profiles and their sections, change history |
| 10 | `20261016-10-create-import-batches` | Registrar / EAO imports |
| 11 | `20261016-11-log-export-action` | "Export" in the activity log |
| 12 | `20261016-12-profile-invitations` | Portal invitations |
| 13 | `20261016-13-eao-monitoring-event-registrations` | Profile update monitoring, event registrations |
| 14 | `20261020-14-portal-password-reset` | Alumni password reset |
| 15 | `20261123-15-event-alerts` | Homepage "Notify me" event alert subscribers |
| 16 | `20261124-16-work-industry` | Industry of each job (Work section), for EAO search by industry |

**The seeder** (`backend/scripts/seed.js`) is safe to re-run: existing records are never overwritten. It creates:

- the **Super Admin** from `SEED_ADMIN_EMAIL`
- the default campaigns, scholars, networks, partners and projects
- the base tables that are not created by migrations (users, donations, messages, logs and others)

### 2.5 Build and start

```bash
npm run build      # builds the frontend into frontend/dist (served by the backend)
npm start          # starts the API + website on PORT
```

Keep it running with a process manager, for example pm2:

```bash
npm install -g pm2
pm2 start npm --name mcu-alumni-staging -- start
pm2 save
```

Point the reverse proxy (HTTPS) at `http://localhost:6002`. Allow uploads of at least **6 MB** through the proxy;
the app limits images to 5 MB.

### 2.6 Check

1. Open `https://<staging address>/api/v1`: it returns `MCU Alumni API v1`.
2. Open the site, then **Staff login** (`/admin/login`) → **Sign in with Microsoft 365** with `SEED_ADMIN_EMAIL`.
3. In the admin, check Events, Alumni profiles and Reports load.
4. Register a test alumnus on `/portal/register`. With `MAIL_FROM` empty, the verification link appears in the server log.

---

## 3. Copying existing data instead of seeding (optional)

To give staging the same data as another copy (for example the development database):

1. Create the empty database (2.2) and `backend/.env` (2.3).
2. Import a dump from the source: `mysqldump --single-transaction mcu_alumni > dump.sql`, then `mysql mcu_alumni_staging < dump.sql`.
3. Copy the source's `backend/uploads/` folder (profile photos, event covers, banners).
4. Run `npm run migrate -w backend`. Only the migrations the dump doesn't have yet are applied.
5. **Skip the seeder.**

Copied data includes **real alumni personal information**. Restrict who can open the staging site (VPN, IP allow-list
or proxy password) and delete it when it is no longer needed (Data Privacy Act of 2012).

---

## 4. Updating a running site

```bash
git pull
npm install
npm run build
pm2 restart mcu-alumni-staging
```

New migrations are applied **automatically** when the server starts; you can also run `npm run migrate -w backend`
first to see them applied. The seeder is not needed again. If something goes wrong, `npm run migrate:undo -w backend`
reverts the most recent migration.

Back up before every update that includes migrations:

```bash
mysqldump --single-transaction mcu_alumni_staging > backup-$(date +%F).sql
```

Back up `backend/uploads/` as well.

---

## 5. Email on staging (important)

The system sends real emails through Microsoft 365 (Microsoft Graph, from the `MAIL_FROM` mailbox):

- portal email verification
- invitations to imported graduates
- password reset and "password changed"
- event registration confirmations
- "Leave us a message" notifications and confirmations

On staging this can reach **real alumni**. Choose one:

- **No emails:** leave `MAIL_FROM=` empty. Emails are written to the server log instead, where you can copy links when testing.
- **Emails to testers only:** set `MAIL_FROM` and `MESSAGE_NOTIFY_TO` to test mailboxes, use only test accounts, and
  **do not** send portal invitations to imported graduates from staging.

To send email, the Entra app needs the Microsoft Graph **application** permission **Mail.Send** with admin consent.
Ask ICT to restrict it to the sending mailbox with an Exchange Online application access policy.

---

## 6. Troubleshooting

| Symptom | Check |
|---|---|
| `Could not connect to MySQL` on start | `DB_*` values, MySQL running, the database exists (2.2) |
| `Migration … failed` | Run `npm run migrate:status -w backend`; restore the backup and contact the developer with the error |
| Staff sign-in error after Microsoft | `M365_REDIRECT_URI` matches the Entra app's redirect URI exactly (https, path) |
| Emails not arriving | `MAIL_FROM` set, Mail.Send consented; errors are logged as `[mail] Could not send …` |
| Email links point to localhost | `FRONTEND_URL` |
| Images missing after a copy | `backend/uploads/` was not copied |
| "Too many requests" during testing | Rate limits per IP (15 minutes); wait or test from another IP |
