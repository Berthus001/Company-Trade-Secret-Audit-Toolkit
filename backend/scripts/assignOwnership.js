/**
 * Migration Script: Assign Ownership to Existing Users
 * 
 * This script assigns existing users without a createdBy field
 * to a specific admin account.
 * 
 * Usage: node scripts/assignOwnership.js <admin_email>
 * Example: node scripts/assignOwnership.js admin1@company.com
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Get admin email from command line argument
const adminEmail = process.argv[2];

if (!adminEmail) {
  console.error('❌ Error: Please provide admin email');
  console.log('Usage: node scripts/assignOwnership.js <admin_email>');
  console.log('Example: node scripts/assignOwnership.js admin1@company.com');
  process.exit(1);
}

const assignOwnership = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB Connected');

    // Find the admin
    const admin = await User.findOne({ 
      email: adminEmail.toLowerCase(), 
      role: 'admin' 
    });

    if (!admin) {
      console.error(`❌ Admin not found: ${adminEmail}`);
      console.log('Make sure the email is correct and the user has admin role');
      process.exit(1);
    }

    console.log(`✓ Found admin: ${admin.name} (${admin.email})`);

    // Find all users without createdBy field
    const usersWithoutOwner = await User.find({
      role: 'user',
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });

    console.log(`\n📊 Found ${usersWithoutOwner.length} users without ownership:`);
    usersWithoutOwner.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    if (usersWithoutOwner.length === 0) {
      console.log('\n✓ All users already have ownership assigned!');
      process.exit(0);
    }

    // Ask for confirmation
    console.log(`\n⚠️  This will assign all ${usersWithoutOwner.length} users to ${admin.name}`);
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update all users
    const result = await User.updateMany(
      {
        role: 'user',
        $or: [
          { createdBy: { $exists: false } },
          { createdBy: null }
        ]
      },
      {
        $set: { createdBy: admin._id }
      }
    );

    console.log(`\n✅ Successfully assigned ${result.modifiedCount} users to ${admin.name}`);
    
    // Show updated users
    const updatedUsers = await User.find({ 
      role: 'user',
      createdBy: admin._id 
    }).select('name email');
    
    console.log(`\n📋 Users now owned by ${admin.name}:`);
    updatedUsers.forEach(user => {
      console.log(`   ✓ ${user.name} (${user.email})`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

assignOwnership();
