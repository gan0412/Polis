const fs = require('fs');
const { generatePersonalizedImpact } = require('./aiService');

async function runTests() {
  const billText = fs.readFileSync('./mock_bill.txt', 'utf8');

  const personas = [
    {
      id: "Persona 1: Low-income Renter with Child",
      data: {
        zipCode: "90210",
        housingStatus: "renter",
        employmentStatus: "employed",
        incomeBracket: "$45,000",
        hasChildren: true,
        industry: "hospitality",
        insuranceType: "employer",
        carOwner: false,
        preferredLanguage: "English"
      }
    },
    {
      id: "Persona 2: Small Property Owner (Duplex)",
      data: {
        zipCode: "94110",
        housingStatus: "homeowner",
        propertyType: "duplex",
        occupiesProperty: true,
        employmentStatus: "self-employed",
        incomeBracket: "$120,000",
        hasChildren: false,
        industry: "real estate",
        insuranceType: "marketplace",
        carOwner: true,
        preferredLanguage: "English"
      }
    },
    {
      id: "Persona 3: High-income Renter, No Kids",
      data: {
        zipCode: "90028",
        housingStatus: "renter",
        employmentStatus: "employed",
        incomeBracket: "$150,000",
        hasChildren: false,
        industry: "tech",
        insuranceType: "employer",
        carOwner: true,
        preferredLanguage: "English"
      }
    }
  ];

  console.log("Starting Polis AI Integration Tests...\n");

  for (const persona of personas) {
    console.log(`Testing ${persona.id}...`);
    try {
      const result = await generatePersonalizedImpact(billText, persona.data);
      console.log(`Headline: ${result.impactHeadline}`);
      console.log(`Summary:\n${result.summary}\n`);
      
      // Simple verification of sentence count
      const sentences = result.summary.match(/[^.!?]+[.!?]+/g) || [];
      if (sentences.length !== 4) {
        console.warn(`⚠️ Warning: Expected 4 sentences, but got ${sentences.length}.`);
      }
    } catch (error) {
      console.error(`Failed for ${persona.id}:`, error.message);
    }
  }
}

runTests();
