const Database = require('better-sqlite3');
const path = require('path');

// Initialize the SQLite database in the root folder
const db = new Database(path.join(__dirname, 'polis.db'), { verbose: console.log });

// Create the users table if it doesn't exist
const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      city TEXT,
      state TEXT,
      age TEXT,
      topics TEXT
    )
  `);
};

initDB();

module.exports = db;
