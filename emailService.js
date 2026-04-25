const nodemailer = require('nodemailer');

async function sendEmail(userEmail, userName, aiResult) {
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Build a card for each bill
  const billCards = aiResult.map(bill => `
    <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 6px;">
        ${bill.billTitle}
      </p>
      <h3 style="color: #d63426; font-size: 18px; margin: 0 0 10px;">
        ${bill.impactHeadline}
      </h3>
      <p style="font-size: 15px; line-height: 1.6; color: #333; margin: 0 0 16px;">
        ${bill.summary}
      </p>
      <div style="background-color: #fff8f0; border-left: 4px solid #d63426; padding: 12px 16px; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #555;">
          <strong style="color: #d63426;">Action: </strong>${bill.action}
        </p>
      </div>
    </div>
  `).join('');

  // Use first bill's headline as email subject
  const emailSubject = aiResult[0]?.impactHeadline || 'Your Polis Civic Update';

  // Plain text fallback
  const plainText = aiResult.map(bill => 
    `${bill.billTitle}\n${bill.impactHeadline}\n${bill.summary}`
  ).join('\n\n---\n\n');

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #d63426; color: #f8f4ee; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">POLIS UPDATE</h1>
        <p style="margin: 5px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Civic Intelligence Briefing</p>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="margin-top: 0; font-size: 20px;">Hi ${userName},</h2>
        <p style="color: #555; font-size: 14px; margin-bottom: 24px;">
          Here are the bills that matter most to you this week.
        </p>
        ${billCards}
      </div>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        This is a personalized summary based on your Polis profile.
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: '"Polis Civic Intelligence" <alert@polis.civic>',
    to: userEmail,
    subject: `Polis Alert: ${emailSubject}`,
    text: plainText,
    html: htmlTemplate,
  });

  console.log("====================================");
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  console.log("====================================");

  return nodemailer.getTestMessageUrl(info);
}

module.exports = { sendEmail };