// d:/zechsoft/mansarafoods/crm/backend/scripts/generate_agreement_pdf.js
require('dotenv').config();
const prisma = require('../src/config/database');
const { generateInvoicePdf } = require('../src/utils/pdfGenerator');
const { buildAgreementHtml } = require('../src/utils/pdfTemplate');
const fs = require('fs');
const path = require('path');

const getCompanyDetails = () => {
  return {
    name: process.env.COMPANY_NAME || 'Mansara Foods Pvt. Ltd.',
    gstNumber: process.env.COMPANY_GST || '27AABCM1234F1Z5',
    address: process.env.COMPANY_ADDRESS || 'Mumbai, Maharashtra, India',
    phone: process.env.COMPANY_PHONE || '+91 98765 43210',
    email: process.env.COMPANY_EMAIL || 'info@mansarafoods.com'
  };
};

async function main() {
  try {
    console.log('Querying test dealer...');
    // Find dealer with user email = dealer@test.com
    const user = await prisma.user.findUnique({
      where: { email: 'dealer@test.com' },
      include: { dealer: true }
    });

    if (!user || !user.dealer) {
      console.error('Test dealer not found in the database. Please seed first.');
      process.exit(1);
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id: user.dealer.id },
      include: { user: true }
    });

    console.log(`Generating agreement for: ${dealer.companyName}...`);
    const company = getCompanyDetails();
    const html = buildAgreementHtml(company, dealer);

    console.log('Generating PDF buffer using Puppeteer...');
    const pdfBuffer = await generateInvoicePdf(html);

    const destDir = 'C:/Users/mural/.gemini/antigravity-ide/brain/fe61c17d-c8d7-4356-bd16-8be34bcca7ed';
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const destPath = path.join(destDir, 'sample_agreement.pdf');
    fs.writeFileSync(destPath, pdfBuffer);
    console.log(`Agreement PDF generated successfully at: ${destPath}`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
}

main();
