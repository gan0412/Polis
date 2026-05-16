const express = require('express');
const cors = require('cors');
const fs = require('fs');
const db = require('./db');
const billsDb = require('./billsDb');
const { selectAndSummarizeBills } = require('./aiService');
const { sendEmail } = require('./emailService');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve the built React frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

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

    // 2. Get relevant bills from NoSQL Database
    const userState = req.body.state; // e.g. "NY" or "CA" (to be added on frontend later)
    const stateBills = userState ? billsDb.get(userState) : [];
    const federalBills = billsDb.get('federal');
    
    // Filter out placeholder "Reserved for the Speaker" bills
    const relevantBills = [...stateBills, ...federalBills].filter(
      bill => bill.title && !bill.title.includes("Reserved for the Speaker")
    );
    let billText;
    
    if (relevantBills.length > 0) {
      // For this demo, pick the first 5 relevant bills to summarize and filter
      const initialBills = relevantBills.slice(0, 5);
      
      console.log(`Generating AI summary for ${name}...`);
      const aiResultArray = await selectAndSummarizeBills(initialBills, req.body);

      // 4. Dispatch Email
      if (aiResultArray && aiResultArray.length > 0) {
        console.log(`Sending email...`);
        const previewUrl = await sendEmail(email, name, aiResultArray);
        res.status(201).json({ message: 'User processed and email dispatched', aiResult: aiResultArray });
      } else {
        res.status(201).json({ message: 'No impactful bills found for this user.' });
      }
    } else {
      res.status(201).json({ message: 'No relevant bills in the database yet.' });
    }

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

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Catch-all to serve React app for unknown routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Polis API server running on http://localhost:${PORT}`);
});