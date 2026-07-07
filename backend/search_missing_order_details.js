const mongoose = require('mongoose');

const localUri = 'mongodb://localhost:27017/mansara';

(async () => {
  try {
    console.log('Connecting to database...');
    const conn = await mongoose.createConnection(localUri).asPromise();
    console.log('🔌 Connected!');

    const UserSchema = new mongoose.Schema({}, { strict: false });
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const OrderSchema = new mongoose.Schema({}, { strict: false });

    const User = conn.model('User', UserSchema, 'users');
    const Product = conn.model('Product', ProductSchema, 'products');
    const Order = conn.model('Order', OrderSchema, 'orders');

    // 1. Search for customer by phone number
    const phonesToSearch = ['9677463695', '+919677463695', 'deepika.hari03@okaxis'];
    console.log('\nSearching for user matching customer info...');
    const matchedUsers = await User.find({
      $or: [
        { phone: { $regex: '9677463695' } },
        { email: { $regex: 'deepika', $options: 'i' } },
        { name: { $regex: 'deepika', $options: 'i' } }
      ]
    }).lean();

    console.log(`Found ${matchedUsers.length} matching users:`);
    matchedUsers.forEach(u => {
      console.log(`  - User: ${u.name} | Phone: ${u.phone} | Email: ${u.email} | ID: ${u._id}`);
      console.log(`  - Cart:`, JSON.stringify(u.cart, null, 2));
    });

    // 2. Fetch all active products and combos to compute price matches
    console.log('\nFetching products to match target amount: ₹654.90...');
    const products = await Product.find({ isActive: true }).lean();
    console.log(`Found ${products.length} active products.`);

    const prices = [];
    products.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          prices.push({ id: p._id, name: `${p.name} (${v.weight || v.size || v.price})`, price: v.price });
        });
      } else {
        prices.push({ id: p._id, name: p.name, price: p.price });
      }
    });

    console.log('\nPrice mapping of individual items:');
    prices.forEach(item => {
      console.log(`  - ${item.name}: ₹${item.price}`);
    });

    // Let's find combinations of items that sum to exactly 654.90 OR close to it.
    // Target is: Total = Items Total + Shipping
    // Note: shipping is 50 for orders below 750.
    // So if Total = 654.90:
    // Case A: No shipping (total >= 750). But 654.90 < 750, so there MUST be shipping of ₹50.
    // Therefore, items total = 654.90 - 50 = 604.90.
    // Wait, is there GST? Yes, prices in database usually include GST or it's added. Let's see if 654.90 includes shipping of 50, or if they had a discount code!
    // Let's search combinations that sum up to 604.90 or 654.90.
    console.log('\nAnalyzing combination match for target item total: ₹604.90 (if ₹50 shipping added) or ₹654.90 (if free shipping/exact match)');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
