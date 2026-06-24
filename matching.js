/**
 * Local demographic matching utility.
 * Matches user's persona criteria against the pre-processed impacts list on a bill.
 */
function matchUserToBillImpacts(bill, userPersona) {
  if (!bill.criteria_impacts || !Array.isArray(bill.criteria_impacts) || bill.criteria_impacts.length === 0) {
    return null;
  }

  // Find the first impact that matches user's demographics
  for (const item of bill.criteria_impacts) {
    const { criteria, impactDescription } = item;
    if (!criteria || Object.keys(criteria).length === 0) continue;

    let matches = true;

    // Check each key in demographic criteria (e.g. housing, income, employment, etc.)
    for (const key of Object.keys(criteria)) {
      const requiredVal = String(criteria[key]).toLowerCase();
      
      // Get user's value (handle differences in formats)
      let userVal = userPersona[key];
      if (userVal === undefined || userVal === null) {
        matches = false;
        break;
      }
      userVal = String(userVal).toLowerCase();

      // Flexible matching (e.g. "renter" matches "I rent my home")
      if (!userVal.includes(requiredVal) && !requiredVal.includes(userVal)) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Return formatting compatible with selectAndSummarizeBills output
      return {
        billId: bill.bill_id,
        billTitle: bill.title,
        impactHeadline: impactDescription.split(/[.,]/)[0].substring(0, 40) + "...", // Generate teaser
        summary: impactDescription
      };
    }
  }

  return null;
}

module.exports = { matchUserToBillImpacts };
