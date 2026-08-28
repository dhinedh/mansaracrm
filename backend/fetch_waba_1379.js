require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const wabaId = '1379129324117602';

(async () => {
  try {
    const templatesRes = await axios.get(`https://graph.facebook.com/v20.0/${wabaId}/message_templates?limit=100`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
    console.log('\n📜 Approved Meta WhatsApp Templates Count:', templatesRes.data.data?.length);
    (templatesRes.data.data || []).forEach(t => {
      console.log(`\n📌 Name: "${t.name}" | Status: ${t.status} | Category: ${t.category} | Lang: ${t.language}`);
      if (t.components) {
        t.components.forEach(c => {
          console.log(`   Type: ${c.type} | Text: "${c.text || ''}"`);
        });
      }
    });
  } catch (err) {
    console.error('Error fetching templates:', err.response?.data || err.message);
  }
})();
