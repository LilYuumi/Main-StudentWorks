const db = require('./database');
const bcrypt = require('bcryptjs');

console.log('Mengisi data dummy...');

const hash = (pass) => bcrypt.hashSync(pass, 10);

// Clear existing data
db.exec('DROP TABLE IF EXISTS ratings');
db.exec('DROP TABLE IF EXISTS messages');
db.exec('DROP TABLE IF EXISTS project_submissions');
db.exec('DROP TABLE IF EXISTS escrow_transactions');
db.exec('DROP TABLE IF EXISTS projects');
db.exec('DROP TABLE IF EXISTS simulated_siakad');
db.exec('DROP TABLE IF EXISTS student_profiles');
db.exec('DROP TABLE IF EXISTS academic_calendar');
db.exec('DROP TABLE IF EXISTS users');
require('./migrate');

// ── Helpers ──
const insUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
const insProfile = db.prepare('INSERT INTO student_profiles (user_id, nim, jurusan, skills, bio, is_safe_zone) VALUES (?, ?, ?, ?, ?, 0)');
const insSiakad = db.prepare('INSERT INTO simulated_siakad (nim, mata_kuliah, nilai_akhir) VALUES (?, ?, ?)');
const insProject = db.prepare('INSERT INTO projects (klien_id, judul_proyek, deskripsi, anggaran, tenggat_waktu, status, mahasiswa_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insEscrow = db.prepare('INSERT INTO escrow_transactions (project_id, jumlah_dana, status, bukti_transfer_path) VALUES (?, ?, ?, ?)');
const insCal = db.prepare('INSERT INTO academic_calendar (nama_periode, tanggal_mulai, tanggal_selesai, is_active) VALUES (?, ?, ?, ?)');
const insRating = db.prepare('INSERT INTO ratings (project_id, klien_id, mahasiswa_id, mahasiswa_rating, platform_rating, review) VALUES (?, ?, ?, ?, ?, ?)');
const insMsg = db.prepare('INSERT INTO messages (project_id, sender_id, message, is_read, created_at) VALUES (?, ?, ?, ?, ?)');
const insSub = db.prepare('INSERT INTO project_submissions (project_id, user_id, file_path, file_name, file_type, created_at) VALUES (?, ?, ?, ?, ?, ?)');

// ═══════════════════════════════════════════
//  USERS (15 total: 1 admin, 8 students, 6 clients)
// ═══════════════════════════════════════════

// 1 - Admin
insUser.run('Admin StudentWorks', 'admin@studentworks.id', hash('admin123'), 'admin');

// 2-9 - Mahasiswa
insUser.run('Made Ayu Dewi', 'ayu@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');
insUser.run('Ketut Rai Suardana', 'rai@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');
insUser.run('Ni Luh Putri Wulandari', 'putri@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');
insUser.run('Wayan Adi Pratama', 'adi@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');
insUser.run('Komang Dwi Lestari', 'komang@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');
insUser.run('Kadek Sinta Pratiwi', 'sinta@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');       // 7
insUser.run('Nyoman Agus Wira', 'agus.w@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');          // 8
insUser.run('Putu Rina Maheswari', 'rina@student.idb.ac.id', hash('mahasiswa123'), 'mahasiswa');         // 9

// 10-15 - Klien
insUser.run('Budi Santoso - Kopi Bali', 'budi@kopibali.com', hash('klien123'), 'klien');
insUser.run('Sari Dewi - Boutique Ubud', 'sari@boutiqueubud.com', hash('klien123'), 'klien');
insUser.run('Agus Wijaya - Startup Lokal', 'agus@startuplokal.id', hash('klien123'), 'klien');
insUser.run('Dewa Putra - Warung Nusantara', 'dewa@warungnusantara.id', hash('klien123'), 'klien');      // 13
insUser.run('Lia Handayani - Bali Tour', 'lia@balitour.com', hash('klien123'), 'klien');                // 14
insUser.run('Rizky Firmansyah - TechHub', 'rizky@techhub.id', hash('klien123'), 'klien');               // 15

console.log('  Users: 15 inserted');

// ═══════════════════════════════════════════
//  STUDENT PROFILES
// ═══════════════════════════════════════════
insProfile.run(2, '2024001001', 'Bisnis Digital', JSON.stringify(['Digital Marketing', 'Copywriting', 'Analisis Bisnis', 'Social Media Management']), 'Mahasiswa Bisnis Digital semester 4, passionate about e-commerce dan digital strategy.');
insProfile.run(3, '2024001002', 'Desain Grafis', JSON.stringify(['UI/UX Design', 'Illustrasi', 'Branding', 'Adobe Photoshop', 'Figma']), 'Desainer kreatif dengan fokus pada brand identity dan UI design.');
insProfile.run(4, '2024001003', 'Teknologi Informasi', JSON.stringify(['Pemrograman Web', 'Mobile Development', 'Database Management', 'Python']), 'Full-stack developer wannabe, suka bikin aplikasi web dan mobile.');
insProfile.run(5, '2024001004', 'Desain Grafis', JSON.stringify(['Fotografi', 'Videografi', 'Video Editing', 'Adobe Premiere']), 'Videografer dan fotografer dengan minat di konten marketing.');
insProfile.run(6, '2024001005', 'Bisnis Digital', JSON.stringify(['Copywriting', 'SEO', 'Content Marketing', 'Analisis Data']), 'Content creator dan SEO enthusiast.');
insProfile.run(7, '2024001006', 'Teknologi Informasi', JSON.stringify(['UI/UX Design', 'Figma', 'Web Development', 'React']), 'Mahasiswa TI semester 6, fokus di interaction design dan front-end development.');
insProfile.run(8, '2024001007', 'Bisnis Digital', JSON.stringify(['Social Media Management', 'Content Creation', 'Canva', 'Analytics']), 'Social media strategist yang suka bikin konten viral dan brand awareness.');
insProfile.run(9, '2024001008', 'Desain Grafis', JSON.stringify(['Motion Graphics', 'After Effects', '3D Modeling', 'Blender']), 'Motion designer dengan passion di animasi 3D dan visual effects.');

console.log('  Profiles: 8 inserted');

// ═══════════════════════════════════════════
//  SIAKAD (Academic Grades — A = verified skill)
// ═══════════════════════════════════════════
const siakadData = [
  // Ayu (2) - Bisnis Digital
  ['2024001001', 'Digital Marketing', 'A'], ['2024001001', 'Copywriting', 'A'], ['2024001001', 'Analisis Bisnis', 'B'], ['2024001001', 'Social Media Management', 'A'], ['2024001001', 'E-Commerce', 'B'], ['2024001001', 'Statistika', 'A'],
  // Rai (3) - Desain Grafis
  ['2024001002', 'UI/UX Design', 'A'], ['2024001002', 'Illustrasi', 'A'], ['2024001002', 'Branding', 'B'], ['2024001002', 'Adobe Photoshop', 'A'], ['2024001002', 'Fotografi Dasar', 'C'], ['2024001002', 'Tipografi', 'A'],
  // Putri (4) - TI
  ['2024001003', 'Pemrograman Web', 'A'], ['2024001003', 'Mobile Development', 'A'], ['2024001003', 'Database Management', 'A'], ['2024001003', 'Python', 'B'], ['2024001003', 'Jaringan Komputer', 'C'], ['2024001003', 'Algoritma', 'A'],
  // Adi (5) - Desain Grafis
  ['2024001004', 'Fotografi', 'A'], ['2024001004', 'Videografi', 'A'], ['2024001004', 'Video Editing', 'B'], ['2024001004', 'Adobe Premiere', 'A'], ['2024001004', 'Desain Grafis Dasar', 'B'],
  // Komang (6) - Bisnis Digital
  ['2024001005', 'Copywriting', 'A'], ['2024001005', 'SEO', 'A'], ['2024001005', 'Content Marketing', 'B'], ['2024001005', 'Analisis Data', 'C'], ['2024001005', 'Digital Marketing', 'A'],
  // Sinta (7) - TI
  ['2024001006', 'UI/UX Design', 'A'], ['2024001006', 'Web Development', 'A'], ['2024001006', 'React Framework', 'A'], ['2024001006', 'Database Systems', 'B'], ['2024001006', 'Pemrograman Mobile', 'B'], ['2024001006', 'Human Computer Interaction', 'A'],
  // Agus W (8) - Bisnis Digital
  ['2024001007', 'Social Media Management', 'A'], ['2024001007', 'Content Creation', 'A'], ['2024001007', 'Digital Analytics', 'B'], ['2024001007', 'Marketing Strategy', 'A'], ['2024001007', 'Business Communication', 'B'],
  // Rina (9) - Desain Grafis
  ['2024001008', 'Motion Graphics', 'A'], ['2024001008', 'After Effects', 'A'], ['2024001008', '3D Modeling', 'B'], ['2024001008', 'Blender', 'A'], ['2024001008', 'Visual Communication', 'A'], ['2024001008', 'Storyboarding', 'B'],
];
siakadData.forEach(([nim, mk, nilai]) => insSiakad.run(nim, mk, nilai));
console.log('  SIAKAD: ' + siakadData.length + ' entries');

// ═══════════════════════════════════════════
//  PROJECTS (21 total)
// ═══════════════════════════════════════════
// IDs 1-21 after inserts (in order)

// P1 - Budi, Mencari Talenta
insProject.run(10, 'Desain Logo Kopi Bali Premium', 'Kami membutuhkan desain logo baru untuk brand kopi premium kami. Logo harus mencerminkan budaya Bali dengan sentuhan modern. Deliverable: AI, PNG, SVG.', 2500000, '2026-07-15', 'Mencari Talenta', null);

// P2 - Budi, Selesai (Ayu)
insProject.run(10, 'Desain Kemasan Kopi', 'Desain kemasan kopi premium ukuran 250g dan 500g dengan nuansa Bali modern. Termasuk mockup 3D.', 1500000, '2026-05-01', 'Selesai', 2);

// P3 - Budi, Sedang Dikerjakan (Komang)
insProject.run(10, 'Social Media Campaign Kopi Bali', 'Pengelolaan konten Instagram dan TikTok selama 1 bulan. Target: 5000 followers baru dan engagement rate 5%.', 4000000, '2026-08-20', 'Sedang Dikerjakan', 6);

// P4 - Sari, Selesai (Rai)
insProject.run(11, 'Katalog Fashion Online', 'Desain katalog digital 20 halaman untuk koleksi Spring/Summer 2026. Layout clean dan minimalist.', 3500000, '2026-04-15', 'Selesai', 3);

// P5 - Sari, Dalam Peninjauan (Putri)
insProject.run(11, 'Website E-Commerce Boutique', 'Pembuatan website toko online dengan fitur keranjang belanja, payment gateway, dan admin panel.', 8000000, '2026-07-30', 'Dalam Peninjauan', 4);

// P6 - Sari, Sedang Dikerjakan (Sinta)
insProject.run(11, 'Redesign Brand Identity', 'Desain ulang identitas brand lengkap: logo, color palette, typography, brand guidelines book.', 6000000, '2026-09-01', 'Sedang Dikerjakan', 7);

// P7 - Agus, Selesai (Adi)
insProject.run(12, 'Video Profil Startup', 'Pembuatan company profile video 90 detik untuk pitch deck investor. Konsep modern dan profesional.', 5000000, '2026-05-20', 'Selesai', 5);

// P8 - Agus, Sedang Dikerjakan (Agus W)
insProject.run(12, 'Landing Page Optimization', 'Optimasi landing page untuk meningkatkan conversion rate. Termasuk A/B testing dan analytics setup.', 3000000, '2026-08-10', 'Sedang Dikerjakan', 8);

// P9 - Agus, Mencari Talenta
insProject.run(12, 'Aplikasi Mobile Inventory', 'Pengembangan aplikasi mobile Android untuk manajemen inventory gudang. Fitur: barcode scanner, laporan stok.', 12000000, '2026-10-01', 'Mencari Talenta', null);

// P10 - Dewa, Selesai (Komang)
insProject.run(13, 'Menu Digital Warung Nusantara', 'Desain menu digital interaktif untuk 5 cabang warung. Termasuk food photography editing.', 2000000, '2026-04-01', 'Selesai', 6);

// P11 - Dewa, Sedang Dikerjakan (Rai)
insProject.run(13, 'Interior Mural Warung', 'Desain mural untuk dinding interior warung ukuran 4x3 meter. Tema: Bali tradisional modern.', 3500000, '2026-08-15', 'Sedang Dikerjakan', 3);

// P12 - Dewa, Dalam Peninjauan (Ayu)
insProject.run(13, 'Kampanye Instagram Warung', 'Strategi dan eksekusi kampanye Instagram Ads selama 2 minggu untuk grand opening cabang baru.', 2500000, '2026-07-10', 'Dalam Peninjauan', 2);

// P13 - Lia, Selesai (Putri)
insProject.run(14, 'Website Booking Wisata', 'Website booking tour dengan fitur calendar, payment integration, dan multi-language (ID/EN).', 7000000, '2026-05-15', 'Selesai', 4);

// P14 - Lia, Sedang Dikerjakan (Rina)
insProject.run(14, 'Video Cinematic Bali Tour', 'Pembuatan video cinematic 3 menit untuk promosi paket wisata premium. Lokasi: Ubud, Seminyak, Nusa Penida.', 5500000, '2026-09-15', 'Sedang Dikerjakan', 9);

// P15 - Lia, Mencari Talenta
insProject.run(14, 'SEO & Content Strategy', 'Audit SEO website dan pembuatan strategi konten 3 bulan. Termasuk keyword research dan backlink building.', 4500000, '2026-09-30', 'Mencari Talenta', null);

// P16 - Rizky, Selesai (Sinta)
insProject.run(15, 'UI/UX Audit TechHub', 'Audit UX lengkap aplikasi web TechHub: user research, heuristic evaluation, dan redesign recommendations.', 4000000, '2026-05-10', 'Selesai', 7);

// P17 - Rizky, Dalam Peninjauan (Putri)
insProject.run(15, 'Dashboard Analytics App', 'Pengembangan dashboard analytics real-time dengan chart interaktif. Tech: React, Chart.js, REST API.', 9000000, '2026-08-25', 'Dalam Peninjauan', 4);

// P18 - Rizky, Sedang Dikerjakan (Adi)
insProject.run(15, 'Promo Video TechHub', 'Video promosi 60 detik untuk social media. Konsep tech-savvy, target audience startup founders.', 3500000, '2026-08-30', 'Sedang Dikerjakan', 5);

// P19 - Budi, Dibatalkan
insProject.run(10, 'Foto Produk Kopi', 'Foto produk 30 SKU kopi dengan styling rustic. Background kayu natural.', 1800000, '2026-06-01', 'Dibatalkan', 5);

// P20 - Sari, Mencari Talenta
insProject.run(11, 'Fashion Show Photography', 'Dokumentasi foto dan video fashion show koleksi terbaru. 2 hari event di Nusa Dua.', 5000000, '2026-09-20', 'Mencari Talenta', null);

// P21 - Agus, Selesai (Komang)
insProject.run(12, 'Blog Content Strategy', 'Pembuatan 10 artikel blog SEO-friendly tentang startup dan teknologi. Riset keyword termasuk.', 2000000, '2026-06-10', 'Selesai', 6);

console.log('  Projects: 21 inserted');

// ═══════════════════════════════════════════
//  ESCROW TRANSACTIONS
// ═══════════════════════════════════════════
insEscrow.run(2, 1500000, 'Dana Dicairkan', null);            // P2 - Selesai
insEscrow.run(3, 4000000, 'Dana Dikunci', null);              // P3 - Active
insEscrow.run(4, 3500000, 'Dana Dicairkan', null);            // P4 - Selesai
insEscrow.run(5, 8000000, 'Dana Dikunci', null);              // P5 - Review
insEscrow.run(6, 6000000, 'Dana Dikunci', null);              // P6 - Active
insEscrow.run(7, 5000000, 'Dana Dicairkan', null);            // P7 - Selesai
insEscrow.run(8, 3000000, 'Dana Dikunci', null);              // P8 - Active
insEscrow.run(10, 2000000, 'Dana Dicairkan', null);           // P10 - Selesai
insEscrow.run(11, 3500000, 'Dana Dikunci', null);             // P11 - Active
insEscrow.run(12, 2500000, 'Menunggu Pembayaran', null);      // P12 - Review
insEscrow.run(13, 7000000, 'Dana Dicairkan', null);           // P13 - Selesai
insEscrow.run(14, 5500000, 'Dana Dikunci', null);             // P14 - Active
insEscrow.run(16, 4000000, 'Dana Dicairkan', null);           // P16 - Selesai
insEscrow.run(17, 9000000, 'Menunggu Pembayaran', null);      // P17 - Review
insEscrow.run(18, 3500000, 'Dana Dikunci', null);             // P18 - Active
insEscrow.run(19, 1800000, 'Dana Dikembalikan', null);        // P19 - Cancelled
insEscrow.run(21, 2000000, 'Dana Dicairkan', null);           // P21 - Selesai

console.log('  Escrow: 17 transactions');

// ═══════════════════════════════════════════
//  RATINGS (for completed projects: P2, P4, P7, P10, P13, P16, P21)
// ═══════════════════════════════════════════
insRating.run(2,  10, 2, 5, 4, 'Hasil desain kemasan sangat memuaskan! Warna dan layout sesuai brief. Recomended!');
insRating.run(4,  11, 3, 5, 5, 'Rai sangat kreatif dan responsif. Katalognya elegant persis seperti yang kami mau.');
insRating.run(7,  12, 5, 4, 4, 'Video profilnya keren, investor kami impressed. Sedikit revisi di awal tapi hasil akhir sempurna.');
insRating.run(10, 13, 6, 5, 5, 'Komang luar biasa! Menu digitalnya interaktif dan pelanggan kami suka banget.');
insRating.run(13, 14, 4, 5, 4, 'Website booking-nya sangat profesional. Booking online meningkat 300% sejak launch.');
insRating.run(16, 15, 7, 4, 5, 'Audit UX-nya sangat detail. Banyak insight berharga untuk improve produk kami.');
insRating.run(21, 12, 6, 4, 4, 'Artikel blog-nya berkualitas tinggi dan SEO-friendly. Traffic naik 40% dalam sebulan.');

console.log('  Ratings: 7 reviews');

// ═══════════════════════════════════════════
//  FILE SUBMISSIONS (for active/review projects)
// ═══════════════════════════════════════════
insSub.run(3, 6, '/uploads/p3_konten_plan.pdf', 'Konten_Plan_Juli.pdf', '.pdf', '2026-07-01 10:00:00');
insSub.run(3, 6, '/uploads/p3_feed_design.png', 'Instagram_Feed_Design.png', '.png', '2026-07-05 14:30:00');
insSub.run(5, 4, '/uploads/p5_wireframe.pdf', 'Wireframe_E-Commerce.pdf', '.pdf', '2026-06-20 09:15:00');
insSub.run(5, 4, '/uploads/p5_frontend.zip', 'Frontend_Source.zip', '.zip', '2026-07-15 16:45:00');
insSub.run(5, 4, '/uploads/p5_screenshot.png', 'Homepage_Screenshot.png', '.png', '2026-07-15 16:50:00');
insSub.run(6, 7, '/uploads/p6_moodboard.jpg', 'Moodboard_Brand.jpg', '.jpg', '2026-07-10 11:00:00');
insSub.run(6, 7, '/uploads/p6_logo_v2.ai', 'Logo_Concept_v2.ai', '.ai', '2026-07-20 15:20:00');
insSub.run(8, 8, '/uploads/p8_report.pdf', 'Analytics_Report.pdf', '.pdf', '2026-07-25 13:00:00');
insSub.run(11, 3, '/uploads/p11_sketch.jpg', 'Mural_Sketch_Final.jpg', '.jpg', '2026-07-12 10:30:00');
insSub.run(12, 2, '/uploads/p12_ad_creatives.zip', 'Ad_Creatives_v3.zip', '.zip', '2026-07-05 09:00:00');
insSub.run(14, 9, '/uploads/p14_raw_footage.zip', 'Raw_Footage_Day1.zip', '.zip', '2026-08-01 18:00:00');
insSub.run(14, 9, '/uploads/p14_storyboard.pdf', 'Storyboard_Final.pdf', '.pdf', '2026-07-28 14:00:00');
insSub.run(17, 4, '/uploads/p17_dashboard_v2.zip', 'Dashboard_App_v2.zip', '.zip', '2026-08-10 17:30:00');
insSub.run(18, 5, '/uploads/p18_teaser.mp4', 'Promo_Video_Teaser.mp4', '.mp4', '2026-08-05 12:00:00');

console.log('  Submissions: 14 files');

// ═══════════════════════════════════════════
//  CHAT MESSAGES (for active/in-progress projects)
// ═══════════════════════════════════════════
const msgs = [
  // P3 - Budi(10) <-> Komang(6): Social Media Campaign
  [3, 10, 'Halo Komang! Selamat bergabung di proyek ini. Brief-nya sudah saya lampirkan di deskripsi ya.', 1, '2026-06-28 09:00:00'],
  [3, 6, 'Halo Pak Budi, terima kasih! Saya sudah baca brief-nya. Untuk target followers, apakah fokus ke organic atau paid?', 1, '2026-06-28 09:15:00'],
  [3, 10, 'Kombinasi keduanya ya. 60% organic, 40% paid ads. Budget ads sudah termasuk di anggaran.', 1, '2026-06-28 09:30:00'],
  [3, 6, 'Siap! Saya akan siapkan content plan dulu dalam 3 hari ke depan. Nanti saya share draft-nya.', 1, '2026-06-28 10:00:00'],
  [3, 6, 'Pak Budi, ini draft content plan bulan Juli sudah saya upload. Mohon review ya!', 1, '2026-07-01 10:05:00'],
  [3, 10, 'Bagus sekali! Saya suka ide kontennya. Tapi tolong tambahkan lebih banyak video Reels ya.', 0, '2026-07-01 14:00:00'],
  [3, 6, 'Noted! Saya akan revisi dan tambahkan 8 Reels per minggu. Akan saya update file-nya.', 1, '2026-07-01 14:30:00'],

  // P5 - Sari(11) <-> Putri(4): E-Commerce Website
  [5, 11, 'Hai Putri, untuk websitenya saya mau tampilan yang clean dan modern seperti Zara.', 1, '2026-06-10 10:00:00'],
  [5, 4, 'Baik Bu Sari, saya paham. Untuk payment gateway prefer Midtrans atau Xendit?', 1, '2026-06-10 10:20:00'],
  [5, 11, 'Midtrans saja ya, lebih familiar untuk customer kami.', 1, '2026-06-10 10:35:00'],
  [5, 4, 'Siap! Ini wireframe awal sudah saya upload. Ada 12 halaman total termasuk checkout flow.', 1, '2026-06-20 09:20:00'],
  [5, 11, 'Wireframe-nya sudah oke. Tolong tambahkan wishlist feature juga ya.', 1, '2026-06-22 11:00:00'],
  [5, 4, 'Sudah saya tambahkan. Frontend sudah 80% selesai, tinggal integrasi payment.', 1, '2026-07-10 15:00:00'],
  [5, 4, 'Bu Sari, website sudah selesai dan saya serahkan untuk review. Mohon dicek ya!', 0, '2026-07-15 16:55:00'],

  // P6 - Sari(11) <-> Sinta(7): Brand Identity
  [6, 11, 'Sinta, untuk brand identity baru ini saya ingin nuansa yang lebih premium dan elegant.', 1, '2026-07-05 09:00:00'],
  [6, 7, 'Baik Bu! Saya sudah riset brand fashion premium. Ini moodboard-nya saya upload.', 1, '2026-07-10 11:05:00'],
  [6, 11, 'Moodboard-nya bagus! Saya suka arah visual yang nomor 2 dan 4.', 1, '2026-07-11 08:30:00'],
  [6, 7, 'Noted! Saya akan kembangkan 3 konsep logo berdasarkan direction itu.', 1, '2026-07-12 10:00:00'],
  [6, 7, 'Bu Sari, ini 3 konsep logo sudah saya upload. Mana yang paling cocok?', 0, '2026-07-20 15:25:00'],

  // P8 - Agus(12) <-> Agus W(8): Landing Page Optimization
  [8, 12, 'Bro, landing page kita conversion rate-nya cuma 1.2%. Bisa dibantu optimize?', 1, '2026-07-15 10:00:00'],
  [8, 8, 'Bisa banget Mas! Saya akan audit dulu selama 3 hari, lalu kasih rekomendasi.', 1, '2026-07-15 10:30:00'],
  [8, 8, 'Mas Agus, ini audit report-nya. Ada 12 improvement points. Yang paling impact: CTA placement dan loading speed.', 1, '2026-07-25 13:05:00'],
  [8, 12, 'Mantap! Langsung kerjakan yang prioritas tinggi dulu ya.', 0, '2026-07-25 14:00:00'],

  // P11 - Dewa(13) <-> Rai(3): Interior Mural
  [11, 13, 'Ketut, untuk mural-nya saya mau yang menggambarkan suasana pasar tradisional Bali.', 1, '2026-07-08 09:00:00'],
  [11, 3, 'Siap Pak Dewa! Ini sketch awal konsepnya. Gabungan pasar tradisional dengan sentuhan kontemporer.', 1, '2026-07-12 10:35:00'],
  [11, 13, 'Keren banget! Tapi tolong tambahkan elemen subak (irigasi Bali) juga ya.', 0, '2026-07-12 15:00:00'],

  // P14 - Lia(14) <-> Rina(9): Video Cinematic
  [14, 14, 'Putu, untuk video cinematic-nya saya mau feel-nya seperti travel vlog premium.', 1, '2026-07-20 08:00:00'],
  [14, 9, 'Baik Bu Lia! Ini storyboard-nya sudah saya siapkan. 15 scenes total.', 1, '2026-07-28 14:05:00'],
  [14, 14, 'Storyboard-nya amazing! Lokasi Nusa Penida tolong ditambahkan drone shot ya.', 1, '2026-07-29 09:00:00'],
  [14, 9, 'Siap! Day 1 shooting sudah selesai. Ini raw footage-nya untuk preview.', 0, '2026-08-01 18:05:00'],

  // P18 - Rizky(15) <-> Adi(5): Promo Video
  [18, 15, 'Di, untuk video promo TechHub ini target audience-nya startup founders muda.', 1, '2026-08-01 10:00:00'],
  [18, 5, 'Oke Mas Rizky, saya sudah punya konsepnya. Style-nya fast-paced editing dengan upbeat music.', 1, '2026-08-01 11:00:00'],
  [18, 5, 'Mas, ini teaser 15 detik dulu ya. Full video sedang proses editing.', 0, '2026-08-05 12:05:00'],
];

msgs.forEach(m => insMsg.run(m[0], m[1], m[2], m[3], m[4]));
console.log('  Messages: ' + msgs.length + ' chat messages');

// ═══════════════════════════════════════════
//  ACADEMIC CALENDAR
// ═══════════════════════════════════════════
insCal.run('UTS Semester Ganjil 2025/2026', '2025-10-01', '2025-10-14', 0);
insCal.run('UTS Semester Genap 2025/2026', '2026-04-01', '2026-04-14', 0);
insCal.run('UAS Semester Genap 2025/2026', '2026-06-15', '2026-06-30', 1);
insCal.run('Libur Semester Genap', '2026-07-01', '2026-07-14', 0);
insCal.run('UTS Semester Ganjil 2026/2027', '2026-10-05', '2026-10-18', 0);
insCal.run('UAS Semester Ganjil 2026/2027', '2027-01-11', '2027-01-24', 0);

console.log('  Calendar: 6 periods');

// ═══════════════════════════════════════════
//  DONE
// ═══════════════════════════════════════════
console.log('');
console.log('=== SEED COMPLETE ===');
console.log('  Total users: 15 (1 admin, 8 students, 6 clients)');
console.log('  Total projects: 21 (4 open, 7 active, 3 review, 6 completed, 1 cancelled)');
console.log('  Total escrow: 17 transactions');
console.log('  Total ratings: 7 reviews');
console.log('  Total messages: ' + msgs.length);
console.log('  Total submissions: 14 files');
console.log('');
console.log('Akun login yang tersedia:');
console.log('  Admin:     admin@studentworks.id / admin123');
console.log('  Mahasiswa: ayu@student.idb.ac.id / mahasiswa123');
console.log('             rai@student.idb.ac.id / mahasiswa123');
console.log('             putri@student.idb.ac.id / mahasiswa123');
console.log('             adi@student.idb.ac.id / mahasiswa123');
console.log('             komang@student.idb.ac.id / mahasiswa123');
console.log('             sinta@student.idb.ac.id / mahasiswa123');
console.log('             agus.w@student.idb.ac.id / mahasiswa123');
console.log('             rina@student.idb.ac.id / mahasiswa123');
console.log('  Klien:     budi@kopibali.com / klien123');
console.log('             sari@boutiqueubud.com / klien123');
console.log('             agus@startuplokal.id / klien123');
console.log('             dewa@warungnusantara.id / klien123');
console.log('             lia@balitour.com / klien123');
console.log('             rizky@techhub.id / klien123');
