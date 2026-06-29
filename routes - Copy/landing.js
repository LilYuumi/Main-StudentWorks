const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Landing page
router.get('/', (req, res) => {
  const students = db.prepare(`
    SELECT u.name, sp.jurusan, sp.skills, sp.bio, sp.nim, sp.foto_profil,
    COUNT(CASE WHEN s.nilai_akhir = 'A' THEN 1 END) as verified_count
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN simulated_siakad s ON sp.nim = s.nim
    GROUP BY u.id
    LIMIT 6
  `).all();

  // Get verified skills (courses with grade A) for each student
  students.forEach(student => {
    const gradeACourses = db.prepare(
      "SELECT mata_kuliah FROM simulated_siakad WHERE nim = ? AND nilai_akhir = 'A'"
    ).all(student.nim).map(r => r.mata_kuliah);
    student.verified_skills = gradeACourses;
  });

  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
  const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mahasiswa'").get();
  const clientCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'klien'").get();

  // Platform rating
  const platformRating = db.prepare(
    'SELECT AVG(platform_rating) as avg_rating, COUNT(*) as total FROM ratings'
  ).get();

  res.render('landing', {
    students,
    projectCount: projectCount.count,
    studentCount: studentCount.count,
    clientCount: clientCount.count,
    platformAvgRating: platformRating.avg_rating ? Math.round(platformRating.avg_rating * 10) / 10 : 0,
    platformTotalRatings: platformRating.total
  });
});

module.exports = router;
