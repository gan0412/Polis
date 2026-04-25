require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const BILLS = require('./bills');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Summarizes a policy and personalizes it for the user based on their onboarding responses.
 * Ensures the output is exactly a 4-sentence description.
 * 
 * @param {string} billText - The text of the bill or policy.
 * @param {object} userPersona - The demographic and onboarding data of the user.
 * @returns {Promise<object>} The personalized impact summary and headline.
 */
async function generatePersonalizedImpact(billText, userPersona) {
  const systemPrompt = `You are the AI engine for "Polis", an email newsletter that gives citizens an immediate, personalized answer to how a bill affects them. 
Your goal is to inform and empower. Center human dignity and treat the user as an independent decision-maker.

Rules:
1. You will be provided with the text of a bill and a User Persona JSON object.
2. Cross-reference the bill's provisions with the user's specific demographics (income, renter status, location, family size, etc.).
3. Write EXACTLY a 4-sentence description explaining how the bill affects them and any actions they should take.
4. Sentence 1: Direct, personalized impact summary.
5. Sentence 2 & 3: Important context or nuances that apply specifically to their demographic.
6. Sentence 4: A clear, actionable item if applicable, or a concluding thought on timing.
7. DO NOT oversimplify or hallucinate. If a bill doesn't affect them or the impact is uncertain, state that clearly rather than making assumptions.
8. Output your response strictly as a JSON object without any markdown wrappers, using the following schema:
{
  "impactHeadline": "A short, 5-8 word headline summarizing the personal impact.",
  "summary": "The exact 4-sentence summary."
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
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2 // low temperature for consistency and less hallucination
    });

    // Parse the JSON output from Claude
    let content = response.content[0].text;
    
    // Sometimes Claude wraps JSON in markdown blocks
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

/**
 * Selects bills relevant to a user based on their location and interests.
 * Step 1: Hard-filter by jurisdiction (federal always included, state/city must match).
 * Step 2: Claude picks the top 3–5 most relevant from the filtered pool.
 *
 * @param {object} userPersona - { city, state, topics, age, ... }
 * @returns {Promise<Array>} Array of bill objects from bills.js
 */
async function selectRelevantBills(userPersona) {
  // Step 1: jurisdiction filter
  const locationFiltered = BILLS.filter(bill => {
    if (bill.jurisdiction === "federal") return true;
    if (bill.jurisdiction === "state") {
      return bill.state && bill.state.toLowerCase() === (userPersona.state || "").toLowerCase();
    }
    if (bill.jurisdiction === "city") {
      const stateMatch = bill.state && bill.state.toLowerCase() === (userPersona.state || "").toLowerCase();
      const cityMatch = bill.city && bill.city.toLowerCase() === (userPersona.city || "").toLowerCase();
      return stateMatch && cityMatch;
    }
    return false;
  });

  if (locationFiltered.length === 0) return [];

  // Step 2: Claude picks the most relevant subset
  const billCatalog = locationFiltered.map(b => ({
    id: b.id,
    number: b.number,
    title: b.title,
    jurisdiction: b.jurisdiction,
    topics: b.topics,
  }));

  const systemPrompt = `You are a civic relevance engine. Given a user profile and a list of bills, select the 3 to 5 bills that are most likely to directly and meaningfully affect this specific person based on their location, age, and stated interests.

Return ONLY a JSON array of bill IDs (strings). No explanation, no markdown, just the array. Example: ["FED-001", "CA-SB567"]`;

  const userMessage = `User profile:
${JSON.stringify(userPersona, null, 2)}

Available bills:
${JSON.stringify(billCatalog, null, 2)}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.1,
    });

    let content = response.content[0].text.trim();
    if (content.includes('```')) {
      content = content.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
    }

    const selectedIds = JSON.parse(content);
    return BILLS.filter(b => selectedIds.includes(b.id));
  } catch (error) {
    console.error("Error selecting relevant bills:", error);
    // Fallback: return first 3 location-filtered bills
    return locationFiltered.slice(0, 3);
  }
}

module.exports = { generatePersonalizedImpact, selectRelevantBills };
