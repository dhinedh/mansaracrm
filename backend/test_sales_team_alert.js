require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const recipientPhone = '917904441760';

(async () => {
  console.log(`📡 Sending test sales_team_alert (English Hello) template to ${recipientPhone}...`);

  const params = [
    'Himesh Priyan',
    'Himesh Priyan Traders',
    '7904441760',
    'B2B Dealer Account APPROVED! Email: himeshpriyan@gmail.com | Password: Dealer@123 | Tier: STARTER (10% Margin) | Portal URL: https://crm.mansarafoods.com/login'
  ];

  try {
    const res = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'template',
        template: {
          name: 'sales_team_alert',
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: params.map(text => ({ type: 'text', text }))
            }
          ]
        }
      }
    });
    console.log('✅ Template sales_team_alert Delivered!', res.data);
  } catch (err) {
    console.error('❌ Template sales_team_alert error:', err.response?.data || err.message);
  }
})();
