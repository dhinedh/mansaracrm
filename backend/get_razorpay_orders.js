const Razorpay = require('razorpay');

const key_id = 'rzp_test_S3GyJz9EOXynOG';
const key_secret = 'N3Eu86oHpqV4vFgIXG0PrgAb';

const razorpay = new Razorpay({ key_id, key_secret });

(async () => {
  try {
    console.log('Fetching payments from Razorpay...');
    const payments = await razorpay.payments.all({ count: 10 });
    console.log(`Fetched ${payments.items.length} recent payments from Razorpay:\n`);

    payments.items.forEach((p, idx) => {
      console.log(`[Payment #${idx + 1}]`);
      console.log(`  - ID: ${p.id}`);
      console.log(`  - Order ID: ${p.order_id}`);
      console.log(`  - Amount: ₹${p.amount / 100}`);
      console.log(`  - Status: ${p.status}`);
      console.log(`  - Email: ${p.email}`);
      console.log(`  - Contact: ${p.contact}`);
      console.log(`  - Created At: ${new Date(p.created_at * 1000).toLocaleString()}`);
      console.log(`  - Method: ${p.method}`);
      console.log(`  - Notes:`, p.notes);
      console.log('----------------------------------------------------');
    });

    console.log('\nFetching orders from Razorpay...');
    const orders = await razorpay.orders.all({ count: 10 });
    console.log(`Fetched ${orders.items.length} recent orders from Razorpay:\n`);

    orders.items.forEach((o, idx) => {
      console.log(`[Order #${idx + 1}]`);
      console.log(`  - ID: ${o.id}`);
      console.log(`  - Amount: ₹${o.amount / 100}`);
      console.log(`  - Status: ${o.status}`);
      console.log(`  - Created At: ${new Date(o.created_at * 1000).toLocaleString()}`);
      console.log(`  - Notes:`, o.notes);
      console.log('----------------------------------------------------');
    });

  } catch (err) {
    console.error('❌ Failed to fetch from Razorpay:', err);
  }
})();
