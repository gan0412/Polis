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
      .map(key => results[key])
      .map(bill => {
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

    // Fetch detailed descriptions from LegiScan API (reusing old descriptions when possible to save API limits)
    console.log(`Fetching high-fidelity descriptions for ${bills.length} bills in ${stateKey}...`);
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      const oldBill = oldBills.find(ob => ob.bill_id === bill.bill_id);
      
      if (oldBill && oldBill.description && oldBill.change_hash === bill.change_hash) {
        bill.description = oldBill.description;
      } else {
        try {
          const detailsResponse = await fetch(`${BASE_URL}?key=${API_KEY}&op=getBill&id=${bill.bill_id}`);
          const detailsData = await detailsResponse.json();
          if (detailsData.status === 'OK' && detailsData.bill) {
            bill.description = detailsData.bill.description;
          }
          // 100ms rate-limit friendly delay
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.log(`   ⚠️ Could not fetch description for ${bill.bill_number}:`, err.message);
        }
      }
    }
    
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
