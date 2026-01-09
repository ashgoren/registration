import nodemailer from 'nodemailer';
import { logger } from 'firebase-functions/v2';
import { getConfig } from '../config/internal/config.js';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  from?: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

// Configure the email transport with SMTP
let mailTransport: Transporter | null = null;
const getMailTransport = () => {
  if (mailTransport) return mailTransport;
  const { EMAIL_ENDPOINT, EMAIL_USER, EMAIL_PASSWORD } = getConfig();
  mailTransport = nodemailer.createTransport({
    host: EMAIL_ENDPOINT,
    port: 587,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });
  return mailTransport;
};

const sendMail = async ({ from, to, subject, html, text, replyTo }: EmailOptions) => {
  from ||= getConfig().EMAIL_FROM;

  if (getConfig().IS_EMULATOR) {
    logger.info('Skipping email send in emulator', { from, to, subject, html, text });
    return;
  }
  
  logger.info(`Sending email to ${to}`, { from, to, subject });
  try {
    await getMailTransport().sendMail({
      from,
      to,
      subject,
      ...(html && { html }),
      ...(text && { text }),
      ...(replyTo && { replyTo })
    });
  } catch (error) {
    logger.error(`Error sending email to ${to}`, error);
    throw error;
  }
}

export { sendMail };
