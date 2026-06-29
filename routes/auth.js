const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(getDashboardUrl(req.session.user.role));
  }
  res.render('login');
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    req.flash('error', 'Email tidak ditemukan.');
    return res.redirect('/login');
  }

  if (!bcrypt.compareSync(password, user.password)) {
    req.flash('error', 'Password salah.');
    return res.redirect('/login');
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  req.flash('success', `Selamat datang, ${user.name}!`);
  res.redirect(getDashboardUrl(user.role));
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect(getDashboardUrl(req.session.user.role));
  }
  res.render('register');
});

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if email exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    req.flash('error', 'Email sudah terdaftar.');
    return res.redirect('/register');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role);

    // If mahasiswa, create empty profile
    if (role === 'mahasiswa') {
      db.prepare('INSERT INTO student_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);
    }

    req.flash('success', 'Registrasi berhasil! Silakan login.');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', 'Terjadi kesalahan saat registrasi.');
    res.redirect('/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

function getDashboardUrl(role) {
  switch (role) {
    case 'mahasiswa': return '/mahasiswa/dashboard';
    case 'klien': return '/klien/dashboard';
    case 'admin': return '/admin/dashboard';
    default: return '/';
  }
}

module.exports = router;
