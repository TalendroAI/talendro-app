import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talendro';
const TEST_EMAIL = 'kg.jackson@talendro.com';
const TEST_PASSWORD = 'password123';

async function setTestPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log('✅ Password hashed');

    // Update user
    const result = await User.updateOne(
      { email: TEST_EMAIL },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ User not found:', TEST_EMAIL);
    } else if (result.modifiedCount === 0) {
      console.log('⚠️  User found but password was not updated (may already be set)');
    } else {
      console.log('✅ Password updated successfully!');
    }

    // Verify the update
    const user = await User.findOne({ email: TEST_EMAIL }).select('+password');
    if (user && user.password) {
      const isMatch = await bcrypt.compare(TEST_PASSWORD, user.password);
      console.log('✅ Password verification:', isMatch ? 'PASSED' : 'FAILED');
      console.log('\n📋 Test Credentials:');
      console.log('   Email:', TEST_EMAIL);
      console.log('   Password:', TEST_PASSWORD);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setTestPassword();




