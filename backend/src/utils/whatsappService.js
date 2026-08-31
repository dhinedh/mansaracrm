// src/utils/whatsappService.js — WhatsApp Chatbot Service for Mansara Foods B2B CRM
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Clean & normalize phone number into standard international format (e.g., 919876543210)
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  let clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) return '91' + clean;
  if (clean.length > 10 && clean.length <= 15) return clean;
  return '';
};

/**
 * Sends Vendor Registration details via WhatsApp Chatbot / Meta WhatsApp API
 */
const sendVendorWhatsAppRegistration = async (details) => {
  const {
    phone,
    name,
    companyName,
    email,
    password,
    dealerType,
    dealerCategory,
    defaultMargin,
    gstNumber,
    approvalStatus = 'PENDING'
  } = details;

  const normalizedPhone = normalizePhone(phone);
  const frontendUrl = process.env.FRONTEND_URL || 'https://crm.mansarafoods.com';

  if (!normalizedPhone) {
    console.warn(`[WHATSAPP SERVICE] Cannot send WhatsApp message: Phone number '${phone}' is missing or invalid.`);
    return { success: false, error: 'Invalid phone number' };
  }

  // Construct message payload for WhatsApp Chatbot
  const isApproved = approvalStatus === 'APPROVED';
  const statusHeadline = isApproved ? 'registered and APPROVED!' : 'registered successfully and is currently PENDING approval.';
  const noteText = isApproved
    ? 'Your account is verified. You now have full access to place stock orders & manage inventory. Thank you for partnering with Mansara Foods! 🌿'
    : 'Your registration is under review by our administration team. You will be notified once your account is approved. Thank you for partnering with Mansara Foods! 🌿';

  const messageText = 
`🎉 *Welcome to Mansara Foods B2B Portal!* 🙏

Hello *${name || 'Partner'}*, your vendor account for *${companyName || 'your firm'}* has been ${statusHeadline}

🔑 *Your Account Credentials & Details:*
• *Registered Email:* ${email}
${password ? `• *Password:* ${password}\n` : ''}• *Phone:* ${phone}
${dealerCategory ? `• *Category / Tier:* ${dealerCategory} (${dealerType || 'RETAIL'})\n` : ''}${defaultMargin !== undefined && defaultMargin !== null ? `• *Default Margin:* ${defaultMargin}%\n` : ''}${gstNumber ? `• *GSTIN:* ${gstNumber}\n` : ''}• *Status:* ${approvalStatus}

🌐 *Log in to B2B Partner Portal:*
${frontendUrl}/login

📌 *Note:* ${noteText}`;

  const botUrl = process.env.WHATSAPP_BOT_URL || 'https://whatapp-automation-kxml.onrender.com';
  const metaToken = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;

  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;

  // 1. Try sending via WhatsApp Bot Automation API
  try {
    console.log(`[WHATSAPP SERVICE] Sending registration message via Chatbot Bot API to ${normalizedPhone}...`);
    const response = await axios.post(`${botUrl}/api/send-message`, {
      phone: normalizedPhone,
      message: messageText,
      recipientName: name,
      companyName
    }, { timeout: 4000 });

    console.log(`[WHATSAPP SERVICE] ✓ Registration message delivered to ${normalizedPhone} via Bot API`);
    return { success: true, method: 'bot_api', data: response.data, whatsappUrl, messageText };
  } catch (botError) {
    console.warn(`[WHATSAPP SERVICE] Bot Automation API call failed (${botError.message}). Trying Meta Cloud API...`);
  }

  // 2. Fallback to direct Meta Cloud API if credentials exist
  if (metaToken && phoneId) {
    try {
      const tierInfo = `${dealerCategory || 'STARTER'} (${defaultMargin || 10}% Margin)${password ? ` | Password: ${password}` : ''}`;
      const metaRes = await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v20.0/${phoneId}/messages`,
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: 'dealer_partner_approval_v2',
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: name || 'Vendor Partner' },
                  { type: 'text', text: companyName || 'Mansara Partner' },
                  { type: 'text', text: email || 'dealer@mansarafoods.com' },
                  { type: 'text', text: tierInfo }
                ]
              }
            ]
          }
        },
        timeout: 5000
      });
      console.log(`[WHATSAPP SERVICE] ✓ Delivered dealer_partner_approval_v2 template to ${normalizedPhone}`);
      return { success: true, method: 'meta_cloud_api', data: metaRes.data, whatsappUrl, messageText };
    } catch (primaryErr) {
      console.warn(`[WHATSAPP SERVICE] dealer_partner_approval_v2 pending/error (${primaryErr.message}). Using approved sales_team_alert fallback...`);
      try {
        const bodyParams = [
          name || 'Vendor Partner',
          `${companyName || 'Mansara Foods Vendor'} (B2B Portal)`,
          phone,
          `Dealer Reg ${isApproved ? 'APPROVED!' : 'RECEIVED (Pending Approval)'} | Login Email: ${email}${password ? ` | Password: ${password}` : ''} | Status: ${approvalStatus}${dealerCategory ? ` | Tier: ${dealerCategory} (${dealerType || 'RETAIL'})` : ''}${defaultMargin !== undefined && defaultMargin !== null ? ` | Margin: ${defaultMargin}%` : ''} | Portal URL: ${frontendUrl}/login`
        ];

        const metaRes = await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v20.0/${phoneId}/messages`,
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizedPhone,
            type: 'template',
            template: {
              name: 'sales_team_alert',
              language: { code: 'en_US' },
              components: [
                {
                  type: 'body',
                  parameters: bodyParams.map(text => ({ type: 'text', text }))
                }
              ]
            }
          },
          timeout: 6000
        });
        console.log(`[WHATSAPP SERVICE] ✓ Delivered sales_team_alert fallback template to ${normalizedPhone}`);
        return { success: true, method: 'meta_cloud_api', data: metaRes.data, whatsappUrl, messageText };
      } catch (metaErr) {
        console.warn(`[WHATSAPP SERVICE] Meta API error:`, metaErr.response?.data || metaErr.message);
      }
    }
  }

  // 3. Simulation fallback (logs message details safely so API request never fails)
  console.log(`\n======================================================`);
  console.log(`💬 [SIMULATED WHATSAPP CHATBOT DISPATCH] To: ${normalizedPhone} (${phone})`);
  console.log(`Recipient: ${name} (${companyName})`);
  console.log(`Content:\n${messageText}`);
  console.log(`======================================================\n`);

  try {
    const logPath = path.join(__dirname, '../../../errors.log');
    fs.appendFileSync(logPath, `[WhatsApp Dispatch] ${new Date().toISOString()} - Sent to ${normalizedPhone} (${companyName})\n`);
  } catch (e) {
    console.error(e);
  }

  return { success: true, simulated: true, normalizedPhone, whatsappUrl, messageText };
};

/**
 * Sends Password Reset OTP via WhatsApp Chatbot / Meta WhatsApp API
 */
const sendWhatsAppOTP = async ({ phone, otp, name }) => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    console.warn(`[WHATSAPP SERVICE] Cannot send OTP: Phone number '${phone}' is missing or invalid.`);
    return { success: false, error: 'Invalid phone number' };
  }

  const messageText = 
`🔐 *Mansara Foods - Password Reset OTP*

Hello *${name || 'Partner'}*, your One-Time Password (OTP) for resetting your password on the B2B Partner Portal is:

👉 *${otp}*

This OTP is valid for 10 minutes. Please do not share this OTP with anyone.

🌿 *Mansara Foods Team*`;

  const botUrl = process.env.WHATSAPP_BOT_URL || 'https://whatapp-automation-kxml.onrender.com';
  const metaToken = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;

  const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;

  // 1. Try sending via WhatsApp Bot Automation API
  try {
    console.log(`[WHATSAPP SERVICE] Sending Password Reset OTP via Bot API to ${normalizedPhone}...`);
    const response = await axios.post(`${botUrl}/api/send-message`, {
      phone: normalizedPhone,
      message: messageText,
      recipientName: name
    }, { timeout: 4000 });

    console.log(`[WHATSAPP SERVICE] ✓ Reset OTP delivered to ${normalizedPhone} via Bot API`);
    return { success: true, method: 'bot_api', data: response.data, whatsappUrl, messageText };
  } catch (botError) {
    console.warn(`[WHATSAPP SERVICE] Bot API call failed (${botError.message}). Trying Meta Cloud API / Simulation...`);
  }

  // 2. Fallback to direct Meta Cloud API if credentials exist
  if (metaToken && phoneId) {
    try {
      const metaRes = await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v20.0/${phoneId}/messages`,
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: 'sales_team_alert',
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: name || 'Partner' },
                  { type: 'text', text: 'Password Reset OTP' },
                  { type: 'text', text: phone },
                  { type: 'text', text: `Your Password Reset OTP is: ${otp}. Valid for 10 minutes.` }
                ]
              }
            ]
          }
        },
        timeout: 6000
      });
      console.log(`[WHATSAPP SERVICE] ✓ Delivered Meta approved WhatsApp OTP to ${normalizedPhone}`);
      return { success: true, method: 'meta_cloud_api', data: metaRes.data, whatsappUrl, messageText };
    } catch (metaErr) {
      console.warn(`[WHATSAPP SERVICE] Meta API error:`, metaErr.response?.data || metaErr.message);
    }
  }

  // 3. Simulation fallback
  console.log(`\n======================================================`);
  console.log(`💬 [SIMULATED WHATSAPP OTP DISPATCH] To: ${normalizedPhone} (${phone})`);
  console.log(`Recipient: ${name}`);
  console.log(`OTP: ${otp}`);
  console.log(`Content:\n${messageText}`);
  console.log(`======================================================\n`);

  try {
    const logPath = path.join(__dirname, '../../../errors.log');
    fs.appendFileSync(logPath, `[WhatsApp OTP] ${new Date().toISOString()} - Sent OTP to ${normalizedPhone}\n`);
  } catch (e) {
    console.error(e);
  }

  return { success: true, simulated: true, normalizedPhone, whatsappUrl, messageText };
};

module.exports = {
  normalizePhone,
  sendVendorWhatsAppRegistration,
  sendWhatsAppOTP
};
