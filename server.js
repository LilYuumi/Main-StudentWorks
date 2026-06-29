const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session
app.use(session({
  secret: 'studentworks-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

app.use(flash());

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');

  // Check exam period status (Warning Only, Not Blocking)
  const today = new Date().toISOString().split('T')[0];
  const activePeriod = db.prepare(`
    SELECT * FROM academic_calendar 
    WHERE is_active = 1 
    AND tanggal_mulai <= ? 
    AND tanggal_selesai >= ?
  `).get(today, today);

  res.locals.isExamPeriod = !!activePeriod;
  res.locals.examPeriodInfo = activePeriod || null;
  res.locals.examWarningMessage = activePeriod 
    ? `⚠️ Periode UTS/UAS aktif (${activePeriod.tanggal_mulai} s/d ${activePeriod.tanggal_selesai}). Kamu tetap bebas mengambil proyek, namun pastikan prioritas akademikmu terjaga.`
    : null;


  next();
});

// Routes
app.use('/', require('./routes/landing'));
app.use('/', require('./routes/auth'));
app.use('/mahasiswa', require('./routes/mahasiswa'));
app.use('/klien', require('./routes/klien'));
app.use('/admin', require('./routes/admin'));
app.use('/chat', require('./routes/chat'));

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Only listen on port in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n=== StudentWorks MVP ===`);
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Tagline: Kuliah. Kerja. Berkembang.\n`);
  });
}

// Export for Vercel
module.exports = app;
