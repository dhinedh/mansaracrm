const prisma = require('./src/config/database');
const mongoose = require('mongoose');

// =========================================================================
// RUN THIS SCRIPT TO MANUALLY INSERT A WEB ORDER THAT FAILED DURING CHECKOUT
// =========================================================================

// INPUT YOUR ORDER DETAILS HERE:
const ORDER_DATA = {
  customerName: 'Mugilan',
  email: 'mugil9451@gmail.com', // Optional
  phone: '9342400879',
  address: {
    firstName: 'Mugilan',
    lastName: '',
    street: 'PANIMALAR ENGINEERING COLLEGE, 9gb9',
    city: 'Chennai',
    state: 'Tamil Nadu',
    zip: '600123'
  },
  items: [
    {
      productId: '6a1fb6bad0bc918ad582f7ad', // Replace with valid local/Atlas Product ObjectId
      name: 'Ragi Choco Malt 250g',
      quantity: 1,
      price: 190
    }
  ],
  totalAmount: 190,
  paymentInfo: {
    id: 'pay_S3HxO3I7CxqmF9', // Razorpay Payment ID
    orderId: 'order_S3HvWQGszFxzhA', // Razorpay Order ID
    signature: 'MANUAL_INJECT_VERIFIED',
    status: 'Paid'
  }
};

(async () => {
  try {
    console.log('Connecting to database...');
    // Ensure Mongoose is connected
    await new Promise(resolve => setTimeout(resolve, 2000));

    const User = mongoose.model('User');
    const Order = mongoose.model('Order');

    // 1. Find or create User
    console.log(`Checking user: ${ORDER_DATA.phone} / ${ORDER_DATA.email}...`);
    let user = await User.findOne({ 
      $or: [{ phone: ORDER_DATA.phone }, { email: ORDER_DATA.email }] 
    });

    if (!user) {
      console.log('User not found. Creating new customer user...');
      user = await User.create({
        name: ORDER_DATA.customerName,
        email: ORDER_DATA.email || `${ORDER_DATA.phone}@temp.com`,
        phone: ORDER_DATA.phone,
        password: 'password123', // temp password
        role: 'DEALER', // Default
        isActive: true
      });
      console.log('✓ Created User:', user._id.toString());
    } else {
      console.log('✓ Found existing user:', user._id.toString());
    }

    // 2. Generate Custom Order ID
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 3. Create Order
    const trackingSteps = [
      { status: 'Ordered', date: new Date(), completed: true },
      { status: 'Processing', completed: false },
      { status: 'Shipped', completed: false },
      { status: 'Out for Delivery', completed: false },
      { status: 'Delivered', completed: false }
    ];

    console.log('Saving order to DB...');
    const order = await Order.create({
      user: user._id,
      orderId,
      items: ORDER_DATA.items.map(item => ({
        product: new mongoose.Types.ObjectId(item.productId),
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: ORDER_DATA.totalAmount,
      paymentMethod: 'Online',
      deliveryAddress: ORDER_DATA.address,
      orderStatus: 'Ordered',
      paymentStatus: 'Paid',
      paymentInfo: ORDER_DATA.paymentInfo,
      trackingSteps
    });

    console.log(`\n🎉 SUCCESS! Order manually created:`);
    console.log(`  - Order ID: ${order.orderId}`);
    console.log(`  - DB ID: ${order._id.toString()}`);
    console.log(`  - Customer: ${ORDER_DATA.customerName}`);
    console.log(`  - Total: ₹${order.total}`);

    // Create system notification in CRM
    const db = mongoose.connection.db;
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await db.collection('notifications').insertOne({
        userId: admin._id,
        type: 'SYSTEM',
        title: 'New Website Order Placed 🛍️',
        message: `Order #${order.orderId} for ₹${order.total} has been placed by ${ORDER_DATA.customerName}.`,
        isRead: false,
        metadata: { orderId: order._id, websiteOrder: true },
        createdAt: new Date()
      });
    }
    console.log(`✓ Seeded ${admins.length} B2B CRM notifications for the order.`);

  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
