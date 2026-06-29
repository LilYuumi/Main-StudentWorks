const db = require('./database');

console.log('Menjalankan migrasi database...');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('mahasiswa', 'klien', 'admin')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create student_profiles table
db.exec(`
  CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    nim TEXT UNIQUE,
    jurusan TEXT,
    skills TEXT,
    is_safe_zone INTEGER DEFAULT 0,
    bio TEXT,
    foto_profil TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Create simulated_siakad table
db.exec(`
  CREATE TABLE IF NOT EXISTS simulated_siakad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nim TEXT NOT NULL,
    mata_kuliah TEXT NOT NULL,
    nilai_akhir TEXT CHECK(nilai_akhir IN ('A', 'B', 'C', 'D', 'E')) NOT NULL
  )
`);

// Create projects table
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    klien_id INTEGER NOT NULL,
    judul_proyek TEXT NOT NULL,
    deskripsi TEXT,
    anggaran INTEGER DEFAULT 0,
    tenggat_waktu DATE,
    status TEXT CHECK(status IN ('Mencari Talenta', 'Sedang Dikerjakan', 'Dalam Peninjauan', 'Selesai', 'Dibatalkan')) DEFAULT 'Mencari Talenta',
    mahasiswa_id INTEGER,
    cancelled_by INTEGER,
    cancellation_reason TEXT,
    cancelled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (klien_id) REFERENCES users(id),
    FOREIGN KEY (mahasiswa_id) REFERENCES users(id),
    FOREIGN KEY (cancelled_by) REFERENCES users(id)
  )
`);

// Add new columns if table already exists (for upgrades)
try {
  db.exec("ALTER TABLE projects ADD COLUMN cancelled_by INTEGER REFERENCES users(id)");
} catch(e) {}
try {
  db.exec("ALTER TABLE projects ADD COLUMN cancellation_reason TEXT");
} catch(e) {}
try {
  db.exec("ALTER TABLE projects ADD COLUMN cancelled_at DATETIME");
} catch(e) {}

// Create escrow_transactions table
db.exec(`
  CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER UNIQUE NOT NULL,
    jumlah_dana INTEGER NOT NULL,
    status TEXT CHECK(status IN ('Menunggu Pembayaran', 'Dana Dikunci', 'Dana Dicairkan', 'Dana Dikembalikan')) DEFAULT 'Menunggu Pembayaran',
    bukti_transfer_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )
`);

// Create academic_calendar table (for safe zone date ranges)
db.exec(`
  CREATE TABLE IF NOT EXISTS academic_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_periode TEXT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('Migrasi database selesai!');

// Create project_submissions table (for file uploads by mahasiswa)
db.exec(`
  CREATE TABLE IF NOT EXISTS project_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create messages table (chat between mahasiswa and klien per project)
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  )
`);

console.log('Migrasi tabel tambahan selesai!');

// Create ratings table (dual rating: mahasiswa + platform)
db.exec(`
  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER UNIQUE NOT NULL,
    klien_id INTEGER NOT NULL,
    mahasiswa_id INTEGER NOT NULL,
    mahasiswa_rating INTEGER NOT NULL CHECK(mahasiswa_rating BETWEEN 1 AND 5),
    platform_rating INTEGER NOT NULL CHECK(platform_rating BETWEEN 1 AND 5),
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (klien_id) REFERENCES users(id),
    FOREIGN KEY (mahasiswa_id) REFERENCES users(id)
  )
`);

console.log('Migrasi tabel ratings selesai!');

console.log('Running expert feedback migrations...');

try {
  // Create job_applications table (it was missing from MVP)
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      mahasiswa_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      commitment_signed BOOLEAN DEFAULT 0,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (mahasiswa_id) REFERENCES users(id)
    )
  `);

  // Migration 1: Add custom SLA rules to projects
  try {
    db.exec(`
      ALTER TABLE projects ADD COLUMN custom_sla_rules TEXT NOT NULL DEFAULT 'Fleksibel, komunikatif, dan selesai tepat waktu.';
    `);
  } catch (e) {
    // Column might already exist
  }

  // Migration 2: Add test requirement flag
  try {
    db.exec(`
      ALTER TABLE projects ADD COLUMN requires_test BOOLEAN DEFAULT 0;
    `);
  } catch (e) {}

  // Migration 3: Add commitment tracking to applications
  // Done in CREATE TABLE above

  // Migration 4: Create commitment_metrics table
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

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_commitment_user ON commitment_metrics(user_id);
    CREATE INDEX IF NOT EXISTS idx_commitment_project ON commitment_metrics(project_id);
    CREATE INDEX IF NOT EXISTS idx_commitment_category ON commitment_metrics(metric_category);
  `);

  console.log('All expert feedback migrations completed successfully!');
} catch (err) {
  console.error('Migration error:', err.message);
}
