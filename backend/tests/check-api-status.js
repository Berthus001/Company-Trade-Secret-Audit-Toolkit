require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('\n🔍 Checking API Key Status...\n');
console.log(`API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : '❌ NOT SET'}\n`);

// Try to list models
const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Attempting to list available models...\n');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✅ API KEY IS VALID!\n');
      console.log('Available models:');
      
      if (response.models) {
        response.models.forEach(model => {
          console.log(`  - ${model.name.replace('models/', '')}`);
        });
      }
    } else {
      console.log('❌ API Key Issue:');
      try {
        const error = JSON.parse(data);
        console.log(`   Error: ${error.error?.message || data}`);
        console.log('\n💡 Solution: Create a NEW API key at https://aistudio.google.com/app/apikey');
      } catch (e) {
        console.log(data);
      }
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Connection Error: ${e.message}`);
});

req.end();
