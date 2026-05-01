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

app.post('/api/users', async (req, res) => {
  const { name, email, zip, housing, income, employment, dependents, health_insurance, age, topics } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    // 1. Save to Database (gracefully handling existing users for the demo)
    try {
      const stmt = db.prepare(`
        INSERT INTO users (name, email, zip, housing, income, employment, dependents, health_insurance, age, topics)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(name, email, zip, housing, income, employment, dependents, health_insurance, age, JSON.stringify(topics || []));
    } catch (dbErr) {
      if (dbErr.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw dbErr;
      console.log(`User ${email} already exists in DB. Proceeding with demo generation...`);
    }

    // 2. Read Mock Bill
    const billText = fs.readFileSync('./mock_bill.txt', 'utf8');

    // 3. Generate Claude Summary
    console.log(`Generating AI summary for ${name}...`);
    const aiResult = await generatePersonalizedImpact(billText, req.body);

    // 4. Dispatch Email
    console.log(`Sending email...`);
    const previewUrl = await sendEmail(email, name, aiResult);

    res.status(201).json({ 
      message: 'User processed and email dispatched', 
      previewUrl: previewUrl,
      aiResult: aiResult
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM users');
    const users = stmt.all();
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