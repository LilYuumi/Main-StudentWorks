# StudentWorks Qoder - Project Overview & Checkpoint

## 1. Project Summary
StudentWorks is a two-sided digital talent marketplace designed specifically for IDB Bali. It bridges the gap between verified student talents and clients needing digital services. The platform emphasizes academic priority (via the "Safe Zone" feature) and secure transactions (via Escrow).

## 2. Technology Stack
- **Backend Framework:** Node.js with Express.js
- **Database:** SQLite (using `better-sqlite3`)
- **Templating Engine:** EJS (Embedded JavaScript templating)
- **Styling:** Tailwind CSS (via CDN, extended with custom `idb-` prefix tokens)
- **Animations & Icons:** GSAP (landing page) and Lucide Icons
- **Authentication:** Custom session-based auth (`express-session`)

## 3. Core Architecture & Features
### A. Role-Based Access Control (RBAC)
- **Mahasiswa (Student):** Can create profiles, verify skills, apply for projects, submit work, and chat with clients.
- **Klien (Client):** Can create projects, browse verified talents, manage escrow payments, review submissions, and rate students.
- **Admin:** Manages academic calendar (Safe Zone), verifies escrow payments, and oversees users/projects.

### B. "Safe Zone" (Academic Integration)
- A global state managed by `res.locals.globalSafeZone` in `server.js`.
- Queries the `academic_calendar` table for active exam periods (UTS/UAS).
- When active, students are blocked from applying to new projects, forcing them to prioritize their studies.

### C. Escrow Payment Workflow
1. Client selects a talent and the project enters "Dalam Peninjauan" / "Menunggu Pembayaran".
2. Client uploads proof of transfer to the system's Escrow account.
3. Admin verifies the payment. Status changes to "Dana Dikunci" and "Sedang Dikerjakan".
4. Student completes the work and submits files.
5. Client approves the submission. Escrow funds are marked as "Dana Dicairkan" and sent to the student.

### D. Skill Verification System
- Students define skills. The system (or Admin) can mark skills as "Terverifikasi Kompeten (Nilai A)".
- Dummy data in `seed.js` simulates this integration by automatically verifying skills where `nilai_akhir == 'A'`.

## 4. Directory Structure
```text
Student-works-qoder/
├── db/                 # Database schema (migrate.js), seeding (seed.js), and SQLite file
├── middleware/         # Express middleware (auth.js, upload handling)
├── public/             # Static assets (images, uploads, custom css/js)
├── routes/             # Route controllers (admin.js, klien.js, mahasiswa.js, landing.js)
├── views/              # EJS Templates
│   ├── admin/          # Admin dashboards and management views
│   ├── chat/           # Chat interface
│   ├── klien/          # Client dashboards, project creation, talent browsing
│   ├── mahasiswa/      # Student dashboards, project browsing
│   └── partials/       # Reusable UI components (header, footer)
├── server.js           # Application entry point, global configurations
├── skill.md            # MVP Requirement and logic specifications
├── ui.md               # UI design system and CSS tokens
└── overview.md         # This checkpoint document
```

## 5. Database Schema Snapshot
- **users:** Stores auth info, roles (mahasiswa, klien, admin), and profile details.
- **academic_records & skills:** Manages student academic data and verified skills.
- **projects:** Core table tracking project details, budget, deadlines, and status (`Mencari Talenta`, `Sedang Dikerjakan`, `Dalam Peninjauan`, `Selesai`, `Dibatalkan`).
- **project_submissions:** Tracks files uploaded by students for a project.
- **project_reviews:** Stores ratings and feedback from clients.
- **academic_calendar:** Controls the Safe Zone state based on active dates.
- **chat_messages:** Stores real-time communication between Client and Student.

## 6. Current State Checkpoint
- **Status:** Functional MVP.
- **UI/UX:** Fully implemented using the specified IDB Bali design tokens (Blue, Orange, Green) with responsive Tailwind styling.
- **Database:** Migrated and seeded with dummy data for testing all roles.
- **Next Steps:** Ready for review, potential feature expansion, or bug fixes based on testing feedback.
