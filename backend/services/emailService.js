'use strict';

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// ─── Transporter ──────────────────────────────────────────────────────────────
const createTransporter = () => {
  if (process.env.NODE_ENV === 'test') {
    // No-op transporter for tests
    return { sendMail: async () => ({ messageId: 'test-id' }) };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

// ─── HTML Templates ───────────────────────────────────────────────────────────
const templates = {
  passwordReset: ({ name, resetUrl, expiryMinutes }) => ({
    subject: 'Health Platform — Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Health Platform</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">Reset Password</a>
          </div>
          <p>This link will expire in <strong>${expiryMinutes} minutes</strong>.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">Health Centre Management Platform &bull; Government Health Services</p>
        </div>
      </div>
    `,
  }),

  welcome: ({ name, email, tempPassword }) => ({
    subject: 'Welcome to Health Platform — Your Account is Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Health Platform</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p>Your account has been created. Here are your login credentials:</p>
          <div style="background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #eee;">
            <p><strong>Email:</strong> ${email}</p>
            ${tempPassword ? `<p><strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
          </div>
          ${tempPassword ? '<p style="color: #e53935;"><strong>Please change your password after first login.</strong></p>' : ''}
          <p>Log in at: <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">Health Centre Management Platform</p>
        </div>
      </div>
    `,
  }),

  lowStockAlert: ({ centerName, items }) => ({
    subject: `⚠️ Low Stock Alert — ${centerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f57c00; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Low Stock Alert</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>The following items at <strong>${centerName}</strong> are running low:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #eee;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: left;">Current Stock</th>
                <th style="padding: 8px; text-align: left;">Min Level</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((i) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">${i.itemName}</td>
                  <td style="padding: 8px; color: ${i.currentStock === 0 ? '#e53935' : '#f57c00'};">${i.currentStock} ${i.unit}</td>
                  <td style="padding: 8px;">${i.minStockLevel} ${i.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p>Please arrange for immediate restocking.</p>
        </div>
      </div>
    `,
  }),

  reportReminder: ({ centerName, reportType, dueDate }) => ({
    subject: `📋 Report Due — ${reportType} Report for ${centerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">📋 Report Reminder</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>This is a reminder that the <strong>${reportType}</strong> report for <strong>${centerName}</strong> is due by <strong>${dueDate}</strong>.</p>
          <p>Please log in and submit your report before the deadline.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_URL}/reports" style="background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Submit Report</a>
          </div>
        </div>
      </div>
    `,
  }),

  generic: ({ subject: _s, message, title }) => ({
    subject: title || 'Notification from Health Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">${title || 'Health Platform'}</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>${message}</p>
        </div>
      </div>
    `,
  }),
};

// ─── sendEmail ────────────────────────────────────────────────────────────────
/**
 * Send an email using a named template or raw HTML.
 * @param {object} options
 * @param {string} options.to - Recipient email(s), comma-separated or array.
 * @param {string} [options.subject] - Subject line (used if no template).
 * @param {string} [options.template] - Template key (e.g. 'passwordReset').
 * @param {object} [options.data] - Data passed to the template.
 * @param {string} [options.html] - Raw HTML (used when no template).
 * @param {string} [options.text] - Plain-text version.
 */
const sendEmail = async ({ to, subject, template, data = {}, html, text }) => {
  const transporter = createTransporter();

  let emailSubject = subject;
  let emailHtml = html;

  if (template && templates[template]) {
    const rendered = templates[template](data);
    emailSubject = rendered.subject;
    emailHtml = rendered.html;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Health Platform <noreply@healthplatform.gov>',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: emailSubject,
    html: emailHtml,
    text: text || emailHtml?.replace(/<[^>]+>/g, ''),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${mailOptions.to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${mailOptions.to}: ${err.message}`);
    throw err;
  }
};

/**
 * Send email to multiple recipients in batches.
 */
const sendBulkEmail = async (recipients, { template, data, subject, html }) => {
  const BATCH_SIZE = 50;
  const results = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map((to) =>
      sendEmail({ to, template, data, subject, html }).catch((err) => ({ error: err.message, to }))
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
};

module.exports = { sendEmail, sendBulkEmail };
