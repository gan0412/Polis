require('dotenv').config();
const cron = require('node-cron');
const db = require('./db');
const billsDb = require('./billsDb');
const { generatePersonalizedImpact } = require('./aiService');
const { sendEmail } = require('./emailService');
const { syncAll } = require('./syncLegiscan');

// This function represents your daily loop
async function runDailyUpdates() {
  console.log("==========================================");
  console.log("Starting Daily Polis Update Loop...");
  console.log("==========================================");

  // 1. Fetch latest bills from LegiScan (updates bills.json and sets is_new_or_updated flags)
  console.log("1. Syncing latest data from LegiScan...");
  await syncAll();
  
  // 2. Fetch all users from SQLite
  const stmt = db.prepare('SELECT * FROM users');
  const users = stmt.all();
  console.log(`Found ${users.length} users in the database.\n`);

  // 3. Loop through users and match bills
  for (const user of users) {
    console.log(`Processing user: ${user.name} (${user.state || 'No State Provided'})`);
    
    // Parse topics back to array (since SQLite stores it as a JSON string)
    user.topics = user.topics ? JSON.parse(user.topics) : [];

    // Get bills relevant to this user (Federal + State)
    const stateBills = user.state ? billsDb.get(user.state) : [];
    const federalBills = billsDb.get('federal');
    
    // Filter for bills that are real (not placeholder) AND newly added/updated
    const relevantBills = [...stateBills, ...federalBills].filter(
      bill => bill.title && !bill.title.includes("Reserved for the Speaker") && bill.is_new_or_updated
    );

    if (relevantBills.length > 0) {
      // Shuffle the bills and pick up to 10 random ones
      const shuffledBills = relevantBills.sort(() => 0.5 - Math.random());
      const selectedBills = shuffledBills.slice(0, 10);

      console.log(` -> Found ${relevantBills.length} relevant bills. Randomly selected ${selectedBills.length} to process.`);

      for (let i = 0; i < selectedBills.length; i++) {
        const billToSummarize = selectedBills[i];
        const billText = billToSummarize.text || billToSummarize.title || JSON.stringify(billToSummarize);

        console.log(` -> [Bill ${i + 1}/${selectedBills.length}] Generating AI summary for: ${billToSummarize.title || billToSummarize.bill_number}`);
        try {
          const aiResult = await generatePersonalizedImpact(billText, user);
          
          if (!aiResult.bullets || aiResult.bullets.length === 0) {
            console.log(` -> 🚫 Zero impact on ${user.email} from bill ${i + 1}. Skipping email.`);
            continue;
          }

          console.log(` -> ✉️ Dispatching email to ${user.email}...`);
          await sendEmail(user.email, user.name, aiResult);
          console.log(` ✅ Success for ${user.email} (Bill ${i + 1})\n`);
        } catch (err) {
          console.error(` ❌ Failed to process user ${user.email} for bill ${i + 1}:`, err.message, '\n');
        }
      }
    } else {
      console.log(` -> No new relevant bills found. Skipping email.\n`);
    }
  }

  console.log("Daily Polis Update Loop Complete!");
  console.log("==========================================");
}

// Schedule the job to run every morning at 8:00 AM
console.log("Polis Daily Worker started. Waiting for scheduled times (8:00 AM daily)...");
cron.schedule('0 8 * * *', async () => {
  await runDailyUpdates();
});

// FOR TESTING: Uncomment the line below to test the loop immediately when you run the file!
runDailyUpdates();
