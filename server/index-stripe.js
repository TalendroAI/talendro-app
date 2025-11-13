/**
 * TALENDRO BACKEND SERVER
 * Updated with Stripe integration
 * 
 * This is your COMPLETE server/index.js file with Stripe routes added
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ============================================
// MIDDLEWARE - ORDER MATTERS!
// ============================================

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// ⚠️ IMPORTANT: Webhook route MUST come before express.json()
// Stripe webhooks need raw body for signature verification
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Parse JSON bodies for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// DATABASE CONNECTION
// ============================================

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talendro', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Import route modules
const aiRoutes = require('./routes/ai');
const jobRoutes = require('./routes/jobs');
const stripeRoutes = require('./routes/stripe'); // ← NEW!

// Use routes
app.use('/api/ai', aiRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/stripe', stripeRoutes); // ← NEW!

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║                                        ║
║         🚀 TALENDRO SERVER             ║
║                                        ║
║  Status: Running                       ║
║  Port: ${PORT}                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Database: Connected                   ║
║                                        ║
║  API Endpoints:                        ║
║  - http://localhost:${PORT}/health       ║
║  - http://localhost:${PORT}/api/ai       ║
║  - http://localhost:${PORT}/api/jobs     ║
║  - http://localhost:${PORT}/api/stripe   ║
║                                        ║
╚════════════════════════════════════════╝
    `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, closing server gracefully...');
    
    mongoose.connection.close(() => {
        console.log('📊 MongoDB connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, closing server gracefully...');
    
    mongoose.connection.close(() => {
        console.log('📊 MongoDB connection closed');
        process.exit(0);
    });
});

module.exports = app;
