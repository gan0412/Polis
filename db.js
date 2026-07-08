const Database = require('better-sqlite3');
const path = require('path');

// Initialize the SQLite database (using a persistent volume path in production if available)
const dbPath = process.env.PERSISTENT_VOLUME_PATH 
  ? path.join(process.env.PERSISTENT_VOLUME_PATH, 'polis.db')
  : path.join(__dirname, 'polis.db');

console.log(`Initializing SQLite database at: ${dbPath}`);
const db = new Database(dbPath, { verbose: console.log });

// Create the users table if it doesn't exist
const initDB = () => {

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      zip TEXT,
      housing TEXT,
      income TEXT,
      employment TEXT,
      dependents TEXT,
      health_insurance TEXT,
      age TEXT,
      topics TEXT,
      education TEXT,
      education_field TEXT,
      state TEXT
    )
  `);

  // Schema migration for existing databases
  try {
    db.exec("ALTER TABLE users ADD COLUMN education TEXT");
  } catch (e) { }
  try {
    db.exec("ALTER TABLE users ADD COLUMN education_field TEXT");
  } catch (e) { }
  try {
    db.exec("ALTER TABLE users ADD COLUMN state TEXT");
  } catch (e) { }
};

initDB();

module.exports = db;
