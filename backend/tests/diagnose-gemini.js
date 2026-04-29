require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('\n🔍 Diagnosing Gemini API Setup...\n');
console.log(`API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : '❌ NOT SET'}\n`);

// Test direct API call
const testAPI = () => {
  const models = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-2.0-flash-exp'
  ];

  console.log('Testing different model names...\n');

  models.forEach((model, index) => {
    setTimeout(() => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const postData = JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello'
          }]
        }]
      });

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ ${model} - WORKS!`);
          } else {
            const error = JSON.parse(data);
            console.log(`❌ ${model} - ${res.statusCode}: ${error.error?.message || 'Not available'}`);
          }
        });
      });

      req.on('error', (e) => {
        console.error(`❌ ${model} - Error: ${e.message}`);
      });

      req.write(postData);
      req.end();
    }, index * 1000); // Delay each request by 1 second
  });
};

testAPI();

setTimeout(() => {
  console.log('\n💡 Troubleshooting Tips:');
  console.log('   1. Make sure you created the API key at: https://aistudio.google.com/app/apikey');
  console.log('   2. Try creating a NEW API key if none work');
  console.log('   3. Check API key restrictions in Google AI Studio');
  console.log('   4. Ensure Generative Language API is enabled\n');
}, 6000);
