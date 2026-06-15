// src/utils/pdfGenerator.js
const puppeteer = require('puppeteer');

/**
 * Generates an A4 PDF from HTML using Puppeteer.
 * @param {string} html - HTML invoice template string
 * @returns {Promise<Buffer>} - PDF Buffer
 */
const generateInvoicePdf = async (html) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Puppeteer generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { generateInvoicePdf };
