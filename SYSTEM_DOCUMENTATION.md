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
4. [Environment Variables](#environment-variables)
5. [User Roles](#user-roles)
6. [Clearance Workflow](#clearance-workflow)
7. [API Routes](#api-routes)
8. [Frontend Pages](#frontend-pages)
9. [Database Enums and Status Codes](#database-enums-and-status-codes)
10. [What Is Done](#what-is-done)
11. [What Is Missing or Needs Work](#what-is-missing-or-needs-work)

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

**Step 1 - Database**

Import the schema into MySQL:
```
mysql -u root -p < server/src/eso_auditing_db.sql
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
| EMAIL_HOST | SMTP host for Nodemailer |
| EMAIL_PORT | SMTP port |
| EMAIL_USER | Sender email address |
| EMAIL_PASS | Sender email password |

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
| /auth | auth.routes.ts | Login, logout, refresh token, register, change password |
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
| Production Deployment | Low | The system currently runs on a local machine exposed via Cloudflare Tunnel. There is no production server, no domain, no SSL certificate, and no automated startup. A proper deployment would require a VPS or dedicated server. |
| Database Migrations | Low | There is no migration tool. Schema changes require manually editing the SQL file and re-importing. |
| Unit and Integration Tests | Low | No tests exist anywhere in the project. |
| Forgot Password Flow | Low | No password reset via email is implemented. Admin can change passwords manually through the system admin accounts page. |
| Student Registration Approval | Low | Students can sign up but there is no admin approval step before an account is activated. The current flow auto-activates on signup. |
| Dark Mode | Low | useTheme hook exists and a toggle is present in some layouts but dark mode styles are not fully applied across all pages. |

---

## Security Notes

- Passwords are hashed with bcrypt before storage. Plain text passwords are never saved.
- Accounts lock after 5 consecutive failed login attempts.
- All connections through the Cloudflare Tunnel are HTTPS encrypted.
- JWT access tokens are short-lived. Refresh tokens are used to issue new access tokens silently.
- The server allows any `*.trycloudflare.com` origin through CORS to support the tunnel setup without manual URL updates.
- File uploads are stored in Cloudinary (cloud) not on the local filesystem, except for PDF templates which are stored in `/uploads/pdf-templates/` on the server machine.

---

## Notes for the Next Developer

- Start by reading `server/src/server.ts` to understand middleware order and route registration.
- All API calls on the frontend go through `client/src/services/api.ts` which handles token attachment and refresh logic automatically.
- The `apiFetch` wrapper in `api.ts` is used by every service file. Do not bypass it with raw `fetch` calls unless you need blob responses (see `document.service.ts` for the pattern).
- Role-based UI is handled by checking `user.role` from `useAuth()`. The backend independently validates the same role on every request.
- The clearance workflow steps are stored in the database and configurable through the System Admin settings page. Do not hardcode step numbers in the frontend.
- When adding a new admin page, register it in both `client/src/routes/router.tsx` and the appropriate layout sidebar (`AdminLayout.tsx` or `SysAdminLayout.tsx`).
- When adding a new API route, register it in `server/src/routes/index.ts`.
