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

const sendMail = async ({ from=process.env.EMAIL_FROM, to, subject, html=null, text=null, replyTo=null }) => {
  if (IS_EMULATOR) {
    logger.info('Skipping email send in emulator', { from, to, subject, html, text });
    return;
  }

  logger.info('Sending email', { from, to, subject });
  try {
    await mailTransport.sendMail({
      from,
      to,
      subject,
      ...(html && { html }),
      ...(text && { text }),
      ...(replyTo && { replyTo })
    });
  } catch (error) {
    logger.error('Error sending email', error);
    throw error;
  }
}

export { sendMail };
