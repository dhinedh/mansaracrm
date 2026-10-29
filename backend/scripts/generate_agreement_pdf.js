// d:/zechsoft/mansarafoods/crm/backend/scripts/generate_agreement_pdf.js
require('dotenv').config();
const prisma = require('../src/config/database');
const { generateInvoicePdf } = require('../src/utils/pdfGenerator');
const { buildAgreementHtml } = require('../src/utils/pdfTemplate');
const { getOrAssignDealerAgreementNumber } = require('../src/utils/agreementSequence');
const fs = require('fs');
const path = require('path');

const getCompanyDetails = () => {
  return {
    name: process.env.COMPANY_NAME || 'Mansara Foods Pvt. Ltd.',
    gstNumber: process.env.COMPANY_GST || '27AABCM1234F1Z5',
    address: process.env.COMPANY_ADDRESS || 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal, Chennai – 600077',
    phone: process.env.COMPANY_PHONE || '+91-88388 87064',
    email: process.env.COMPANY_EMAIL || 'contact@mansarafoods.com'
  };
};

async function main() {
  try {
    console.log('Querying test dealer...');
    // Find dealer with user email = dealer@test.com
    let dealer;
    const user = await prisma.user.findUnique({
      where: { email: 'dealer@test.com' },
      include: { dealer: true }
    });

    if (user && user.dealer) {
      dealer = await prisma.dealer.findUnique({
        where: { id: user.dealer.id },
        include: { user: true }
      });
    } else {
      dealer = await prisma.dealer.findFirst({
        include: { user: true }
      });
    }

    if (!dealer) {
      console.error('No dealer found in the database. Please seed first.');
      process.exit(1);
    }

    const { agreementNumber, agreeSeq } = await getOrAssignDealerAgreementNumber(dealer.id);
    dealer.agreementNumber = agreementNumber;
    dealer.agreeSeq = agreeSeq;

    console.log(`Generating agreement for: ${dealer.companyName} (${agreementNumber})...`);
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
