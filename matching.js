const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Local demographic matching utility.
 * Matches user's persona criteria against the pre-processed impacts list on a bill.
 */
async function matchUserToBillImpacts(bill, userPersona) {
  if (!bill.criteria_impacts || !Array.isArray(bill.criteria_impacts) || bill.criteria_impacts.length === 0) {
    return null;
  }

  // Iterate and evaluate each impact with Claude based on demographic matching
  for (const item of bill.criteria_impacts) {
    const { criteria, impactDescription } = item;
    if (!criteria) continue;

    const systemPrompt = `You are a demographic matching evaluator for "Polis".
You will be given a User Profile (demographics) and a Eligibility Criteria statement for a legislative benefit/impact.
Determine if this user meets the criteria.
Output ONLY a JSON object:
{
  "matches": true // or false
}`;

    const userMessage = `
User Profile:
${JSON.stringify(userPersona, null, 2)}

Eligibility Criteria:
"${criteria}"
`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.1
      });

      let content = response.content[0].text.trim();
      if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
      }

      const result = JSON.parse(content);
      if (result.matches === true) {
        return {
          billId: bill.bill_id,
          billTitle: bill.title,
          impactHeadline: impactDescription.split(/[.,]/)[0].substring(0, 40) + "...", // Generate teaser
          summary: impactDescription
        };
      }
    } catch (error) {
      console.error("Error evaluating demographic match with Claude:", error);
    }
  }

  return null;
}

module.exports = { matchUserToBillImpacts };
