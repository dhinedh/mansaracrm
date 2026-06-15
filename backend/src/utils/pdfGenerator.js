// src/utils/pdfGenerator.js

/**
 * Generates an A4 PDF from HTML using Puppeteer.
 * Falls back gracefully if Puppeteer is unavailable.
 * @param {string} html - HTML invoice template string
 * @returns {Promise<Buffer>} - PDF Buffer
 */
const generateInvoicePdf = async (html) => {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    const err = new Error('Puppeteer not available: ' + e.message);
    err.code = 'PUPPETEER_UNAVAILABLE';
    throw err;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Puppeteer PDF generation error:', error);
    const err = new Error('PDF generation failed: ' + error.message);
    err.code = 'PDF_GENERATION_FAILED';
    throw err;
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
};

module.exports = { generateInvoicePdf };

