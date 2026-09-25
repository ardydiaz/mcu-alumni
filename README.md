# MCU Alumni Website

A modern redesign of [alumni.mcu.edu.ph](https://alumni.mcu.edu.ph/).

- **backend/**: Node.js + Express REST API, MySQL (Sequelize), JWT auth
- **frontend/**: React.js (Vite + React Router)

## Getting started

Requires Node.js 20.19+ and MySQL 8+.

```bash
npm install                             # installs backend + frontend (npm workspaces)
cp backend/.env.example backend/.env    # set DB_PASSWORD, JWT secrets, M365_* and SEED_ADMIN_EMAIL
npm run seed -w backend                 # creates the database, tables, admin account and initial content
npm run dev                             # backend :6002 + frontend http://localhost:5002
```

- Public website: http://localhost:5002
- Admin panel: http://localhost:5002/admin (sign in with Microsoft 365; see "Microsoft 365 sign-in" below)

In development the backend creates the `mcu_alumni` database if it doesn't exist, and `DB_SYNC=safe` creates missing tables on startup.

### Production

```bash
npm run build     # builds frontend into frontend/dist
npm start         # Express serves the API, /uploads and the built frontend on :6002
```

Set `NODE_ENV=production`, strong `JWT_*` secrets, and `DB_SYNC=none` once the tables exist.

## Backend structure

```
backend/
├── src/
│   ├── config/            env.js, database.js (Sequelize/MySQL), jwt.js, multer.js, cors.js
│   ├── middleware/        auth (JWT), role (admin/staff), validation (Joi), upload (multer), error
│   ├── utils/             response.js, pagination.js, logger.js, helpers.js (ApiError, CRUD helpers)
│   ├── routes/            index.js -> /api/v1 and /api/v2
│   ├── modules/           one folder per feature: *.controller / *.service / *.model / *.routes / *.validation
│   │   ├── auth/          Microsoft 365 sign-in, refresh-token rotation, logout, /auth/profile
│   │   ├── users/         admin/staff accounts (admin only)
│   │   ├── dashboard/     staff dashboard stats + recent activity
│   │   ├── content/       static site content (site info, home, bank details, courses)
│   │   ├── campaigns/     giving campaigns
│   │   ├── donations/     donation pledges from the Give page
│   │   ├── scholars/      Support-a-Centralino scholars
│   │   ├── networks/      alumni associations
│   │   ├── partners/      merchant + industry partners
│   │   ├── projects/      campus development projects
│   │   ├── reports/       transparency report PDFs
│   │   ├── alumni/        alumni contact updates + Alumni ID requests
│   │   ├── tracer/        graduate tracer responses + summary stats
│   │   ├── volunteers/    volunteer sign-ups
│   │   ├── messages/      "Leave us a message" inbox
│   │   └── logs/          activity log (sign-ins + every staff create/update/delete)
│   ├── app.js
│   └── server.js
│   ├── database/          migrator.js + migrations/ (roles, users)
├── scripts/               seed.js, seed-data.js, migrate.js
├── uploads/               uploaded images and PDFs (git-ignored)
├── package.json
└── .env
```

## Frontend structure

```
frontend/src/
├── layouts/
│   ├── PublicLayout.jsx     navbar + footer for the public website
│   ├── AdminLayout.jsx      sidebar + topbar for the admin panel
│   └── AuthLayout.jsx       split-screen staff sign-in
├── pages/
│   ├── public/              Home, Give, SupportCentralino, CampusDevelopment, Volunteer,
│   │                        MerchantPartners, IndustryPartners, Networks, TransparencyReports,
│   │                        ContactUpdate, GraduateTracer, NotFound
│   ├── auth/
│   │   └── Login.jsx
│   └── admin/
│       ├── Dashboard.jsx    stat tiles, donations by campaign, tracer employment, recent activity
│       ├── Categories.jsx   giving campaigns
│       ├── Scholars.jsx, Networks.jsx, Partners.jsx, Projects.jsx, Reports.jsx   (website content)
│       ├── Donations.jsx, Alumni.jsx, Tracer.jsx, Volunteers.jsx, Messages.jsx   (submissions)
│       ├── Users.jsx        admin only
│       ├── Roles.jsx        admin only: permission matrix + assign roles
│       ├── Logs.jsx         admin only: activity log
│       └── Profile.jsx      own fullname + department, sign out everywhere
├── routes/
│   ├── AppRoutes.jsx        all routes; admin pages are lazy-loaded
│   └── ProtectedRoute.jsx   sign-in / role guard
├── components/              layout (Navbar, Footer), ui, forms, admin (ResourcePage, DataTable, Modal...)
├── context/AuthContext.jsx  session state (login, logout, auto-refresh)
├── api/                     client.js (public + auth), admin.js (staff endpoints)
├── hooks/                   useContent, useForm
└── styles/                  global.css (site + brand tokens), admin.css (admin panel)
```

Most admin pages are a configuration of `components/admin/ResourcePage.jsx` (search, filters, pagination, table, detail/edit dialog, image/PDF upload, delete). Staff see everything except Users, Roles and Logs; only admins can delete.

## API (v1)

Base URL: `/api/v1`. Every response uses the same envelope:

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
{ "success": false, "message": "Please check the highlighted fields.", "errors": { "email": "Enter a valid email address" } }
```

List endpoints accept `?page=&limit=&search=&sort=&order=asc|desc` plus module filters (e.g. `/partners?type=merchant`).

| Module | Public | Super Admin + Administrator | Super Admin only |
| --- | --- | --- | --- |
| `/auth` | `GET /providers`, `GET /m365/login`, `GET /m365/callback`, `POST /m365/exchange`, `POST /refresh`, `POST /logout` | `GET /profile`, `PATCH /profile`, `POST /logout-all` | |
| `/users` | | | full CRUD, `GET /roles` |
| `/logs` | | | `GET /`, `GET /actions` |
| `/dashboard` | | `GET /stats`, `GET /recent` | |
| `/content` | `GET /`, `GET /:section` | | |
| `/campaigns`, `/scholars`, `/networks`, `/partners`, `/projects`, `/reports` | `GET /`, `GET /:id` (active only) | `POST`, `PATCH /:id`, `DELETE /:id` (+ inactive records) | |
| `/reports` | `GET /grouped` | | |
| `/donations`, `/alumni`, `/volunteers`, `/messages` | `POST /` | `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | |
| `/tracer` | `POST /` | `GET /`, `GET /:id`, `GET /summary`, `DELETE /:id` | |

Faculty and Student tokens get `403` on every column except *Public*.

- **Authentication:** `Authorization: Bearer <accessToken>`. The JWT payload is `{ id, email, role }`. Access tokens last 15 minutes; refresh tokens last 7 days, are stored hashed, and are rotated on each refresh.
- **Uploads:** `POST`/`PATCH` on scholars (`image`), networks and partners (`logo`), projects (`image`) and reports (`file`, PDF) accept `multipart/form-data`. Files are served from `/uploads/...`.
- **Rate limits:** Microsoft sign-in is limited to 60 requests per 15 minutes; public forms to 20 per 15 minutes per IP.

`/api/v2` is reserved for future breaking changes.

## Microsoft 365 sign-in (Entra ID)

Staff sign in to the admin panel with their MCU Microsoft 365 account (OAuth 2.0 authorization code flow with PKCE, handled by the Express API with `@azure/msal-node`). The admin login page offers **Microsoft 365 only**; there are no passwords.

The first Super Admin: set `SEED_ADMIN_EMAIL` (and `SEED_ADMIN_FULLNAME`) to their MCU Microsoft 365 account and run `npm run seed -w backend`.

```
Click "Sign in with Microsoft 365"
  -> GET  /api/v1/auth/m365/login      state + nonce + PKCE verifier kept in a signed httpOnly cookie
  -> Microsoft sign-in (MCU tenant only, MFA per your tenant policy)
  -> GET  /api/v1/auth/m365/callback   verify state, exchange code, check nonce / tenant / email domain, check role
  -> /admin/login/callback#ticket=...  single-use ticket, valid 60 seconds
  -> POST /api/v1/auth/m365/exchange   returns our JWT access + refresh tokens -> dashboard
```

### 1. Register the app in Entra ID

In the [Microsoft Entra admin center](https://entra.microsoft.com) → **App registrations** → **New registration**:

1. **Name:** MCU Alumni Admin. **Supported account types:** *Accounts in this organizational directory only* (single tenant).
2. **Redirect URI:** platform **Web**, `http://localhost:5002/api/v1/auth/m365/callback`. Add the production one later, e.g. `https://alumni.mcu.edu.ph/api/v1/auth/m365/callback`.
3. After creating it, copy the **Application (client) ID** and **Directory (tenant) ID** from *Overview*.
4. **Certificates & secrets** → **New client secret** → copy the secret **Value** (shown once). Note its expiry date.
5. Optional: **Enterprise applications** → *MCU Alumni Admin* → **Properties** → *Assignment required?* = **Yes**, then assign the people who may sign in. Roles are **not** managed in Entra; they come from the `users` table.

API permissions: the default *Microsoft Graph → User.Read* (delegated) is enough; only the `openid profile email` scopes are requested.

### 2. Configure `backend/.env`

```env
FRONTEND_URL=http://localhost:5002
M365_ENABLED=true
M365_TENANT_ID=<Directory (tenant) ID>
M365_CLIENT_ID=<Application (client) ID>
M365_CLIENT_SECRET=<client secret value>
M365_REDIRECT_URI=http://localhost:5002/api/v1/auth/m365/callback
M365_ALLOWED_DOMAINS=mcu.edu.ph
```

Restart the backend; the login page shows **Sign in with Microsoft 365** once `M365_ENABLED=true` and the IDs/secret are set.

### Users, roles and role checking

Two tables, created by migrations (see **Database migrations**):

```
roles                    users
-------------------      ---------------------------------------------------------
1  Super Admin           id, microsoft_id, email, fullname, role_id -> roles.id,
2  Administrator         department, status (active | inactive), created_at
3  Faculty               (+ updated_at, last_login_at)
4  Student
```

When Microsoft authenticates someone, the backend looks them up in `users` (by `microsoft_id`, or by `email` on the first sign-in, which then links `microsoft_id`) and returns a JWT with their role:

```json
{ "id": 1, "email": "admin@mcu.edu.ph", "role": "Super Admin" }
```

The admin dashboard calls `GET /api/v1/auth/profile`: JWT → role → **Super Admin** or **Administrator** is allowed; anyone else (Faculty, Student) gets **403 Forbidden** and sees a "No access to the admin dashboard" page. Every dashboard API applies the same check and reads the role from the database on each request, so role changes and deactivations apply immediately.

| Role | Admin dashboard | Content & submissions | Users, Roles, Logs |
|---|---|---|---|
| Super Admin | ✓ | view, create, edit, delete | ✓ |
| Administrator | ✓ | view, create, edit, delete | – |
| Faculty | 403 | – | – |
| Student | 403 | – | – |

Sign-in is rejected if the email is not in `users`, the user is `inactive`, the email is outside `M365_ALLOWED_DOMAINS`, or the token is from another tenant. Super Admins add people on the **Users** page and change roles on **Roles**; there must always be at least one active Super Admin, and nobody can change their own role. Every sign-in (with role), failure (with reason) and change appears in **Logs**.

## Database migrations

Versioned migrations live in `backend/src/database/migrations/` and run with [Umzug](https://github.com/sequelize/umzug); applied ones are recorded in the `schema_migrations` table.

```bash
npm run migrate -w backend          # apply pending migrations (also runs automatically when the backend starts)
npm run migrate:status -w backend   # list applied / pending
npm run migrate:undo -w backend     # revert the latest migration
```

| Migration | What it does |
|---|---|
| `20260925-01-create-roles` | Creates `roles` and inserts 1 Super Admin, 2 Administrator, 3 Faculty, 4 Student |
| `20260925-02-users-microsoft-roles` | Creates `users` (id, microsoft_id, email, fullname, role_id FK, department, status, created_at). On an existing database it upgrades the previous table in place: first/last name → `fullname`, `admin` → Super Admin, `staff` → Administrator, `is_active` → `status`, `microsoft_oid` → `microsoft_id`, and drops `password`. User ids, sessions and logs are kept. |

Other tables are still created by `DB_SYNC=safe`. To add a migration, create a file in `src/database/migrations/` that exports `up` and `down`, and append it to the list in `src/database/migrator.js`.

## Notes / next steps

- Images for seeded records still load from `alumni.mcu.edu.ph/wp-content/uploads`; replace them by uploading through the API.
- Transparency reports start empty; add them with `POST /api/v1/reports`.
