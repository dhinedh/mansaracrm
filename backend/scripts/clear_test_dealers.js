// crm/backend/scripts/clear_test_dealers.js
require('dotenv').config();
const prisma = require('../src/config/database');

async function main() {
  console.log('🧹 Clearing B2B CRM dealer data for production prep...');

  // 1. Find all dealers
  const dealers = await prisma.dealer.findMany();
  const dealerIds = dealers.map(d => d.id);
  console.log(`Found ${dealers.length} B2B dealers to remove.`);

  // 2. Clear Dealer Inventories
  const deletedInventory = await prisma.dealerInventory.deleteMany({
    where: { dealerId: { in: dealerIds } }
  });
  console.log(`Deleted ${deletedInventory.count} dealer inventory records.`);

  // 3. Clear B2B Invoices & Invoice Items
  const b2bInvoices = await prisma.invoice.findMany({
    where: { channel: 'B2B' }
  });
  const b2bInvoiceIds = b2bInvoices.map(inv => inv.id);
  
  const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({
    where: { invoiceId: { in: b2bInvoiceIds } }
  });
  console.log(`Deleted ${deletedInvoiceItems.count} invoice items.`);

  const deletedInvoices = await prisma.invoice.deleteMany({
    where: { _id: { in: b2bInvoiceIds } }
  });
  console.log(`Deleted ${deletedInvoices.count} B2B invoice records.`);

  // 4. Clear Stock Transfers & Items
  const transfers = await prisma.stockTransfer.findMany();
  const transferIds = transfers.map(t => t.id);

  const deletedTransferItems = await prisma.stockTransferItem.deleteMany({
    where: { transferId: { in: transferIds } }
  });
  console.log(`Deleted ${deletedTransferItems.count} stock transfer items.`);

  const deletedTransfers = await prisma.stockTransfer.deleteMany({
    where: { _id: { in: transferIds } }
  });
  console.log(`Deleted ${deletedTransfers.count} stock transfers.`);

  // 5. Clear Stock Requests
  const deletedRequests = await prisma.stockRequest.deleteMany();
  console.log(`Deleted ${deletedRequests.count} stock requests.`);

  // 6. Clear Margins
  const deletedMargins = await prisma.margin.deleteMany();
  console.log(`Deleted ${deletedMargins.count} margin rules.`);

  // 7. Clear Complaint Tickets
  const deletedTickets = await prisma.complaintTicket.deleteMany();
  console.log(`Deleted ${deletedTickets.count} complaint tickets.`);

  // 8. Delete Dealers
  const deletedDealers = await prisma.dealer.deleteMany();
  console.log(`Deleted ${deletedDealers.count} dealer profiles.`);

  // 9. Delete Users associated with DEALER role
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: 'DEALER' }
  });
  console.log(`Deleted ${deletedUsers.count} dealer user accounts.`);

  console.log('🎉 B2B CRM dealer data successfully wiped for production!');
}

main()
  .catch(err => {
    console.error('❌ Error clearing dealer data:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
