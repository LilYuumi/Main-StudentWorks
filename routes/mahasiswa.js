const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { calculateTrustScore } = require('./commitment');
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|zip|rar|txt|psd|ai|svg/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// Dashboard Mahasiswa
router.get('/dashboard', isAuthenticated, hasRole('mahasiswa'), (req, res) => {
  const profile = db.prepare(`
    SELECT sp.*, u.name, u.email
    FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.user_id = ?
  `).get(req.session.user.id);

  // Get verified skills from SIAKAD
  let verifiedSkills = [];
  if (profile && profile.nim) {
    verifiedSkills = db.prepare(
      "SELECT mata_kuliah FROM simulated_siakad WHERE nim = ? AND nilai_akhir = 'A'"
    ).all(profile.nim).map(s => s.mata_kuliah);
  }

  // Get student's projects
  const projects = db.prepare(`
    SELECT p.*, u.name as klien_name, e.status as escrow_status, e.jumlah_dana
    FROM projects p
    JOIN users u ON p.klien_id = u.id
    LEFT JOIN escrow_transactions e ON p.id = e.project_id
    WHERE p.mahasiswa_id = ?
    ORDER BY p.created_at DESC
  `).all(req.session.user.id);

  // Attach submissions and unread message count to each project
  projects.forEach(p => {
    p.submissions = db.prepare(
      'SELECT * FROM project_submissions WHERE project_id = ? ORDER BY created_at DESC'
    ).all(p.id);
    p.unread_messages = db.prepare(
      'SELECT COUNT(*) as c FROM messages WHERE project_id = ? AND sender_id != ? AND is_read = 0'
    ).get(p.id, req.session.user.id).c;
  });

  // Parse skills
  let skills = [];
  if (profile && profile.skills) {
    try { skills = JSON.parse(profile.skills); } catch (e) { skills = []; }
  }

  // Get academic calendar
  const calendar = db.prepare('SELECT * FROM academic_calendar ORDER BY tanggal_mulai ASC').all();

  // Earnings calculation
  const completedProjects = projects.filter(p => p.status === 'Selesai');
  const totalEarnings = completedProjects.reduce((sum, p) => sum + (p.jumlah_dana || 0), 0);

  // Calculate dynamic trust score
  const trustScore = calculateTrustScore(req.session.user.id);
  
  // Get commitment metrics history
  const commitmentMetrics = db.prepare(`
    SELECT * FROM commitment_metrics 
    WHERE user_id = ? 
    ORDER BY logged_at DESC
  `).all(req.session.user.id);

  res.render('mahasiswa/dashboard', {
    profile,
    skills,
    verifiedSkills,
    projects,
    calendar,
    totalEarnings,
    activeProjects: projects.filter(p => p.status === 'Sedang Dikerjakan').length,
    reviewProjects: projects.filter(p => p.status === 'Dalam Peninjauan').length,
    trustScore, // Passed to view
    commitmentMetrics // Passed to view
  });
});

// Update profile
router.post('/profil/update', isAuthenticated, hasRole('mahasiswa'), (req, res) => {
  const { nim, jurusan, skills, bio } = req.body;
  const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];

  db.prepare(`
    UPDATE student_profiles SET nim = ?, jurusan = ?, skills = ?, bio = ?
    WHERE user_id = ?
  `).run(nim, jurusan, JSON.stringify(skillsArray), bio, req.session.user.id);

  req.flash('success', 'Profil berhasil diperbarui!');
  res.redirect('/mahasiswa/dashboard');
});

// Apply to project
router.post('/proyek/lamar', isAuthenticated, hasRole('mahasiswa'), (req, res) => {
  try {
    const { project_id } = req.body;
    let { commitment_signed } = req.body;
    
    // Validate project exists
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND status = ?').get(project_id, 'Mencari Talenta');
    if (!project) {
      return res.status(404).json({ error: 'Proyek tidak tersedia' });
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
      examWarning = `Catatan: Kamu sedang dalam periode ${examPeriod.nama_periode}. Pastikan akademikmu tetap prioritas!`;
    }
    
    // Maintain MVP auto-assign behavior but record the application
    db.prepare(`
      INSERT INTO job_applications (
        project_id, mahasiswa_id, status, commitment_signed, applied_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).run(project_id, req.session.user.id, 'accepted', commitment_signed);
    
    db.prepare('UPDATE projects SET mahasiswa_id = ?, status = ? WHERE id = ?')
      .run(req.session.user.id, 'Sedang Dikerjakan', project_id);

    db.prepare('INSERT INTO escrow_transactions (project_id, jumlah_dana, status) VALUES (?, ?, ?)')
      .run(project_id, project.anggaran, 'Menunggu Pembayaran');
    
    res.status(201).json({ 
      success: true,
      message: 'Kamu telah diterima untuk proyek ini! Klien akan melakukan pembayaran escrow.',
      examWarning: examWarning
    });
    
  } catch (err) {
    console.error('Error applying for project:', err);
    res.status(500).json({ error: 'Gagal mengirim lamaran' });
  }
});

// Submit project for review
router.post('/proyek/submit/:id', isAuthenticated, hasRole('mahasiswa'), (req, res) => {
  db.prepare('UPDATE projects SET status = ? WHERE id = ? AND mahasiswa_id = ?')
    .run('Dalam Peninjauan', req.params.id, req.session.user.id);

  req.flash('success', 'Proyek telah diserahkan untuk peninjauan klien.');
  res.redirect('/mahasiswa/dashboard');
});

// Upload work file for a project
router.post('/proyek/upload/:id', isAuthenticated, hasRole('mahasiswa'), upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    req.flash('error', 'Pilih minimal satu file untuk diunggah.');
    return res.redirect('/mahasiswa/dashboard');
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND mahasiswa_id = ?')
    .get(req.params.id, req.session.user.id);
  if (!project) {
    req.flash('error', 'Proyek tidak ditemukan.');
    return res.redirect('/mahasiswa/dashboard');
  }

  req.files.forEach(file => {
    db.prepare(
      'INSERT INTO project_submissions (project_id, user_id, file_path, file_name, file_type) VALUES (?, ?, ?, ?, ?)'
    ).run(
      req.params.id,
      req.session.user.id,
      '/uploads/' + file.filename,
      file.originalname,
      path.extname(file.originalname).toLowerCase()
    );
  });

  req.flash('success', `${req.files.length} file berhasil diunggah!`);
  res.redirect('/mahasiswa/dashboard');
});

// Delete a submission
router.post('/proyek/submission/hapus/:id', isAuthenticated, hasRole('mahasiswa'), (req, res) => {
  const sub = db.prepare('SELECT * FROM project_submissions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.user.id);
  if (sub) {
    const filePath = path.join(__dirname, '..', sub.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM project_submissions WHERE id = ?').run(req.params.id);
    req.flash('success', 'File berhasil dihapus.');
  }
  res.redirect('/mahasiswa/dashboard');
});

// Browse available projects
router.get('/proyek', isAuthenticated, hasRole('mahasiswa'), (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as klien_name
    FROM projects p
    JOIN users u ON p.klien_id = u.id
    WHERE p.status = 'Mencari Talenta'
    ORDER BY p.created_at DESC
  `).all();

  res.render('mahasiswa/proyek', { projects });
});

// Cancel a project (mahasiswa)
router.post('/proyek/batalkan/:id', isAuthenticated, hasRole('mahasiswa'), (req, res) => {
  const projectId = req.params.id;
  const { cancellation_reason } = req.body;

  // Only allow cancellation if project is 'Sedang Dikerjakan' or 'Mencari Talenta' (edge case)
  const project = db.prepare(
    'SELECT * FROM projects WHERE id = ? AND mahasiswa_id = ? AND status IN (?, ?)'
  ).get(projectId, req.session.user.id, 'Sedang Dikerjakan', 'Mencari Talenta');

  if (!project) {
    req.flash('error', 'Proyek tidak dapat dibatalkan pada status ini.');
    return res.redirect('/mahasiswa/dashboard');
  }

  // Cancel the project
  db.prepare(
    'UPDATE projects SET status = ?, cancelled_by = ?, cancellation_reason = ?, cancelled_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run('Dibatalkan', req.session.user.id, cancellation_reason || 'Dibatalkan oleh mahasiswa', projectId);

  // Handle escrow: if funds are locked, return them
  const escrow = db.prepare('SELECT * FROM escrow_transactions WHERE project_id = ?').get(projectId);
  if (escrow) {
    if (escrow.status === 'Dana Dikunci') {
      db.prepare('UPDATE escrow_transactions SET status = ? WHERE project_id = ?').run('Dana Dikembalikan', projectId);
    } else if (escrow.status === 'Menunggu Pembayaran') {
      // Just remove the escrow record
      db.prepare('DELETE FROM escrow_transactions WHERE project_id = ?').run(projectId);
    }
  }

  req.flash('success', 'Proyek berhasil dibatalkan.');
  res.redirect('/mahasiswa/dashboard');
});

module.exports = router;
