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
  
  // 2. Fetch all users from database
  const users = await db.all('SELECT * FROM users');
  console.log(`Found ${users.length} users in the database.\n`);

  // 3. Loop through users and match bills
  for (const user of users) {
    console.log(`Processing user: ${user.name} (${user.state || 'No State Provided'})`);
    
    // Parse topics back to array (since SQLite stores it as a JSON string)
    user.topics = user.topics ? JSON.parse(user.topics) : [];

    // Get bills relevant to this user (Federal + State)
    const stateBills = user.state ? billsDb.get(user.state) : [];
    const federalBills = billsDb.get('federal');
    
    // Filter for bills that are real and added/updated since the user's last briefing
    const userLastBriefed = user.last_briefed_at ? new Date(user.last_briefed_at).getTime() : 0;

    const relevantBills = [...stateBills, ...federalBills].filter(
      bill => {
        if (!bill.title || bill.title.includes("Reserved for the Speaker") || bill.title.includes("The Big Beautiful Bill Act")) {
          return false;
        }
        const billAddedTime = bill.added_at ? new Date(bill.added_at).getTime() : 0;
        return billAddedTime > userLastBriefed;
      }
    );

    if (relevantBills.length > 0) {
      console.log(`Locally matching pre-processed bill impacts for ${user.email} (filtering bills since last brief: ${user.last_briefed_at || 'Never'})...`);
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
        
        // Update their briefing timestamp in database so they won't get matched to these bills again
        await db.run('UPDATE users SET last_briefed_at = ? WHERE email = ?', [new Date().toISOString(), user.email]);

        if (aiResultArray.length === 0) {
          console.log(` -> 🚫 Local evaluation found zero impact on ${user.email} from these bills.`);
          continue;
        }

        console.log(` -> ✉️ Dispatching ${aiResultArray.length} separate emails to ${user.email}...`);
        const { generatePersonalizedImpact } = require('./aiService');
        for (const bill of aiResultArray) {
          // Fetch the full bill object from NoSQL to get description
          const stateKey = user.state || 'federal';
          const stateBills = billsDb.get(stateKey) || [];
          const federalBills = billsDb.get('federal') || [];
          const fullBill = [...stateBills, ...federalBills].find(b => String(b.bill_id) === String(bill.billId));
          
          let articlePayload = null;
          if (fullBill) {
            try {
              console.log(`   -> Pre-generating full article for bill ${bill.billId}...`);
              const billText = `BILL STATE: ${fullBill.state}\nBILL NUMBER: ${fullBill.bill_number || ''}\nBILL TITLE: ${fullBill.title || ''}\nBILL DESCRIPTION: ${fullBill.description || fullBill.title || ''}`;
              articlePayload = await generatePersonalizedImpact(billText, user);
            } catch (pErr) {
              console.error(`Failed to pre-generate article payload for bill ${bill.billId}:`, pErr.message);
            }
          }
          
          await sendEmail(user.email, user.name, bill, articlePayload);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(` ✅ Success for ${user.email}\n`);
      } catch (err) {
        console.error(` ❌ Failed to process user ${user.email}:`, err.message, '\n');
      }
    } else {
      console.log(` -> No new relevant bills found since last brief (${user.last_briefed_at || 'Never'}).\n`);
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
