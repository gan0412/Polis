const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

// Determine if we are using PostgreSQL (production) or SQLite (local development)
const isPostgres = !!process.env.DATABASE_URL;

let pool = null;
let sqliteDb = null;

if (isPostgres) {
  console.log("Initializing PostgreSQL database...");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  const dbPath = path.join(__dirname, 'polis.db');
  console.log(`Initializing SQLite database at: ${dbPath}`);
  sqliteDb = new Database(dbPath, { verbose: console.log });
}

// Helper to convert SQLite "?" placeholders to PostgreSQL "$1, $2, etc."
function convertSqlPlaceholders(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

// Unified interface representing a DB connection wrapper
const db = {
  // Executes a query that returns multiple rows
  async all(sql, params = []) {
    if (isPostgres) {
      const pgSql = convertSqlPlaceholders(sql);
      const res = await pool.query(pgSql, params);
      return res.rows;
    } else {
      return sqliteDb.prepare(sql).all(params);
    }
  },

  // Executes a query that returns a single row
  async get(sql, params = []) {
    if (isPostgres) {
      const pgSql = convertSqlPlaceholders(sql);
      const res = await pool.query(pgSql, params);
      return res.rows[0] || null;
    } else {
      return sqliteDb.prepare(sql).get(params);
    }
  },

  // Runs a statement (INSERT/UPDATE/DELETE)
  async run(sql, params = []) {
    if (isPostgres) {
      const pgSql = convertSqlPlaceholders(sql);
      await pool.query(pgSql, params);
      return { changes: 1 };
    } else {
      const stmt = sqliteDb.prepare(sql);
      const res = stmt.run(params);
      return { changes: res.changes };
    }
  }
};

const initDB = async () => {
  if (isPostgres) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
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
          state TEXT,
          last_briefed_at TIMESTAMPTZ
        )
      `);
      // Postgres Migration
      try {
        await pool.query("ALTER TABLE users ADD COLUMN last_briefed_at TIMESTAMPTZ");
      } catch (e) {}
      console.log("PostgreSQL users table checked/created.");
    } catch (err) {
      console.error("Error initializing PostgreSQL table:", err);
    }
  } else {
    sqliteDb.exec(`
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
        state TEXT,
        last_briefed_at TEXT
      )
    `);

    // Schema migration for existing local databases
    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN education TEXT");
    } catch (e) { }
    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN education_field TEXT");
    } catch (e) { }
    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN state TEXT");
    } catch (e) { }
    try {
      sqliteDb.exec("ALTER TABLE users ADD COLUMN last_briefed_at TEXT");
    } catch (e) { }
  }
};

initDB();

module.exports = db;
