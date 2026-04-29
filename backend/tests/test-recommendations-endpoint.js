/**
 * Test: POST /api/recommendations
 * 
 * Run this to test the AI recommendations endpoint
 * Usage: node backend/test-recommendations-endpoint.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Sample test data
const testData = {
  categoryScores: {
    'Access Control': { score: 65, earnedPoints: 13, maxPoints: 20 },
    'Data Encryption': { score: 45, earnedPoints: 9, maxPoints: 20 },
    'Employee Policies': { score: 80, earnedPoints: 16, maxPoints: 20 },
    'Physical Security': { score: 55, earnedPoints: 11, maxPoints: 20 }
  },
  weakCategories: [
    'Data Encryption',
    'Physical Security',
    'Access Control'
  ]
};

async function testRecommendationsEndpoint() {
  console.log('\n🧪 Testing POST /api/recommendations\n');
  console.log('Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '─'.repeat(80) + '\n');

  try {
    // You need a valid JWT token to test this endpoint
    // Login first to get a token, or use an existing token
    const token = 'YOUR_JWT_TOKEN_HERE';

    const response = await axios.post(
      `${API_URL}/audits/recommendations`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCESS!\n');
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n' + '─'.repeat(80) + '\n');
    console.log('Recommendations:\n');
    console.log(response.data.data.recommendations);

  } catch (error) {
    if (error.response) {
      console.error('❌ ERROR:', error.response.status);
      console.error('Message:', error.response.data);
    } else {
      console.error('❌ ERROR:', error.message);
    }
    console.log('\n💡 To test this endpoint:');
    console.log('   1. Start your backend server: npm start');
    console.log('   2. Login to get a JWT token');
    console.log('   3. Replace YOUR_JWT_TOKEN_HERE in this file');
    console.log('   4. Run this test again\n');
  }
}

testRecommendationsEndpoint();
