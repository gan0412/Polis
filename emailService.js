const { Resend } = require('resend');

// In production, this must be set in your .env or Railway variables
const resend = new Resend(process.env.RESEND_API_KEY || 're_your_api_key_here');

async function sendEmail(userEmail, userName, aiResultArray) {
  // Check if there are bills to send
  if (!aiResultArray || aiResultArray.length === 0) return false;

  // Build the email subject based on the first bill
  const emailSubject = aiResultArray.length > 1 
    ? `${aiResultArray[0].billTitle} and ${aiResultArray.length - 1} more update(s)`
    : `${aiResultArray[0].billTitle}: Important Update`;

  // Build the HTML for each bill
  const billsHtml = aiResultArray.map(bill => `
    <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
      <h3 style="margin: 0 0 8px; font-size: 18px; color: #333;">${bill.billTitle}</h3>
      <p style="font-size: 14px; color: #d63426; margin: 0 0 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
        ${bill.impactHeadline}
      </p>
      <div style="width: 100%; height: 1px; background-color: #eaeaea; margin-bottom: 16px;"></div>
      <p style="margin: 0; font-size: 15px; color: #555; line-height: 1.6;">
        ${bill.summary}
      </p>
    </div>
  `).join('');

  // Plain text fallback
  const plainText = aiResultArray.map(bill => 
    `${bill.billTitle}\n${bill.impactHeadline}\n${bill.summary}\n`
  ).join('\n---\n\n');

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #fafafa;">
      <div style="background-color: #d63426; color: #f8f4ee; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">POLIS UPDATE</h1>
        <p style="margin: 5px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Civic Intelligence Briefing</p>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="margin-top: 0; font-size: 20px;">Hi ${userName},</h2>
        <p style="color: #555; font-size: 14px; margin-bottom: 24px;">
          Based on your profile, here are the most relevant legislative updates for you today:
        </p>
        
        ${billsHtml}

      </div>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        This is a personalized summary based on your Polis profile.
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Polis <onboarding@resend.dev>', // Resend's default test email
      to: userEmail,
      subject: emailSubject,
      text: plainText,
      html: htmlTemplate,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }

    console.log("====================================");
    console.log("Message successfully sent to: %s via Resend API", userEmail);
    console.log("====================================");

    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
}

module.exports = { sendEmail };