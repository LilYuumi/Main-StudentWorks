const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Dashboard Admin
router.get('/dashboard', isAuthenticated, hasRole('admin'), (req, res) => {
  const pendingEscrow = db.prepare(`
    SELECT e.*, p.judul_proyek, p.anggaran,
    k.name as klien_name, m.name as mahasiswa_name
    FROM escrow_transactions e
    JOIN projects p ON e.project_id = p.id
    JOIN users k ON p.klien_id = k.id
    LEFT JOIN users m ON p.mahasiswa_id = m.id
    WHERE e.status = 'Menunggu Pembayaran' AND e.bukti_transfer_path IS NOT NULL
    ORDER BY e.created_at DESC
  `).all();

  const allEscrow = db.prepare(`
    SELECT e.*, p.judul_proyek,
    k.name as klien_name, m.name as mahasiswa_name
    FROM escrow_transactions e
    JOIN projects p ON e.project_id = p.id
    JOIN users k ON p.klien_id = k.id
    LEFT JOIN users m ON p.mahasiswa_id = m.id
    ORDER BY e.created_at DESC
  `).all();

  const calendar = db.prepare('SELECT * FROM academic_calendar ORDER BY tanggal_mulai DESC').all();

  // Fetch all users with student profile data
  const allUsers = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
      sp.nim, sp.jurusan, sp.skills, sp.is_safe_zone, sp.bio, sp.foto_profil
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    ORDER BY u.created_at DESC
  `).all();

  // Attach verified skills count for mahasiswa
  allUsers.forEach(u => {
    if (u.role === 'mahasiswa' && u.nim) {
      u.verified_count = db.prepare(
        "SELECT COUNT(*) as c FROM simulated_siakad WHERE nim = ? AND nilai_akhir = 'A'"
      ).get(u.nim).c;
      try { u.skills_parsed = JSON.parse(u.skills || '[]'); } catch(e) { u.skills_parsed = []; }
    }
    // Count projects per user
    if (u.role === 'klien') {
      u.project_count = db.prepare('SELECT COUNT(*) as c FROM projects WHERE klien_id = ?').get(u.id).c;
    }
    if (u.role === 'mahasiswa') {
      u.project_count = db.prepare('SELECT COUNT(*) as c FROM projects WHERE mahasiswa_id = ?').get(u.id).c;
    }
  });

  const stats = {
    totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    totalStudents: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'mahasiswa'").get().c,
    totalClients: db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'klien'").get().c,
    totalProjects: db.prepare('SELECT COUNT(*) as c FROM projects').get().c,
    activeProjects: db.prepare("SELECT COUNT(*) as c FROM projects WHERE status != 'Selesai'").get().c,
    escrowLocked: db.prepare("SELECT SUM(jumlah_dana) as s FROM escrow_transactions WHERE status = 'Dana Dikunci'").get().s || 0,
    escrowReleased: db.prepare("SELECT SUM(jumlah_dana) as s FROM escrow_transactions WHERE status = 'Dana Dicairkan'").get().s || 0,
    pendingVerification: pendingEscrow.length
  };

  res.render('admin/dashboard', {
    pendingEscrow,
    allEscrow,
    calendar,
    stats,
    allUsers
  });
});

// Approve escrow payment
router.post('/escrow/setujui/:id', isAuthenticated, hasRole('admin'), (req, res) => {
  db.prepare('UPDATE escrow_transactions SET status = ? WHERE id = ?')
    .run('Dana Dikunci', req.params.id);

  req.flash('success', 'Pembayaran escrow berhasil disetujui!');
  res.redirect('/admin/dashboard');
});

// Reject escrow payment
router.post('/escrow/tolak/:id', isAuthenticated, hasRole('admin'), (req, res) => {
  db.prepare('UPDATE escrow_transactions SET bukti_transfer_path = NULL WHERE id = ?')
    .run(req.params.id);

  req.flash('success', 'Bukti transfer telah ditolak. Klien harus mengunggah ulang.');
  res.redirect('/admin/dashboard');
});

// Academic calendar management
router.post('/kalender', isAuthenticated, hasRole('admin'), (req, res) => {
  const { nama_periode, tanggal_mulai, tanggal_selesai } = req.body;

  db.prepare('INSERT INTO academic_calendar (nama_periode, tanggal_mulai, tanggal_selesai, is_active) VALUES (?, ?, ?, 1)')
    .run(nama_periode, tanggal_mulai, tanggal_selesai);

  req.flash('success', 'Periode kalender akademik berhasil ditambahkan!');
  res.redirect('/admin/dashboard');
});

// Toggle calendar period
router.post('/kalender/toggle/:id', isAuthenticated, hasRole('admin'), (req, res) => {
  const period = db.prepare('SELECT is_active FROM academic_calendar WHERE id = ?').get(req.params.id);
  if (period) {
    const newStatus = period.is_active ? 0 : 1;
    db.prepare('UPDATE academic_calendar SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);
    req.flash('success', newStatus ? 'Periode diaktifkan.' : 'Periode dinonaktifkan.');
  }
  res.redirect('/admin/dashboard');
});

// Delete calendar period
router.post('/kalender/hapus/:id', isAuthenticated, hasRole('admin'), (req, res) => {
  db.prepare('DELETE FROM academic_calendar WHERE id = ?').run(req.params.id);
  req.flash('success', 'Periode kalender berhasil dihapus.');
  res.redirect('/admin/dashboard');
});

module.exports = router;
