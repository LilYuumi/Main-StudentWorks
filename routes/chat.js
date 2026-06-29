const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { isAuthenticated } = require('../middleware/auth');

// Chat page for a specific project
router.get('/:projectId', isAuthenticated, (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  // Verify user has access to this project
  let project;
  if (userRole === 'mahasiswa') {
    project = db.prepare(`
      SELECT p.*, u.name as klien_name, u.id as klien_id
      FROM projects p
      JOIN users u ON p.klien_id = u.id
      WHERE p.id = ? AND p.mahasiswa_id = ?
    `).get(projectId, userId);
  } else if (userRole === 'klien') {
    project = db.prepare(`
      SELECT p.*, u.name as mahasiswa_name, u.id as mahasiswa_id
      FROM projects p
      LEFT JOIN users u ON p.mahasiswa_id = u.id
      WHERE p.id = ? AND p.klien_id = ?
    `).get(projectId, userId);
  }

  if (!project) {
    req.flash('error', 'Anda tidak memiliki akses ke percakapan ini.');
    return res.redirect('/' + userRole + '/dashboard');
  }

  // Get all messages for this project
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.project_id = ?
    ORDER BY m.created_at ASC
  `).all(projectId);

  // Mark messages as read
  db.prepare('UPDATE messages SET is_read = 1 WHERE project_id = ? AND sender_id != ?')
    .run(projectId, userId);

  // Determine the other party's name
  const otherName = userRole === 'mahasiswa' ? project.klien_name : project.mahasiswa_name;

  // Get submissions for this project
  const submissions = db.prepare(`
    SELECT ps.*, u.name as uploader_name
    FROM project_submissions ps
    JOIN users u ON ps.user_id = u.id
    WHERE ps.project_id = ?
    ORDER BY ps.created_at DESC
  `).all(projectId);

  res.render('chat/index', {
    project,
    messages,
    submissions,
    otherName
  });
});

// Send a message (POST)
router.post('/:projectId', isAuthenticated, (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.redirect('/chat/' + projectId);
  }

  // Verify user has access
  let hasAccess;
  if (userRole === 'mahasiswa') {
    hasAccess = db.prepare('SELECT id FROM projects WHERE id = ? AND mahasiswa_id = ?').get(projectId, userId);
  } else {
    hasAccess = db.prepare('SELECT id FROM projects WHERE id = ? AND klien_id = ?').get(projectId, userId);
  }

  if (!hasAccess) {
    req.flash('error', 'Akses ditolak.');
    return res.redirect('/' + userRole + '/dashboard');
  }

  db.prepare('INSERT INTO messages (project_id, sender_id, message) VALUES (?, ?, ?)')
    .run(projectId, userId, message.trim());

  res.redirect('/chat/' + projectId);
});

// AJAX endpoint: get new messages (for polling)
router.get('/:projectId/messages', isAuthenticated, (req, res) => {
  const projectId = req.params.projectId;
  const after = parseInt(req.query.after) || 0;

  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.project_id = ? AND m.id > ?
    ORDER BY m.created_at ASC
  `).all(projectId, after);

  // Mark new messages as read
  db.prepare('UPDATE messages SET is_read = 1 WHERE project_id = ? AND sender_id != ? AND id > ?')
    .run(projectId, req.session.user.id, after);

  res.json(messages);
});

module.exports = router;
