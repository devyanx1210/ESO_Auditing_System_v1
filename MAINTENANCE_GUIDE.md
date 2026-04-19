# ESO Auditing System - Maintenance Guide

**System:** Engineering Student Organization (ESO) Auditing System  
**Audience:** System Administrator or Developer responsible for keeping the system running  

This guide covers how to start the system, handle common problems, manage the database, and perform routine maintenance tasks.

---

## Table of Contents

1. [Starting the System](#starting-the-system)
2. [Stopping the System](#stopping-the-system)
3. [Sharing Access via Cloudflare Tunnel](#sharing-access-via-cloudflare-tunnel)
4. [Checking if Everything is Running](#checking-if-everything-is-running)
5. [Common Problems and Fixes](#common-problems-and-fixes)
6. [Database Maintenance](#database-maintenance)
7. [Managing Student Accounts](#managing-student-accounts)
8. [Semester Transition Checklist](#semester-transition-checklist)
9. [Updating the System](#updating-the-system)
10. [File Storage and Uploads](#file-storage-and-uploads)
11. [Logs](#logs)
12. [Security Reminders](#security-reminders)

---

## Starting the System

You need three things running: MySQL, the backend server, and the frontend server.

**Step 1 - Start MySQL**

Open Windows Services: press `Win + R`, type `services.msc`, press Enter.  
Find **MySQL80** (or similar), right-click it, and click Start.  
If it is already running, skip this step.

**Step 2 - Start the Backend**

Open a Command Prompt or PowerShell window and run:
```
cd "C:\Users\Ian\OneDrive\Documents\OJT_Project\ESO_Auditing_System_v1\server"
npm run dev
```

Leave this window open. You should see: `Server running on port 5000`

**Step 3 - Start the Frontend**

Open another Command Prompt or PowerShell window and run:
```
cd "C:\Users\Ian\OneDrive\Documents\OJT_Project\ESO_Auditing_System_v1\client"
npm run dev
```

Leave this window open. You should see: `Local: http://localhost:5174`

The system is now running and accessible on the same machine at `http://localhost:5174`.

---

## Stopping the System

To stop either server, click the terminal window and press `Ctrl + C`.

To stop MySQL, go back to Windows Services, find MySQL80, right-click, and click Stop.

---

## Sharing Access via Cloudflare Tunnel

To let other devices (phones, laptops on other networks) access the system:

Open a third Command Prompt or PowerShell window and run:
```
cloudflared tunnel --url http://localhost:5174
```

After a few seconds it will print a URL like:
```
https://something-random.trycloudflare.com
```

Share that URL with your users. The URL changes every time you restart the tunnel, so you will need to reshare it each session.

**Important:** The tunnel only works while this terminal window is open and your machine is on.

---

## Checking if Everything is Running

Open your browser and visit:

| URL | What It Should Show |
|---|---|
| http://localhost:5174 | The login page of the system |
| http://localhost:5000/api/v1/sysadmin/maintenance/status | A JSON response (not an error) |

If the login page does not load, the frontend is not running. Go back to Step 3 above.  
If the JSON does not load, the backend is not running. Go back to Step 2 above.

---

## Common Problems and Fixes

**Problem: Backend crashes on start with "Cannot connect to database"**

MySQL is not running or the credentials in `.env` are wrong.

1. Start MySQL via Windows Services.
2. Open `server/.env` and verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are correct.
3. Restart the backend.

**Problem: Frontend shows a blank page or error**

1. Check the frontend terminal for red error text.
2. Try stopping and restarting the frontend with `npm run dev`.
3. Clear your browser cache and reload.

**Problem: Cloudflare tunnel URL is not accessible from other devices**

1. Make sure the frontend is running first.
2. Make sure the tunnel terminal is still open.
3. Try running the tunnel command again to get a fresh URL.
4. Check that the other device has internet access.

**Problem: Images or avatars are not loading**

Cloudinary may be misconfigured. Check these values in `server/.env`:
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Log in to your Cloudinary account and verify the values match.

**Problem: A user says they cannot log in**

1. Log in to the system as System Admin.
2. Go to Accounts.
3. Find the user and check their account status. If it is inactive or locked, reactivate it.
4. If they forgot their password, edit their account and set a temporary password, then tell them to change it in Settings.

**Problem: The system shows a maintenance screen to everyone**

1. Log in as System Admin (maintenance mode does not block system admins).
2. Go to Settings.
3. Toggle Maintenance Mode to OFF and save.

---

## Database Maintenance

**Accessing the database directly**

Use MySQL Workbench or the command line:
```
mysql -u root -p eso_auditing_db
```

**Taking a database backup**

Run this in Command Prompt (replace the path as needed):
```
mysqldump -u root -p eso_auditing_db > backup_YYYY-MM-DD.sql
```

Do this before any major changes like a semester transition or schema update.

**Restoring from a backup**
```
mysql -u root -p eso_auditing_db < backup_YYYY-MM-DD.sql
```

**Viewing audit logs from the database**
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;
```

**Checking for locked accounts**
```sql
SELECT user_id, email, status, failed_login_attempts FROM users WHERE status = 'locked';
```

**Manually unlocking an account**
```sql
UPDATE users SET status = 'active', failed_login_attempts = 0 WHERE email = 'student@example.com';
```

---

## Managing Student Accounts

**Importing students in bulk**

1. Log in as System Admin or ESO Officer.
2. Go to Import (in the sidebar).
3. Prepare a CSV file with the following columns:

| Column | Example |
|---|---|
| student_no | 2021-00001 |
| first_name | Juan |
| last_name | dela Cruz |
| email | juan@marsu.edu.ph |
| program_code | BSCE |
| year_level | 2 |
| section | A |
| gender | Male |

4. Upload the file and click Import.
5. Students will receive accounts with a default password. Have them change it on first login.

**Creating a single student account**

Students can register themselves at the signup page. Their account is activated immediately after registration.

**Deactivating a student account**

Go to System Admin > Accounts, find the student, and set their status to Inactive. They will no longer be able to log in.

---

## Semester Transition Checklist

At the end of each semester, do the following in order:

| Step | Task |
|---|---|
| 1 | Take a full database backup before making any changes |
| 2 | Log in as System Admin and go to Settings |
| 3 | Update the School Year and Current Semester to the new values |
| 4 | Save the settings |
| 5 | Go to System Settings and use the Year Advancement feature if students need to move up a year level |
| 6 | Verify that obligations for the new semester have been created by the ESO Officer |
| 7 | Confirm that clearances from the previous semester are archived and visible in reports |

---

## Updating the System

If a developer has made code changes and you need to apply them:

**Step 1 - Pull the latest code**
```
cd "C:\Users\Ian\OneDrive\Documents\OJT_Project\ESO_Auditing_System_v1"
git pull
```

**Step 2 - Install any new dependencies**
```
cd server
npm install

cd ../client
npm install
```

**Step 3 - Apply any database changes**

If the developer has provided a new SQL file or migration script, run it:
```
mysql -u root -p eso_auditing_db < update_script.sql
```

**Step 4 - Restart the servers**

Stop both the backend and frontend if they are running, then start them again.

---

## File Storage and Uploads

**Profile photos and avatars:** Stored in Cloudinary. No local files are involved.

**PDF document templates:** Stored locally in the server machine at:
```
server/uploads/pdf-templates/
```

Back up this folder periodically if you have uploaded custom PDF templates.

**Payment proof images:** Stored in Cloudinary.

---

## Logs

The backend prints logs to the terminal in real time using Morgan. These include every HTTP request made to the server.

To save logs to a file, run the backend like this:
```
npm run dev > server.log 2>&1
```

This writes all output to `server.log` in the server folder.

Audit logs (who did what and when) are stored in the database `audit_logs` table and are viewable in the System Admin panel under Audit Logs.

---

## Security Reminders

| Item | Reminder |
|---|---|
| .env file | Never share or commit the `.env` file to git. It contains database passwords and JWT secrets. |
| System Admin password | Change the default system admin password immediately after first login. |
| Cloudflare URL | The tunnel URL is public. Anyone with the link can reach the login page. Make sure all accounts have strong passwords. |
| Database backups | Keep backups in a separate location, not just on the same machine. |
| MySQL root password | Use a strong password for the MySQL root account. Do not use root credentials in the `.env` file if possible; create a dedicated database user instead. |
| Account lockout | After 5 failed login attempts, accounts are automatically locked. Unlock them through the System Admin panel, not directly in the database, so the action is logged. |
