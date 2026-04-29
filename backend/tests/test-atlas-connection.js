/**
 * Test MongoDB Atlas Connection
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    console.log('Connection URI:', process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting steps:');
    console.error('1. Go to MongoDB Atlas → Network Access');
    console.error('2. Add your IP address or "Allow Access from Anywhere"');
    console.error('3. Wait 1-2 minutes for changes to propagate');
    console.error('4. Verify username and password are correct');
    process.exit(1);
  }
}

testConnection();
