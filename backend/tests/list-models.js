require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  console.log('\n📋 Listing available Gemini models...\n');
  
  try {
    const models = await genAI.listModels();
    
    console.log('✅ Available models:\n');
    for await (const model of models) {
      console.log(`Model: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
