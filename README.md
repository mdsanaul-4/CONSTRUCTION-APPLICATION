# Construction Labour Manager

A complete, production-ready web application for a construction company to manage labourers, labour suppliers, attendance, overtime, monthly payroll, payments, projects, reports, and audit history.

Replaces notebook-based tracking with: **enter data once → automatic calculations → complete history → safe cloud storage (MongoDB Atlas).**

---

## 1. Features

- **Authentication** — JWT-based login, password hashing (bcrypt), protected routes, role field ready for Owner/Manager/Accountant/Supervisor expansion.
- **Multi-tenant by design** — every business record is scoped to a `companyId` taken from the authenticated user's JWT, never from client input.
- **Projects** — create/edit/search/filter, per-project labourers/attendance/payroll/cost summary.
- **Labour suppliers** — create/edit/search/filter, per-supplier labourers/attendance/payroll/payments/outstanding.
- **Labourers** — full profile (personal/work/salary info) with Overview / Attendance / Payroll / Payments / Activity tabs. Never hard-deleted — deactivated instead, preserving history.
- **Attendance** — a fast bulk entry sheet (Mark All Present / Absent / Off, per-row status + OT hours, Save). Duplicate attendance for the same company+labourer+date is blocked at the database level (unique compound index) and surfaced in the UI with an "edit instead?" flow.
- **Overtime** — per-record OT hours, `overtimeAmount = overtimeHours × overtimeRate`.
- **Payroll engine** — generates payroll from attendance for a given month/project/supplier. Formulas:
  - `Present Pay = Present Days × Daily Rate`
  - `Half Day Pay = Half Days × Daily Rate × 0.5`
  - `Overtime Pay = Overtime Hours × Overtime Rate`
  - `Gross Salary = Present Pay + Half Day Pay + Overtime Pay + Other Earnings − Deductions`
  - `Due = Gross Salary − Total Active Payments`
  - Weekly-off and holiday pay are **configurable** in Settings (`weeklyOffPaid`, `holidayPaid`), not assumed.
  - **Historical accuracy**: every payroll record snapshots `dailyRateAtPayroll` / `overtimeRateAtPayroll` at generation time, so a later rate change never rewrites old payroll.
  - Status lifecycle: `draft → finalized → partially_paid / paid`, with an authorized **reopen** action for corrections.
- **Payments** — separate from payroll; `totalPaid`/`dueAmount` are always computed by the backend, never entered manually. Payments are never hard-deleted — a **Void Payment** action preserves history while excluding the amount from totals, with a required reason and an audit trail entry.
- **Reports** — Attendance, Payroll, Supplier, Project, and Payment reports, each with **Excel / CSV / PDF export** and print support (backend-generated for large datasets).
- **Activity / audit log** — every create/update/deactivate/finalize/void/settings-change is recorded with before/after data, user, and timestamp.
- **Dashboard** — live stat cards, today's attendance breakdown, 6-month labour cost trend chart, recent payments, recent activity — all from real backend APIs, nothing hardcoded.
- **Settings** — company info, weekly-off/holiday pay toggles, default OT rate, currency, change password.
- **Security** — Helmet, CORS locked to `CLIENT_URL`, rate limiting (general + stricter on login), MongoDB injection sanitization, Zod request validation, no password hashes in API responses, safe/generic error messages in production.
- **Responsive** — sidebar collapses to a mobile drawer; tables scroll horizontally on small screens; the attendance sheet is built mobile-first since it's used most often in the field.

---

## 2. Tech stack

**Frontend:** React 19, Vite, React Router, Axios, Tailwind CSS v4, Lucide icons, Recharts
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Zod, Helmet, CORS, express-rate-limit, express-mongo-sanitize, ExcelJS, PDFKit
**Database:** MongoDB Atlas (or any MongoDB instance)

---

## 3. Folder structure

```
construction-labour-manager/
├── client/                  React + Vite frontend
│   └── src/
│       ├── components/      Reusable UI (Sidebar, Modal, tables, etc.)
│       ├── pages/           One folder per feature area
│       ├── layouts/         DashboardLayout (sidebar + header shell)
│       ├── context/         AuthContext, ToastContext
│       ├── services/        Axios API client
│       └── utils/           Formatting helpers
├── server/                  Express + MongoDB backend
│   ├── config/               DB connection
│   ├── controllers/          Route handlers
│   ├── middleware/           auth, error handling, validation
│   ├── models/                Mongoose schemas
│   ├── routes/                 Express routers
│   ├── services/               payrollEngine.js — the money-math single source of truth
│   ├── utils/                   token, response, date, audit helpers
│   ├── validators/              Zod schemas
│   ├── seed/                    seedOwner.js — creates the first Owner account
│   └── tests/                   Jest unit + integration tests
├── .gitignore
└── README.md (this file)
```

---

## 4. Installation

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB) and its connection string

### Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, PORT, CLIENT_URL, and ADMIN_* for seeding
npm install
npm run seed     # creates the first Owner account from ADMIN_* env vars
npm run dev      # starts the API on http://localhost:5000
```

### Frontend

```bash
cd client
cp .env.example .env
# edit .env: set VITE_API_URL (defaults to http://localhost:5000/api)
npm install
npm run dev       # starts the app on http://localhost:5173
```

Log in at `http://localhost:5173/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set before seeding.

---

## 5. Environment variables

### `server/.env`
| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret used to sign JWTs — never commit a real value |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_COMPANY_NAME` | Used only once, by `npm run seed`, to create the first Owner account |

### `client/.env`
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

---

## 6. MongoDB Atlas setup

1. Create a free/shared or dedicated cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a database user with a strong password.
3. Under **Network Access**, allow the IP address(es) your server will run from (or `0.0.0.0/0` only for early development — restrict this in production).
4. Under **Database → Connect → Drivers**, copy the connection string and put it in `MONGO_URI` in `server/.env`. Add your database name to the path, e.g. `.../construction-labour-manager?retryWrites=true&w=majority`.
5. Mongoose creates all indexes automatically on first connection (`autoIndex: true`), including the compound unique indexes that prevent duplicate attendance and duplicate monthly payroll.

---

## 7. Local development flow

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Visit `http://localhost:5173`.

## 8. Production build

```bash
cd client && npm run build   # outputs client/dist — serve with any static host or behind the API
cd server && npm start        # runs the compiled Express app with node
```

Set `NODE_ENV=production` in `server/.env` for generic (non-stack-trace) error messages.

---

## 9. API overview

Base path: `/api`

| Resource | Base route |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/change-password`, `POST /auth/logout` |
| Company | `GET/PUT /company` |
| Settings | `GET/PUT /settings` |
| Projects | `GET/POST /projects`, `GET/PUT /projects/:id`, `GET /projects/:id/summary`, `PATCH /projects/:id/status` |
| Suppliers | `GET/POST /suppliers`, `GET/PUT /suppliers/:id`, `GET /suppliers/:id/summary` |
| Labourers | `GET/POST /labourers`, `GET/PUT /labourers/:id`, `GET /labourers/:id/profile`, `PATCH /labourers/:id/status` |
| Attendance | `GET /attendance/sheet`, `POST /attendance/bulk`, `GET /attendance`, `PUT /attendance/:id` |
| Payroll | `POST /payroll/generate`, `GET /payroll`, `GET/PUT /payroll/:id`, `POST /payroll/:id/finalize`, `POST /payroll/:id/reopen` |
| Payments | `GET/POST /payments`, `GET /payments/:id`, `POST /payments/:id/void` |
| Reports | `GET /reports/{attendance,payroll,supplier,project,payment}`, `GET /reports/:type/export/{excel,csv,pdf}` |
| Activity | `GET /activity` |
| Dashboard | `GET /dashboard`, `GET /dashboard/trend` |

All responses follow `{ success, message, data }` (or `{ success: false, message, errors }` on failure).

---

## 10. Database models

`User`, `Company`, `Project`, `Supplier`, `Labourer`, `Attendance`, `Payroll`, `Payment`, `AuditLog`, `Settings` — see `server/models/`. Key indexes:

- `Attendance`: unique on `(companyId, labourerId, date)` — prevents duplicate attendance.
- `Payroll`: unique on `(companyId, labourerId, month, year)` — prevents duplicate monthly payroll.
- Text indexes on name/searchable fields for Projects, Suppliers, Labourers.

---

## 11. Security notes

- Passwords are hashed with bcrypt; hashes are never serialized in API responses (`toJSON` transform on `User`).
- All money calculations are recomputed server-side on generate/finalize/payment/void — the frontend never sends trusted totals.
- `companyId` always comes from the authenticated JWT, never from the request body/query.
- Helmet sets standard security headers; CORS is locked to `CLIENT_URL`; `express-mongo-sanitize` strips `$`/`.` operators from user input; Zod validates every request body.
- Rate limiting: 500 req/15min general, 20 req/15min on `/auth/login`.

---

## 12. Backup recommendations

MongoDB Atlas provides automated continuous backups on paid tiers, and on-demand snapshots on all tiers. Recommended:

- Enable Atlas **Cloud Backup** with a retention policy matching your compliance needs.
- Periodically export critical collections (`payroll`, `payments`, `auditlogs`) via `mongodump` as an additional offline copy.
- Never rely on a single copy of production data — this application does not claim data is "never lost"; you are responsible for configuring and testing backups.

---

## 13. Testing

```bash
cd server
npm test          # runs pure unit tests for the payroll engine — no network required
npm run test:all  # also runs Mongoose/duplicate-prevention integration tests
                   # (downloads a MongoDB binary via mongodb-memory-server on first run —
                   #  needs outbound internet access)
```

Unit tests cover: present-day pay, half-day pay, OT pay, weekly-off toggle, holiday toggle, gross salary composition, negative-gross guard, paid/due/status derivation, and rounding. Integration tests cover: duplicate attendance prevention, duplicate payroll prevention, and the historical-rate-snapshot guarantee.

---

## 14. Deployment notes

- Deploy `server/` as a standard Node process (PM2, systemd, Docker, or a PaaS like Render/Railway/Fly.io). Set all `server/.env` variables in your host's environment/secrets manager — never commit `.env`.
- Deploy `client/dist` (after `npm run build`) to any static host (Netlify, Vercel, S3+CloudFront, or served by the same Node process behind a reverse proxy). Point `VITE_API_URL` at your deployed API's public URL before building.
- Set `CLIENT_URL` on the backend to your deployed frontend's origin so CORS allows it.
