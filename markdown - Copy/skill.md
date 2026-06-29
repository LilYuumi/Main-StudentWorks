# Software Requirement Specification (SRS) & Design Prompt - StudentWorks MVP

## 1. Project Overview & Vision
**StudentWorks** is a two-sided digital talent marketplace web application designed specifically to bridge the gap between **active college students** (as digital talent providers) and **local MSMEs/Startups** (as clients/employers). 

The goal of this MVP (Minimum Viable Product) is to validate the core features within a university ecosystem—initially tailored for **Institut Desain dan Bisnis (IDB) Bali**—by utilizing smart, simulated integrations rather than complex external APIs.

### Tagline & Localization
*   **Tagline:** *"Kuliah. Kerja. Berkembang."*
*   **Target Language:** All user-facing text, buttons, alerts, and content MUST be written in **Bahasa Indonesia**.

---

## 2. Brand Identity & UI/UX Design Guidelines
The UI must look professional, modern, creative, and highly trustworthy. The color palette is strictly inspired by the official identity of **IDB Bali** (Blue and Orange).

### Color Palette (Hex Codes)
*   **Primary Brand Color (Trust & Academic):** Deep Corporate Blue (`#0F4C81` or `#1A365D`)
*   **Secondary/Accent Color (Energy & Creativity):** Vibrant Orange (`#FF6B35` or `#E28743`)
*   **Neutral Dark (Text):** Charcoal/Off-Black (`#2D3748`)
*   **Neutral Light (Backgrounds):** Clean Gray/White (`#F7FAFC` or `#FFFFFF`)
*   **Status Colors:** Success Green (`#48BB78`), Alert/Safe Zone Amber (`#ECC94B`)

### UI Style Theme
*   **Typography:** Clean sans-serif fonts (e.g., Inter, Poppins, or Roboto).
*   **Layout:** Card-based components with subtle shadows, clean borders, and highly responsive grid layouts (Desktop and Mobile-first).

---

## 3. Tech Stack Specifications
*   **Framework/Language:** PHP with Laravel OR Node.js with Express.js.
*   **Front-End CSS:** Tailwind CSS or Bootstrap 5.
*   **Database:** MySQL or PostgreSQL.
*   **Authentication:** Default framework-based multi-auth handling 3 user roles: `Mahasiswa` (Student), `Klien` (Client), and `Admin`.

---

## 4. Database Schema (Relational MVP Structure)

AI Agent, please generate a database migration script based on this schema. Note that the enum values are localized to Indonesian for consistency.

### `users` Table
*   `id` (PK)
*   `name`, `email`, `password`
*   `role` (enum: 'mahasiswa', 'klien', 'admin')

### `student_profiles` Table
*   `id` (PK)
*   `user_id` (FK to users)
*   `nim` (Nomor Induk Mahasiswa)
*   `jurusan` (e.g., Bisnis Digital, Desain Grafis, Teknologi Informasi)
*   `skills` (text / json array)
*   `is_safe_zone` (boolean, default: false)

### `simulated_siakad` Table (Academic Data Mockup)
*   `id` (PK)
*   `nim` (varchar)
*   `mata_kuliah` (varchar, e.g., 'Pemrograman Web', 'Desain Grafis', 'Copywriting')
*   `nilai_akhir` (char: A, B, C, D, E)
*   *Note: Populate this manually with dummy data to test the skill verification trigger.*

### `projects` Table
*   `id` (PK)
*   `klien_id` (FK to users)
*   `judul_proyek` (varchar)
*   `deskripsi` (text)
*   `anggaran` (bigint / currency field for Rupiah)
*   `tenggat_waktu` (date)
*   `status` (enum: 'Mencari Talenta', 'Sedang Dikerjakan', 'Dalam Peninjauan', 'Selesai')
*   `mahasiswa_id` (FK to users, nullable)

### `escrow_transactions` Table
*   `id` (PK)
*   `project_id` (FK to projects)
*   `jumlah_dana` (bigint)
*   `status` (enum: 'Menunggu Pembayaran', 'Dana Dikunci', 'Dana Dicairkan')
*   `bukti_transfer_path` (string/image path, nullable)

---

## 5. Core MVP Features & Logic Implementation (Indonesian UI Content)

AI Agent, implement the following core workflows using pure backend logic. Ensure all display text is in Indonesian.

### A. Automated Skill Extraction (SIAKAD Mock Integration)
1. When a user with the `Mahasiswa` role completes their profile and enters their `NIM`.
2. The system queries the `simulated_siakad` table using that specific `NIM`.
3. If a record is found where `nilai_akhir == 'A'`, the system automatically applies a text badge next to that specific skill on the student's profile card.
4. **UI Label:** The badge must display text: **"Terverifikasi Kompeten (Nilai A)"** (Styled with IDB Blue background and white text).

### B. Academic Milestone Sync & "Safe Zone" Feature
1. Create a basic form in the `Admin` Dashboard to set an active date range for exams (UTS/UAS).
2. If the current server date falls within this range, the system automatically switches `is_safe_zone` to `true` globally for all students.
3. **UI/UX Impact:** When `is_safe_zone == true`, the hiring action buttons on the student profile must be disabled, turning into a muted color with the warning text: ⚠️ **"Safe Zone Aktif (Minggu Ujian - Fokus Belajar)"**.

### C. Secure Escrow System (Manual Mockup Workflow)
1. Once a client hires a student, the project status shifts to `'Sedang Dikerjakan'`.
2. The client is redirected to a page displaying static bank details for payment. The client uploads an image file as a receipt.
3. The escrow status becomes `'Menunggu Pembayaran'`.
4. The `Admin` reviews the receipt in their dashboard. Upon clicking "Setujui Pembayaran", the status updates to `'Dana Dikunci'`.
5. The student receives an interface alert banner: 🟢 **"Dana telah dikunci oleh sistem. Anda aman untuk mulai bekerja!"**.
6. Upon project completion and client approval, the escrow status updates to `'Dana Dicairkan'`.

---

## 6. App Architecture & User Interface Layouts (In Indonesian)

Please render clean, modern UI templates styled with the specified palette for the following view routes:

### 1. Halaman Utama (Landing Page)
*   **Hero Section:** Prominent header with the tagline *"Kuliah. Kerja. Berkembang."*. A clean dual-call-to-action layout: "Cari Talenta Mahasiswa" (Blue Button) and "Gabung Sebagai Freelancer" (Orange Outline Button).
*   **Value Proposition:** A grid showcasing the core mechanics in Indonesian (Verifikasi Nilai Otomatis, Fitur Perlindungan Kuliah / Safe Zone, Rekening Bersama Aman).

### 2. Dashboard Mahasiswa
*   **Profile Section:** Displays student info with automated **"Terverifikasi Kompeten"** badges.
*   **Kalender Kerja & Kuliah:** Integrated visual calendar matching scheduled academic exam periods (highlighted in soft Orange alert borders) alongside client project milestones (highlighted in deep IDB Blue).
*   **Daftar Proyek:** Overview of current earnings and active assignments.

### 3. Dashboard Klien
*   **Eksplorasi Talenta:** A cleanly designed card deck displaying student profiles, filterable by major or skill, emphasizing the **"Terverifikasi Kompeten"** indicator badges.
*   **Manajemen Proyek:** Simple forms to post open briefs ("Buat Proyek Baru") and clear modals to track project milestones, complete with proof-of-payment upload dropzones.

### 4. Dashboard Admin
*   **Pusat Verifikasi Pembayaran (Escrow):** List of pending payment uploads with side-by-side action buttons: "Setujui" and "Tolak".
*   **Kontrol Kalender Akademik:** Date pickers to activate or deactivate the campus-wide **Safe Zone** status lock manually.

---

## Instructions for AI Agent Generation Execution:
1. Initialize the codebase layout, set up the environment files, and process database migrations using the localized schemas above.
2. Inject a robust set of dummy records into the `simulated_siakad` data pool so that any test login using predefined sample NIM tokens immediately fires the automated skill verification logic.
3. Prioritize clean system functionality and data flow before polishing cosmetic layout properties. Ensure absolutely no English words appear on the public user interface pages.
4.