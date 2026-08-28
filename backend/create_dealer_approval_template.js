require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const wabaId = '1379129324117602';

const templateData = {
  name: 'dealer_approval_notification',
  category: 'UTILITY',
  language: 'en_US',
  components: [
    {
      type: 'BODY',
      text: 'Hello {{1}}, your B2B dealer partner account for {{2}} has been APPROVED! Registered Email: {{3}}. Credentials & Details: {{4}}. Log in to your portal at {{5}} to access your account. Thank you!',
      example: {
        body_text: [
          ['Himesh Priyan', 'Himesh Priyan Traders', 'himeshpriyan@gmail.com', 'Password: Dealer@123 | Tier: STARTER (10% Margin)', 'https://crm.mansarafoods.com/login']
        ]
      }
    }
  ]
};

(async () => {
  try {
    console.log('🚀 Submitting new English template "dealer_approval_notification" to Meta Graph API...');
    const res = await axios.post(
      `https://graph.facebook.com/v20.0/${wabaId}/message_templates`,
      templateData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('🎉 SUCCESS! Template created ID:', res.data.id, 'Status:', res.data.status);
  } catch (err) {
    console.error('❌ Template creation details:', err.response?.data || err.message);
  }
})();
