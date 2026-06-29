# StudentWorks Qoder - Expert Feedback Implementation Guide

**Date:** June 29, 2026  
**Purpose:** Document concrete updates from expert review  
**Status:** Ready for implementation  
**Language:** Indonesian with technical terms

---

## EXECUTIVE SUMMARY

Expert review identified four critical areas needing restructuring:

1. **Database Schema Expansion** - Add MSME autonomy & student commitment tracking
2. **Remove Safe Zone Blocking** - Switch from restrictive to educational model
3. **Update Route Logic** - Implement commitment lock mechanism
4. **Redesign UI/UX** - Add awareness dialogs & replace ratings with trust scores

**Core Philosophy Change:** From *"Platform Blocks Student"* → to *"Student Owns Decision with Full Awareness"*

---

## 1. DATABASE SCHEMA UPDATES

### 1.1 Modify `projects` Table
Add two new columns to support client autonomy and work quality standards:

```sql
-- Migration Step 1: Add custom SLA rules column
ALTER TABLE projects ADD COLUMN custom_sla_rules TEXT NOT NULL DEFAULT 'Fleksibel, komunikatif, dan selesai tepat waktu.';

-- Migration Step 2: Add test requirement flag
ALTER TABLE projects ADD COLUMN requires_test BOOLEAN DEFAULT 0;
```

**Purpose:**
- `custom_sla_rules`: Client specifies work commitment expectations (SLA = Service Level Agreement)
- `requires_test`: Flag whether client requires quality testing/approval before payment release

**Example Values:**
```
custom_sla_rules: 
  "1. Update harian via WhatsApp sebelum jam 21:00
   2. Deadline tidak boleh ditekan tanpa diskusi
   3. Revisi maksimal 2x putaran
   4. Komunikasi responsif dalam 2 jam"

requires_test: 1 (true)
```

### 1.2 Modify `job_applications` Table
Add commitment verification field:

```sql
-- Migration Step 3: Add commitment signature flag
ALTER TABLE job_applications ADD COLUMN commitment_signed BOOLEAN DEFAULT 0;
```

**Purpose:**
- Tracks whether student explicitly acknowledged commitment before applying
- Required for application to be valid (commits to following project rules)
- Prevents "accidental" applications without awareness

**Database Constraint:**
```sql
-- Add constraint: Cannot mark application as accepted if commitment not signed
ALTER TABLE job_applications 
ADD CONSTRAINT chk_commitment_required 
CHECK (status != 'accepted' OR commitment_signed = 1);
```

### 1.3 Create New `commitment_metrics` Table
Replaces/supplements traditional star ratings with behavioral tracking:

```sql
-- Migration Step 4: Create commitment metrics table
CREATE TABLE commitment_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL, -- 'positive' or 'negative'
    score_impact REAL NOT NULL,
    description TEXT,
    logged_by_id INTEGER, -- FK to admin/klien who logged this
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_commitment_user ON commitment_metrics(user_id);
CREATE INDEX idx_commitment_project ON commitment_metrics(project_id);
CREATE INDEX idx_commitment_category ON commitment_metrics(metric_category);
```

**Metric Examples:**

| metric_name | score_impact | metric_category | Description |
|---|---|---|---|
| Update Tepat Waktu | +5.0 | positive | Student provides status update before deadline |
| Komunikasi Responsif | +3.0 | positive | Replies within 2 hours to client message |
| Pengiriman Awal | +10.0 | positive | Submits work before agreed deadline |
| Mangkir/Ghosting | -20.0 | negative | Zero contact for 48+ hours |
| Revisi Berlebihan | -8.0 | negative | Requests more than agreed revision rounds |
| Keterlambatan Signifikan | -15.0 | negative | Late submission beyond deadline |
| Kualitas Rendah | -12.0 | negative | Work doesn't meet basic requirements |
| Kolaborasi Baik | +7.0 | positive | Active contribution & problem-solving |

### 1.4 Updated Database Schema Diagram

```
users (unchanged)
├── id (PK)
├── name, email, password, role
└── created_at

projects (MODIFIED)
├── id (PK)
├── klien_id (FK)
├── judul_proyek, deskripsi
├── anggaran, tenggat_waktu
├── status
├── mahasiswa_id
├── custom_sla_rules          ← NEW
├── requires_test             ← NEW
└── created_at

job_applications (MODIFIED)
├── id (PK)
├── project_id (FK)
├── mahasiswa_id (FK)
├── status
├── applied_at
└── commitment_signed         ← NEW

commitment_metrics (NEW TABLE)
├── id (PK)
├── project_id (FK)
├── user_id (FK)
├── metric_name
├── metric_category
├── score_impact
├── logged_by_id (FK)
└── logged_at

escrow_transactions (unchanged)
project_submissions (unchanged)
chat_messages (unchanged)
academic_calendar (unchanged - repurposed for warnings only)
```

### 1.5 Migration File Implementation

**File: `db/migrate.js`** (Add these to existing migration)

```javascript
const db = require('./database');

// Run existing migrations first...

console.log('Running expert feedback migrations...\n');

try {
  // Migration 1: Add custom SLA rules to projects
  console.log('1. Adding custom_sla_rules column to projects...');
  db.exec(`
    ALTER TABLE projects ADD COLUMN custom_sla_rules TEXT NOT NULL DEFAULT 'Fleksibel, komunikatif, dan selesai tepat waktu.';
  `);
  console.log('   ✓ Done');

  // Migration 2: Add test requirement flag
  console.log('2. Adding requires_test column to projects...');
  db.exec(`
    ALTER TABLE projects ADD COLUMN requires_test BOOLEAN DEFAULT 0;
  `);
  console.log('   ✓ Done');

  // Migration 3: Add commitment tracking to applications
  console.log('3. Adding commitment_signed column to job_applications...');
  db.exec(`
    ALTER TABLE job_applications ADD COLUMN commitment_signed BOOLEAN DEFAULT 0;
  `);
  console.log('   ✓ Done');

  // Migration 4: Create commitment metrics table
  console.log('4. Creating commitment_metrics table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS commitment_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      metric_name VARCHAR(100) NOT NULL,
      metric_category VARCHAR(50) NOT NULL CHECK(metric_category IN ('positive', 'negative')),
      score_impact REAL NOT NULL,
      description TEXT,
      logged_by_id INTEGER,
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (logged_by_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
  console.log('   ✓ Done');

  // Create indexes for performance
  console.log('5. Creating indexes for commitment_metrics...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_commitment_user ON commitment_metrics(user_id);
    CREATE INDEX IF NOT EXISTS idx_commitment_project ON commitment_metrics(project_id);
    CREATE INDEX IF NOT EXISTS idx_commitment_category ON commitment_metrics(metric_category);
  `);
  console.log('   ✓ Done');

  console.log('\n✓ All expert feedback migrations completed successfully!\n');
} catch (err) {
  console.error('Migration error:', err.message);
  process.exit(1);
}
```

---

## 2. SAFE ZONE RESTRUCTURING

### 2.1 Philosophy Change

**OLD MODEL (Blocking):**
```
During exam week:
  Safe Zone = TRUE
    ↓
  globalSafeZone middleware
    ↓
  res.locals.globalSafeZone = true
    ↓
  All Hire/Apply buttons DISABLED
    ↓
  Students CANNOT apply for projects
```

**NEW MODEL (Educational Warning):**
```
During exam week:
  Academic Calendar shows exam dates
    ↓
  Buttons remain ACTIVE
    ↓
  Visual warning indicator displayed
    ↓
  Student sees commitment dialog
    ↓
  Student makes CONSCIOUS CHOICE
    ↓
  Commitment metrics track follow-through
```

### 2.2 Updated Server Middleware

**File: `server.js`** (Modify existing Safe Zone logic)

```javascript
// OLD CODE (REMOVE THIS):
// app.use((req, res, next) => {
//   const today = new Date().toISOString().split('T')[0];
//   const activePeriod = db.prepare(
//     'SELECT * FROM academic_calendar WHERE is_active = 1 AND tanggal_mulai <= ? AND tanggal_selesai >= ?'
//   ).get(today, today);
//   
//   res.locals.globalSafeZone = !!activePeriod;  // ← THIS BLOCKS
// });

// NEW CODE (ADD THIS):
app.use((req, res, next) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if currently in exam period
  const activePeriod = db.prepare(`
    SELECT * FROM academic_calendar 
    WHERE is_active = 1 
    AND tanggal_mulai <= ? 
    AND tanggal_selesai >= ?
  `).get(today, today);
  
  // CHANGE: Set as WARNING only, not BLOCKING
  res.locals.isExamPeriod = !!activePeriod;
  res.locals.examPeriodInfo = activePeriod || null;
  res.locals.examWarningMessage = activePeriod 
    ? `⚠️ Periode UTS/UAS aktif (${activePeriod.tanggal_mulai} s/d ${activePeriod.tanggal_selesai}). Kamu tetap bebas mengambil proyek, namun pastikan prioritas akademikmu terjaga.`
    : null;
  
  // REMOVED: DO NOT disable buttons
  // REMOVED: res.locals.globalSafeZone = !!activePeriod;
  
  next();
});
```

### 2.3 Updated Academic Calendar Logic

**Purpose Change:**
- OLD: Block student actions
- NEW: Provide informational guidance only

**Database Entry Example:**
```sql
INSERT INTO academic_calendar (event_name, tanggal_mulai, tanggal_selesai, is_active) 
VALUES ('UTS Semester Gasal 2026', '2026-10-01', '2026-10-15', 1);
```

**Display Logic in Routes:**
```javascript
// In any mahasiswa route:
if (req.session.user && req.session.user.role === 'mahasiswa') {
  const today = new Date().toISOString().split('T')[0];
  const examPeriod = db.prepare(`
    SELECT * FROM academic_calendar 
    WHERE is_active = 1 
    AND tanggal_mulai <= ? 
    AND tanggal_selesai >= ?
  `).get(today, today);
  
  res.locals.examWarning = {
    isActive: !!examPeriod,
    message: examPeriod ? 
      `Kamu sedang dalam periode ${examPeriod.event_name}. Tetap fokus pada akademik!` 
      : null,
    startDate: examPeriod?.tanggal_mulai,
    endDate: examPeriod?.tanggal_selesai
  };
}
```

---

## 3. ROUTE LOGIC UPDATES

### 3.1 Client Side Updates (routes/klien.js)

**Endpoint: POST /proyek/baru** (Project Creation)

```javascript
router.post('/proyek/baru', authenticateMiddleware, async (req, res) => {
  try {
    // Validate existing fields
    const { judul_proyek, deskripsi, anggaran, tenggat_waktu } = req.body;
    
    // VALIDATE: NEW FIELDS
    let { custom_sla_rules, requires_test } = req.body;
    
    // Sanitize custom_sla_rules (prevent injection)
    if (!custom_sla_rules || custom_sla_rules.trim() === '') {
      custom_sla_rules = 'Fleksibel, komunikatif, dan selesai tepat waktu.';
    }
    // Max 1000 characters to prevent abuse
    if (custom_sla_rules.length > 1000) {
      return res.status(400).json({ 
        error: 'Aturan main terlalu panjang (maks 1000 karakter)' 
      });
    }
    
    // Convert checkbox to boolean
    requires_test = requires_test === 'on' || requires_test === true ? 1 : 0;
    
    // Validate budget and deadline (existing logic)
    if (anggaran < 100000) {
      return res.status(400).json({ error: 'Anggaran minimal Rp 100.000' });
    }
    
    const deadlineDate = new Date(tenggat_waktu);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ error: 'Tenggat waktu harus di masa depan' });
    }
    
    // INSERT with new fields
    const result = db.prepare(`
      INSERT INTO projects (
        klien_id, judul_proyek, deskripsi, anggaran, tenggat_waktu, 
        status, custom_sla_rules, requires_test, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      req.session.user.id,
      judul_proyek,
      deskripsi,
      anggaran,
      tenggat_waktu,
      'Mencari Talenta',
      custom_sla_rules,
      requires_test
    );
    
    res.status(201).json({ 
      success: true, 
      projectId: result.lastID,
      message: 'Proyek berhasil dibuat! Tunggu mahasiswa yang lamar.' 
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Gagal membuat proyek' });
  }
});

// ENDPOINT: GET /proyek/:id (View project details - shows custom rules)
router.get('/proyek/:id', authenticateMiddleware, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as klien_name 
    FROM projects p
    JOIN users u ON p.klien_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!project) {
    return res.status(404).render('404');
  }
  
  // Return data that will populate the client's custom rules input
  res.json({
    id: project.id,
    judul_proyek: project.judul_proyek,
    deskripsi: project.deskripsi,
    anggaran: project.anggaran,
    tenggat_waktu: project.tenggat_waktu,
    custom_sla_rules: project.custom_sla_rules,  // ← NEW FIELD
    requires_test: project.requires_test,        // ← NEW FIELD
    klien_name: project.klien_name
  });
});
```

### 3.2 Student Side Updates (routes/mahasiswa.js)

**Endpoint: POST /proyek/lamar** (Apply for Project)

```javascript
router.post('/proyek/lamar', authenticateMiddleware, (req, res) => {
  try {
    const { project_id } = req.body;
    let { commitment_signed } = req.body;
    
    // Validate project exists
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Proyek tidak ditemukan' });
    }
    
    // CRITICAL: Commitment signature REQUIRED
    commitment_signed = commitment_signed === 'true' || commitment_signed === true ? 1 : 0;
    
    if (!commitment_signed) {
      return res.status(400).json({ 
        error: 'Kamu harus menyetujui komitmen sebelum melamar',
        requiresCommitment: true 
      });
    }
    
    // Check if already applied
    const existing = db.prepare(`
      SELECT * FROM job_applications 
      WHERE project_id = ? AND mahasiswa_id = ?
    `).get(project_id, req.session.user.id);
    
    if (existing) {
      return res.status(400).json({ error: 'Kamu sudah melamar proyek ini' });
    }
    
    // Check Safe Zone / Exam Period (WARNING ONLY, not blocking)
    const today = new Date().toISOString().split('T')[0];
    const examPeriod = db.prepare(`
      SELECT * FROM academic_calendar 
      WHERE is_active = 1 AND tanggal_mulai <= ? AND tanggal_selesai >= ?
    `).get(today, today);
    
    let examWarning = null;
    if (examPeriod) {
      examWarning = `Catatan: Kamu sedang dalam periode ${examPeriod.event_name}. Pastikan akademikmu tetap prioritas!`;
    }
    
    // INSERT application with commitment signature
    const result = db.prepare(`
      INSERT INTO job_applications (
        project_id, mahasiswa_id, status, commitment_signed, applied_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).run(
      project_id,
      req.session.user.id,
      'pending',
      commitment_signed
    );
    
    res.status(201).json({ 
      success: true,
      applicationId: result.lastID,
      message: 'Lamaran berhasil dikirim! Tunggu respons klien.',
      examWarning: examWarning
    });
    
  } catch (err) {
    console.error('Error applying for project:', err);
    res.status(500).json({ error: 'Gagal mengirim lamaran' });
  }
});

// ENDPOINT: GET /proyek/:id/detail (Show project with commitment dialog)
router.get('/proyek/:id/detail', authenticateMiddleware, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as klien_name 
    FROM projects p
    JOIN users u ON p.klien_id = u.id
    WHERE p.id = ? AND p.status = 'Mencari Talenta'
  `).get(req.params.id);
  
  if (!project) {
    return res.status(404).render('404');
  }
  
  // Check exam warning
  const today = new Date().toISOString().split('T')[0];
  const examPeriod = db.prepare(`
    SELECT * FROM academic_calendar 
    WHERE is_active = 1 AND tanggal_mulai <= ? AND tanggal_selesai >= ?
  `).get(today, today);
  
  res.render('mahasiswa/project-detail', {
    project: project,
    examWarning: examPeriod ? {
      isActive: true,
      eventName: examPeriod.event_name,
      startDate: examPeriod.tanggal_mulai,
      endDate: examPeriod.tanggal_selesai
    } : null,
    user: req.session.user
  });
});
```

### 3.3 Add Commitment Metrics Logging

**New Utility Function: `routes/commitment.js`** (Create new file)

```javascript
const express = require('express');
const db = require('../db/database');

// Helper function to log commitment metrics
function logCommitmentMetric(projectId, userId, metricName, scoreImpact, loggedById = null) {
  try {
    // Map metric names to categories
    const positiveMetrics = [
      'Update Tepat Waktu',
      'Komunikasi Responsif',
      'Pengiriman Awal',
      'Kolaborasi Baik',
      'Kualitas Memuaskan'
    ];
    
    const category = positiveMetrics.includes(metricName) ? 'positive' : 'negative';
    
    const result = db.prepare(`
      INSERT INTO commitment_metrics (
        project_id, user_id, metric_name, metric_category, score_impact, logged_by_id, logged_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      projectId,
      userId,
      metricName,
      category,
      scoreImpact,
      loggedById
    );
    
    return result.lastID;
  } catch (err) {
    console.error('Error logging commitment metric:', err);
    return null;
  }
}

// Function to calculate trust score from metrics
function calculateTrustScore(userId) {
  try {
    // Aggregate all metrics for user
    const metrics = db.prepare(`
      SELECT 
        SUM(CASE WHEN metric_category = 'positive' THEN score_impact ELSE 0 END) as positive_score,
        SUM(CASE WHEN metric_category = 'negative' THEN ABS(score_impact) ELSE 0 END) as negative_score,
        COUNT(*) as total_metrics
      FROM commitment_metrics
      WHERE user_id = ?
    `).get(userId);
    
    if (!metrics || metrics.total_metrics === 0) {
      return 100; // New users start with 100%
    }
    
    // Calculate score: 100 - (negative penalties)
    // Base 100, deduct negative impacts, with diminishing returns
    const baseScore = 100;
    const penalty = Math.min(metrics.negative_score || 0, 40); // Cap at -40
    const bonus = Math.min((metrics.positive_score || 0) / 5, 20); // Cap bonus at +20
    
    const trustScore = Math.max(0, Math.min(100, baseScore - penalty + bonus));
    return Math.round(trustScore);
    
  } catch (err) {
    console.error('Error calculating trust score:', err);
    return 100;
  }
}

module.exports = {
  logCommitmentMetric,
  calculateTrustScore
};
```

**Usage in routes (example):**

```javascript
const { logCommitmentMetric, calculateTrustScore } = require('./commitment');

// When client approves student submission:
router.post('/proyek/:id/approve-submission', authenticateMiddleware, (req, res) => {
  // ... existing approval logic ...
  
  // Log positive metric
  logCommitmentMetric(
    projectId,
    studentId,
    'Pengiriman Awal',
    10.0,
    req.session.user.id // logged by client
  );
  
  // ... rest of function ...
});

// When checking student profile:
router.get('/mahasiswa/:id', (req, res) => {
  const student = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?')
    .get(req.params.id, 'mahasiswa');
  
  if (!student) return res.status(404).render('404');
  
  // Calculate dynamic trust score
  const trustScore = calculateTrustScore(student.id);
  
  res.render('student-profile', {
    student: student,
    trustScore: trustScore  // ← Pass to view
  });
});
```

---

## 4. UI/UX UPDATES

### 4.1 Commitment Lock Dialog (Modal)

**File: `views/mahasiswa/proyek.ejs`** (Add to project list view)

```ejs
<!-- Add this modal to the page (hidden by default) -->
<div id="commitmentModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-white rounded-card w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
    
    <!-- Header -->
    <div class="bg-gradient-to-r from-idb-blue-dark to-idb-blue p-6 text-white">
      <h2 class="text-2xl font-heading font-bold">Sadar Diri Sebelum Melamar</h2>
      <p class="text-sm mt-2 opacity-90">Baca aturan main klien dan pastikan kamu siap berkomitmen.</p>
    </div>
    
    <!-- Content -->
    <div class="p-6 space-y-6">
      
      <!-- Client's Custom SLA Rules -->
      <div class="bg-idb-gray p-4 rounded-card border-l-4 border-idb-orange">
        <h3 class="font-heading font-bold text-idb-charcoal mb-3">
          📋 Aturan Main Klien
        </h3>
        <div id="slaRulesContent" class="text-sm text-idb-charcoal whitespace-pre-wrap font-body">
          <!-- Dynamically populated -->
        </div>
      </div>
      
      <!-- Consequence Statement -->
      <div class="bg-amber-50 p-4 rounded-card border-l-4 border-idb-amber">
        <h3 class="font-heading font-bold text-idb-charcoal mb-3">
          ⚠️ Pernyataan Konsekuensi
        </h3>
        <p class="text-sm text-idb-charcoal font-body leading-relaxed">
          IDB Bali memberikanmu <strong>kebebasan penuh</strong> mengelola waktu dan proyek. Kamu boleh mengambil proyek ini meski sedang UTS/UAS. Namun, <strong>kamu bertanggung jawab sepenuhnya</strong> atas:
        </p>
        <ul class="list-disc list-inside mt-3 text-sm text-idb-charcoal space-y-1">
          <li>Nilai akademikmu di kampus</li>
          <li>Kualitas hasil kerja untuk klien</li>
          <li>Memenuhi aturan main yang disepakati</li>
          <li>Komunikasi yang jelas dan responsif</li>
        </ul>
        <p class="text-sm text-idb-charcoal font-bold mt-3 text-red-600">
          🔴 Pelanggaran komitmen berakibat <strong>fatal pada skor reputasimu</strong>.
        </p>
      </div>
      
      <!-- Exam Period Warning (if applicable) -->
      <div id="examWarningBox" class="hidden bg-amber-100 p-4 rounded-card border-l-4 border-idb-amber">
        <h3 class="font-heading font-bold text-idb-charcoal mb-2">
          📚 Catatan Periode Ujian
        </h3>
        <p id="examWarningText" class="text-sm text-idb-charcoal">
          <!-- Dynamically populated -->
        </p>
      </div>
      
      <!-- Commitment Checkbox -->
      <div class="flex items-start space-x-3 bg-blue-50 p-4 rounded-card">
        <input 
          type="checkbox" 
          id="commitmentCheckbox" 
          class="mt-1 w-5 h-5 accent-idb-orange cursor-pointer"
        >
        <label for="commitmentCheckbox" class="text-sm text-idb-charcoal font-body cursor-pointer">
          Saya setuju dengan aturan main di atas dan siap berkomitmen penuh terhadap proyek ini. 
          Saya memahami risiko dan konsekuensinya.
        </label>
      </div>
      
    </div>
    
    <!-- Footer Actions -->
    <div class="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
      <button 
        onclick="closeCommitmentModal()" 
        class="btn btn-ghost px-4 py-2"
      >
        Kembali
      </button>
      <button 
        id="confirmCommitmentBtn" 
        onclick="submitApplication()" 
        disabled
        class="btn btn-orange px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Lamar dengan Komitmen
      </button>
    </div>
    
  </div>
</div>

<!-- JavaScript for modal interaction -->
<script>
let currentProjectData = null;

// Open modal when "Lamar" button clicked
function openCommitmentModal(projectData) {
  currentProjectData = projectData;
  
  // Populate SLA rules
  document.getElementById('slaRulesContent').textContent = projectData.custom_sla_rules;
  
  // Show exam warning if applicable
  if (projectData.isExamPeriod) {
    document.getElementById('examWarningBox').classList.remove('hidden');
    document.getElementById('examWarningText').textContent = 
      `Kamu sedang dalam periode ${projectData.examPeriodInfo}. Pastikan prioritas akademikmu tetap terjaga!`;
  } else {
    document.getElementById('examWarningBox').classList.add('hidden');
  }
  
  // Reset checkbox and show modal
  document.getElementById('commitmentCheckbox').checked = false;
  updateCommitmentButtonState();
  document.getElementById('commitmentModal').classList.remove('hidden');
}

function closeCommitmentModal() {
  document.getElementById('commitmentModal').classList.add('hidden');
  currentProjectData = null;
}

// Enable/disable submit button based on checkbox
document.getElementById('commitmentCheckbox').addEventListener('change', updateCommitmentButtonState);

function updateCommitmentButtonState() {
  const isChecked = document.getElementById('commitmentCheckbox').checked;
  document.getElementById('confirmCommitmentBtn').disabled = !isChecked;
  
  if (isChecked) {
    document.getElementById('confirmCommitmentBtn').classList.remove('opacity-50', 'cursor-not-allowed');
    document.getElementById('confirmCommitmentBtn').classList.add('hover:bg-orange-600');
  } else {
    document.getElementById('confirmCommitmentBtn').classList.add('opacity-50', 'cursor-not-allowed');
  }
}

// Submit application with commitment flag
async function submitApplication() {
  if (!currentProjectData) return;
  
  try {
    const response = await fetch('/proyek/lamar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: currentProjectData.id,
        commitment_signed: true  // ← CRITICAL
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('✓ Lamaran berhasil dikirim!', 'success');
      closeCommitmentModal();
      
      // Redirect after 1.5s
      setTimeout(() => {
        window.location.href = '/mahasiswa/dashboard';
      }, 1500);
    } else {
      showToast(data.error || 'Gagal mengirim lamaran', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// Trigger modal from project card button
document.querySelectorAll('[data-lamar-btn]').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Get project data from DOM or fetch
    const projectId = this.dataset.projectId;
    const projectData = {
      id: projectId,
      custom_sla_rules: this.dataset.slaRules || 'Fleksibel, komunikatif, dan selesai tepat waktu.',
      isExamPeriod: this.dataset.isExamPeriod === 'true',
      examPeriodInfo: this.dataset.examPeriodInfo || ''
    };
    
    openCommitmentModal(projectData);
  });
});
</script>
```

### 4.2 Update Project Card Component

**File: `views/mahasiswa/proyek.ejs`** (Update the project listing)

```ejs
<!-- For each project in the list -->
<% projects.forEach(project => { %>
  <div class="card hover:shadow-lg transition-shadow">
    
    <!-- Header with warning badge if exam period -->
    <div class="flex justify-between items-start mb-4">
      <h3 class="font-heading font-bold text-lg text-idb-charcoal">
        <%= project.judul_proyek %>
      </h3>
      
      <% if (examWarning && examWarning.isActive) { %>
        <span class="status-chip status-chip--amber text-xs">
          📚 Minggu Ujian
        </span>
      <% } %>
      
      <% if (project.requires_test) { %>
        <span class="status-chip status-chip--blue text-xs">
          ✓ Ada Quality Test
        </span>
      <% } %>
    </div>
    
    <!-- Description -->
    <p class="text-sm text-idb-charcoal mb-4 font-body">
      <%= project.deskripsi.substring(0, 100) %>...
    </p>
    
    <!-- Budget & Deadline -->
    <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
      <div>
        <span class="font-semibold text-idb-blue">Anggaran:</span>
        <p class="text-idb-charcoal">Rp <%= project.anggaran.toLocaleString('id-ID') %></p>
      </div>
      <div>
        <span class="font-semibold text-idb-blue">Deadline:</span>
        <p class="text-idb-charcoal"><%= new Date(project.tenggat_waktu).toLocaleDateString('id-ID') %></p>
      </div>
    </div>
    
    <!-- NEW: Custom SLA Rules Preview -->
    <div class="bg-idb-gray p-3 rounded mb-4 border-l-2 border-idb-orange">
      <span class="text-xs font-semibold text-idb-blue uppercase">Aturan Main</span>
      <p class="text-xs text-idb-charcoal mt-1">
        <%= project.custom_sla_rules.substring(0, 80) %>...
      </p>
    </div>
    
    <!-- Action Button -->
    <button 
      data-lamar-btn 
      data-project-id="<%= project.id %>"
      data-sla-rules="<%= project.custom_sla_rules %>"
      data-is-exam-period="<%= examWarning?.isActive || false %>"
      data-exam-period-info="<%= examWarning?.eventName || '' %>"
      class="w-full btn btn-orange"
    >
      Lamar Sekarang
    </button>
    
  </div>
<% }); %>
```

### 4.3 Dashboard: Replace Star Ratings with Trust Score

**File: `views/mahasiswa/dashboard.ejs`** (Update profile section)

```ejs
<!-- OLD CODE (REMOVE THIS):
<div class="rating">
  <% for (let i = 0; i < 5; i++) { %>
    <span class="<%= i < student.rating ? 'text-yellow-400' : 'text-gray-300' %>">★</span>
  <% } %>
  <span class="text-sm text-gray-600">(<%= student.rating %>/5)</span>
</div>
-->

<!-- NEW CODE (ADD THIS): -->
<div class="trust-score-container bg-gradient-to-r from-idb-blue-light to-idb-blue p-4 rounded-card text-white">
  
  <!-- Score Circle -->
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="font-heading font-bold text-sm opacity-90">Tingkat Komitmen</h3>
      <p class="text-xs opacity-75">Trust Score</p>
    </div>
    
    <!-- Circular Progress -->
    <div class="relative w-20 h-20">
      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="8"/>
        
        <!-- Progress circle -->
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="8"
          stroke-dasharray="<%= (trustScore / 100) * 282.6 %> 282.6"
          class="transition-all duration-500"
        />
      </svg>
      
      <!-- Score text in center -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold"><%= trustScore %>%</span>
        <span class="text-xs opacity-75">Score</span>
      </div>
    </div>
  </div>
  
  <!-- Score Category -->
  <div class="pt-4 border-t border-white border-opacity-30">
    <% if (trustScore >= 90) { %>
      <p class="text-xs font-semibold">🌟 Sangat Terpercaya</p>
      <p class="text-xs opacity-75 mt-1">Klien senang bekerja sama denganmu!</p>
    <% } else if (trustScore >= 75) { %>
      <p class="text-xs font-semibold">✓ Terpercaya</p>
      <p class="text-xs opacity-75 mt-1">Rekam jejakmu cukup baik.</p>
    <% } else if (trustScore >= 50) { %>
      <p class="text-xs font-semibold">⚠️ Perlu Ditingkatkan</p>
      <p class="text-xs opacity-75 mt-1">Perbaiki komitmenmu di proyek berikutnya.</p>
    <% } else { %>
      <p class="text-xs font-semibold">❌ Rendah</p>
      <p class="text-xs opacity-75 mt-1">Ada masalah serius. Diskusi dengan admin.</p>
    <% } %>
  </div>
  
</div>

<!-- Commitment Metrics History (Optional) -->
<div class="mt-6 bg-white p-4 rounded-card border border-gray-200">
  <h4 class="font-heading font-bold text-sm text-idb-charcoal mb-3">📊 Riwayat Komitmen</h4>
  
  <% if (commitmentMetrics && commitmentMetrics.length > 0) { %>
    <div class="space-y-2 text-xs">
      <% commitmentMetrics.slice(0, 5).forEach(metric => { %>
        <div class="flex justify-between items-center py-2 border-b last:border-0">
          <span class="text-idb-charcoal">
            <%= metric.metric_name %>
            <span class="text-gray-500">(dari <%= new Date(metric.logged_at).toLocaleDateString('id-ID') %>)</span>
          </span>
          <span class="<%= metric.score_impact > 0 ? 'text-idb-green font-bold' : 'text-red-600 font-bold' %>">
            <%= metric.score_impact > 0 ? '+' : '' %><%= metric.score_impact %>
          </span>
        </div>
      <% }); %>
    </div>
  <% } else { %>
    <p class="text-sm text-gray-500 italic">Belum ada riwayat. Mulai ambil proyek untuk membangun skor!</p>
  <% } %>
  
</div>
```

### 4.4 Client Dashboard: Log Commitment Metrics

**File: `views/klien/project-detail.ejs`** (Add metrics logging UI)

```ejs
<!-- After project submission review section -->
<div class="card mt-6 border-2 border-idb-blue p-4">
  <h3 class="font-heading font-bold text-idb-charcoal mb-4">
    📈 Catat Performa Komitmen Mahasiswa
  </h3>
  
  <form id="commitmentMetricForm" class="space-y-4">
    
    <!-- Metric Selection -->
    <div>
      <label class="block text-sm font-semibold text-idb-charcoal mb-2">Jenis Penilaian</label>
      <select name="metric_name" required class="input w-full">
        <option value="">-- Pilih Jenis Penilaian --</option>
        <optgroup label="✓ Positif">
          <option value="Update Tepat Waktu">✓ Update Tepat Waktu (+5.0)</option>
          <option value="Komunikasi Responsif">✓ Komunikasi Responsif (+3.0)</option>
          <option value="Pengiriman Awal">✓ Pengiriman Awal (+10.0)</option>
          <option value="Kolaborasi Baik">✓ Kolaborasi Baik (+7.0)</option>
          <option value="Kualitas Memuaskan">✓ Kualitas Memuaskan (+8.0)</option>
        </optgroup>
        <optgroup label="✗ Negatif">
          <option value="Mangkir/Ghosting">✗ Mangkir/Ghosting (-20.0)</option>
          <option value="Revisi Berlebihan">✗ Revisi Berlebihan (-8.0)</option>
          <option value="Keterlambatan Signifikan">✗ Keterlambatan Signifikan (-15.0)</option>
          <option value="Kualitas Rendah">✗ Kualitas Rendah (-12.0)</option>
        </optgroup>
      </select>
    </div>
    
    <!-- Optional notes -->
    <div>
      <label class="block text-sm font-semibold text-idb-charcoal mb-2">Catatan (Opsional)</label>
      <textarea 
        name="description" 
        class="input w-full h-24"
        placeholder="Jelaskan singkat alasan penilaian ini..."
      ></textarea>
    </div>
    
    <!-- Submit Button -->
    <button 
      type="submit" 
      class="btn btn-blue w-full"
    >
      Catat Penilaian
    </button>
    
  </form>
  
</div>

<script>
document.getElementById('commitmentMetricForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const metricName = e.target.querySelector('select[name="metric_name"]').value;
  const description = e.target.querySelector('textarea[name="description"]').value;
  
  if (!metricName) {
    showToast('Pilih jenis penilaian terlebih dahulu', 'error');
    return;
  }
  
  // Determine score impact based on metric name
  const scoreMap = {
    'Update Tepat Waktu': 5.0,
    'Komunikasi Responsif': 3.0,
    'Pengiriman Awal': 10.0,
    'Kolaborasi Baik': 7.0,
    'Kualitas Memuaskan': 8.0,
    'Mangkir/Ghosting': -20.0,
    'Revisi Berlebihan': -8.0,
    'Keterlambatan Signifikan': -15.0,
    'Kualitas Rendah': -12.0
  };
  
  try {
    const response = await fetch('/mahasiswa/<%= project.mahasiswa_id %>/commitment-metric', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: <%= project.id %>,
        metric_name: metricName,
        score_impact: scoreMap[metricName],
        description: description
      })
    });
    
    if (response.ok) {
      showToast('✓ Penilaian komitmen tercatat', 'success');
      e.target.reset();
      
      // Optionally refresh page to show updated trust score
      setTimeout(() => location.reload(), 1500);
    } else {
      showToast('Gagal mencatat penilaian', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});
</script>
```

---

## 5. MIGRATION CHECKLIST

### Step 1: Database Updates
- [ ] Backup existing `studentworks.db`
- [ ] Run new migrations from `db/migrate.js`
- [ ] Verify all columns added: `custom_sla_rules`, `requires_test`, `commitment_signed`
- [ ] Verify new table created: `commitment_metrics` with all indexes
- [ ] Test data integrity with sample queries

### Step 2: Backend Route Updates
- [ ] Update `routes/klien.js` for project creation (add custom_sla_rules, requires_test)
- [ ] Update `routes/mahasiswa.js` for project application (add commitment_signed requirement)
- [ ] Create new `routes/commitment.js` for metrics logging
- [ ] Add commitment metric endpoints to admin/klien routes
- [ ] Test all new endpoints with Postman/Insomnia

### Step 3: Server Middleware Updates
- [ ] Modify `server.js` Safe Zone logic (from blocking to warning)
- [ ] Change `res.locals.globalSafeZone` to `res.locals.isExamPeriod`
- [ ] Test exam period detection still works correctly
- [ ] Verify buttons are NOT disabled during exam period

### Step 4: Frontend Updates
- [ ] Add commitment modal to `views/mahasiswa/proyek.ejs`
- [ ] Update project card component with SLA preview
- [ ] Implement JavaScript modal handlers
- [ ] Update project detail view to show custom SLA rules
- [ ] Replace star ratings with Trust Score circle in dashboard

### Step 5: Client Views Updates
- [ ] Add commitment metric logging UI to `views/klien/project-detail.ejs`
- [ ] Create metric selection dropdown
- [ ] Add description/notes field
- [ ] Test form submission

### Step 6: Testing
- [ ] Test student project application flow (must accept commitment)
- [ ] Test client custom SLA rules display
- [ ] Test commitment metrics logging from client side
- [ ] Test trust score calculation
- [ ] Test exam period warning (not blocking)
- [ ] Verify database transactions logged correctly

---

## 6. FILE CHANGES SUMMARY

### Modified Files
| File | Changes |
|------|---------|
| `db/migrate.js` | Add 4 new migration blocks |
| `db/database.js` | No changes needed (SQLite handles new schema) |
| `server.js` | Update Safe Zone middleware logic |
| `routes/mahasiswa.js` | Add commitment_signed validation to lamar endpoint |
| `routes/klien.js` | Add custom_sla_rules & requires_test handling |
| `views/mahasiswa/proyek.ejs` | Add commitment modal & update card |
| `views/mahasiswa/dashboard.ejs` | Replace star rating with trust score |
| `views/klien/project-detail.ejs` | Add commitment metrics logging UI |

### New Files
| File | Purpose |
|------|---------|
| `routes/commitment.js` | Utility functions for metrics & trust score |

---

## 7. TESTING SCENARIOS

### Scenario 1: Student Applies Without Commitment
**Expected:** Application rejected, error message shown

```bash
curl -X POST http://localhost:3000/proyek/lamar \
  -H "Content-Type: application/json" \
  -d '{"project_id": 1, "commitment_signed": false}'
  
# Response: 400 - "Kamu harus menyetujui komitmen sebelum melamar"
```

### Scenario 2: Student Applies During Exam Period
**Expected:** Application accepted, warning displayed, commitment logged

```bash
curl -X POST http://localhost:3000/proyek/lamar \
  -H "Content-Type: application/json" \
  -d '{"project_id": 1, "commitment_signed": true}'
  
# Response: 201 - Success with examWarning message
```

### Scenario 3: Client Logs Positive Commitment Metric
**Expected:** Score recorded, trust score increases

```bash
curl -X POST http://localhost:3000/mahasiswa/123/commitment-metric \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "metric_name": "Pengiriman Awal",
    "score_impact": 10.0
  }'
  
# Response: 201 - Metric recorded
# Student's trust score: 100 → 110 (capped at 100)
```

### Scenario 4: Trust Score Calculation
**Expected:** Score reflects positive + negative balance

```
Starting score: 100%
After +10 (Pengiriman Awal): 110% → capped at 100%
After +5 (Update Tepat Waktu): +5 bonus = 100%
After -20 (Mangkir): 100% - 20% = 80%
Final: 80%
```

---

## 8. ROLLBACK PLAN

If issues occur, rollback is possible:

```sql
-- Restore old Safe Zone behavior
-- In server.js, revert globalSafeZone logic

-- Remove new columns (WARNING: Data loss)
-- ALTER TABLE projects DROP COLUMN custom_sla_rules;
-- ALTER TABLE projects DROP COLUMN requires_test;
-- ALTER TABLE job_applications DROP COLUMN commitment_signed;

-- Drop new table
-- DROP TABLE commitment_metrics;

-- Note: Safer to keep columns/table and just disable UI
```

---

## 9. PERFORMANCE CONSIDERATIONS

### Database Indexes
Already created in migration:
```sql
CREATE INDEX idx_commitment_user ON commitment_metrics(user_id);
CREATE INDEX idx_commitment_project ON commitment_metrics(project_id);
CREATE INDEX idx_commitment_category ON commitment_metrics(metric_category);
```

### Query Optimization
Trust score calculation aggregates all metrics. For large user bases, consider:
- Caching trust scores (update hourly)
- Pagination for metrics history
- Archive old metrics after 1 year

### Frontend Performance
- Modal lazy-loads project data
- JavaScript handlers use event delegation
- SVG circle animation uses CSS transitions

---

## 10. DOCUMENTATION & TRAINING

### For Students
- Add help article: "Apa itu Commitment Lock?"
- Explain trust score calculation
- Show example modal workflow

### For Clients
- Guide on setting custom SLA rules
- How to log commitment metrics
- Trust score interpretation

### For Admins
- Monitor system adoption
- Review flagged high-negative-score students
- Adjust metric values if needed

---

## CONCLUSION

These changes transform StudentWorks from a platform that restricts students to one that empowers them with conscious choice and accountability. The shift from blocking (Safe Zone) to awareness-building (warnings + trust scores) aligns with educational principles while maintaining work quality standards.

**Key Improvements:**
✅ Student agency & autonomy  
✅ Transparent commitment tracking  
✅ Real-time trust scoring  
✅ Client-defined work standards  
✅ Behavior-driven reputation system  

**Implementation Timeline:** Estimated 2-3 weeks with proper testing

---

**Document Version:** 1.0  
**Last Updated:** June 29, 2026  
**Status:** Ready for Development Team
