import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    plan: { type: String, enum: ['basic', 'pro', 'premium'], required: true },
    subscriptionStatus: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function createUser() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');
    
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    
    const user = await User.create({
        email: 'kgregjackson@gmail.com',
        name: 'Greg Jackson',
        password: hashedPassword,
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
        plan: 'pro',
        subscriptionStatus: 'active'
    });
    
    console.log('✅ User created:', user.email);
    console.log('Email: kgregjackson@gmail.com');
    console.log('Password: TestPassword123!');
    process.exit(0);
}

createUser().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
