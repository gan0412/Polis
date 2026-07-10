const { Resend } = require('resend');

// In production, this must be set in your .env or Railway variables
const resend = new Resend(process.env.RESEND_API_KEY || 're_your_api_key_here');

const zlib = require('zlib');

async function sendEmail(userEmail, userName, bill, articlePayload = null) {
  // Check if there is a bill to send
  if (!bill) return false;

  // Build the email subject emphasizing the direct effect/impact headline to get the user hooked!
  const emailSubject = bill.impactHeadline || `${bill.billTitle}: Important Update`;

  const appUrl = process.env.APP_URL || 'http://localhost:3001';

  // If we have a pre-generated article, compress and encode it to keep URL compact
  let payloadParam = '';
  if (articlePayload) {
    try {
      const buffer = zlib.deflateRawSync(Buffer.from(JSON.stringify(articlePayload), 'utf8'));
      const base64Str = buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // URL-safe base64 encoding
      payloadParam = `&p=${base64Str}`;
    } catch (compressErr) {
      console.error("Failed to compress article payload:", compressErr);
    }
  }

  // Build the HTML for the single bill
  const articleLink = bill.billId
    ? `<div style="margin-top: 16px; text-align: right;">
         <a href="${appUrl}/article/${bill.billId}?email=${encodeURIComponent(userEmail)}${payloadParam}" style="display: inline-block; font-size: 14px; color: #d63426; font-weight: bold; text-decoration: none; border-bottom: 2px solid #d63426; padding-bottom: 2px;">
           Click here to view full article &rarr;
         </a>
       </div>`
    : '';

  const billHtml = `
    <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
      <h3 style="margin: 0 0 16px; font-size: 18px; color: #333; line-height: 1.4;">${bill.billTitle}</h3>
      <div style="width: 100%; height: 1px; background-color: #eaeaea; margin-bottom: 16px;"></div>
      <p style="margin: 0; font-size: 15px; color: #555; line-height: 1.6;">
        ${bill.summary}
      </p>
      ${articleLink}
    </div>
  `;

  // Plain text fallback
  const plainText = `${bill.impactHeadline}\n\n${bill.summary}\n`;

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #fafafa;">
      <div style="background-color: #d63426; color: #f8f4ee; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">POLIS ALERT</h1>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="margin-top: 0; font-size: 20px;">Hi ${userName},</h2>
        <p style="color: #555; font-size: 14px; margin-bottom: 24px;">
          Based on your profile, here is the most relevant legislative update for you today:
        </p>
        
        ${billHtml}

      </div>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eaeaea;">
        This is a personalized summary based on your Polis profile.<br/>
        No longer want alerts? <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color: #d63426; text-decoration: underline;">Unsubscribe</a>.
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Polis <notifications@the-polis.com>', // Verified custom domain sender
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
    console.log("Subject: %s", emailSubject);
    console.log("====================================");

    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
}

async function sendVerificationEmail(userEmail, userName, code) {
  const emailSubject = `${code} is your Polis verification code`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; background-color: #fafafa;">
      <div style="background-color: #d63426; color: #f8f4ee; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">POLIS</h1>
      </div>
      <div style="padding: 30px 20px; text-align: center;">
        <h2 style="margin-top: 0; font-size: 20px; color: #333;">Confirm Your Email</h2>
        <p style="color: #555; font-size: 14px; margin-bottom: 24px;">
          Hi ${userName},<br/>
          Use the verification code below to complete your sign-up and unlock your personalized civic portal:
        </p>
        
        <div style="display: inline-block; padding: 12px 24px; background-color: #111; color: #d63426; font-size: 32px; font-weight: bold; letter-spacing: 6px; border-radius: 4px; font-family: monospace; border: 1px solid #d63426;">
          ${code}
        </div>
        
        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        © 2026 Polis. Connecting citizens to legislative intelligence.
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Polis <notifications@the-polis.com>',
      to: userEmail,
      subject: emailSubject,
      text: `Your Polis verification code is: ${code}`,
      html: htmlTemplate,
    });

    if (error) {
      console.error("Resend Verification Error:", error);
      return false;
    }
    console.log(`Verification code email successfully sent to: ${userEmail}`);
    return true;
  } catch (err) {
    console.error("Error sending verification email:", err);
    return false;
  }
}

module.exports = { sendEmail, sendVerificationEmail };