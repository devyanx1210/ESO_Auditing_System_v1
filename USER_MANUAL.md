# ESO Auditing System - User Manual

**System:** Engineering Student Organization (ESO) Auditing System  
**Institution:** Marinduque State University - College of Engineering  

This manual explains how to use the system depending on your role. Find your role below and follow the steps.

---

## Table of Contents

1. [How to Access the System](#how-to-access-the-system)
2. [Student Guide](#student-guide)
3. [Class Officer Guide](#class-officer-guide)
4. [Program Officer Guide](#program-officer-guide)
5. [ESO Officer Guide](#eso-officer-guide)
6. [Signatory Guide](#signatory-guide)
7. [Program Head Guide](#program-head-guide)
8. [Dean Guide](#dean-guide)
9. [System Admin Guide](#system-admin-guide)
10. [Common Issues](#common-issues)

---

## How to Access the System

1. Open your browser (Chrome or Edge recommended).
2. Go to the system URL provided by your ESO officer or system admin.
3. Enter your email and password.
4. Click Login.

You will be taken to your dashboard based on your role.

If you do not have an account, click **Sign up here** on the login page and fill in your details. Wait for your account to be activated before you can log in.

---

## Student Guide

### Dashboard

When you log in, you will see your Student Dashboard. It shows:

- Your personal information (name, student number, program, year level)
- Your list of ESO obligations for the current semester
- Your clearance status and progress

### Viewing Your Obligations

Your obligations are listed in the dashboard. Each obligation shows:

| Column | What It Means |
|---|---|
| Obligation | The name of the fee or requirement |
| Amount | How much you need to pay |
| Status | Unpaid, Pending, Paid, or Waived |

**Status meanings:**

| Status | Meaning |
|---|---|
| Unpaid | You have not submitted a payment yet |
| Pending | You submitted a payment and it is being reviewed |
| Paid | Your payment was approved |
| Waived | This obligation was removed for you by an officer |

### Submitting a Payment

1. Find the obligation you want to pay in your dashboard.
2. Click the **Pay** or **Submit Payment** button beside it.
3. Choose your payment method: GCash or Cash.
4. Enter the amount and upload your proof of payment (screenshot or receipt photo).
5. Click Submit.

Your obligation status will change to **Pending** while the officer reviews it.

### Checking Your Clearance

Your clearance tracker shows which steps have been completed. There are 6 steps. Once all 6 steps are signed, you are fully cleared.

If your clearance was rejected at any step, you will see a note explaining why. Fix the issue and your clearance will be resubmitted.

### Updating Your Profile

1. Click **Settings** on the sidebar.
2. Update your name, email, or upload a profile photo.
3. To change your password, fill in your current password and the new one.
4. Click Save.

---

## Class Officer Guide

The Class Officer handles Step 1 of the clearance process.

### Viewing Students

1. Go to **Students** on the sidebar.
2. You will see a list of students assigned to your section.
3. Use the search bar or filter to find a specific student.

### Reviewing Clearances

1. Go to **Students > Clearances**.
2. Students waiting for your signature will appear here.
3. Click a student to view their details.
4. If everything is in order, click **Sign** to approve.
5. If there is an issue, click **Reject** and write a reason. The student will be notified.

### Viewing Obligations

1. Go to **Students > Obligations List**.
2. Select a student to see their full obligation breakdown.

---

## Program Officer Guide

The Program Officer handles Step 2 of the clearance process.

The steps are the same as the Class Officer guide above. You will only see clearances that have already passed Step 1 (Class Officer).

1. Go to **Students > Clearances**.
2. Sign or reject clearances waiting at your step.

---

## ESO Officer Guide

The ESO Officer has the most access in the system.

### Dashboard

Your dashboard shows overall statistics including total students, paid obligations, pending payments, and clearance progress charts.

### Managing Students

**Viewing students:**
1. Go to **Students > Student List**.
2. Search by name or student number.
3. Filter by program, year level, or section.
4. Click a student to view their full profile and obligations.

**Importing students via CSV:**
1. Go to **Students > Import**.
2. Download the CSV template.
3. Fill in student data following the template format.
4. Upload the file and click Import.

### Managing Obligations

1. Go to **Obligations** on the sidebar.
2. Click **Add Obligation** to create a new fee or requirement.
3. Fill in the name, amount, scope (all students, by program, by year level, or by section), and semester.
4. Click Save. The obligation will be assigned to matching students automatically.

To edit or delete an obligation, find it in the list and use the action buttons beside it.

### Verifying Payments

1. Go to **Students > Payments**.
2. Pending payments are listed here.
3. Click a payment to view the submitted proof.
4. Click **Approve**, **Reject**, or **Return** with a remark.

### Processing Clearances (Step 3)

1. Go to **Students > Clearances**.
2. Sign clearances waiting at Step 3.

### Documents (Clearance Certificates)

1. Go to **Documents** on the sidebar.
2. You can create an HTML template for the clearance certificate using the built-in editor.
3. Variables you can use in the template:

| Variable | What It Shows |
|---|---|
| {{full_name}} | Student full name (Last, First) |
| {{student_no}} | Student number |
| {{program}} | Program name |
| {{program_section}} | Program with year and section |
| {{year_section}} | Year level and section |
| {{school_year}} | Current school year |
| {{semester}} | Current semester |
| {{date}} | Date of printing |

4. You can also upload a PDF template and map where each variable should be stamped.
5. To print clearance documents for all cleared students, click **Print All** and select the semester.

### Reports

Go to **Reports** to view and export clearance and obligation summaries by semester.

### Audit and Finance

Go to **Audit** to view a financial summary of collected obligations per semester.

---

## Signatory Guide

The Signatory handles Step 4 of the clearance process.

1. Go to **Students > Clearances**.
2. You will see clearances that have passed Steps 1, 2, and 3.
3. Sign or reject as needed.

---

## Program Head Guide

The Program Head handles Step 5 of the clearance process.

1. Go to **Students > Clearances**.
2. You will see clearances that have passed Steps 1 through 4.
3. Sign or reject as needed.

---

## Dean Guide

The Dean handles Step 6, which is the final step of the clearance process.

1. Go to **Students > Clearances**.
2. You will see clearances that have passed all previous steps.
3. Signing at this step marks the student as fully cleared.

---

## System Admin Guide

The System Admin does not handle clearances. This role manages the system itself.

### Managing Accounts

1. Go to **Accounts** on the sidebar.
2. You will see all officer and admin accounts.
3. To create a new account, click **Add Account** and fill in the details including name, email, password, and role.
4. To edit an account, click the edit icon beside it.
5. To deactivate an account without deleting it, use the status toggle.
6. To delete an account permanently, click the delete icon.

### System Settings

1. Go to **Settings** on the sidebar.
2. You can update the current school year and semester.
3. You can turn maintenance mode ON or OFF and set the message students will see during maintenance.
4. You can configure which role handles which clearance step under the Workflow section.

### Importing Students

1. Go to **Import** on the sidebar.
2. Upload a CSV file with student data.
3. The system will create student accounts in bulk.

### Audit Logs

1. Go to **Audit Logs** on the sidebar.
2. All system actions are recorded here including logins, approvals, account changes, and more.
3. Use the search bar to filter by user name, action type, or date.

---

## Common Issues

| Problem | What to Do |
|---|---|
| Cannot log in | Check that your email and password are correct. If you have tried 5 times, your account is locked. Contact your system admin. |
| Page says System is under maintenance | The system admin has turned on maintenance mode. Wait for it to be turned off. |
| Payment status is still Pending after a long time | Contact your ESO officer to check if your payment proof was received. |
| Cannot submit a payment | Make sure your file is a clear image or PDF. Try a smaller file size. |
| Clearance is not moving to the next step | The officer at the current step may not have signed yet. You can follow up with them directly. |
| Profile photo is not saving | Try a smaller image file. Accepted formats are JPG and PNG. |
| Page shows an error or goes blank | Refresh the page. If it continues, contact your system admin. |
