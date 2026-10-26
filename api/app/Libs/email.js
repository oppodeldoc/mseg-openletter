const Mail = use('Mail');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmail(recipient, subject, template, data, options = {}) {
  const from = options.from || process.env.MAIL_FROM;
  const maxAttempts = options.maxAttempts || 10;
  // Postmark message stream: confirmations are transactional ("outbound"), not "broadcast"
  const postmarkStream = process.env.POSTMARK_STREAM;

  if (!from) {
    console.error('>>> MAIL_FROM is not set; refusing to send email to', recipient);
    return;
  }

  if (!isValidEmail(recipient)) {
    console.error('>>> invalid email', recipient);
    return;
  }

  let attempt = 0;

  const makeAttempt = async () => {
    try {
      if (attempt > maxAttempts) {
        console.error('>>> too many attempts to send email to ', recipient);
        return;
      }
      await Mail.send(template, data, (message) => {
        message.to(recipient).from(from).subject(subject);
        if (postmarkStream) {
          // Adonis Mail 3 has no header() helper; the object goes straight to nodemailer.sendMail()
          message.mailerMessage.headers = { 'X-PM-Message-Stream': postmarkStream };
        }
      });
      console.log('>>> email sent');
    } catch (e) {
      console.error('error', JSON.stringify(e, null, '  '));
      attempt++;
      console.log('>>> new attempt in 10mn');
      setTimeout(makeAttempt, 1000 * 60 * 10);
    }
  };

  return await makeAttempt();
}

module.exports = {
  sendEmail,
};
