// prisma/seed.js — Seed initial admin user and authentic Mansara Foods product catalog data
require('dotenv').config();
const { PrismaClient } = require('../src/config/database');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding B2B CRM database for Mansara Foods...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mansarafoods.com' },
    update: {},
    create: {
      email: 'admin@mansarafoods.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created: admin@mansarafoods.com');

  // Create categories exactly matching Mansara Foods e-commerce setup
  const categoriesList = [
    { name: 'Urad Porridge Mix', description: 'Nutritious Urad Dal based health mixes' },
    { name: 'Black Rice mix', description: 'Premium Black Rice based health mixes' },
    { name: 'Millet fusion mix', description: 'Wholesome Millet fusion blends' },
    { name: 'Health drink mix', description: 'Nutritious and delicious health drink blends' },
    { name: 'Idly Podi', description: 'Traditional and Millet enriched idly podis' },
    { name: 'Rice Mixes', description: 'Authentic and nutritious rice mixes' }
  ];

  const categoryMap = {};
  for (const cat of categoriesList) {
    const savedCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap[cat.name] = savedCat.id;
  }
  console.log(`✅ ${categoriesList.length} categories seeded successfully.`);

  // Create products matching Mansara Foods e-commerce setup
  const productsList = [
    { name: "Urad Health Mix – Classic", category: "Urad Porridge Mix", price: 55, mrp: 55, unit: "100g", sku: "MF-URAD-CLA-100", hsnCode: "1901", image: "/products/urad-classic-front.jpg" },
    { name: "Urad Health Mix – Salt n Pepper", category: "Urad Porridge Mix", price: 55, mrp: 55, unit: "100g", sku: "MF-URAD-SNP-100", hsnCode: "1901", image: "/products/urad-salt-pepper-front.jpg" },
    { name: "Urad Health Mix – Millet Magic", category: "Urad Porridge Mix", price: 60, mrp: 60, unit: "100g", sku: "MF-URAD-MIL-100", hsnCode: "1901", image: "/products/urad-millet-magic-front.jpg" },
    { name: "Urad Health Mix – Premium", category: "Urad Porridge Mix", price: 65, mrp: 65, unit: "100g", sku: "MF-URAD-PRE-100", hsnCode: "1901", image: "/products/urad-premium-front.jpg" },
    { name: "Health Mix – Black Rice Delight", category: "Black Rice mix", price: 70, mrp: 70, unit: "100g", sku: "MF-BLAC-DEL-100", hsnCode: "1901", image: "/products/black-rice-delight-front.jpg" },
    { name: "Ragi Choco Malt", category: "Health drink mix", price: 250, mrp: 250, unit: "250g", sku: "MF-RAGI-CHO-250", hsnCode: "1901", image: "/products/RagiChocoMalt.PNG" },
    { name: "Nutriminix – Multi Grain Health Mix", category: "Health drink mix", price: 200, mrp: 200, unit: "250g", sku: "MF-NUTR-MGM-250", hsnCode: "1901", image: "/products/NutriMix.PNG" },
    { name: "Idly Podi – Traditional", category: "Idly Podi", price: 75, mrp: 75, unit: "100g", sku: "MF-IDLY-TRA-100", hsnCode: "2103", image: "/products/TraditionalIdlyPodi.PNG" },
    { name: "Idly Podi – Millet Fusion", category: "Idly Podi", price: 75, mrp: 75, unit: "100g", sku: "MF-IDLY-MIL-100", hsnCode: "2103", image: "/products/MilletFusionIdlyPodi.PNG" },
    { name: "Rice Podi Mix", category: "Rice Mixes", price: 85, mrp: 85, unit: "100g", sku: "MF-RICE-POD-100", hsnCode: "2103", image: "/products/HomeStyleParuppu.PNG" },
    { name: "Curry Leaves Rice Podi Mix", category: "Rice Mixes", price: 85, mrp: 85, unit: "100g", sku: "MF-RICE-CUR-100", hsnCode: "2103", image: "/products/KaruveppillaiSpecial.PNG" },
    { name: "Coriander Rice Podi Mix", category: "Rice Mixes", price: 75, mrp: 85, unit: "100g", sku: "MF-RICE-COR-100", hsnCode: "2103", image: "/products/KothamalliAroma.PNG" },
    { name: "Moringa Rice Podi Mix", category: "Rice Mixes", price: 85, mrp: 85, unit: "100g", sku: "MF-RICE-MOR-100", hsnCode: "2103", image: "/products/MurungaiVital.PNG" },
    { name: "Pirandai Rice Podi Mix", category: "Rice Mixes", price: 85, mrp: 85, unit: "100g", sku: "MF-RICE-PIR-100", hsnCode: "2103", image: "/products/PirandaiPower.PNG" }
  ];

  for (const prod of productsList) {
    const productData = {
      name: prod.name,
      sku: prod.sku,
      price: prod.price,
      mrp: prod.mrp,
      gstPercent: 5.0, // Standard 5% GST on Spices/Cereals/Mixes
      hsnCode: prod.hsnCode,
      categoryId: categoryMap[prod.category],
      unit: prod.unit,
      minOrderQty: 5,
      image: prod.image
    };

    const savedProd = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: { 
        price: prod.price,
        mrp: prod.mrp,
        image: prod.image 
      },
      create: productData,
    });

    // Seed Company Stock levels (Warehouse)
    await prisma.companyInventory.upsert({
      where: { productId: savedProd.id },
      update: {},
      create: {
        productId: savedProd.id,
        quantity: 500,
        minQuantity: 20,
      },
    });
  }
  console.log(`✅ ${productsList.length} Mansara products seeded with default stock of 500 units each.`);

  // Initialize invoice sequence
  await prisma.invoiceSequence.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', lastNumber: 0, prefix: 'MF-INV' },
  });
  console.log('✅ Invoice sequence initialized.');

  // Create a sample dealer for testing
  const dealerPassword = await bcrypt.hash('Dealer@123', 12);
  const dealerUser = await prisma.user.upsert({
    where: { email: 'dealer@test.com' },
    update: {},
    create: {
      email: 'dealer@test.com',
      password: dealerPassword,
      name: 'Ramesh Kumar',
      role: 'DEALER',
      isActive: true,
    },
  });

  const dealerProfile = await prisma.dealer.upsert({
    where: { userId: dealerUser.id },
    update: {},
    create: {
      userId: dealerUser.id,
      companyName: 'Kumar Traders',
      gstNumber: '27ABCDE1234F1Z5',
      address: '123, MG Road, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      zone: 'West',
      area: 'Pune Central',
      phone: '9876543210',
      dealerType: 'DISTRIBUTOR',
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  });
  console.log('✅ Sample dealer created: dealer@test.com / Dealer@123');

  // Allocate initial stock to this test dealer for the first 3 products so they can immediately test billing
  const firstThreeProducts = await prisma.product.findMany({ take: 3 });
  for (const prod of firstThreeProducts) {
    await prisma.dealerInventory.upsert({
      where: {
        dealerId_productId: {
          dealerId: dealerProfile.id,
          productId: prod.id
        }
      },
      update: {},
      create: {
        dealerId: dealerProfile.id,
        productId: prod.id,
        quantity: 50 // seed 50 units for immediate B2B sales testing
      }
    });
  }
  console.log('✅ Allocated initial partner stock of 50 units for testing billing cart.');

  // Seed sample Complaints/Tickets
  console.log('🌱 Seeding sample complaint tickets...');
  await prisma.complaintTicket.upsert({
    where: { ticketNo: 'TKT-1001' },
    update: {},
    create: {
      ticketNo: 'TKT-1001',
      userId: dealerUser.id,
      subject: 'Delayed Delivery of Millet Fusion Mix Order',
      category: 'DELIVERY',
      priority: 'HIGH',
      status: 'OPEN',
      description: 'Our last stock request (Millet Fusion Mix, 100 packs) has not arrived yet. It was scheduled for delivery 3 days ago. Please check with logistics.',
      replies: []
    }
  });

  await prisma.complaintTicket.upsert({
    where: { ticketNo: 'TKT-1002' },
    update: {},
    create: {
      ticketNo: 'TKT-1002',
      userId: dealerUser.id,
      subject: 'Urad Classic Margin Applied Incorrectly',
      category: 'BILLING',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      description: 'The margin rate applied on invoice #MF-INV-001 for Urad Health Mix - Classic is 12%, but our contract states 15%. Please adjust this invoice.',
      replies: [
        {
          userId: admin.id,
          userName: 'Mansara Support',
          message: 'Hello Ramesh, we have received your ticket. We are cross-referencing your margin configuration with our accounts team and will update you shortly.',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000) // 4 hours ago
        },
        {
          userId: dealerUser.id,
          userName: 'Kumar Traders',
          message: 'Thank you for the quick response. Looking forward to the correction.',
          createdAt: new Date(Date.now() - 2 * 3600 * 1000) // 2 hours ago
        }
      ]
    }
  });
  console.log('✅ 2 sample complaint tickets seeded.');

  console.log('\n🎉 Database Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
