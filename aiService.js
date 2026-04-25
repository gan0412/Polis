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
    `<bill index="${i+1}">\n<title>${b.title}</title>\n<text>${b.text}</text>\n</bill>`
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
      model: 'claude-sonnet-4-6',
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
    console.error("Error selecting and summarizing bills:", error);
    throw error;
  }
}

async function generatePersonalizedImpact(billText, userPersona) {
  const systemPrompt = `You are the AI engine for "Polis", a personalized civic newsletter.
You will be given a list of bills and a User Persona. Your job is to:
1. Select the 2 most relevant bills to this specific user based on their demographics.
2. For each selected bill, write a SHORT 2-sentence summary of how it impacts them personally.

Rules:
- Always return at least 1 bill even if the connection is indirect.
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
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
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
    console.error("Error generating impact summary:", error);
    throw error;
  }
}

// ✅ Single export at the bottom
module.exports = { generatePersonalizedImpact, selectAndSummarizeBills };