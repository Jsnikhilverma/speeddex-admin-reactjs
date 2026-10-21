# Speeddex Construction CRM + HRMS — Admin Portal

Enterprise Admin Frontend for **Speeddex Construction** (Indore, Madhya Pradesh, India), built with **React JS**, **JavaScript**, **Tailwind CSS**, and **Lucide React**.

---

## 🚀 Quick Start

### 1. Ensure the Backend is Running
The backend (`backendspeed`) runs on `http://localhost:5000`.
```bash
cd backendspeed
npm run dev
```

### 2. Start the Admin Frontend
The admin dashboard runs on `http://localhost:3000` with an automatic Vite reverse proxy to port `5000`.
```bash
cd admin
npm install
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🔑 Default Super Admin Credentials
Click the **"Auto-fill"** demo button on the login screen, or enter:
- **Email**: `admin@speeddexconstruction.com`
- **Password**: `Admin@Speeddex2026!`

---

## 🛠️ Key Features Implemented

1. **Authentication & Security (`/api/v1/auth/*`)**
   - JWT Access Token (15 mins) + Cryptographic Refresh Token (7 days) with automated silent renewal
   - Super Admin Auto-fill & password visibility toggle
   - Forgot Password & Cryptographic Reset Token flow
   - Password change with strength validation and automatic session re-authentication

2. **Team & User Control (`/api/v1/users` & `/api/v1/auth/users/:id/*`)**
   - Live paginated employee directory
   - Real-time search by Name, Email, and 10-digit Indian Mobile number
   - Filter by Role (`SUPER_ADMIN`, `MANAGER`, `HR`, `SALES`) and Status (`Active` / `Inactive`)
   - **Add New Member Modal**: Indian phone validation (`+91`), strong password generator, and granular permissions selection
   - **Edit Role & Permissions Modal**: Assign base role + custom granular permissions matrix with session revocation warning
   - **User Status Toggle**: Instant activation/deactivation with self-protection safeguards
   - **Soft-Delete Safeguards**: Super Admin removal protection

3. **Live System Diagnostics & Telemetry (`/api/v1/health`)**
   - Real-time MongoDB connection latency (ms) and host status
   - Node.js engine version, Process ID (PID), and server uptime
   - RAM RSS and Heap allocation gauge with visual percentage meter
   - Indian Standard Time (IST, Asia/Kolkata) clock for Indore headquarters
   - Interactive Ping Probe tool

4. **Security Audit Trail (`/api/v1/audit-logs`)**
   - Cryptographically attributed administrative event log
   - Search by actor email, action type (`USER_CREATED`, `USER_ROLE_UPDATED`, `USER_STATUS_UPDATED`, `PASSWORD_CHANGED`)
   - Change diffs and forensic client IP tracking

5. **Executive Dashboard & Roadmap**
   - High-level KPI metric cards
   - Overview of all 12 planned Construction CRM & HRMS modules (Leads, BOQ & Proposals, Attendance, Payroll, Document Vault, Reports)
