// test_create_request.js
require('dotenv').config();
const prisma = require('./src/config/database');

async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'dealer@test.com' },
    include: { dealer: true }
  });

  const product = await prisma.product.findFirst({
    where: { isActive: true }
  });

  console.log('Using User:', user.id);
  console.log('Using Dealer:', user.dealer.id);
  console.log('Using Product:', product.id);

  try {
    const request = await prisma.stockRequest.create({
      data: {
        requestNo: `REQ-TEST-${Date.now()}`,
        dealerId: user.dealer.id,
        items: [{
          productId: product.id,
          quantity: 15
        }],
        status: 'PENDING',
        notes: 'Test stock request'
      }
    });
    console.log('Created Request Successfully:', JSON.stringify(request, null, 2));
  } catch (err) {
    console.error('Error creating request:', err);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
