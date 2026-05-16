require('dotenv').config();
const cron = require('node-cron');
const db = require('./db');
const billsDb = require('./billsDb');
const { selectAndSummarizeBills } = require('./aiService');
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
      console.log(` -> Found ${relevantBills.length} newly updated/added bills. Sending ALL of them to AI for filtering...`);

      try {
        const aiResultArray = await selectAndSummarizeBills(relevantBills, user);
        
        if (!aiResultArray || aiResultArray.length === 0) {
          console.log(` -> 🚫 AI found zero impact on ${user.email} from these bills. Skipping email.`);
          continue; // Skips to the next user, no email sent!
        }

        console.log(` -> ✉️ Dispatching email with ${aiResultArray.length} top bills to ${user.email}...`);
        await sendEmail(user.email, user.name, aiResultArray);
        console.log(` ✅ Success for ${user.email}\n`);
      } catch (err) {
        console.error(` ❌ Failed to process user ${user.email}:`, err.message, '\n');
      }
    } else {
      console.log(` -> No new relevant bills found. Skipping email.\n`);
    }
  }

  console.log("Daily Polis Update Loop Complete!");
  console.log("==========================================");
}

// Schedule the job to run every evening at 6:15 PM EST
console.log("Polis Daily Worker started. Waiting for scheduled times (6:15 PM EST daily)...");
cron.schedule('15 18 * * *', async () => {
  await runDailyUpdates();
}, {
  timezone: "America/New_York"
});

// FOR TESTING: Uncomment the line below to test the loop immediately when you run the file!
runDailyUpdates();
