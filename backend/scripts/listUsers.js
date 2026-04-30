/**
 * List all users and their ownership
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB Connected\n');

    const users = await User.find({ role: 'user' })
      .select('name email company createdBy createdAt')
      .populate('createdBy', 'name email');
    
    console.log(`📋 Found ${users.length} user(s):\n`);
    
    if (users.length === 0) {
      console.log('No users found in database.\n');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Company: ${user.company}`);
        console.log(`   Created By: ${user.createdBy ? `${user.createdBy.name} (${user.createdBy.email})` : 'NOT SET (null)'}`);
        console.log(`   Created At: ${user.createdAt}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listUsers();
