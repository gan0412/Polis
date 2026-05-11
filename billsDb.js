const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'bills.json');

// Initialize the NoSQL JSON database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  // Start with a 'federal' key as requested
  fs.writeFileSync(DB_FILE, JSON.stringify({ federal: [] }, null, 2));
}

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading bills.json", err);
    return {};
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  /**
   * Get all bills for a specific key (e.g., 'federal', 'NY', 'CA')
   */
  get: (stateKey) => {
    const db = readDB();
    return db[stateKey] || [];
  },

  /**
   * Set or replace all bills for a specific state key
   */
  set: (stateKey, billsArray) => {
    const db = readDB();
    db[stateKey] = billsArray;
    writeDB(db);
  },

  /**
   * Append a single bill to a specific state key
   */
  addBill: (stateKey, bill) => {
    const db = readDB();
    if (!db[stateKey]) {
      db[stateKey] = [];
    }
    db[stateKey].push(bill);
    writeDB(db);
  },

  /**
   * Return the entire database
   */
  getAll: () => {
    return readDB();
  }
};
