/**
 * List all admin accounts in the database
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const listAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB Connected\n');

    const admins = await User.find({ role: 'admin' }).select('name email company createdAt');
    
    console.log(`📋 Found ${admins.length} admin(s):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Company: ${admin.company}`);
      console.log(`   Created: ${admin.createdAt}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listAdmins();
