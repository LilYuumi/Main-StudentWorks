const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { logCommitmentMetric } = require('./commitment');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// Dashboard Klien
router.get('/dashboard', isAuthenticated, hasRole('klien'), (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as mahasiswa_name, u.id as mahasiswa_id, e.status as escrow_status, e.jumlah_dana, e.bukti_transfer_path
    FROM projects p
    LEFT JOIN users u ON p.mahasiswa_id = u.id
    LEFT JOIN escrow_transactions e ON p.id = e.project_id
    WHERE p.klien_id = ?
    ORDER BY p.created_at DESC
  `).all(req.session.user.id);

  // Attach submissions, unread message count, and rating to each project
  projects.forEach(p => {
    p.submissions = db.prepare(
      'SELECT * FROM project_submissions WHERE project_id = ? ORDER BY created_at DESC'
    ).all(p.id);
    p.unread_messages = db.prepare(
      'SELECT COUNT(*) as c FROM messages WHERE project_id = ? AND sender_id != ? AND is_read = 0'
    ).get(p.id, req.session.user.id).c;
    // Get rating for this project
    p.rating = db.prepare('SELECT * FROM ratings WHERE project_id = ?').get(p.id) || null;
  });

  const stats = {
    total: projects.length,
    mencari: projects.filter(p => p.status === 'Mencari Talenta').length,
    aktif: projects.filter(p => p.status === 'Sedang Dikerjakan').length,
    review: projects.filter(p => p.status === 'Dalam Peninjauan').length,
    selesai: projects.filter(p => p.status === 'Selesai').length,
    dibatalkan: projects.filter(p => p.status === 'Dibatalkan').length
  };

  // Get academic calendar for client awareness
  const calendar = db.prepare('SELECT * FROM academic_calendar ORDER BY tanggal_mulai ASC').all();

  res.render('klien/dashboard', { projects, stats, calendar });
});

// Create new project
router.get('/proyek/baru', isAuthenticated, hasRole('klien'), (req, res) => {
  res.render('klien/proyek-baru');
});

router.post('/proyek/baru', isAuthenticated, hasRole('klien'), (req, res) => {
  const { judul_proyek, deskripsi, anggaran, tenggat_waktu } = req.body;
  let { custom_sla_rules, requires_test } = req.body;
  
  // Sanitize custom_sla_rules
  if (!custom_sla_rules || custom_sla_rules.trim() === '') {
    custom_sla_rules = 'Fleksibel, komunikatif, dan selesai tepat waktu.';
  }
  if (custom_sla_rules.length > 1000) {
    req.flash('error', 'Aturan main terlalu panjang (maks 1000 karakter)');
    return res.redirect('/klien/proyek/baru');
  }
  
  // Convert checkbox to boolean
  requires_test = requires_test === 'on' || requires_test === true ? 1 : 0;

  db.prepare(`
    INSERT INTO projects (klien_id, judul_proyek, deskripsi, anggaran, tenggat_waktu, status, custom_sla_rules, requires_test)
    VALUES (?, ?, ?, ?, ?, 'Mencari Talenta', ?, ?)
  `).run(req.session.user.id, judul_proyek, deskripsi, parseInt(anggaran), tenggat_waktu, custom_sla_rules, requires_test);

  req.flash('success', 'Proyek baru berhasil dibuat!');
  res.redirect('/klien/dashboard');
});

// Browse talents
router.get('/talenta', isAuthenticated, hasRole('klien'), (req, res) => {
  const { jurusan, skill } = req.query;

  let query = `
    SELECT u.name, sp.jurusan, sp.skills, sp.bio, sp.nim, sp.is_safe_zone, sp.foto_profil,
    COUNT(CASE WHEN s.nilai_akhir = 'A' THEN 1 END) as verified_count
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN simulated_siakad s ON sp.nim = s.nim
  `;
  const conditions = [];
  const params = [];

  if (jurusan) {
    conditions.push('sp.jurusan = ?');
    params.push(jurusan);
  }

  if (query && conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' GROUP BY u.id';

  const students = db.prepare(query).all(...params);

  // Get verified skills for each student
  const studentsWithSkills = students.map(student => {
    let skills = [];
    try { skills = JSON.parse(student.skills || '[]'); } catch (e) { skills = []; }

    let verifiedSkills = [];
    if (student.nim) {
      verifiedSkills = db.prepare(
        "SELECT mata_kuliah FROM simulated_siakad WHERE nim = ? AND nilai_akhir = 'A'"
      ).all(student.nim).map(s => s.mata_kuliah);
    }

    return { ...student, skillsArray: skills, verifiedSkills };
  });

  res.render('klien/talenta', {
    students: studentsWithSkills,
    jurusan: jurusan || '',
    jurusanList: ['Bisnis Digital', 'Desain Grafis', 'Teknologi Informasi']
  });
});

// Upload payment proof
router.post('/escrow/upload/:projectId', isAuthenticated, hasRole('klien'), upload.single('bukti_transfer'), (req, res) => {
  if (!req.file) {
    req.flash('error', 'Silakan unggah bukti transfer.');
    return res.redirect('/klien/dashboard');
  }

  db.prepare('UPDATE escrow_transactions SET bukti_transfer_path = ? WHERE project_id = ?')
    .run('/uploads/' + req.file.filename, req.params.projectId);

  req.flash('success', 'Bukti transfer berhasil diunggah! Menunggu verifikasi admin.');
  res.redirect('/klien/dashboard');
});

// Approve completed project
router.post('/proyek/setujui/:id', isAuthenticated, hasRole('klien'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND klien_id = ? AND status = ?')
    .get(req.params.id, req.session.user.id, 'Dalam Peninjauan');

  if (!project) {
    req.flash('error', 'Proyek tidak ditemukan.');
    return res.redirect('/klien/dashboard');
  }

  db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('Selesai', req.params.id);
  db.prepare('UPDATE escrow_transactions SET status = ? WHERE project_id = ?').run('Dana Dicairkan', req.params.id);

  req.flash('success', 'Proyek telah disetujui dan dana telah dicairkan! Silakan beri rating untuk mahasiswa.');
  res.redirect('/klien/dashboard');
});

// Submit rating for a completed project
router.post('/rating/:projectId', isAuthenticated, hasRole('klien'), (req, res) => {
  const projectId = req.params.projectId;
  const { mahasiswa_rating, platform_rating, review } = req.body;

  // Verify project belongs to this klien and is completed
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND klien_id = ? AND status = ?')
    .get(projectId, req.session.user.id, 'Selesai');

  if (!project) {
    req.flash('error', 'Proyek tidak ditemukan atau belum selesai.');
    return res.redirect('/klien/dashboard');
  }

  // Check if already rated
  const existing = db.prepare('SELECT id FROM ratings WHERE project_id = ?').get(projectId);
  if (existing) {
    req.flash('error', 'Anda sudah memberikan rating untuk proyek ini.');
    return res.redirect('/klien/dashboard');
  }

  db.prepare(
    'INSERT INTO ratings (project_id, klien_id, mahasiswa_id, mahasiswa_rating, platform_rating, review) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(projectId, req.session.user.id, project.mahasiswa_id, parseInt(mahasiswa_rating), parseInt(platform_rating), review || null);

  req.flash('success', 'Terima kasih atas rating Anda!');
  res.redirect('/klien/dashboard');
});

// Browse all open projects (for mahasiswa too)
router.get('/proyek', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as klien_name
    FROM projects p
    JOIN users u ON p.klien_id = u.id
    WHERE p.status = 'Mencari Talenta'
    ORDER BY p.created_at DESC
  `).all();

  res.render('klien/proyek-list', { projects });
});

// Cancel a project (klien)
router.post('/proyek/batalkan/:id', isAuthenticated, hasRole('klien'), (req, res) => {
  const projectId = req.params.id;
  const { cancellation_reason } = req.body;

  // Klien can cancel: Mencari Talenta, Sedang Dikerjakan, or Dalam Peninjauan
  const project = db.prepare(
    'SELECT * FROM projects WHERE id = ? AND klien_id = ? AND status IN (?, ?, ?)'
  ).get(projectId, req.session.user.id, 'Mencari Talenta', 'Sedang Dikerjakan', 'Dalam Peninjauan');

  if (!project) {
    req.flash('error', 'Proyek tidak dapat dibatalkan pada status ini.');
    return res.redirect('/klien/dashboard');
  }

  // Cancel the project
  db.prepare(
    'UPDATE projects SET status = ?, cancelled_by = ?, cancellation_reason = ?, cancelled_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run('Dibatalkan', req.session.user.id, cancellation_reason || 'Dibatalkan oleh klien', projectId);

  // Handle escrow
  const escrow = db.prepare('SELECT * FROM escrow_transactions WHERE project_id = ?').get(projectId);
  if (escrow) {
    if (escrow.status === 'Dana Dikunci') {
      // Refund to klien
      db.prepare('UPDATE escrow_transactions SET status = ? WHERE project_id = ?').run('Dana Dikembalikan', projectId);
    } else if (escrow.status === 'Menunggu Pembayaran') {
      // No payment yet, remove escrow
      db.prepare('DELETE FROM escrow_transactions WHERE project_id = ?').run(projectId);
    }
    // 'Dana Dicairkan' means project was already 'Selesai', shouldn't reach here
  }

  req.flash('success', 'Proyek berhasil dibatalkan.');
  res.redirect('/klien/dashboard');
});

// Log commitment metrics for a student
router.post('/mahasiswa/:mahasiswa_id/commitment-metric', isAuthenticated, hasRole('klien'), (req, res) => {
  const mahasiswa_id = req.params.mahasiswa_id;
  const { project_id, metric_name, score_impact, description } = req.body;

  // Verify project belongs to this klien and student is assigned
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND klien_id = ? AND mahasiswa_id = ?')
    .get(project_id, req.session.user.id, mahasiswa_id);

  if (!project) {
    return res.status(404).json({ error: 'Proyek tidak ditemukan atau talenta tidak cocok' });
  }

  const resultId = logCommitmentMetric(
    project_id,
    mahasiswa_id,
    metric_name,
    parseFloat(score_impact),
    req.session.user.id
  );

  if (resultId) {
    res.status(201).json({ success: true, message: 'Penilaian berhasil dicatat' });
  } else {
    res.status(500).json({ error: 'Gagal mencatat penilaian' });
  }
});

module.exports = router;
