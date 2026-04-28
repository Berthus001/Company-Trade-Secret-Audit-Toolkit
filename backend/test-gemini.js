/**
 * Quick Test Script for Gemini Integration
 * 
 * Run this file to test your Gemini API connection:
 * node backend/test-gemini.js
 */

require('dotenv').config();
const { testConnection, analyzeAuditResponses } = require('./services/gemini');

console.log('\n🔍 Testing Gemini API Integration...\n');
console.log('API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : '❌ NOT SET');

async function runTests() {
  try {
    // Test 1: Connection Test
    console.log('\n📡 Test 1: Connection Test');
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ SUCCESS: Gemini API is connected!\n');
    } else {
      console.log('❌ FAILED: Could not connect to Gemini API\n');
      return;
    }

    // Test 2: Sample Audit Analysis
    console.log('📊 Test 2: Sample Audit Analysis');
    console.log('Generating AI insights for a sample audit...\n');

    const sampleAudit = {
      companyName: 'Test Company Inc.',
      overallScore: 65,
      riskLevel: 'Medium',
      categoryScores: [
        { category: 'Access Control', score: 70, earnedPoints: 14, maxPoints: 20 },
        { category: 'Data Encryption', score: 55, earnedPoints: 11, maxPoints: 20 },
        { category: 'Employee Policies', score: 75, earnedPoints: 15, maxPoints: 20 },
        { category: 'Physical Security', score: 60, earnedPoints: 12, maxPoints: 20 }
      ],
      answers: [
        {
          questionText: 'How well does your organization implement Role-Based Access Control (RBAC)?',
          category: 'Access Control',
          selectedOption: {
            label: 'Good',
            value: 2,
            description: 'RBAC implemented with occasional reviews'
          }
        },
        {
          questionText: 'How effective is your Multi-Factor Authentication (MFA) implementation?',
          category: 'Access Control',
          selectedOption: {
            label: 'Bad',
            value: 1,
            description: 'MFA only for a few critical systems'
          }
        }
      ]
    };

    const insights = await analyzeAuditResponses(sampleAudit);
    
    console.log('✅ SUCCESS: AI Insights Generated!\n');
    console.log('─'.repeat(80));
    console.log(insights);
    console.log('─'.repeat(80));
    console.log('\n✨ All tests passed! Gemini is ready to use.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure GEMINI_API_KEY is set in your .env file');
    console.error('   2. Get your API key from: https://aistudio.google.com/app/apikey');
    console.error('   3. Ensure @google/generative-ai package is installed');
    console.error('   4. Check your internet connection\n');
  }
}

runTests();
