require('dotenv').config();
const billsDb = require('./billsDb');

// In production, this should be set in your .env file
const API_KEY = process.env.LEGISCAN_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.legiscan.com/';

async function fetchBillsForState(stateAbbr, lastSyncDate) {
  // stateAbbr: "NY", "CA", or "US" (for federal)
  console.log(`Fetching bills for ${stateAbbr} since ${lastSyncDate || 'inception'}...`);
  try {
    // Build query to get the most recent bills. If lastSyncDate exists, filter by last_action.
    let queryStr = 'year:2026';
    if (lastSyncDate) {
      queryStr += ` and last_action:>=${lastSyncDate}`;
    }
    const response = await fetch(`${BASE_URL}?key=${API_KEY}&op=getSearch&state=${stateAbbr}&query=${encodeURIComponent(queryStr)}`);
    const data = await response.json();

    if (data.status === 'ERROR') {
      console.error(`LegiScan API Error for ${stateAbbr}:`, data.alert.message);
      return;
    }

    const results = data.searchresult;
    if (!results || Object.keys(results).length === 0) {
      console.log(`No bills found for ${stateAbbr} in this time range.`);
      return;
    }

    // Load old bills to compare change_hash
    const stateKey = stateAbbr === 'US' ? 'federal' : stateAbbr;
    const oldBills = billsDb.get(stateKey) || [];
    const oldBillsMap = new Map();
    oldBills.forEach(b => oldBillsMap.set(b.bill_id, b.change_hash));

    let newOrUpdatedCount = 0;

    const bills = Object.keys(results)
      .filter(key => key !== 'summary')
      .map(key => results[key])
      .filter(bill => bill.title && !bill.title.includes("Reserved for the Speaker") && !bill.title.includes("The Big Beautiful Bill Act"))
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

    // Import helper for preprocessing impacts
    const { extractBillImpactsAndCriteria } = require('./aiService');

    // Fetch detailed descriptions and compute impacts
    console.log(`Fetching high-fidelity descriptions and impacts for ${bills.length} bills in ${stateKey}...`);
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      const oldBill = oldBills.find(ob => ob.bill_id === bill.bill_id);
      
      if (oldBill && oldBill.description && oldBill.change_hash === bill.change_hash) {
        bill.description = oldBill.description;
        bill.criteria_impacts = oldBill.criteria_impacts || [];
      } else {
        try {
          const detailsResponse = await fetch(`${BASE_URL}?key=${API_KEY}&op=getBill&id=${bill.bill_id}`);
          const detailsData = await detailsResponse.json();
          if (detailsData.status === 'OK' && detailsData.bill) {
            bill.description = detailsData.bill.description;
            
            // Pre-process and extract criteria-based impacts on-the-fly
            console.log(`   -> Extracting criteria-based impacts for ${bill.bill_number}...`);
            const billText = `BILL STATE: ${stateKey}\nBILL NUMBER: ${bill.bill_number || ''}\nBILL TITLE: ${bill.title || ''}\nBILL DESCRIPTION: ${bill.description || bill.title || ''}`;
            bill.criteria_impacts = await extractBillImpactsAndCriteria(billText);
          }
          // 100ms rate-limit friendly delay
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.log(`   ⚠️ Could not fetch description or compute impacts for ${bill.bill_number}:`, err.message);
          bill.criteria_impacts = [];
        }
      }
    }
    
    // Merge new/updated bills with existing cache to keep local database cumulative
    const finalBillsMap = new Map();
    // Start with all old cached bills
    oldBills.forEach(ob => finalBillsMap.set(ob.bill_id, ob));
    // Overwrite or append new/updated ones
    bills.forEach(nb => finalBillsMap.set(nb.bill_id, nb));
    
    const mergedBills = Array.from(finalBillsMap.values());
    
    // Save to your NoSQL JSON database
    billsDb.set(stateKey, mergedBills);
    console.log(`✅ Saved ${mergedBills.length} total bills for ${stateKey} to NoSQL DB. (${newOrUpdatedCount} were newly added/updated!)`);
  } catch (error) {
    console.error(`Error fetching for ${stateAbbr}:`, error.message);
  }
}

async function syncAll() {
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn("⚠️ Warning: Please add your LegiScan API key before running.");
    return;
  }

  // Load the current NoSQL DB state to read last_sync_date
  const fullDb = billsDb.getAll() || {};
  const lastSyncDate = fullDb.last_sync_date || null;

  // Fetch Federal Bills
  await fetchBillsForState('US', lastSyncDate);

  // Fetch all 50 states
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  for (const state of states) {
    await fetchBillsForState(state, lastSyncDate);
    // Be nice to the API rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Store the new sync date (today's date in YYYY-MM-DD format)
  const todayStr = new Date().toISOString().split('T')[0];
  const updatedDb = billsDb.getAll() || {};
  updatedDb.last_sync_date = todayStr;
  
  // Directly writing to full db
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, 'bills.json'), JSON.stringify(updatedDb, null, 2));

  console.log(`Database sync complete! Stored last_sync_date as: ${todayStr}`);
}

// If run directly from the terminal, execute it immediately
if (require.main === module) {
  syncAll();
}

module.exports = { syncAll };
