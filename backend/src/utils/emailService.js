// src/utils/emailService.js — Nodemailer Email Service for Vendor & Dealer Notifications
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create reusable transporter object using SMTP transport configuration
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || user === 'your_email@gmail.com' || !pass || pass === 'your_app_password') {
    return null; // Development mode fallback (no active SMTP configured)
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Sends Registration Details Email to newly registered Vendors / Dealers
 */
const sendVendorRegistrationEmail = async (details) => {
  const {
    email,
    name,
    companyName,
    password,
    phone,
    dealerType,
    dealerCategory,
    defaultMargin,
    gstNumber,
    address,
    city,
    state,
    pincode,
    approvalStatus = 'PENDING'
  } = details;

  const frontendUrl = process.env.FRONTEND_URL || 'https://crm.mansarafoods.com';
  const companyNameHeader = process.env.COMPANY_NAME || 'Mansara Foods Pvt. Ltd.';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Registration Confirmation - Mansara Foods CRM</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid #f43f5e; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: #e11d48; margin: 0; font-size: 24px; font-weight: 800;">${companyNameHeader}</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">B2B Partner & Vendor Onboarding Confirmation</p>
        </div>

        <!-- Greeting -->
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Welcome, ${name}! 👋</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your vendor account for <strong>${companyName}</strong> has been registered in the Mansara Foods B2B CRM System. Below are your account details and login credentials:
        </p>

        <!-- Credentials & Details Box -->
        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #9f1239; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🔑 Vendor Account Credentials</h3>
          
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">Registered Email:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${email}</td>
            </tr>
            ${password ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Password:</td>
              <td style="padding: 6px 0; color: #e11d48; font-family: monospace; font-weight: bold;">${password}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Company Name:</td>
              <td style="padding: 6px 0; color: #0f172a;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Phone Number:</td>
              <td style="padding: 6px 0; color: #0f172a;">${phone || 'N/A'}</td>
            </tr>
            ${dealerType ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Dealer Category:</td>
              <td style="padding: 6px 0; color: #0f172a;">${dealerType} (${dealerCategory || 'STARTER'})</td>
            </tr>` : ''}
            ${defaultMargin !== undefined && defaultMargin !== null ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Default Margin:</td>
              <td style="padding: 6px 0; color: #059669; font-weight: bold;">${defaultMargin}%</td>
            </tr>` : ''}
            ${gstNumber ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">GSTIN:</td>
              <td style="padding: 6px 0; color: #0f172a;">${gstNumber}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Status:</td>
              <td style="padding: 6px 0;">
                <span style="background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 9999px;">
                  ${approvalStatus}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.5;">
          ${approvalStatus === 'PENDING' 
            ? '📌 <em>Note: Your registration is currently under review by our administration team. Once approved, you will receive full access to place stock requests, build invoices, and manage inventory.</em>' 
            : '✅ Your account is active and ready to log in.'}
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 24px 0;">
          <a href="${frontendUrl}/login" style="background-color: #e11d48; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
            Log In to B2B Partner Portal →
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center;">
          <p style="margin: 4px 0;">Mansara Foods Pvt. Ltd. • Customer & Partner Support</p>
          <p style="margin: 4px 0;">Need help? Email us at <a href="mailto:info@mansarafoods.com" style="color: #e11d48; text-decoration: none;">info@mansarafoods.com</a></p>
        </div>

      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`✉️ [SIMULATED EMAIL DISPATCH] Registration Details for Vendor: ${email}`);
    console.log(`Recipient Name: ${name}`);
    console.log(`Company Name: ${companyName}`);
    console.log(`Password: ${password || '(hidden)'}`);
    console.log(`Status: ${approvalStatus}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Mansara Foods CRM'}" <${process.env.FROM_EMAIL || 'noreply@mansarafoods.com'}>`,
      to: email,
      subject: `🎉 Registration Confirmation & Account Details — ${companyName}`,
      html: htmlContent
    });
    console.log(`✅ Registration email successfully sent to ${email} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email sending failed for ${email}:`, error.message);
    try {
      const logPath = path.join(__dirname, '../../../errors.log');
      fs.appendFileSync(logPath, `[Email Error] ${new Date().toISOString()} - ${email} - Error: ${error.message}\n`);
    } catch (e) {
      console.error(e);
    }
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVendorRegistrationEmail
};
