const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'studentworks.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
