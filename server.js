const express = require('express');
const cors = require('cors');
const fs = require('fs');
const db = require('./db');
const billsDb = require('./billsDb');
const { selectAndSummarizeBills, generatePersonalizedImpact } = require('./aiService');
const { sendEmail } = require('./emailService');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve the built React frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    // 1. Check if email is already verified in active users table
    const existingUser = await db.get('SELECT email FROM users WHERE email = ?', [email]);
    if (existingUser) {
      console.log(`User ${email} already registered in verified table.`);
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    // 2. Generate a random 6-digit verification code
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

    // 3. Save to pending_users (upsert if exists)
    // To support both SQLite and Postgres upsert syntax safely: delete first, then insert.
    await db.run('DELETE FROM pending_users WHERE email = ?', [email]);
    await db.run(
      `INSERT INTO pending_users (email, code, profile_data) VALUES (?, ?, ?)`,
      [email, verificationCode, JSON.stringify(req.body)]
    );

    // 4. Send Verification Code Email
    console.log(`Generating verification code ${verificationCode} for ${email}...`);
    const emailSent = await sendVerificationEmail(email, name, verificationCode);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/verify', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  try {
    // 1. Fetch pending record
    const pending = await db.get('SELECT * FROM pending_users WHERE email = ?', [email]);
    if (!pending) {
      return res.status(400).json({ error: 'No verification request found for this email. Please sign up again.' });
    }

    // 2. Verify code
    if (pending.code.trim() !== code.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // 3. Parse user profile details from pending data
    const profile = JSON.parse(pending.profile_data);
    const { name, zip, housing, income, employment, dependents, health_insurance, age, topics, education, education_field, state } = profile;

    // 4. Save to active users table
    try {
      await db.run(
        `INSERT INTO users (name, email, zip, housing, income, employment, dependents, health_insurance, age, topics, education, education_field, state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, zip, housing, income, employment, dependents, health_insurance, age, JSON.stringify(topics || []), education, education_field, state]
      );
    } catch (dbErr) {
      if (dbErr.code === 'SQLITE_CONSTRAINT_UNIQUE' || dbErr.code === '23505') {
        return res.status(409).json({ error: 'This email is already registered.' });
      }
      throw dbErr;
    }

    // Remove pending record now that they are verified
    await db.run('DELETE FROM pending_users WHERE email = ?', [email]);

    // 5. Query and dispatch onboarding briefings immediately
    const stateBills = state ? billsDb.get(state) : [];
    const federalBills = billsDb.get('federal');
    
    const relevantBills = [...stateBills, ...federalBills].filter(
      bill => bill.title && !bill.title.includes("Reserved for the Speaker") && !bill.title.includes("The Big Beautiful Bill Act")
    );
    
    let aiResultArray = [];
    if (relevantBills.length > 0) {
      console.log(`Locally matching pre-processed bill impacts for verified user ${name}...`);
      const { matchUserToBillImpacts } = require('./matching');
      
      for (const bill of relevantBills) {
        const matched = await matchUserToBillImpacts(bill, profile);
        if (matched) {
          aiResultArray.push(matched);
        }
        if (aiResultArray.length >= 2) break;
      }

      // Fallback to dynamic AI matching
      if (aiResultArray.length === 0) {
        console.log(`⚠️ Local matching returned 0 results for verified ${name}. Falling back to dynamic AI matching...`);
        aiResultArray = await selectAndSummarizeBills(relevantBills, profile);
      }

      // Dispatch briefing emails
      if (aiResultArray.length > 0) {
        console.log(`Sending ${aiResultArray.length} onboarding briefs to ${email}...`);
        for (const bill of aiResultArray) {
          // Fetch the full bill object from NoSQL to get description
          let fullBill = null;
          for (const key of Object.keys(allBills)) {
            fullBill = allBills[key].find(b => String(b.bill_id) === String(bill.billId));
            if (fullBill) break;
          }
          
          let articlePayload = null;
          if (fullBill) {
            try {
              console.log(`   -> Pre-generating full article for bill ${bill.billId}...`);
              const billText = `BILL STATE: ${fullBill.state}\nBILL NUMBER: ${fullBill.bill_number || ''}\nBILL TITLE: ${fullBill.title || ''}\nBILL DESCRIPTION: ${fullBill.description || fullBill.title || ''}`;
              articlePayload = await generatePersonalizedImpact(billText, profile);
            } catch (pErr) {
              console.error(`Failed to pre-generate article payload for bill ${bill.billId}:`, pErr.message);
            }
          }
          
          await sendEmail(email, name, bill, articlePayload);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    await db.run('UPDATE users SET last_briefed_at = ? WHERE email = ?', [new Date().toISOString(), email]);
    res.status(200).json({ message: 'Email verified successfully!', aiResult: aiResultArray });

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: 'Internal server error during verification.' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT * FROM users');
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

app.post('/api/clear-users', async (req, res) => {
  try {
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM pending_users');
    console.log("Database tables cleared successfully.");
    res.status(200).json({ message: "Users cleared successfully." });
  } catch (err) {
    console.error("Database clearing error:", err);
    res.status(500).json({ error: 'Failed to clear users database.' });
  }
});

app.get('/article/:billId', async (req, res) => {
  const { billId } = req.params;
  const { email, p } = req.query;

  if (!email) {
    return res.status(400).send("<h1>Error</h1><p>Email query parameter is required.</p>");
  }

  try {
    // 1. Fetch user from database
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      console.log(`User ${email} not found in DB. Falling back to default profile for public viewing.`);
      user = {
        name: 'Guest Reader',
        email: email,
        zip: '23219',
        housing: '🏠 I rent my home',
        income: '$50,000 – $100,000',
        employment: 'Employed',
        dependents: 'No dependents',
        health_insurance: '🏢 Through my employer',
        age: '26 – 34',
        topics: JSON.stringify([]),
        education: "Bachelor's Degree",
        education_field: 'General',
        state: 'VA'
      };
    }
    user.topics = user.topics ? JSON.parse(user.topics) : [];

    // 2. Fetch bill from NoSQL
    const allBills = billsDb.getAll();
    let foundBill = null;
    for (const key of Object.keys(allBills)) {
      foundBill = allBills[key].find(b => String(b.bill_id) === String(billId));
      if (foundBill) break;
    }

    if (!foundBill) {
      return res.status(404).send("<h1>Bill Not Found</h1><p>Could not locate the requested bill.</p>");
    }

    // 3. Try to decompress and decode pre-generated article payload from URL parameter
    let article = null;
    if (p) {
      try {
        const zlib = require('zlib');
        // Restore standard Base64 characters from URL-safe variants
        const base64Str = p.replace(/-/g, '+').replace(/_/g, '/');
        const compressedBuffer = Buffer.from(base64Str, 'base64');
        const decompressed = zlib.inflateRawSync(compressedBuffer).toString('utf8');
        article = JSON.parse(decompressed);
        console.log(`Decoded pre-generated article payload from URL for bill ${billId}. Bypassing AI generation.`);
      } catch (decodeErr) {
        console.error("Failed to decode URL article payload:", decodeErr.message);
      }
    }

    // Fallback: Generate dynamically if no valid payload was provided in the link
    if (!article) {
      console.log(`Generating in-depth article for bill ${billId} and user ${email}...`);
      const billText = `BILL STATE: ${foundBill.state}\nBILL NUMBER: ${foundBill.bill_number || ''}\nBILL TITLE: ${foundBill.title || ''}\nBILL DESCRIPTION: ${foundBill.description || foundBill.title || ''}`;
      article = await generatePersonalizedImpact(billText, user);
    }

    // 4. Render a premium article web page matching the form UI perfectly!
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${article.billTitle || foundBill.title} - Personalized Briefing</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            background-color: #080808;
            color: #f8f4ee;
            font-family: 'DM Sans', system-ui, sans-serif;
            line-height: 1.6;
            min-height: 100vh;
            padding-bottom: 100px;
            overflow-x: hidden;
          }

          /* ── TOP BAR ── */
          .top-bar {
            border-bottom: 1px solid rgba(248, 244, 238, 0.1);
            padding: 18px 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .top-bar-logo {
            font-family: 'Bebas Neue', Impact, sans-serif;
            font-size: 22px;
            letter-spacing: 0.06em;
            color: #f8f4ee;
          }

          .top-bar-sub {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.16em;
            color: #6b6459;
            text-transform: uppercase;
          }

          /* ── HERO ── */
          .hero {
            padding: 72px 40px 56px;
            max-width: 900px;
            margin: 0 auto;
            animation: fadeUp 0.5s ease both;
          }

          .hero-tag {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.18em;
            color: #d63426;
            text-transform: uppercase;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .hero-tag span {
            display: inline-block;
            width: 24px;
            height: 1px;
            backgroundColor: #d63426;
          }

          .hero h1 {
            font-family: 'Bebas Neue', Impact, sans-serif;
            font-size: clamp(48px, 6vw, 76px);
            line-height: 0.92;
            margin: 0 0 24px;
            letter-spacing: 0.02em;
            color: #f8f4ee;
            text-transform: uppercase;
          }

          .hero-desc {
            font-family: 'Instrument Serif', Georgia, serif;
            font-style: italic;
            font-size: 20px;
            color: #6b6459;
            margin: 0;
            line-height: 1.55;
          }

          /* ── CONTAINER & CARD ── */
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 40px;
          }

          article {
            background-color: #111111;
            border: 1px solid rgba(248, 244, 238, 0.1);
            border-radius: 4px;
            padding: clamp(32px, 5vw, 56px) clamp(28px, 5vw, 56px);
            box-shadow: 0 0 60px rgba(214, 52, 38, 0.06);
            animation: fadeUp 0.6s 0.15s ease both;
          }

          /* ── METADATA ── */
          .section-header {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.18em;
            color: #d63426;
            text-transform: uppercase;
            margin: 8px 0 36px;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .section-header span {
            flex: 1;
            height: 1px;
            background-color: rgba(248, 244, 238, 0.1);
          }

          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 40px;
            margin-bottom: 40px;
          }

          .meta-item {
            margin-bottom: 24px;
          }

          .meta-label {
            display: block;
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #f8f4ee;
            margin-bottom: 6px;
          }

          .meta-value {
            font-family: 'DM Sans', sans-serif;
            font-weight: 300;
            font-size: 17px;
            color: #6b6459;
          }

          .meta-value span {
            color: #f8f4ee;
            font-weight: 400;
          }

          /* ── ARTICLE SECTIONS ── */
          .article-section {
            margin-bottom: 40px;
          }
          
          .article-section:last-child {
            margin-bottom: 0;
          }

          .section-title {
            font-family: 'DM Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.2em;
            color: #d63426;
            text-transform: uppercase;
            margin-bottom: 16px;
            border-bottom: 1px solid rgba(248, 244, 238, 0.1);
            padding-bottom: 8px;
          }

          .summary-text {
            font-family: 'DM Sans', sans-serif;
            font-weight: 300;
            font-size: 16px;
            line-height: 1.7;
            color: #f8f4ee;
            letter-spacing: 0.01em;
          }

          .impact-list {
            list-style: none;
            padding: 0;
          }

          .impact-list li {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 16px;
          }

          .impact-list li:last-child {
            margin-bottom: 0;
          }

          .bullet-dot {
            display: inline-block;
            flex-shrink: 0;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #d63426;
            margin-top: 8px;
          }

          .rights-dot {
            background-color: #f8f4ee;
            opacity: 0.5;
          }

          .prep-dot {
            background-color: #d63426;
          }

          .impact-list p {
            font-family: 'DM Sans', sans-serif;
            font-weight: 300;
            font-size: 16px;
            line-height: 1.6;
            color: #f8f4ee;
            margin: 0;
          }

          /* ── FOOTER NOTE ── */
          .footer-note {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
          }

          .footer-copy {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.14em;
            color: #6b6459;
            text-transform: uppercase;
          }

          .footer-tagline {
            font-family: 'Instrument Serif', Georgia, serif;
            font-style: italic;
            font-size: 14px;
            color: #6b6459;
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <!-- ── TOP BAR ── -->
        <div class="top-bar">
          <a href="/" style="text-decoration: none;"><div class="top-bar-logo">POLIS</div></a>
          <div class="top-bar-sub">Polis Briefing Portal</div>
        </div>

        <!-- ── HERO ── -->
        <div class="hero">
          <div class="hero-tag">
            <span style="display: inline-block; width: 24px; height: 1px; background-color: #d63426;"></span>
            ${foundBill.state === 'US' ? 'Federal Legislation' : foundBill.state + ' State Policy'}
          </div>
          <h1>${article.billTitle || foundBill.title}</h1>
        </div>

        <div class="container">
          <article>
            <div class="article-body">
              <div class="article-section">
                <h2 class="section-title">Bill Summary</h2>
                <p class="summary-text">${article.summary}</p>
              </div>

              <div class="article-section">
                <h2 class="section-title">How It Affects You</h2>
                <ul class="impact-list">
                  ${(article.impacts || []).map(item => `<li><span class="bullet-dot"></span><p>${item}</p></li>`).join('')}
                </ul>
              </div>

              <div class="article-section">
                <h2 class="section-title">Your Rights & Obligations</h2>
                <ul class="impact-list">
                  ${(article.rightsObligations || []).map(item => `<li><span class="bullet-dot rights-dot"></span><p>${item}</p></li>`).join('')}
                </ul>
              </div>

              <div class="article-section">
                <h2 class="section-title">Recommendations to Prepare</h2>
                <ul class="impact-list">
                  ${(article.recommendations || []).map(item => `<li><span class="bullet-dot prep-dot"></span><p>${item}</p></li>`).join('')}
                </ul>
              </div>
            </div>
          </article>

          <!-- ── FOOTER NOTE ── -->
          <div class="footer-note">
            <span class="footer-copy">
              © 2026 Polis
            </span>
            <span class="footer-tagline">
              Generated on-demand using live legislative intelligence from LegiScan.
            </span>
          </div>
        </div>
      </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (err) {
    console.error("Error generating article view:", err);
    res.status(500).send("<h1>Internal Server Error</h1><p>Failed to generate personalized article on the fly. Please try again later.</p>");
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
  
  // Trigger background database sync immediately on boot to guarantee processed data
  console.log("Starting initial background LegiScan database sync...");
  const { syncAll } = require('./syncLegiscan');
  syncAll()
    .then(() => console.log("Initial startup database sync complete!"))
    .catch(err => console.error("Initial database sync failed:", err.message));
});

// Initialize the daily cron worker in the background
require('./dailyWorker');