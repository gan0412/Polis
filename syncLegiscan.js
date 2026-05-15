require('dotenv').config();
const billsDb = require('./billsDb');

// In production, this should be set in your .env file
const API_KEY = process.env.LEGISCAN_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.legiscan.com/';

async function fetchBillsForState(stateAbbr) {
  // stateAbbr: "NY", "CA", or "US" (for federal)
  console.log(`Fetching bills for ${stateAbbr}...`);
  try {
    // Query for 2026 to get the most recent bills
    const response = await fetch(`${BASE_URL}?key=${API_KEY}&op=getSearch&state=${stateAbbr}&query=year:2026`);
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      console.error(`LegiScan API Error for ${stateAbbr}:`, data.alert.message);
      return;
    }

    const results = data.searchresult;
    
    // Load old bills to compare change_hash
    const stateKey = stateAbbr === 'US' ? 'federal' : stateAbbr;
    const oldBills = billsDb.get(stateKey) || [];
    const oldBillsMap = new Map();
    oldBills.forEach(b => oldBillsMap.set(b.bill_id, b.change_hash));

    let newOrUpdatedCount = 0;

    const bills = Object.keys(results)
      .filter(key => key !== 'summary')
      .map(key => {
        const bill = results[key];
        const oldHash = oldBillsMap.get(bill.bill_id);
        
        // Flag bill if newly introduced or hash changed
        if (!oldHash || oldHash !== bill.change_hash) {
          bill.is_new_or_updated = true;
          newOrUpdatedCount++;
        } else {
          bill.is_new_or_updated = false;
        }
        return bill;
      });
    
    // Save to your NoSQL JSON database
    billsDb.set(stateKey, bills);
    console.log(`✅ Saved ${bills.length} bills for ${stateKey} to NoSQL DB. (${newOrUpdatedCount} were newly added/updated!)`);
  } catch (error) {
    console.error(`Error fetching for ${stateAbbr}:`, error.message);
  }
}

async function syncAll() {
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn("⚠️ Warning: Please add your LegiScan API key before running.");
    return;
  }

  // Fetch Federal Bills
  await fetchBillsForState('US'); 
  
  // Fetch specific state bills
  await fetchBillsForState('NY'); 
  await fetchBillsForState('CA'); 
  await fetchBillsForState('TX'); 
  
  console.log("Database sync complete!");
}

// If run directly from the terminal, execute it immediately
if (require.main === module) {
  syncAll();
}

module.exports = { syncAll };
