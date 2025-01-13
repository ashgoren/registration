import { logger } from 'firebase-functions/v2';
import nodemailer from 'nodemailer';
import { IS_EMULATOR } from '../helpers.js';

// Configure the email transport using Sendgrid with SMTP

const mailTransport = IS_EMULATOR ? null : nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
      user: "apikey",
      pass: process.env.EMAIL_SENDGRID_API_KEY
  }
});

const sendMail = async ({ from=process.env.EMAIL_FROM, to, subject, html, replyTo=null }) => {
  if (IS_EMULATOR) {
    logger.info('Skipping email send in emulator', { from, to, subject, html, replyTo });
    return;
  }

  try {
    await mailTransport.sendMail({
      from,
      to,
      subject,
      html,
      ...(replyTo && { replyTo })
    });
  } catch (error) {
    logger.error('Error sending email', error);
    throw error;
  }
}

export { sendMail };
