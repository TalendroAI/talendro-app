/**
 * STRIPE SUBSCRIPTION ROUTES
 * Backend API for handling Stripe payments and subscriptions
 * 
 * Place this file in: /server/routes/stripe.js
 */

import express from 'express';
const router = express.Router();
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Import models (you'll create these next)
import User from '../models/User.js';

// ============================================
// PRICING CONFIGURATION
// ============================================

const PLANS = {
    basic: {
        name: 'Basic',
        price: 29,
        priceId: process.env.STRIPE_PRICE_ID_BASIC, // Stripe Price ID
        features: [
            'Daily job searches',
            '50 auto-applications/month',
            'AI-powered matching',
            'Resume auto-tailoring',
            'SMS + Email notifications',
            'Basic analytics'
        ]
    },
    pro: {
        name: 'Pro',
        price: 49,
        priceId: process.env.STRIPE_PRICE_ID_PRO,
        features: [
            'Hourly job searches',
            'Unlimited auto-applications',
            'Priority auto-apply',
            'Advanced AI matching',
            'Detailed analytics',
            'Everything in Basic'
        ]
    },
    premium: {
        name: 'Premium',
        price: 99,
        priceId: process.env.STRIPE_PRICE_ID_PREMIUM,
        features: [
            'Real-time alerts',
            'Dedicated success manager',
            'Interview preparation',
            'Salary negotiation support',
            'Priority support',
            'Everything in Pro'
        ]
    }
};

const TRIAL_DAYS = 7;

// ============================================
// CREATE SUBSCRIPTION
// ============================================

/**
 * POST /api/stripe/create-subscription
 * Creates a new Stripe customer and subscription with trial
 */
router.post('/create-subscription', async (req, res) => {
    try {
        const { paymentMethodId, plan, email, name, onboardingData } = req.body;
        
        // Validate plan
        if (!PLANS[plan]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid plan selected' 
            });
        }
        
        const selectedPlan = PLANS[plan];
        
        // Check if user already exists
        let user = await User.findOne({ email });
        
        if (user) {
            return res.status(400).json({ 
                success: false, 
                message: 'An account with this email already exists' 
            });
        }
        
        // Create Stripe customer
        const customer = await stripe.customers.create({
            email,
            name,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
            metadata: {
                plan: plan,
                onboardingCompleted: new Date().toISOString()
            }
        });
        
        // Create subscription with trial
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: selectedPlan.priceId }],
            trial_period_days: TRIAL_DAYS,
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                plan: plan,
                trialStart: new Date().toISOString()
            }
        });
        
        // Calculate trial end date
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
        
        // Get client secret from payment intent
        // If not in subscription response, retrieve invoice separately
        let clientSecret = null;
        if (subscription.latest_invoice) {
            const invoice = typeof subscription.latest_invoice === 'string' 
                ? await stripe.invoices.retrieve(subscription.latest_invoice, { expand: ['payment_intent'] })
                : subscription.latest_invoice;
            
            if (invoice.payment_intent) {
                const paymentIntent = typeof invoice.payment_intent === 'string'
                    ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
                    : invoice.payment_intent;
                if (paymentIntent && paymentIntent.client_secret) {
                    clientSecret = paymentIntent.client_secret;
                }
            }
        }
        
        if (!clientSecret) {
            console.log('⚠️ No payment intent found - creating setup intent for payment method collection');
            try {
                // Create a setup intent to collect payment method
                const setupIntent = await stripe.setupIntents.create({
                    customer: customer.id,
                    payment_method: paymentMethodId,
                });
                if (setupIntent && setupIntent.client_secret) {
                    clientSecret = setupIntent.client_secret;
                } else {
                    console.log('⚠️ Setup intent created but no client_secret returned');
                }
            } catch (setupError) {
                console.error('❌ Error creating setup intent:', setupError);
                // For trial subscriptions, we can proceed without client_secret
                // The payment method is already attached to the customer
            }
        }
        
        // Create user in database
        user = await User.create({
            email,
            name,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            plan: plan,
            subscriptionStatus: 'trialing',
            trialEndsAt: trialEnd,
            onboardingData: onboardingData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log(`✅ New user created: ${email} (${plan} plan, trial until ${trialEnd.toLocaleDateString()})`);
        
        res.json({
            success: true,
            subscriptionId: subscription.id,
            clientSecret: clientSecret,
            customerId: customer.id,
            userId: user._id,
            trialEnd: trialEnd
        });
        
    } catch (error) {
        console.error('❌ Subscription creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to create subscription' 
        });
    }
});

// ============================================
// STRIPE WEBHOOKS
// ============================================

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * 
 * IMPORTANT: This route should use raw body, not JSON parsed body
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log(`📥 Webhook received: ${event.type}`);
    
    // Handle the event
    switch (event.type) {
        case 'customer.subscription.trial_will_end':
            await handleTrialWillEnd(event.data.object);
            break;
            
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object);
            break;
            
        case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object);
            break;
            
        case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(event.data.object);
            break;
            
        case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
});

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handleTrialWillEnd(subscription) {
    console.log(`⏰ Trial ending soon for subscription: ${subscription.id}`);
    
    try {
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        
        if (user) {
            // Send email reminder about trial ending
            // TODO: Implement email service
            console.log(`📧 Should send trial ending reminder to: ${user.email}`);
            
            // Update user record
            user.trialEndingNotificationSent = true;
            await user.save();
        }
    } catch (error) {
        console.error('Error handling trial_will_end:', error);
    }
}

async function handleSubscriptionUpdated(subscription) {
    console.log(`🔄 Subscription updated: ${subscription.id}`);
    
    try {
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        
        if (user) {
            user.subscriptionStatus = subscription.status;
            
            // If trial just ended and now active, update trial end
            if (subscription.status === 'active' && user.subscriptionStatus === 'trialing') {
                user.trialEndsAt = null;
                console.log(`✅ Trial ended, subscription now active for: ${user.email}`);
            }
            
            await user.save();
        }
    } catch (error) {
        console.error('Error handling subscription.updated:', error);
    }
}

async function handleSubscriptionDeleted(subscription) {
    console.log(`❌ Subscription canceled: ${subscription.id}`);
    
    try {
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        
        if (user) {
            user.subscriptionStatus = 'canceled';
            user.subscriptionEndedAt = new Date();
            await user.save();
            
            console.log(`User subscription canceled: ${user.email}`);
        }
    } catch (error) {
        console.error('Error handling subscription.deleted:', error);
    }
}

async function handlePaymentSucceeded(invoice) {
    console.log(`💰 Payment succeeded for invoice: ${invoice.id}`);
    
    try {
        const user = await User.findOne({ stripeCustomerId: invoice.customer });
        
        if (user) {
            user.lastPaymentDate = new Date();
            user.lastPaymentAmount = invoice.amount_paid / 100; // Convert cents to dollars
            await user.save();
            
            console.log(`Payment recorded for: ${user.email} ($${invoice.amount_paid / 100})`);
        }
    } catch (error) {
        console.error('Error handling payment_succeeded:', error);
    }
}

async function handlePaymentFailed(invoice) {
    console.log(`⚠️ Payment failed for invoice: ${invoice.id}`);
    
    try {
        const user = await User.findOne({ stripeCustomerId: invoice.customer });
        
        if (user) {
            user.paymentFailedAt = new Date();
            user.subscriptionStatus = 'past_due';
            await user.save();
            
            // Send payment failed email
            console.log(`📧 Should send payment failed email to: ${user.email}`);
        }
    } catch (error) {
        console.error('Error handling payment_failed:', error);
    }
}

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================

/**
 * GET /api/stripe/subscription/:userId
 * Get current subscription status for a user
 */
router.get('/subscription/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Get latest subscription data from Stripe
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.json({
            success: true,
            subscription: {
                status: subscription.status,
                plan: user.plan,
                planName: PLANS[user.plan].name,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            }
        });
        
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch subscription' 
        });
    }
});

// ============================================
// CANCEL SUBSCRIPTION
// ============================================

/**
 * POST /api/stripe/cancel-subscription
 * Cancel a subscription (at period end)
 */
router.post('/cancel-subscription', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Cancel subscription at period end (don't cancel immediately)
        const subscription = await stripe.subscriptions.update(
            user.stripeSubscriptionId,
            { cancel_at_period_end: true }
        );
        
        user.subscriptionStatus = 'canceling';
        await user.save();
        
        res.json({
            success: true,
            message: 'Subscription will be canceled at period end',
            periodEnd: new Date(subscription.current_period_end * 1000)
        });
        
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to cancel subscription' 
        });
    }
});

// ============================================
// REACTIVATE SUBSCRIPTION
// ============================================

/**
 * POST /api/stripe/reactivate-subscription
 * Reactivate a canceled subscription
 */
router.post('/reactivate-subscription', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Reactivate subscription
        const subscription = await stripe.subscriptions.update(
            user.stripeSubscriptionId,
            { cancel_at_period_end: false }
        );
        
        user.subscriptionStatus = subscription.status;
        await user.save();
        
        res.json({
            success: true,
            message: 'Subscription reactivated successfully'
        });
        
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reactivate subscription' 
        });
    }
});

// ============================================
// UPDATE PAYMENT METHOD
// ============================================

/**
 * POST /api/stripe/update-payment-method
 * Update payment method for a customer
 */
router.post('/update-payment-method', async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: user.stripeCustomerId,
        });
        
        // Set as default payment method
        await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        
        res.json({
            success: true,
            message: 'Payment method updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update payment method' 
        });
    }
});

// ============================================
// UPGRADE/DOWNGRADE PLAN
// ============================================

/**
 * POST /api/stripe/change-plan
 * Upgrade or downgrade subscription plan
 */
router.post('/change-plan', async (req, res) => {
    try {
        const { userId, newPlan } = req.body;
        
        if (!PLANS[newPlan]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid plan' 
            });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Get current subscription
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // Update subscription item with new price
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
            items: [{
                id: subscription.items.data[0].id,
                price: PLANS[newPlan].priceId,
            }],
            proration_behavior: 'create_prorations', // Prorate the change
        });
        
        // Update user record
        user.plan = newPlan;
        await user.save();
        
        res.json({
            success: true,
            message: `Plan changed to ${PLANS[newPlan].name}`,
            newPlan: newPlan
        });
        
    } catch (error) {
        console.error('Error changing plan:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to change plan' 
        });
    }
});

// ============================================
// CUSTOMER PORTAL
// ============================================

// Create Stripe Customer Portal Session
router.post('/create-portal-session', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('❌ Error creating portal session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      customerId: customerId
    });
    res.status(500).json({ 
      error: 'Failed to create portal session',
      details: error.message 
    });
  }
});

export default router;
