require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

(async () => {
  try {
    const res = await axios.get(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}?fields=id,display_phone_number,name_status,quality_rating,platform_type`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    console.log('Phone Object:', res.data);

    // Try fetching templates using phone number ID or business manager
    const tokenInfo = await axios.get(`https://graph.facebook.com/v20.0/debug_token?input_token=${ACCESS_TOKEN}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    console.log('Granular Scopes:', JSON.stringify(tokenInfo.data.data.granular_scopes));
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
})();
