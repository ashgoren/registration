import { logger } from 'firebase-functions/v2';
import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { IS_EMULATOR } from './helpers.js';
const { EMAIL_ENDPOINT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM } = config;

// Configure the email transport using Sendgrid with SMTP

const mailTransport = IS_EMULATOR ? null : nodemailer.createTransport({
  host: EMAIL_ENDPOINT,
  port: 587,
  auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
  }
});

const sendMail = async ({ from=EMAIL_FROM, to, subject, html=null, text=null, replyTo=null }) => {
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
