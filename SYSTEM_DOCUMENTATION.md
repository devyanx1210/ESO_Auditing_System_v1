# ESO Auditing System - System Documentation

**System Name:** Engineering Student Organization (ESO) Auditing System  
**Institution:** Marinduque State University - College of Engineering  
**Purpose:** Manages student ESO obligations, payment submissions, and clearance processing across multiple officer roles.  
**Last Updated:** April 2026  

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [How to Run Locally](#how-to-run-locally)
4. [LAN Deployment Setup](#lan-deployment-setup)
5. [Environment Variables](#environment-variables)
6. [User Roles](#user-roles)
7. [Clearance Workflow](#clearance-workflow)
8. [API Routes](#api-routes)
9. [Frontend Pages](#frontend-pages)
10. [Database Enums and Status Codes](#database-enums-and-status-codes)
11. [What Is Done](#what-is-done)
12. [What Is Missing or Needs Work](#what-is-missing-or-needs-work)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19 |
| Frontend Build Tool | Vite | 7 |
| Frontend Language | TypeScript | 5.9 |
| Frontend Styling | Tailwind CSS | 3.4 |
| Frontend Routing | React Router DOM | 7 |
| Frontend Charts | Chart.js + react-chartjs-2 | 4.5 |
| Frontend Animations | Framer Motion | 12 |
| Frontend PDF Viewer | pdfjs-dist | 3.11 |
| Backend Framework | Express | 5 |
| Backend Language | TypeScript (ESM) | 5.9 |
| Backend Runtime | Node.js with tsx (dev) | - |
| Database | MySQL | 8 |
| Database Driver | mysql2 | 3.19 |
| Authentication | JWT (access + refresh tokens) | - |
| Password Hashing | bcrypt | 6 |
| File Uploads | Multer | 2 |
| Cloud Storage | Cloudinary | 2.9 |
| PDF Generation | pdf-lib | 1.17 |
| CSV Parsing | csv-parse | 6 |
| Email | Nodemailer | 8 |
| Security | Helmet, express-rate-limit, CORS | - |
| Tunnel (local demo) | Cloudflare Tunnel (cloudflared) | - |

---

## Project Structure

```
ESO_Auditing_System_v1/
  client/                        Frontend (React + Vite)
    src/
      assets/                    Images and icons
      components/
        ui/                      Shared UI components (Modal, Table, Chart, etc.)
        clearance/               Clearance-specific components
      context/                   AuthContext (global auth state)
      hooks/                     useAuth, useLocalStorage, useOfflineCache, useTheme
      layouts/                   AdminLayout, StudentLayout, SysAdminLayout, MainLayout
      pages/
        admin/                   ESO admin pages
        student/                 Student pages
        sysadmin/                System admin pages
      routes/                    router.tsx, ProtectedRoute.tsx
      services/                  All API call functions (one file per domain)
      types/                     TypeScript interfaces and enums
      utils/                     Formatters and export helpers
  server/                        Backend (Express + TypeScript)
    src/
      config/                    db.ts, jwt.ts, enums.ts, cloudinary.ts
      controllers/               Request handlers (one file per domain)
      middleware/                 auth, role, errorHandler, upload
      routes/                    Route definitions (one file per domain)
      services/                  Business logic (one file per domain)
      types/                     auth.types.ts, express.d.ts
      utils/                     response.ts (standard response helpers)
      scripts/                   create-admin.ts (seed first system admin)
      server.ts                  Entry point
    database/
      schema.sql                 Full MySQL schema
```

---

## How to Run Locally

**Prerequisites:** Node.js, MySQL 8, cloudflared (for tunnel access)

> For the full production/LAN installation guide, see the [LAN Deployment Setup](#lan-deployment-setup) section below.

**Step 1 - Database**

Import the schema into MySQL (via phpMyAdmin or CLI):
```
mysql -u root -p eso_auditing_db < server/database/schema.sql
mysql -u root -p eso_auditing_db < server/database/migrate_email_verification.sql
```

**Step 2 - Backend**
```
cd server
npm install
npm run dev
```
Runs on port 5000.

**Step 3 - Frontend**
```
cd client
npm install
npm run dev
```
Runs on port 5174.

**Step 4 - Create First System Admin**
```
cd server
npx tsx src/scripts/create-admin.ts
```

**Step 5 - Cloudflare Tunnel (for multi-device access)**
```
cloudflared tunnel --url http://localhost:5174
```
Share the printed URL with other devices. The Vite proxy forwards `/api` and `/uploads` to the backend automatically.

---

## LAN Deployment Setup

This section is the **complete installation guide** for setting up the system on the deployment laptop inside the school's Wi-Fi network. Students and officers access it from their phones at a fixed URL — no internet required.

---

### Overview

- The system runs on a dedicated laptop connected to the school Wi-Fi.
- The laptop gets a permanent IP address (e.g. `192.168.1.100`).
- Students open `http://192.168.1.100:5000` in their phone browser.
- The URL never changes as long as the laptop has a static IP.
- No Cloudflare Tunnel is needed.

---

### Prerequisites — Install These on the Laptop First

Do all of this before copying the project.

**1. Node.js (v20 or higher)**

Download and install from: https://nodejs.org (choose the LTS version)

After installing, confirm it works:
```bash
node -v
npm -v
```

**2. XAMPP**

XAMPP provides both MySQL and phpMyAdmin.

Download from: https://www.apachefriends.org

After installing, open the XAMPP Control Panel and start:
- **Apache** (needed for phpMyAdmin)
- **MySQL**

**3. PM2 (process manager)**

After Node.js is installed, open a terminal and run:
```bash
npm install -g pm2
```

---

### Step 1 — Transfer the Project Folder

On your development machine:

1. Delete or exclude the `node_modules` folders before copying — they are large and will be reinstalled on the laptop:
   - Delete `ESO_Auditing_System_v1/client/node_modules/`
   - Delete `ESO_Auditing_System_v1/server/node_modules/`
2. Zip the entire `ESO_Auditing_System_v1/` folder.
3. Copy the zip to the laptop via USB drive or shared folder.
4. Extract it somewhere easy to find, e.g. `C:\ESO_Auditing_System_v1\`.

> **Do not include `server/.env` in the zip** — it contains secrets. Copy it separately and edit it on the laptop (see Step 3).

---

### Step 2 — Set Up the Database in phpMyAdmin

1. Open a browser on the laptop and go to: `http://localhost/phpmyadmin`
2. Log in (default: username `root`, password is blank unless you set one in XAMPP).
3. Click **New** in the left sidebar to create a new database.
4. Name it `eso_auditing_db` (must match `DB_NAME` in `.env`) → click **Create**.
5. Click on the new database in the left sidebar → click the **Import** tab.
6. Click **Choose File** → select `server/database/schema.sql` → click **Go**.
7. Wait for it to finish (you'll see a green success message).
8. Import the migration file the same way:
   - Import tab → Choose File → `server/database/migrate_email_verification.sql` → Go.

The database is now ready.

---

### Step 3 — Create the `.env` File

Inside the `server/` folder, create a file named `.env` (no extension). Use `.env.example` as a template.

Fill in these values at minimum:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=eso_auditing_db

JWT_ACCESS_SECRET=<generate a long random string>
JWT_REFRESH_SECRET=<generate a different long random string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLIENT_URL=http://192.168.1.100:5000
APP_URL=http://192.168.1.100:5000
LAN_MODE=true

GMAIL_USER=eso.ceng@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

CLOUDINARY_CLOUD_NAME=<your cloudinary name>
CLOUDINARY_API_KEY=<your cloudinary key>
CLOUDINARY_API_SECRET=<your cloudinary secret>
```

Replace `192.168.1.100` with the actual static IP you will assign to the laptop (see Step 6).

For `DB_PASSWORD`: if you set a root password in XAMPP, put it here. If not, leave it blank.

For JWT secrets: generate two different random strings. You can use: https://generate-secret.vercel.app/64

---

### Step 4 — Install Dependencies

Open a terminal in the project root. Run these one at a time:

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

This will take a few minutes on the first run.

---

### Step 5 — Build the Frontend

The backend serves the compiled frontend files in production. Build them once:

```bash
cd client
npm run build
```

This creates a `client/dist/` folder. The backend reads files from there.

Every time you update frontend code, you need to run `npm run build` again and then `pm2 restart eso-app`.

---

### Step 6 — Create the First System Admin Account

This only needs to be done once. It creates the initial `system_admin` account used to log in and set everything up.

```bash
cd server
npx tsx src/scripts/create-admin.ts
```

Follow the prompts to set the email and password for the system admin.

---

### Step 7 — Start the Server with PM2

```bash
cd server
pm2 start "npx tsx src/server.ts" --name "eso-app"
pm2 save
```

Check that it's running:
```bash
pm2 status
```

You should see `eso-app` with status `online`.

Open a browser on the laptop and go to `http://localhost:5000` — you should see the login page. If it works locally, move on to the network steps.

---

### Step 8 — Assign a Static IP to the Laptop

This makes sure the laptop always gets the same IP on the school Wi-Fi so the URL never changes.

**Option A — Windows Static IP**

1. Open **Settings → Network & Internet → Wi-Fi → Hardware properties**
2. Under **IP assignment**, click **Edit**
3. Switch from **Automatic (DHCP)** to **Manual**
4. Enable **IPv4** and fill in:
   - IP address: `192.168.1.100` *(pick any unused address in the router's range)*
   - Subnet mask: `255.255.255.0`
   - Gateway: `192.168.1.1` *(your router's IP — confirm this with IT)*
   - DNS: `8.8.8.8`
5. Save and reconnect to Wi-Fi

**Option B — Router DHCP Reservation**

Log into the router admin panel (usually `192.168.1.1`), find the laptop in the connected device list, and assign it a reserved IP. The router will always give it the same address automatically.

After setting the static IP, update `server/.env` so `CLIENT_URL` and `APP_URL` use the correct address, then restart:
```bash
pm2 restart eso-app
```

---

### Step 9 — Open Windows Firewall for Port 5000

By default Windows Firewall blocks other devices from connecting. You need to open port 5000.

1. Open **Windows Defender Firewall with Advanced Security** (search for it in Start)
2. Click **Inbound Rules → New Rule**
3. Select **Port** → Next
4. Select **TCP**, enter `5000` → Next
5. Select **Allow the connection** → Next
6. Check all three profiles (Domain, Private, Public) → Next
7. Name it `ESO App Port 5000` → Finish

Now test from a phone on school Wi-Fi: open `http://192.168.1.100:5000` in the browser.

---

### Step 10 — Auto-Start on Windows Boot

So the system starts automatically every time the laptop turns on:

1. Open a terminal **as Administrator** (right-click → Run as administrator)
2. Run:
```bash
pm2 startup
```
3. PM2 will print a command — copy it exactly and run it in the same terminal.
4. Then run:
```bash
pm2 save
```

After this, PM2 and the `eso-app` process will start automatically on every Windows boot, even before anyone logs in.

---

### Email Setup (Gmail)

Email is required for student registration (verification link) and forgot password (reset link).

1. Create a dedicated Gmail account — e.g. `eso.ceng.marsu@gmail.com`. Do not use a personal Gmail.
2. Log into that account → go to **Google Account → Security**
3. Enable **2-Step Verification** (required for App Passwords)
4. Under 2-Step Verification, scroll down to **App passwords**
5. Create an App Password — select app: "Mail", device: "Windows Computer"
6. Google generates a 16-character code — copy it
7. Put it in `server/.env`:

```env
GMAIL_USER=eso.ceng.marsu@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

Restart the server after updating `.env`:
```bash
pm2 restart eso-app
```

**Note:** Email links (verify email, reset password) use the `APP_URL` in `.env`. These links only work when the student's phone is on the same school Wi-Fi. If a student tries to click the link from home, it won't load — they should be on the school network or ask an admin to assist.

If `GMAIL_USER` and `GMAIL_APP_PASSWORD` are not configured, the server will print verification tokens to the terminal log instead of sending emails (this is the dev fallback).

---

### Daily Operation

| Action | How |
|---|---|
| Turn on system | Boot the laptop — PM2 starts `eso-app` automatically |
| Check it's running | Open terminal → `pm2 status` |
| View live logs | `pm2 logs eso-app` |
| Stop the system | `pm2 stop eso-app` or just shut down the laptop |
| Restart after a config change | `pm2 restart eso-app` |

Students and officers access the system at: **`http://192.168.1.100:5000`**

They can also **install it as an app** on their phone — when they open the URL in Chrome on Android, it will prompt "Add to Home Screen". This installs it as a PWA (Progressive Web App) with its own icon.

---

### Important Notes

- The system uses plain **HTTP** (no HTTPS) on LAN. This is fine for a closed school network. Never expose the laptop directly to the internet without adding HTTPS first.
- If the school Wi-Fi router assigns a different IP range (e.g. `10.0.0.x`), adjust all addresses above accordingly. Confirm the gateway IP with the IT department.
- MySQL must be running (XAMPP → Start MySQL) before the Node.js server starts. If MySQL is not running, the server will crash on startup.
- If you update the code (new features, bug fixes), rebuild the frontend (`npm run build` in `client/`) and restart PM2 (`pm2 restart eso-app`).

---

## Environment Variables

Create a `.env` file inside the `server/` folder. Reference `.env.example` for the full list.

| Variable | Description |
|---|---|
| PORT | Express server port (default: 5000) |
| DB_HOST | MySQL host |
| DB_PORT | MySQL port |
| DB_USER | MySQL user |
| DB_PASSWORD | MySQL password |
| DB_NAME | MySQL database name |
| JWT_ACCESS_SECRET | Secret for signing access tokens |
| JWT_REFRESH_SECRET | Secret for signing refresh tokens |
| JWT_ACCESS_EXPIRES_IN | Access token expiry (e.g. 15m) |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry (e.g. 7d) |
| CLIENT_URL | Frontend origin for CORS |
| TUNNEL_URL | Cloudflare tunnel URL for CORS (optional) |
| CLOUDINARY_CLOUD_NAME | Cloudinary account name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| GMAIL_USER | Gmail address used to send emails (e.g. eso.ceng@gmail.com) |
| GMAIL_APP_PASSWORD | 16-character Google App Password (requires 2FA on the Gmail account) |
| APP_URL | Base URL of the server, used in email links (e.g. http://192.168.1.100:5000) |
| LAN_MODE | Set to `true` to loosen rate limits for LAN/intranet deployments |

---

## User Roles

| Role Key | Label | Access Area | Description |
|---|---|---|---|
| system_admin | System Admin | /sysadmin | Manages accounts, settings, audit logs, student import |
| eso_officer | ESO Officer | /dashboard | Full admin access, manages all students and obligations |
| class_officer | Class Officer | /dashboard | Step 1 of clearance, limited to their section |
| program_officer | Program Officer | /dashboard | Step 2 of clearance |
| program_head | Program Head | /dashboard | Step 5 of clearance |
| signatory | Signatory | /dashboard | Step 4 of clearance |
| dean | Dean | /dashboard | Step 6 of clearance (final) |
| student | Student | /student | Views own obligations, submits payments, tracks clearance |

---

## Clearance Workflow

Clearance moves through 6 steps in order. Each step is handled by a specific role.

| Step | Role | Action |
|---|---|---|
| 1 | Class Officer | Initial review and sign-off |
| 2 | Program Officer | Second review |
| 3 | ESO Officer | Validates obligations and payments |
| 4 | Signatory | Signs the clearance |
| 5 | Program Head | Program-level approval |
| 6 | Dean | Final approval, student is fully cleared |

Each role can only act on the step assigned to them. A clearance rejected at any step goes back to the student. A cleared clearance at step 6 marks the student as fully cleared for the semester.

---

## API Routes

All routes are prefixed with `/api/v1`.

| Route Prefix | File | Description |
|---|---|---|
| /auth | auth.routes.ts | Login, logout, refresh token, register, change password, email verification, password reset |
| /students | student.routes.ts | Student profile, obligations, clearance status |
| /obligations | obligation.routes.ts | Student obligation queries |
| /payments | payment.routes.ts | Student payment submission |
| /notifications | notification.routes.ts | Student and admin notifications |
| /dashboard | dashboard.routes.ts | Dashboard stats for admin roles |
| /users | user.routes.ts | User profile management |
| /admin/students | admin-student.routes.ts | Admin view and management of students |
| /admin/payments | admin-payment.routes.ts | Admin payment verification |
| /admin/clearance | admin-clearance.routes.ts | Admin clearance processing per step |
| /admin/documents | document.routes.ts | Clearance document templates and PDF stamping |
| /admin/audit | audit-finance.routes.ts | Financial audit reports |
| /admin/profile | admin-profile.routes.ts | Admin profile and avatar |
| /student-import | student-import.routes.ts | CSV student import |
| /sysadmin | sysadmin.routes.ts | Accounts, settings, audit logs, workflow, programs |

---

## Frontend Pages

### Public

| Page | Path | File |
|---|---|---|
| Landing / Login | / | pages/LandingPage.tsx |
| Sign Up | /signup | pages/SignupPage.tsx |
| More Info | /more-info | pages/MoreInfo.tsx |
| Verify Email | /verify-email?token=... | pages/VerifyEmailPage.tsx |
| Forgot Password | /forgot-password | pages/ForgotPasswordPage.tsx |
| Reset Password | /reset-password?token=... | pages/ResetPasswordPage.tsx |
| Maintenance Screen | shown when maintenance mode is ON | pages/MaintenanceScreen.tsx |
| 404 Not Found | * | pages/NotFoundPage.tsx |

### System Admin (/sysadmin)

| Page | Path | File |
|---|---|---|
| Dashboard | /sysadmin/home | sysadmin/SysAdminDashboard.tsx |
| Accounts | /sysadmin/accounts | sysadmin/AccountsPage.tsx |
| System Settings | /sysadmin/settings | sysadmin/SystemSettingsPage.tsx |
| Audit Logs | /sysadmin/audit | sysadmin/AuditLogsPage.tsx |
| Student Import | /sysadmin/import | sysadmin/StudentImportPage.tsx |

### ESO Admin (/dashboard)

| Page | Path | File |
|---|---|---|
| Dashboard | /dashboard/home | admin/AdminDashboard.tsx |
| Student List | /dashboard/students/list | admin/StudentList.tsx |
| Student Obligations | /dashboard/students/obligations-list | admin/StudentObligationList.tsx |
| Payment Verification | /dashboard/students/payments | admin/PaymentVerification.tsx |
| Clearance Verification | /dashboard/students/clearances | admin/ClearanceVerification.tsx |
| Obligations Manager | /dashboard/obligations | admin/Obligations.tsx |
| Documents | /dashboard/documents | admin/Documents.tsx |
| Audit/Finance | /dashboard/audit | admin/AuditPage.tsx |
| Reports | /dashboard/reports | admin/Reports.tsx |
| Settings | /dashboard/settings | admin/AdminSettings.tsx |
| Student Import | /dashboard/students/import | sysadmin/StudentImportPage.tsx |

### Student (/student)

| Page | Path | File |
|---|---|---|
| Dashboard | /student/dashboard | student/StudentDashboard.tsx |
| Settings | /student/settings | student/StudentSettings.tsx |

---

## Database Enums and Status Codes

These are defined in `server/src/config/enums.ts` and mirrored in `client/src/types/enums.ts`.

**Obligation Status**

| Value | Meaning |
|---|---|
| 0 | Unpaid |
| 1 | Pending Verification |
| 2 | Paid |
| 3 | Waived |

**Payment Status**

| Value | Meaning |
|---|---|
| 0 | Pending |
| 1 | Approved |
| 2 | Rejected |
| 3 | Returned |

**Clearance Status**

| Value | Meaning |
|---|---|
| 0 | Pending |
| 1 | In Progress |
| 2 | Cleared |
| 3 | Rejected |

**Clearance Verification Status (per step)**

| Value | Meaning |
|---|---|
| 0 | Pending |
| 1 | Signed |
| 2 | Rejected |

**Notification Types**

| Value | Event |
|---|---|
| 1 | Obligation Assigned |
| 2 | Payment Submitted |
| 3 | Payment Approved |
| 4 | Payment Rejected |
| 5 | Payment Returned |
| 6 | Clearance Signed |
| 7 | Clearance Cleared |
| 8 | Clearance Unapproved |
| 9 | Account Status Changed |

**Payment Method**

| Value | Meaning |
|---|---|
| 1 | GCash |
| 2 | Cash |

**Obligation Scope**

| Value | Meaning |
|---|---|
| 0 | All Students |
| 1 | By Department |
| 2 | By Year Level |
| 3 | By Section |

---

## What Is Done

| Area | Status | Notes |
|---|---|---|
| Authentication | Complete | Login, logout, refresh token, change password, account lockout after 5 failed attempts |
| Email Verification | Complete | Students must verify their email after signup before they can log in. Verification token sent via Gmail SMTP. Admin-created accounts are auto-verified. |
| Forgot / Reset Password | Complete | Users can request a password reset link sent to their email. Link contains a signed token valid for 1 hour. |
| JWT Auth Middleware | Complete | Access token validation on all protected routes |
| Role Middleware | Complete | Role-based route protection |
| Error Handler | Complete | Centralized error handling middleware |
| Rate Limiting | Complete | General API limit and stricter auth limit |
| Security Headers | Complete | Helmet, CORS configured including Cloudflare tunnel support |
| System Admin - Accounts | Complete | Create, update, delete, activate/deactivate admin accounts |
| System Admin - Settings | Complete | School year, semester, maintenance mode |
| System Admin - Audit Logs | Complete | Paginated audit log viewer with search |
| System Admin - Student Import | Complete | CSV bulk import of students |
| System Admin - Clearance Workflow | Complete | Configurable step-to-role assignment |
| Admin Dashboard | Complete | Stats cards, charts, obligation and payment summaries |
| Admin Student List | Complete | Search, filter by program/year/section, subsection tabs |
| Admin Student Obligations | Complete | Per-student obligation management, waive, assign |
| Admin Payment Verification | Complete | View submissions, approve, reject, return with remarks |
| Admin Clearance Verification | Complete | Step-by-step clearance signing per officer role |
| Admin Obligations Manager | Complete | Create, edit, delete obligations with scope targeting |
| Admin Documents | Complete | HTML template editor, PDF upload, field position mapper, print merge |
| Admin Audit/Finance | Complete | Financial audit reports by semester |
| Admin Reports | Complete | Clearance and obligation reports |
| Admin Settings | Complete | Profile, avatar, password change |
| Student Dashboard | Complete | Obligation list, payment submission, clearance status tracker |
| Student Settings | Complete | Profile and password update |
| Notification System | Complete (backend) | Backend records notifications; frontend bell icon shows unread count |
| Cloudinary Integration | Complete | Avatar and file uploads go to Cloudinary |
| PDF Stamping | Complete | pdf-lib stamps student data onto uploaded PDF templates |
| Offline Cache | Complete | useOfflineCache hook stores last API response in localStorage |
| PWA Support | Complete | vite-plugin-pwa configured; app is installable on mobile |

---

## What Is Missing or Needs Work

| Area | Priority | Description |
|---|---|---|
| Email Notifications | Medium | email.service.ts exists but is not connected to any trigger. No emails are sent on payment approval, clearance signed, etc. |
| Notification Bell (Frontend) | Medium | The backend inserts notification records. The frontend notification dropdown does not yet fetch or display them in real time. |
| Input Validation | Medium | express-validator is installed. validators.ts in utils is empty. No server-side input validation on most routes. |
| Student Clearance PDF Download | Medium | Students cannot download their own cleared clearance document. Only admins can print-merge. |
| ESLint Warnings | Low | Several no-explicit-any, exhaustive-deps, and no-unused-expressions warnings exist across the codebase. The code runs correctly but a future developer should clean these up with care (a previous cleanup attempt broke the student obligations page). |
| LAN Deployment (finalize) | Low | LAN deployment instructions are documented. Remaining steps: run the email verification DB migration (`server/database/migrate_email_verification.sql`), configure Gmail credentials in `.env`, set static IP on the laptop, and run `pm2 startup` + `pm2 save`. |
| HTTPS on LAN | Low | The system currently uses plain HTTP on LAN. Passwords travel in plaintext inside the school network. For higher security, a self-signed certificate or a local reverse proxy (Caddy) can add HTTPS. |
| Database Migrations | Low | There is no migration tool. Schema changes require manually editing the SQL file and re-importing. |
| Unit and Integration Tests | Low | No tests exist anywhere in the project. |
| Student Registration Approval | Low | Students can sign up but there is no admin approval step before an account is activated. The current flow auto-activates on signup after email verification. |
| Dark Mode | Low | useTheme hook exists and a toggle is present in some layouts but dark mode styles are not fully applied across all pages. |

---

## Security Notes

- Passwords are hashed with bcrypt before storage. Plain text passwords are never saved.
- Accounts lock after 5 consecutive failed login attempts.
- JWT access tokens are short-lived. Refresh tokens are used to issue new access tokens silently.
- Student accounts require email verification before first login. Admin-created accounts are auto-verified.
- Password reset tokens are single-use and expire after 1 hour.
- In LAN deployment, traffic is plain HTTP within the school network (no SSL). This is acceptable for an isolated intranet. Do not expose the laptop directly to the internet.
- When using the Cloudflare Tunnel (dev/demo only), all tunnel connections are HTTPS encrypted. The server allows `*.trycloudflare.com` origins through CORS for this purpose.
- File uploads are stored in Cloudinary (cloud) not on the local filesystem, except for PDF templates which are stored in `/uploads/pdf-templates/` on the server machine.
- Rate limiting: 20 registration requests/hour by default; 200/hour in `LAN_MODE=true` to allow bulk student registration.

---

## Notes for the Next Developer

- Start by reading `server/src/server.ts` to understand middleware order and route registration.
- All API calls on the frontend go through `client/src/services/api.ts` which handles token attachment and refresh logic automatically.
- The `apiFetch` wrapper in `api.ts` is used by every service file. Do not bypass it with raw `fetch` calls unless you need blob responses (see `document.service.ts` for the pattern).
- Role-based UI is handled by checking `user.role` from `useAuth()`. The backend independently validates the same role on every request.
- The clearance workflow steps are stored in the database and configurable through the System Admin settings page. Do not hardcode step numbers in the frontend.
- When adding a new admin page, register it in both `client/src/routes/router.tsx` and the appropriate layout sidebar (`AdminLayout.tsx` or `SysAdminLayout.tsx`).
- When adding a new API route, register it in `server/src/routes/index.ts`.
