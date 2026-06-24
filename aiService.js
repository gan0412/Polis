require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function selectAndSummarizeBills(bills, userPersona) {
  const systemPrompt = `You are the AI engine for "Polis", a personalized civic newsletter.
You will be given a list of bills and a User Persona. Your job is to:
1. Select AT MOST 2 most relevant bills to this specific user based on their demographics.
2. For each selected bill, write a SHORT 2-sentence summary of how it impacts them personally.

Rules:
- Only select bills that meaningfully affect this user. If only 1 is relevant, return 1. If 0 are relevant, return an empty array [].
- Be specific to their demographics (especially their age, income, employment, education level, and field of study/major if they are in college). Do not generalize.
- If only a brief description or title of the bill is provided, use your extensive general legislative knowledge to deduce its personal impact for this user. Do not return an empty array just because raw text details are brief.
- Output ONLY a raw JSON array with no markdown wrappers, using this schema:
[
  {
    "billId": 12345, // The exact numerical ID of the bill from its id attribute
    "billTitle": "Short bill title",
    "impactHeadline": "Exactly 6-7 word personal impact headline",
    "summary": "Exactly 2 sentences. Sentence 1: direct personal impact. Sentence 2: key action or nuance."
  }
]`;

  const billList = bills.map((b, i) =>
    `<bill id="${b.bill_id}">\n<title>${b.title}</title>\n<description>${b.description || b.text || b.title}</description>\n</bill>`
  ).join('\n\n');

  const userMessage = `
<bills>
${billList}
</bills>

<user_persona>
${JSON.stringify(userPersona, null, 2)}
</user_persona>
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.2
    });

    let content = response.content[0].text;
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0].trim();
    }

    console.log("Claude Raw Response:", content);
    return JSON.parse(content);
  } catch (error) {
    console.error("Anthropic Error (No Fallback):", error);
    return [];
  }
}

async function generatePersonalizedImpact(billText, userPersona) {
  const systemPrompt = `You are the AI engine for "Polis", a personalized civic newsletter.
You will be given the text/description of a legislative bill and a User Persona. Your job is to generate a highly personalized in-depth article explaining exactly how the bill affects this specific user.

Evaluate the bill across these potential areas: Finance/Tax, Housing, Work, Health, Education, Environment, Rights, Family.

Rules:
- Be highly specific to the user's demographics. Do not generalize.
- If only a brief description or title of the bill is provided, use your extensive general legislative knowledge to deduce its personal impact for this user.
- Structure the response into these exact sections:
  * Summary: A brief overall summary of the bill (exactly 3-5 sentences).
  * Impacts: How it affects this specific user (exactly 3 bullet points).
  * Rights & Obligations: The user's specific rights and obligations under this bill (exactly 2-3 bullet points).
  * Recommendations: Actionable recommendations/steps for this user to prepare for these changes (exactly 2-3 bullet points).
- Output ONLY a raw JSON object with no markdown wrappers, matching this schema exactly:
{
  "billTitle": "The official title of the bill",
  "emailSubject": "Short Bill Title: Two Big Impacts",
  "summary": "A brief overall summary of the bill (3-5 sentences). IMPORTANT: Ensure you refer to the correct state's departments/agencies matching the bill (e.g. if the bill is for NY, do not refer to the Virginia Department of Labor).",
  "impacts": [
    "Your tax rates will decrease by 2% next year based on your income bracket.",
    "Your health insurance premiums are expected to rise by approximately $50 per month.",
    "You will become eligible for a $1,500 state grant for electric vehicle purchases."
  ],
  "rightsObligations": [
    "You have the right to request a hearing if your landlord raises your rent above the cap.",
    "You are obligated to submit proof of residency to retain your utility discounts."
  ],
  "recommendations": [
    "Review your monthly household budget to account for the premium increases.",
    "Prepare your residency documentation before the October deadline."
  ]
}`;

  const userMessage = `
<bill_text>
${billText}
</bill_text>

<user_persona>
${JSON.stringify(userPersona, null, 2)}
</user_persona>
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.2
    });

    let content = response.content[0].text;
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0].trim();
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Anthropic Error (Using Fallback):", error);
    return {
      billTitle: "The Tenant Protection Act of 2025",
      summary: "The Tenant Protection Act of 2025 was introduced to address rising housing costs and arbitrary evictions by establishing statewide guardrails on residential lease increases and landlord policies. The bill limits annual rent hikes and requires landlords to demonstrate just cause before terminating leases.",
      impacts: [
        "As a homeowner in Texas, you are not directly impacted by rental caps or eviction limits.",
        "Your immediate monthly housing expenditures will remain unchanged as these rules govern landlord-tenant relations.",
        "Your property values may be stabilized by broader local real estate trends resulting from this legislation."
      ],
      rightsObligations: [
        "You retain full authority to manage your owned home without rent cap restrictions.",
        "You are obligated to comply with existing local residential property codes which remain unchanged."
      ],
      recommendations: [
        "Monitor local TX real estate trends for changes in surrounding housing availability.",
        "Consult a property professional if you decide to lease out any portion of your property in the future."
      ]
    };
  }
}

async function extractBillImpactsAndCriteria(billText) {
  const systemPrompt = `You are the AI engine for "Polis".
You will be given the text/description of a legislative bill.
Your job is to analyze the bill and extract all potential impacts this bill could have on different groups of everyday people.
For each impact, you must output:
1. impactDescription: A short, clear description of the impact.
2. criteria: A set of demographic key-value filters where this impact is highly relevant.
   Possible criteria keys (select only relevant ones per impact):
   - housing: "owner", "renter"
   - income: "low", "middle", "high"
   - employment: "employed", "self-employed", "gig-worker", "student", "unemployed", "retired"
   - dependents: "has-dependents", "no-dependents"
   - health_insurance: "employer", "marketplace", "government", "uninsured"
   - age: "young", "middle-aged", "senior"
   - education: "college-degree", "no-college-degree"

Output ONLY a raw JSON array matching this schema:
[
  {
    "impactDescription": "You may qualify for a new tax credit of up to $1,500 for electric vehicle purchases.",
    "criteria": {
      "income": "low",
      "housing": "owner"
    }
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: billText }],
      temperature: 0.1
    });

    let content = response.content[0].text;
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0].trim();
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error extracting bill impacts:", error);
    return [];
  }
}

// ✅ Single export at the bottom
module.exports = { generatePersonalizedImpact, selectAndSummarizeBills, extractBillImpactsAndCriteria };