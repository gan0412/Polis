const express = require('express');
const cors = require('cors');
const fs = require('fs');
const db = require('./db');
const { sendEmail } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/users', async (req, res) => {
  const { name, email, city, state, age, topics } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    // 1. Hardcoded AI Result for testing
    console.log(`Generating AI summary for ${name}...`);
    const aiResult = [
      {
        billTitle: "SB 567 - Tenant Protection Act",
        impactHeadline: "Your rent increases capped at 8%",
        summary: "As a renter in California, SB 567 limits how much your landlord can raise your rent each year — no more than 8% or 5% plus inflation, whichever is lower. Starting January 2027, you're also protected from eviction without just cause after living somewhere for 12 months, giving you significantly more housing stability."
      },
      {
        billTitle: "SB 567 - Renter Tax Credit",
        impactHeadline: "You may qualify for $1,000 tax credit",
        summary: "If your adjusted gross income is under $50,000, you could receive a $1,000 renter's tax credit starting in the 2027 tax year. If you have dependent children, you can receive an additional $500 per child, up to two children."
      }
    ];

    // 2. Dispatch Email
    console.log(`Sending email...`);
    const previewUrl = await sendEmail(email, name, aiResult);

    res.status(201).json({ 
      message: 'User registered successfully and email dispatched', 
      previewUrl: previewUrl,
      aiResult: aiResult
    });

  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }
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