const prisma = require('./config/database');

async function list() {
  try {
    const products = await prisma.product.findMany({
      include: { companyStock: true }
    });
    console.log(JSON.stringify(products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      mrp: p.mrp,
      weight: p.weight,
      pacQuantity: p.pacQuantity,
      stock: p.companyStock?.quantity
    })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

list();
