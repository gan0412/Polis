const nodemailer = require('nodemailer');

async function sendEmail(userEmail, userName, aiResult) {
  // Generate test SMTP service account from ethereal.email
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #d63426; color: #f8f4ee; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">POLIS UPDATE</h1>
        <p style="margin: 5px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Civic Intelligence Briefing</p>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="margin-top: 0; font-size: 20px;">Hi ${userName},</h2>
        <h3 style="color: #d63426; font-size: 18px; margin-bottom: 10px;">${aiResult.impactHeadline}</h3>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          ${aiResult.summary}
        </p>
      </div>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        This is a personalized summary based on your CivicBridge profile.
      </div>
    </div>
  `;

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Polis Civic Intelligence" <alert@polis.civic>', // sender address
    to: userEmail, // list of receivers
    subject: `Polis Alert: ${aiResult.impactHeadline}`, // Subject line
    text: `${aiResult.impactHeadline}\n\n${aiResult.summary}`, // plain text body
    html: htmlTemplate, // html body
  });

  console.log("====================================");
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  console.log("====================================");

  return nodemailer.getTestMessageUrl(info);
}

module.exports = { sendEmail };
