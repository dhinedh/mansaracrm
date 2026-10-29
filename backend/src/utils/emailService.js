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
          Your dealer partner account for <strong>${companyName}</strong> has been registered in the Mansara Foods B2B CRM System. Below are your official login credentials and account access details:
        </p>

        <!-- Credentials & Details Box -->
        <div style="background-color: #fff1f2; border: 2px solid #fecdd3; border-radius: 14px; padding: 22px; margin: 24px 0;">
          <h3 style="color: #9f1239; margin-top: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 800;">🔑 Dealer Login Credentials</h3>
          
          <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 12px;">
            <tr style="border-bottom: 1px solid #ffe4e6;">
              <td style="padding: 10px 0; color: #64748b; font-weight: bold; width: 150px;">User ID / Login ID:</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 800; font-size: 14px;">${email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ffe4e6;">
              <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Login Password:</td>
              <td style="padding: 10px 0; color: #e11d48; font-family: 'Courier New', Courier, monospace; font-weight: 800; font-size: 15px; letter-spacing: 0.5px;">${password || 'Dealer@123'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ffe4e6;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Company / Firm:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${companyName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ffe4e6;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Contact Phone:</td>
              <td style="padding: 8px 0; color: #0f172a;">${phone || 'N/A'}</td>
            </tr>
            ${dealerType ? `
            <tr style="border-bottom: 1px solid #ffe4e6;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Category / Tier:</td>
              <td style="padding: 8px 0; color: #6b21a8; font-weight: bold;">${dealerCategory || 'STARTER'} (${dealerType})</td>
            </tr>` : ''}
            ${defaultMargin !== undefined && defaultMargin !== null ? `
            <tr style="border-bottom: 1px solid #ffe4e6;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Default Margin:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: bold;">${defaultMargin}%</td>
            </tr>` : ''}
            ${gstNumber ? `
            <tr style="border-bottom: 1px solid #ffe4e6;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">GSTIN:</td>
              <td style="padding: 8px 0; color: #0f172a;">${gstNumber}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Account Status:</td>
              <td style="padding: 10px 0;">
                <span style="background-color: ${approvalStatus === 'APPROVED' ? '#dcfce7' : '#fef3c7'}; color: ${approvalStatus === 'APPROVED' ? '#15803d' : '#92400e'}; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px;">
                  ${approvalStatus}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.5;">
          ${approvalStatus === 'PENDING' 
            ? '📌 <em>Note: Your registration is currently under review by our administration team. Once approved, you can log in using your User ID and Password above to place stock requests, build invoices, and manage inventory.</em>' 
            : '✅ Your account is active and ready to log in right now.'}
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 24px 0;">
          <a href="${frontendUrl}/login" style="background-color: #e11d48; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(225, 29, 72, 0.3);">
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
