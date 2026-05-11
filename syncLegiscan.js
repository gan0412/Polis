require('dotenv').config();
const billsDb = require('./billsDb');

// In production, this should be set in your .env file
const API_KEY = process.env.LEGISCAN_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.legiscan.com/';

async function fetchBillsForState(stateAbbr) {
  // stateAbbr: "NY", "CA", or "US" (for federal)
  console.log(`Fetching bills for ${stateAbbr}...`);
  try {
    // You can use fetch natively in modern Node.js
    const response = await fetch(`${BASE_URL}?key=${API_KEY}&op=getSearch&state=${stateAbbr}&query=year:2025`);
    const data = await response.json();
    
    if (data.status === 'ERROR') {
      console.error(`LegiScan API Error for ${stateAbbr}:`, data.alert.message);
      return;
    }

    const results = data.searchresult;
    
    // LegiScan returns an object with numbered keys (0, 1, 2...) and a 'summary' key
    const bills = Object.keys(results)
      .filter(key => key !== 'summary')
      .map(key => results[key]);

    // Map "US" to your "federal" key
    const stateKey = stateAbbr === 'US' ? 'federal' : stateAbbr;
    
    // Save to your NoSQL JSON database
    billsDb.set(stateKey, bills);
    console.log(`✅ Saved ${bills.length} bills for ${stateKey} to NoSQL DB.`);
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

syncAll();
