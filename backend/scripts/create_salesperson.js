// scripts/create_salesperson.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
console.log('Connecting to database...');

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB successfully.');
  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const profilesCol = db.collection('salesperson_profiles');

  const email = 'sales@mansarafoods.com';
  const plainPassword = 'Sales@123';

  let user = await usersCol.findOne({ email });

  if (user) {
    console.log('User already exists in DB:', user._id);
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    console.log('Current password matches "Sales@123":', isMatch);

    const hashed = await bcrypt.hash(plainPassword, 10);
    await usersCol.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashed, 
          role: 'SALESPERSON', 
          isActive: true,
          name: user.name || 'Karthik Raja',
          phone: user.phone || '+91 98765 12345'
        } 
      }
    );
    console.log('Password has been set to "Sales@123", role set to "SALESPERSON", and account is ACTIVE.');
  } else {
    console.log('User not found. Creating new salesperson user...');
    const hashed = await bcrypt.hash(plainPassword, 10);
    const result = await usersCol.insertOne({
      email,
      password: hashed,
      name: 'Karthik Raja',
      phone: '+91 98765 12345',
      role: 'SALESPERSON',
      staffRole: 'VIEWER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    user = { _id: result.insertedId };
    console.log('Salesperson user created successfully with ID:', user._id);
  }

  // Ensure SalespersonProfile exists
  let profile = await profilesCol.findOne({ userId: user._id });
  if (!profile) {
    console.log('Creating salesperson profile...');
    await profilesCol.insertOne({
      userId: user._id,
      employeeCode: 'SALES-001',
      designation: 'Senior Area Sales Executive',
      assignedZones: ['Chennai North', 'Chennai South', 'Central Hub'],
      monthlyTarget: 150000,
      monthlyVisitsTarget: 140,
      dailyVisitsTarget: 7,
      activeBeatRoute: 'Beat A - North Retail Hub',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Salesperson profile created successfully.');
  } else {
    console.log('Salesperson profile exists with employeeCode:', profile.employeeCode);
  }

  // Double check login verification simulation
  const verifiedUser = await usersCol.findOne({ email });
  const checkPass = await bcrypt.compare(plainPassword, verifiedUser.password);
  console.log('\nVerification Summary:');
  console.log('Email:', verifiedUser.email);
  console.log('Role:', verifiedUser.role);
  console.log('isActive:', verifiedUser.isActive);
  console.log('Password test ("' + plainPassword + '"):', checkPass ? 'VALID ✅' : 'FAILED ❌');

  process.exit(0);
}).catch((err) => {
  console.error('Database connection / execution error:', err);
  process.exit(1);
});
