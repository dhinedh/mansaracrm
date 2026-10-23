const prisma = require('./src/config/database');
const { buildInvoiceHtml } = require('./src/utils/pdfTemplate');

(async () => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        store: true,
        dealer: { include: { user: true } },
        items: { include: { product: true } }
      }
    });

    console.log(`Found ${invoices.length} invoices`);
    const invoice = invoices[0] || {
      invoiceNo: 'MF-INV-00010',
      invoiceType: 'TAX',
      createdAt: new Date(),
      items: [
        {
          product: { name: 'Urad Health Mix', hsnCode: '1904', netWeightG: 250, mrp: 180 },
          quantity: 24,
          sellingPrice: 150,
          lineTotal: 3600
        }
      ],
      dealer: {
        companyName: 'A3 EXPRESS CARGO',
        address: '123 Freight Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        phone: '+91 91234 56789',
        gstNumber: '33AABCA1234F1Z1'
      }
    };

    const settings = await prisma.setting.findFirst({ where: { key: 'invoice_settings' } });
    console.log('Using settings companyName:', settings?.companyName);
    console.log('Invoice dealer companyName:', invoice.dealer?.companyName);

    const html = buildInvoiceHtml(settings, invoice);

    console.log('\n--- EXTRACTED COMPANY HEADER ---');
    const headerMatch = html.match(/<div class="company-cell">([\s\S]*?)<\/div>\s*<div class="inv-meta-cell">/);
    if (headerMatch) {
      console.log(headerMatch[0]);
    }

    console.log('\n--- EXTRACTED BILL TO ---');
    const billToMatch = html.match(/<div class="bill-cell">([\s\S]*?)<\/div>/);
    if (billToMatch) {
      console.log(billToMatch[0]);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
