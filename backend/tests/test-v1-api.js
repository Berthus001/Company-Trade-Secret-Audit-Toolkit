require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('\n🔍 Testing v1 API (instead of v1beta)...\n');

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1/models/gemini-pro:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const postData = JSON.stringify({
  contents: [{
    parts: [{
      text: 'Say hello in one word'
    }]
  }]
});

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}\n`);
    
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✅ SUCCESS! API is working!');
      console.log('Response:', response.candidates[0].content.parts[0].text);
    } else {
      console.log('❌ Error Response:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request Error: ${e.message}`);
});

req.write(postData);
req.end();
