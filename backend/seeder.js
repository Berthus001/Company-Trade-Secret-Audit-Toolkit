/**
 * Database Seeder
 * Run this script to seed the database with initial data
 * Usage: npm run seed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Question = require('./models/Question');
const { DEFAULT_QUESTIONS } = require('./controllers/questionController');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Seed questions
const seedQuestions = async () => {
  try {
    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert new questions
    const questions = await Question.insertMany(DEFAULT_QUESTIONS);
    console.log(`Seeded ${questions.length} questions`);

    return questions;
  } catch (error) {
    console.error('Error seeding questions:', error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  await connectDB();

  const args = process.argv.slice(2);
  const action = args[0];

  try {
    if (action === '--delete') {
      await Question.deleteMany({});
      console.log('All questions deleted');
    } else {
      await seedQuestions();
      console.log('Database seeded successfully');
    }
  } catch (error) {
    console.error('Seeder error:', error);
  }

  // Disconnect
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

main();
