/**
 * Quick script to create test accounts
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trade-secret-audit', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const User = require('./models/User');

const createTestAccounts = async () => {
  try {
    await connectDB();

    // Create 2 test users
    const testUser1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'TestUser123!',
      company: 'Example Corp',
      role: 'user'
    });
    console.log('✓ Test user 1 created:', testUser1.email);

    const testUser2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'TestUser123!',
      company: 'Example Corp',
      role: 'user'
    });
    console.log('✓ Test user 2 created:', testUser2.email);

    console.log('\nTest accounts created successfully!');
    console.log('\nYou can now see these users in the Manage Users page.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test accounts:', error.message);
    process.exit(1);
  }
};

createTestAccounts();
