const mongoose = require('mongoose');

const remoteUri = 'mongodb+srv://joypackers60_db_user:EYp8MTlbyeyX7X35@cluster0.rhqubga.mongodb.net/test';

async function main() {
  try {
    console.log('Connecting to remote MongoDB Atlas...');
    const conn = await mongoose.connect(remoteUri);
    console.log('Connected!');

    const Return = conn.model('Return', new mongoose.Schema({}, { strict: false }));
    const count = await Return.countDocuments({});
    console.log(`Found ${count} returns to delete.`);

    if (count > 0) {
      const deleted = await Return.deleteMany({});
      console.log(`Deleted ${deleted.deletedCount} return logs.`);
    }

    await mongoose.disconnect();
    console.log('🎉 Done clearing returns!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
