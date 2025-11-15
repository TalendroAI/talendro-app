import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talendro';

// Get email and password from command line arguments
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

if (!email || !password) {
  console.error('❌ Usage: node set-user-password.js <email> <password>');
  console.error('   Example: node set-user-password.js user@example.com MySecurePassword123!');
  process.exit(1);
}

async function setUserPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Validate password strength (minimum 12 characters)
    if (password.length < 12) {
      console.error('❌ Password must be at least 12 characters long');
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Update user
    const result = await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ User not found:', email);
      process.exit(1);
    } else if (result.modifiedCount === 0) {
      console.log('⚠️  User found but password was not updated (may already be set)');
    } else {
      console.log('✅ Password updated successfully!');
    }

    // Verify the update
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (user && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('✅ Password verification:', isMatch ? 'PASSED' : 'FAILED');
      console.log('\n📋 Login Credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setUserPassword();

