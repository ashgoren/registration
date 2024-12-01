'use strict';

import { logger } from 'firebase-functions/v2';
import nodemailer from 'nodemailer';
const testDomains = process.env.EMAIL_IGNORE_TEST_DOMAINS ? process.env.EMAIL_IGNORE_TEST_DOMAINS.split(',').map(domain => domain.trim()) : [];

// Configure the email transport using Sendgrid with SMTP
const mailTransport = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
      user: "apikey",
      pass: process.env.EMAIL_SENDGRID_API_KEY
  }
});

// errors are handled in the calling function
export const sendEmailConfirmations = async (emailReceiptPairs) => {
  for (const {email, receipt}  of emailReceiptPairs) {
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
};
