const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// POST /api/users - Register a new user persona
app.post('/api/users', (req, res) => {
  const { name, email, city, state, age, topics } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, city, state, age, topics)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      name, 
      email, 
      city, 
      state, 
      age, 
      JSON.stringify(topics || [])
    );

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: info.lastInsertRowid 
    });
  } catch (err) {
    // If the email already exists, SQLite will throw an error
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }
    console.error("Database error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users - Retrieve all users
app.get('/api/users', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM users');
    const users = stmt.all();
    
    // Parse the topics JSON string back into an array
    const parsedUsers = users.map(u => ({
      ...u,
      topics: JSON.parse(u.topics)
    }));

    res.status(200).json(parsedUsers);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Polis API server running on http://localhost:${PORT}`);
});
