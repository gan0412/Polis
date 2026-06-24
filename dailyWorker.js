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
    
    // Filter for bills that are real and newly added or updated
    const relevantBills = [...stateBills, ...federalBills].filter(
      bill => bill.title && 
              !bill.title.includes("Reserved for the Speaker") && 
              !bill.title.includes("The Big Beautiful Bill Act") &&
              bill.is_new_or_updated === true
    );



    if (relevantBills.length > 0) {
      console.log(`Locally matching pre-processed bill impacts for ${user.email}...`);
      const { matchUserToBillImpacts } = require('./matching');

      try {
        const aiResultArray = [];
        for (const bill of relevantBills) {
          const matched = await matchUserToBillImpacts(bill, user);
          if (matched) {
            aiResultArray.push(matched);
          }
          if (aiResultArray.length >= 2) break; // Limit to at most 2 bills
        }
        
        if (aiResultArray.length === 0) {
          console.log(` -> 🚫 Local evaluation found zero impact on ${user.email} from these bills. Skipping email.`);
          continue; // Skips to the next user, no email sent!
        }

        console.log(` -> ✉️ Dispatching ${aiResultArray.length} separate emails to ${user.email}...`);
        for (const bill of aiResultArray) {
          await sendEmail(user.email, user.name, bill);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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

// Schedule the job to run every evening at 6:22 PM EST
console.log("Polis Daily Worker started. Waiting for scheduled times (6:22 PM EST & 8:40 PM EST daily)...");
cron.schedule('22 18 * * *', async () => {
  await runDailyUpdates();
}, {
  timezone: "America/New_York"
});

// Secondary cron job at 8:40 PM EST
cron.schedule('40 20 * * *', async () => {
  await runDailyUpdates();
}, {
  timezone: "America/New_York"
});



// FOR TESTING: Run the loop immediately only when you run the file directly!
if (require.main === module) {
  runDailyUpdates();
}
