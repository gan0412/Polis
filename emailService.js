const nodemailer = require('nodemailer');

async function sendEmail(userEmail, userName, aiResult) {
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Try port 587 (STARTTLS) which is often unblocked by cloud providers
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // Build the bullet points list
  const bulletsHtml = `<ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #333; line-height: 1.6;">` +
    aiResult.bullets.map(bullet => `
      <li style="margin-bottom: 12px;">${bullet}</li>
    `).join('') + `</ul>`;

  const emailSubject = aiResult.emailSubject || `${aiResult.billTitle}: Important Updates`;

  // Plain text fallback
  const plainText = `${aiResult.billTitle}\n${aiResult.overallImpact}\n\n` + 
    aiResult.bullets.map(bullet => `- ${bullet}`).join('\n');

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #d63426; color: #f8f4ee; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">POLIS UPDATE</h1>
        <p style="margin: 5px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Civic Intelligence Briefing</p>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="margin-top: 0; font-size: 20px;">Hi ${userName},</h2>
        <p style="color: #555; font-size: 14px; margin-bottom: 24px;">
          Here is how this legislation impacts you specifically:
        </p>
        
        <div style="margin-bottom: 24px; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h3 style="margin: 0 0 10px; font-size: 18px;">${aiResult.billTitle}</h3>
          <p style="font-size: 15px; color: #555; margin: 0 0 24px; font-style: italic; line-height: 1.6;">${aiResult.overallImpact}</p>
          
          <div style="width: 100%; height: 1px; background-color: #eaeaea; margin-bottom: 20px;"></div>
          
          ${bulletsHtml}
        </div>
      </div>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        This is a personalized summary based on your Polis profile.
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: '"Polis" <alert@polis.civic>',
    to: userEmail,
    subject: emailSubject,
    text: plainText,
    html: htmlTemplate,
  });

  console.log("====================================");
  console.log("Message successfully sent to: %s", userEmail);
  console.log("====================================");

  return true;
}

module.exports = { sendEmail };