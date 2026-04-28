require('dotenv').config();
const { testConnection } = require('./services/gemini');

async function quickTest() {
  console.log('\n🚀 Quick Gemini Connection Test\n');
  
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ SUCCESS! Gemini API is fully functional!\n');
      console.log('🎉 Your integration is ready to use!\n');
      console.log('Next steps:');
      console.log('  1. Check examples in: backend/examples/gemini-usage-examples.js');
      console.log('  2. Read docs in: backend/GEMINI_INTEGRATION.md');
      console.log('  3. Start using AI insights in your audit controller\n');
    } else {
      console.log('❌ Connection test failed\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();
