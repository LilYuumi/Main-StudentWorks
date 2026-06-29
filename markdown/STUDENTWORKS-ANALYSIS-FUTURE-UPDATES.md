# StudentWorks Qoder - Project Analysis & Future Update Guide

**Project Date:** June 2026  
**Current Version:** 1.0.0 (MVP)  
**Status:** Functional with completed core features

---

## 1. PROJECT OVERVIEW

### Vision & Purpose
**StudentWorks** is a two-sided digital talent marketplace platform specifically designed for **Institut Desain dan Bisnis (IDB) Bali**. It bridges verified student talents with local MSMEs/Startups needing digital services.

**Tagline:** *"Kuliah. Kerja. Berkembang."* (Study. Work. Develop.)

### Target Users
- **Mahasiswa (Students):** Digital talent providers with verified academic skills
- **Klien (Clients):** MSMEs/Startups hiring students for projects
- **Admin:** Platform overseer managing Safe Zone, escrow verification, and moderation

---

## 2. TECHNOLOGY STACK

### Backend
- **Framework:** Express.js (Node.js)
- **Language:** JavaScript (CommonJS)
- **Database:** SQLite with `better-sqlite3`
- **Session Management:** `express-session` + `express-flash`
- **Password Hashing:** `bcryptjs` v3.0.3
- **File Uploads:** Multer v2.1.1

### Frontend
- **Template Engine:** EJS (Embedded JavaScript)
- **CSS Framework:** Tailwind CSS (CDN)
- **Animations:** GSAP v3.12.5 + ScrollTrigger
- **Icons:** Lucide Icons (via unpkg CDN)
- **Typography:** Plus Jakarta Sans + Inter (Google Fonts)

### Development
- **Dev Server:** Nodemon (auto-reload)
- **Node Version:** Compatible with v18+

### Key Dependencies
```json
{
  "bcryptjs": "^3.0.3",
  "better-sqlite3": "^12.10.0",
  "ejs": "^6.0.1",
  "express": "^5.2.1",
  "express-flash": "^0.0.2",
  "express-session": "^1.19.0",
  "multer": "^2.1.1",
  "nodemon": "^3.1.14" (dev)
}
```

---

## 3. CORE FEATURES & FUNCTIONALITY

### 3.1 Role-Based Access Control (RBAC)
Three distinct user roles with specific capabilities:

**Student (Mahasiswa)**
- Create and manage talent profiles with skills
- Apply for client projects (except during Safe Zone)
- Submit work deliverables with file uploads
- View ratings and reviews
- Chat with clients in real-time
- Access dashboard showing active/completed projects

**Client (Klien)**
- Post projects with budget, description, and deadlines
- Browse and hire verified student talents
- Upload escrow payment proof
- Review and approve student submissions
- Rate students and leave feedback
- Chat with hired students

**Admin**
- Manage academic calendar (Safe Zone dates)
- Verify escrow payments and unlock funds
- Monitor all projects and users
- Access analytics dashboard
- Handle dispute resolution

### 3.2 "Safe Zone" Feature
An innovative academic-priority mechanism that blocks freelance work during exam periods.

**How It Works:**
1. Admin sets exam date ranges in the Admin Dashboard
2. When current date falls within range, `is_safe_zone` is TRUE globally
3. All student profile hire buttons are disabled with warning:  
   ⚠️ *"Safe Zone Aktif (Minggu Ujian - Fokus Belajar)"*
4. Prevents students from taking new projects during UTS/UAS
5. Queries `academic_calendar` table in real-time

**Database Integration:**
- Table: `academic_calendar` (tanggal_mulai, tanggal_selesai, is_active)
- Global state: `res.locals.globalSafeZone` in middleware

### 3.3 Skill Verification System
Automated integration with simulated academic records (SIAKAD mock):

**Flow:**
1. Student enters NIM (Student ID) during profile creation
2. System queries `simulated_siakad` table
3. If `nilai_akhir == 'A'`, skill receives badge: **"Terverifikasi Kompeten (Nilai A)"**
4. Badge displays with IDB Blue (#0F4C81) background and white text

**Database Tables:**
- `simulated_siakad`: NIM, mata_kuliah, nilai_akhir (A/B/C/D/E)
- `skills`: Linked to student profiles with verification status

### 3.4 Escrow Payment System
Secure transaction handling with three-phase workflow:

**Phase 1: Hiring & Payment Setup**
- Client hires student → project status: "Sedang Dikerjakan"
- Escrow status: "Menunggu Pembayaran"
- Client shown static bank details for manual transfer

**Phase 2: Admin Verification**
- Client uploads payment proof screenshot
- Admin reviews in Dashboard
- Clicks "Setujui Pembayaran" → status: "Dana Dikunci"
- Student can now proceed with work

**Phase 3: Fund Release**
- Student submits completed work
- Client approves submission
- Admin releases escrow: status "Dana Dicairkan"
- Funds transferred to student account

**Tables:**
- `escrow_transactions`: project_id, jumlah_dana, status, bukti_transfer_path
- Project statuses: Mencari Talenta → Sedang Dikerjakan → Dalam Peninjauan → Selesai

### 3.5 Project Management
Comprehensive project lifecycle tracking:

**Project Statuses:**
- **Mencari Talenta** (Seeking Talent): Open for applications
- **Sedang Dikerjakan** (In Progress): Talent hired, escrow locked
- **Dalam Peninjauan** (Under Review): Work submitted, awaiting approval
- **Selesai** (Complete): Project finished, escrow released
- **Dibatalkan** (Cancelled): Project cancelled by client or admin

**Project Fields:**
- judul_proyek, deskripsi
- anggaran (IDR budget)
- tenggat_waktu (deadline)
- mahasiswa_id (FK to hired student)
- klien_id (FK to client)

### 3.6 Chat System
Real-time communication between clients and hired students:

**Features:**
- Message history stored in `chat_messages` table
- Project-specific chat (one per project)
- Timestamps for all messages
- Read/unread status tracking

**Table:** `chat_messages` (project_id, sender_id, message, created_at)

### 3.7 Submission & Review System
Students submit work, clients provide feedback:

**Flow:**
1. Student uploads files to project submission page
2. Files stored in `uploads/` directory
3. `project_submissions` table tracks upload metadata
4. Client reviews and approves/requests changes
5. `project_reviews` table stores ratings (1-5 stars) and feedback

**Tables:**
- `project_submissions`: project_id, file_path, submitted_at
- `project_reviews`: project_id, rating, feedback, created_at

---

## 4. DATABASE SCHEMA

### Core Tables

#### `users`
```sql
id (PK)
name (VARCHAR)
email (VARCHAR, UNIQUE)
password (VARCHAR, hashed)
role (ENUM: mahasiswa, klien, admin)
created_at (TIMESTAMP)
```

#### `student_profiles`
```sql
id (PK)
user_id (FK → users)
nim (Nomor Induk Mahasiswa)
jurusan (VARCHAR: Bisnis Digital, Desain Grafis, TI, etc.)
bio (TEXT, optional)
is_safe_zone (BOOLEAN, DEFAULT: false)
verification_status (ENUM: unverified, pending, verified)
created_at (TIMESTAMP)
```

#### `skills`
```sql
id (PK)
student_id (FK → student_profiles)
skill_name (VARCHAR)
proficiency (ENUM: pemula, menengah, ahli)
is_verified (BOOLEAN)
nilai_akhir (CHAR: A/B/C/D/E for SIAKAD matching)
created_at (TIMESTAMP)
```

#### `simulated_siakad`
```sql
id (PK)
nim (VARCHAR, matches student_profiles.nim)
mata_kuliah (VARCHAR)
nilai_akhir (CHAR: A/B/C/D/E)
semester (INT)
```

#### `projects`
```sql
id (PK)
klien_id (FK → users)
judul_proyek (VARCHAR)
deskripsi (TEXT)
anggaran (BIGINT, in IDR)
tenggat_waktu (DATE)
status (ENUM: Mencari Talenta, Sedang Dikerjakan, Dalam Peninjauan, Selesai, Dibatalkan)
mahasiswa_id (FK → users, nullable)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `escrow_transactions`
```sql
id (PK)
project_id (FK → projects, UNIQUE)
jumlah_dana (BIGINT, in IDR)
status (ENUM: Menunggu Pembayaran, Dana Dikunci, Dana Dicairkan, Dibatalkan)
bukti_transfer_path (VARCHAR, nullable)
admin_verified_at (TIMESTAMP, nullable)
created_at (TIMESTAMP)
```

#### `project_submissions`
```sql
id (PK)
project_id (FK → projects)
mahasiswa_id (FK → users)
file_path (VARCHAR)
original_filename (VARCHAR)
submitted_at (TIMESTAMP)
status (ENUM: submitted, approved, rejected)
```

#### `project_reviews`
```sql
id (PK)
project_id (FK → projects)
klien_id (FK → users)
mahasiswa_id (FK → users)
rating (INT: 1-5)
feedback (TEXT)
created_at (TIMESTAMP)
```

#### `academic_calendar`
```sql
id (PK)
event_name (VARCHAR: UTS, UAS, etc.)
tanggal_mulai (DATE)
tanggal_selesai (DATE)
is_active (BOOLEAN, DEFAULT: true)
created_at (TIMESTAMP)
```

#### `chat_messages`
```sql
id (PK)
project_id (FK → projects)
sender_id (FK → users)
message (TEXT)
is_read (BOOLEAN, DEFAULT: false)
created_at (TIMESTAMP)
```

---

## 5. DIRECTORY STRUCTURE

```
Student-works-qoder/
│
├── db/
│   ├── database.js         # SQLite initialization & exports
│   ├── migrate.js          # Schema creation (run once)
│   ├── seed.js             # Dummy data population
│   └── studentworks.db     # SQLite database file
│
├── middleware/
│   └── auth.js             # Authentication checks, role verification
│
├── routes/
│   ├── auth.js             # Login, register, logout flows
│   ├── landing.js          # Public landing page
│   ├── mahasiswa.js        # Student dashboard, profile, projects
│   ├── klien.js            # Client dashboard, project management
│   ├── admin.js            # Admin dashboard, escrow, calendar
│   └── chat.js             # Chat functionality routes
│
├── views/
│   ├── landing.ejs         # Public homepage
│   ├── login.ejs           # Login form
│   ├── register.ejs        # Registration form
│   ├── 404.ejs             # Error page
│   │
│   ├── partials/
│   │   ├── header.ejs      # Navigation, styles, scripts (shared)
│   │   └── footer.ejs      # Footer (shared)
│   │
│   ├── mahasiswa/
│   │   ├── dashboard.ejs   # Student home, quick stats, active projects
│   │   └── proyek.ejs      # Browse available projects
│   │
│   ├── klien/
│   │   ├── dashboard.ejs   # Client home, project management
│   │   ├── proyek-list.ejs # View all client projects
│   │   ├── proyek-baru.ejs # Create new project form
│   │   └── talenta.ejs     # Browse & hire student talents
│   │
│   ├── admin/
│   │   └── dashboard.ejs   # Escrow verification, calendar, user management
│   │
│   └── chat/
│       └── index.ejs       # Chat interface for projects
│
├── public/
│   ├── images/
│   │   └── logo.png        # StudentWorks logo
│   │
│   └── css/
│       └── custom.css      # Additional custom styles (if needed)
│
├── uploads/                # User-uploaded files (payment proofs, submissions)
│   └── [timestamp-based filenames]
│
├── server.js               # Express app initialization & middleware setup
├── package.json            # Dependencies
├── package-lock.json       # Locked versions
├── overview.md             # Project checkpoint (this doc)
├── skill.md                # SRS & feature specs
└── ui.md                   # UI/UX design system guide
```

---

## 6. DESIGN SYSTEM & UI

### Color Palette (Tailwind Custom Tokens)

| Token | Hex | Usage |
|-------|-----|-------|
| `idb-blue` | #0F4C81 | Primary brand, buttons, links, badges |
| `idb-blue-dark` | #1A365D | Headings, dark backgrounds, gradients |
| `idb-blue-light` | #2B6CB0 | Accent, hover states |
| `idb-orange` | #FF6B35 | CTAs, highlights, highlights |
| `idb-orange-light` | #E28743 | Secondary orange |
| `idb-charcoal` | #2D3748 | Body text |
| `idb-gray` | #F7FAFC | Page background, sections |
| `idb-green` | #48BB78 | Success, released payments |
| `idb-amber` | #ECC94B | Warnings, Safe Zone indicator |

### Typography
- **Headings:** Plus Jakarta Sans (400–800 weight), -0.02em letter spacing
- **Body:** Inter (300–700 weight), 1.7 line height
- **All text:** idb-charcoal (#2D3748)

### Component Classes
All defined in `header.ejs` `<style>` block:

**Buttons:**
- `.btn-blue` / `.btn-orange` / `.btn-green` / `.btn-red`
- `.btn-ghost` (transparent outline)
- `.btn-disabled` (muted state)

**Cards:**
- `.card` (white, shadow, border)
- `.card-flat` (white, border, no shadow)

**Status Badges:**
- `.badge-verified` (blue pill)
- `.status-chip--[color]` (gray/blue/amber/green/red)

**Alerts:**
- `.safe-zone-banner` (amber gradient)
- `.escrow-banner` (conditional states)

**Forms:**
- `.input` (full-width, styled inputs)
- `.dropzone` (file upload area)

---

## 7. CURRENT STATE CHECKPOINT

### ✅ Completed Features
- [x] Three-role authentication (Mahasiswa, Klien, Admin)
- [x] Student profile creation with skill listing
- [x] SIAKAD skill verification (mock integration)
- [x] Safe Zone feature with admin calendar control
- [x] Project creation and browsing
- [x] Escrow payment workflow (3-phase)
- [x] Chat messaging between clients & students
- [x] Work submission & review system
- [x] User ratings & feedback
- [x] Admin dashboard for verification & moderation
- [x] Responsive Tailwind CSS UI with IDB branding
- [x] Database migrations & seeding

### ⚠️ Known Limitations & Future Improvements

#### Backend Enhancements
1. **Notifications:**
   - Add in-app notifications for project updates
   - Email notifications for important events (project hired, payment approved)
   - Real-time notifications using Socket.io instead of polling

2. **Payment Processing:**
   - Integrate actual payment gateway (Midtrans, Stripe, GCash)
   - Remove manual escrow verification process
   - Implement automatic fund release on approval

3. **Skill Verification:**
   - Real SIAKAD API integration instead of mock table
   - Batch skill verification for multiple students
   - Admin approval workflow for edge cases

4. **Security:**
   - Add CSRF protection (currently may be vulnerable)
   - Implement rate limiting on login attempts
   - Add 2FA for admin accounts
   - Input sanitization to prevent SQL injection (use parameterized queries)
   - File upload validation (check mime types, size limits)

5. **Analytics:**
   - Dashboard metrics: total projects, earnings, completion rate
   - Charts showing trends over time
   - Export reports (CSV/PDF)

#### Frontend Enhancements
1. **UI/UX:**
   - Dark mode toggle (extend Tailwind config)
   - Mobile app (React Native or Flutter)
   - Improved error handling with user-friendly messages
   - Loading states and skeleton screens

2. **Accessibility:**
   - WCAG 2.1 AA compliance
   - Keyboard navigation throughout
   - Screen reader testing

3. **Performance:**
   - Image optimization (lazy loading, WebP)
   - Database query optimization & indexing
   - Caching strategies (Redis for session data)
   - CDN for static assets

#### Features to Consider
1. **Dispute Resolution:**
   - Formal process for project conflicts
   - Mediation system for refunds

2. **Trending & Discovery:**
   - Top-rated talents carousel
   - Trending projects section
   - Search & filtering improvements

3. **Gamification:**
   - Achievement badges
   - Leaderboards
   - Points/rewards system

4. **Community:**
   - Student blog/articles
   - Skill workshops or webinars
   - Testimonials & success stories

---

## 8. INSTALLATION & SETUP

### Prerequisites
- Node.js v18+
- npm or yarn

### Quick Start
```bash
# Install dependencies
npm install

# Setup database (create schema)
npm run migrate

# Seed dummy data (optional)
npm run seed

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables
Create `.env` file (if needed):
```
PORT=3000
NODE_ENV=development
SESSION_SECRET=studentworks-secret-key-2026
DATABASE_PATH=./studentworks.db
```

### Scripts
- `npm start` → Production server
- `npm run dev` → Development with nodemon
- `npm run migrate` → Create database schema
- `npm run seed` → Populate dummy data
- `npm run setup` → Run both migrate + seed

---

## 9. TESTING CHECKLIST

### User Registration & Auth
- [ ] Register as Mahasiswa
- [ ] Register as Klien
- [ ] Login/logout flows
- [ ] Session persistence
- [ ] Role-based routing

### Mahasiswa Features
- [ ] Create/edit profile with NIM
- [ ] Add skills and verify with SIAKAD mock
- [ ] Browse available projects
- [ ] Apply for projects (outside Safe Zone)
- [ ] Submit work files
- [ ] Chat with clients
- [ ] View ratings/reviews

### Klien Features
- [ ] Create new project with budget & deadline
- [ ] Browse student talents by skill
- [ ] Hire student (escrow created)
- [ ] Upload payment proof
- [ ] Review & approve submissions
- [ ] Rate student after completion
- [ ] Message with hired student

### Admin Features
- [ ] Set/manage academic calendar
- [ ] Verify escrow payments
- [ ] Release funds to students
- [ ] Moderate content/users
- [ ] View dashboard analytics

### Safe Zone Feature
- [ ] Admin sets exam dates
- [ ] Hire buttons disable during exam period
- [ ] Warning message displays
- [ ] Buttons re-enable after exam period

### Escrow System
- [ ] Payment proof upload
- [ ] Admin approval flow
- [ ] Fund locking & release
- [ ] Transaction history visible

---

## 10. DEPLOYMENT NOTES

### Recommended Hosting
- **Server:** Heroku, Render, DigitalOcean, AWS
- **Database:** SQLite (file-based) OR migrate to PostgreSQL for production
- **File Storage:** AWS S3 or local volumes for uploads
- **Email:** SendGrid or Mailgun for notifications

### Pre-Deployment Checklist
- [ ] Change SESSION_SECRET to secure random string
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Setup database backups
- [ ] Configure file upload limits
- [ ] Test all payment workflows
- [ ] Review security headers

### Database Migration (to PostgreSQL)
If migrating from SQLite:
1. Create migration script from SQLite → PostgreSQL schema
2. Use `sequelize-cli` or `knex` for version control
3. Update `db/database.js` connection logic
4. Test all queries for compatibility

---

## 11. KEY FILES REFERENCE

| File | Purpose | Key Content |
|------|---------|------------|
| `server.js` | App bootstrap | Port setup, middleware, route mounting, Safe Zone check |
| `db/database.js` | DB connection | SQLite init, prepared statements |
| `routes/mahasiswa.js` | Student routes | Profile, projects, submissions |
| `routes/klien.js` | Client routes | Project CRUD, escrow management |
| `routes/admin.js` | Admin routes | Calendar, verification, dashboard |
| `views/partials/header.ejs` | Master template | Styles, CDN scripts, color config |
| `skill.md` | Requirements doc | Full SRS and feature specs |
| `ui.md` | Design system | Colors, components, typography |

---

## 12. COMMON ISSUES & FIXES

### Issue: Database locked error
**Solution:** Close other connections, ensure `better-sqlite3` isn't running multiple processes

### Issue: Students can still apply during Safe Zone
**Solution:** Check `res.locals.globalSafeZone` is updated in middleware, verify academic_calendar dates

### Issue: Uploaded files not accessible
**Solution:** Ensure `/uploads` route is public in Express, check file permissions

### Issue: EJS templates not rendering variables
**Solution:** Verify variables are passed in route handler with `res.render('view', { data })`

### Issue: Tailwind CSS not loading
**Solution:** Check CDN link in `header.ejs`, clear browser cache, verify custom config is present

---

## 13. ROADMAP FOR FUTURE VERSIONS

### v1.1 (Next Sprint)
- Real payment gateway integration
- Email notifications
- Search & advanced filtering
- Student portfolio/work samples

### v1.2 (Mid-term)
- Socket.io real-time chat
- Video call integration
- Advanced analytics dashboard
- Dispute resolution system

### v2.0 (Long-term)
- Mobile app (React Native)
- AI-powered talent matching
- Skill marketplace expansion
- Corporate partnerships

---

## 14. SUPPORT & CONTACT

For issues, questions, or contributions:
- Check `overview.md` for quick reference
- Review `skill.md` for feature specifications
- Refer to `ui.md` for design guidelines
- Test with seeded dummy data first

**Project Status:** Actively maintained  
**Last Updated:** June 29, 2026  
**Version:** 1.0.0 (MVP)

---

**End of Document**
