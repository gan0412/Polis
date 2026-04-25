const express = require('express');
const cors = require('cors');
const fs = require('fs');
const db = require('./db');
const { generatePersonalizedImpact } = require('./aiService');
const { sendEmail } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// POST /api/users - Register a new user persona
app.post('/api/users', async (req, res) => {
  const { name, email, city, state, age, topics } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    // 1. Save to Database (Bypassed per request)
    /*
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
    */
    // 2. Read Mock Bill
    const billText = fs.readFileSync('./mock_bill.txt', 'utf8');

    // 3. Generate Claude Summary
    console.log(`Generating AI summary for ${name}...`);
    const aiResult = await generatePersonalizedImpact(billText, req.body);

    // 4. Dispatch Email
    console.log(`Sending email...`);
    const previewUrl = await sendEmail(email, name, aiResult);

    res.status(201).json({ 
      message: 'User registered successfully and email dispatched', 
      userId: info.lastInsertRowid,
      previewUrl: previewUrl,
      aiResult: aiResult
    });
  } catch (err) {
    // If the email already exists, SQLite will throw an error
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }
    console.error("Server error:", err);
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
