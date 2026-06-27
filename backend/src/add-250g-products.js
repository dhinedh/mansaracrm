const { PrismaClient } = require('./config/database');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inserting 250g products into CRM...');

  // Find categories
  const categories = await prisma.category.findMany();
  const catMap = {};
  categories.forEach(c => {
    catMap[c.name] = c.id;
  });

  const uradCatId = catMap['Urad Porridge Mix'];
  const blackRiceCatId = catMap['Black Rice mix'];

  if (!uradCatId || !blackRiceCatId) {
    console.error('❌ Categories not found! Make sure database is seeded first.');
    return;
  }

  const productsToAdd = [
    {
      name: "Urad Health Mix – Classic 250g",
      sku: "MF-URAD-CLA-250",
      price: 165,
      mrp: 195,
      gstPercent: 5.0,
      hsnCode: "1901",
      categoryId: uradCatId,
      unit: "250g",
      pacQuantity: 24,
      minOrderQty: 5,
      image: "/products/urad-classic-front.jpg"
    },
    {
      name: "Urad Health Mix – Salt n Pepper 250g",
      sku: "MF-URAD-SNP-250",
      price: 165,
      mrp: 195,
      gstPercent: 5.0,
      hsnCode: "1901",
      categoryId: uradCatId,
      unit: "250g",
      pacQuantity: 24,
      minOrderQty: 5,
      image: "/products/urad-salt-pepper-front.jpg"
    },
    {
      name: "Urad Health Mix – Millet Magic 250g",
      sku: "MF-URAD-MIL-250",
      price: 165,
      mrp: 195,
      gstPercent: 5.0,
      hsnCode: "1901",
      categoryId: uradCatId,
      unit: "250g",
      pacQuantity: 24,
      minOrderQty: 5,
      image: "/products/urad-millet-magic-front.jpg"
    },
    {
      name: "Urad Health Mix – Premium 250g",
      sku: "MF-URAD-PRE-250",
      price: 165,
      mrp: 195,
      gstPercent: 5.0,
      hsnCode: "1901",
      categoryId: uradCatId,
      unit: "250g",
      pacQuantity: 24,
      minOrderQty: 5,
      image: "/products/urad-premium-front.jpg"
    },
    {
      name: "Health Mix – Black Rice Delight 250g",
      sku: "MF-BLAC-DEL-250",
      price: 165,
      mrp: 195,
      gstPercent: 5.0,
      hsnCode: "1901",
      categoryId: blackRiceCatId,
      unit: "250g",
      pacQuantity: 24,
      minOrderQty: 5,
      image: "/products/black-rice-delight-front.jpg"
    }
  ];

  for (const prod of productsToAdd) {
    const savedProd = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {
        price: prod.price,
        mrp: prod.mrp,
        image: prod.image,
        unit: prod.unit,
        pacQuantity: prod.pacQuantity,
      },
      create: prod
    });

    // Seed Company Stock levels (Warehouse)
    await prisma.companyInventory.upsert({
      where: { productId: savedProd.id },
      update: {},
      create: {
        productId: savedProd.id,
        quantity: 500,
        minQuantity: 20
      }
    });

    console.log(`✅ Seeded ${prod.name} (SKU: ${prod.sku})`);
  }

  console.log('🎉 250g products seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
