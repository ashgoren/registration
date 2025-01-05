import { logger } from 'firebase-functions/v2';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import nodemailer from 'nodemailer';
const testDomains = process.env.EMAIL_IGNORE_TEST_DOMAINS ? process.env.EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];
const CONFIG_DATA_COLLECTION = 'orders';

// Configure the email transport using Sendgrid with SMTP
const mailTransport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
      user: "apikey",
      pass: process.env.EMAIL_SENDGRID_API_KEY
  }
});

export const sendEmailConfirmations = onDocumentUpdated(`${CONFIG_DATA_COLLECTION}/{ITEM}`, async (event) => {
  const { before, after } = event.data;
  if (before?.data()?.status === 'pending' && after.data().status === 'final') {
    const { people } = after.data();
    for (const person of people) {
      const { email, receipt } = person;
      let mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: process.env.EMAIL_SUBJECT,
        html: receipt,
        ...(process.env.EMAIL_REPLY_TO && {replyTo: process.env.EMAIL_REPLY_TO})
      };
      if (testDomains.includes(email.split('@')[1])) {
        logger.info(`SKIPPING RECEIPT SEND: ${email}`);
      } else {
        await mailTransport.sendMail(mailOptions);
        logger.info(`RECEIPT SENT TO: ${email}`);
      }
    }
  }
});
