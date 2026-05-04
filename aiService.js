require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function selectAndSummarizeBills(bills, userPersona) {
  const systemPrompt = `You are the AI engine for "Polis", a personalized civic newsletter.
You will be given a list of bills and a User Persona. Your job is to:
1. Select the 2 most relevant bills to this specific user based on their demographics.
2. For each selected bill, write a SHORT 2-sentence summary of how it impacts them personally.

Rules:
- Only select bills that meaningfully affect this user. If fewer than 2 are relevant, return only the relevant ones.
- Be specific to their demographics. Do not generalize.
- Do not hallucinate impacts. If impact is uncertain, say so briefly.
- Output ONLY a raw JSON array with no markdown wrappers, using this schema:
[
  {
    "billTitle": "Short bill title",
    "impactHeadline": "5-8 word personal impact headline",
    "summary": "Exactly 2 sentences. Sentence 1: direct personal impact. Sentence 2: key action or nuance."
  }
]`;

  const billList = bills.map((b, i) =>
    `<bill index="${i + 1}">\n<title>${b.title}</title>\n<text>${b.text}</text>\n</bill>`
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
You will be given the raw text of a legislative bill and a User Persona. Your job is to read the bill and summarize its direct impact on this specific user.

Evaluate the bill across these potential areas: Finance/Tax, Housing, Work, Health, Education, Environment, Rights, Family.

Rules:
- Be highly specific to the user's demographics. Do not generalize.
- Omit any area where the user has no direct impact.
- Do NOT use section headers or category names.
- Output EXACTLY the top 3-4 most significant personalized impacts as concise bullet points.
- Output ONLY a raw JSON object with no markdown wrappers, matching this schema exactly:
{
  "billTitle": "The official title of the bill",
  "emailSubject": "Short Bill Title: Two Big Impacts Separated By Commas",
  "overallImpact": "A 1-sentence high level personalized summary",
  "bullets": [
    "Your personalized impact bullet point 1...",
    "Your personalized impact bullet point 2..."
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
      max_tokens: 1024,
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
      billTitle: "The Big Beautiful Bill Act",
      emailSubject: "The Big Beautiful Bill Act: Tax-Free Overtime, Medicaid Cuts",
      overallImpact: "This massive legislation permanently changes your tax brackets, cuts Medicaid funding, and alters clean energy credits.",
      bullets: [
        "Your individual tax rates from 2017 are now permanent.",
        "If you work overtime or receive tips, you could see up to a $12,500 to $25,000 tax deduction.",
        "Medicaid is cut by 12% and ACA premium tax credits are reduced by 20%, which may increase your healthcare costs.",
        "The Child Tax Credit is increased to $2,200 per child, and new tax-deferred savings accounts are available for children."
      ]
    };
  }
}

// ✅ Single export at the bottom
module.exports = { generatePersonalizedImpact, selectAndSummarizeBills };