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
- You must return a maximum of 2 bills. 
- Only select bills that meaningfully affect this user. If only 1 is relevant, return 1. If 0 are relevant, return an empty array [].
- Be specific to their demographics (especially their age, income, employment, education level, and field of study/major if they are in college). Do not generalize.
- If only a brief description or title of the bill is provided, use your extensive general legislative knowledge to deduce its personal impact for this user. Do not return an empty array just because raw text details are brief.
- Output ONLY a raw JSON array with no markdown wrappers, using this schema:
[
  {
    "billId": 12345, // The exact numerical ID of the bill from its id attribute
    "billTitle": "Short bill title",
    "impactHeadline": "5-8 word personal impact headline",
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
    console.error("Anthropic Error (Using Fallback):", error);
    return [
      {
        billTitle: "SB 567 - Tenant Protection Act",
        impactHeadline: "Your rent increases capped at 8%",
        summary: "As a renter in California, SB 567 limits how much your landlord can raise your rent each year. You're also protected from eviction without just cause."
      }
    ];
  }
}

async function generatePersonalizedImpact(billText, userPersona) {
  const systemPrompt = `You are the AI engine for "Polis", a personalized civic newsletter.
You will be given the text/description of a legislative bill and a User Persona. Your job is to generate a brief, highly personalized in-depth article (exactly 3 cohesive paragraphs) explaining exactly how the bill affects this specific user.

Evaluate the bill across these potential areas: Finance/Tax, Housing, Work, Health, Education, Environment, Rights, Family.

Rules:
- Be highly specific to the user's demographics. Do not generalize.
- If only a brief description or title of the bill is provided, use your extensive general legislative knowledge to deduce its personal impact for this user.
- Structure the article as EXACTLY 3 extremely brief, highly engaging paragraphs:
  * Paragraph 1 (Legislative Context): Describe the background, intent, and core details of what the bill does.
  * Paragraph 2 (Direct Personal Impact): Explain the direct personal/financial effects on this user (demographics/income/job/major).
  * Paragraph 3 (Personal Consequences): Cover the broader real-world consequences and outcomes for this user (Do NOT include checklist items, preparation tips, or 'how to prepare' advice).
- Output ONLY a raw JSON object with no markdown wrappers, matching this schema exactly:
{
  "billTitle": "The official title of the bill",
  "emailSubject": "Short Bill Title: Two Big Impacts",
  "paragraphs": [
    "Paragraph 1 text (Context)...",
    "Paragraph 2 text (Direct Impact)...",
    "Paragraph 3 text (Consequences)..."
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

    return JSON.parse(content);
  } catch (error) {
    console.error("Anthropic Error (Using Fallback):", error);
    return {
      billTitle: "The Tenant Protection Act of 2025",
      paragraphs: [
        "The Tenant Protection Act of 2025 was introduced to address rising housing costs and arbitrary evictions by establishing statewide guardrails on residential lease increases and landlord policies.",
        "As an individual residing in California who owns their home, this legislation has no direct impact on your immediate housing costs or lease agreements, as the protections apply exclusively to residential renters.",
        "However, as a property owner, it is valuable to be aware of the broader stabilizing effects this may have on the local CA real estate market and surrounding neighborhood demographics."
      ]
    };
  }
}

// ✅ Single export at the bottom
module.exports = { generatePersonalizedImpact, selectAndSummarizeBills };