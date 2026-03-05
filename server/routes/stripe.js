/**
 * STRIPE SUBSCRIPTION ROUTES
 * Backend API for handling Stripe payments and subscriptions
 * 
 * Place this file in: /server/routes/stripe.js
 */

import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map Stripe plan keys to our User model enum values
const PLAN_MAP = { starter: 'basic', pro: 'pro', concierge: 'premium' };

// ============================================
// PRICING CONFIGURATION
// ============================================

const PLANS = {
    starter: {
        name: 'Starter',
        price: 49,
        priceId: process.env.STRIPE_PRICE_ID_STARTER_APPLY || 'price_1T6vTTCoFieNARvYAJmPCS4T',
        features: [
            '24/7 automated job search',
            'Up to 100 auto-applications/month',
            'AI resume tailoring for each job',
            '75%+ match threshold filtering',
            'Email & SMS job alerts',
            'Application tracking dashboard'
        ]
    },
    pro: {
        name: 'Pro',
        price: 99,
        priceId: process.env.STRIPE_PRICE_ID_PRO_APPLY || 'price_1T6vTTCoFieNARvY7qN7JUPE',
        features: [
            'Everything in Starter',
            'Unlimited auto-applications',
            'Real-time alerts (every 30 min)',
            'Priority apply — first to submit',
            'Advanced AI matching & scoring',
            'Interview prep resources',
            'Detailed analytics & insights'
        ]
    },
    concierge: {
        name: 'Concierge',
        price: 499,
        priceId: process.env.STRIPE_PRICE_ID_CONCIERGE_APPLY || 'price_1T6vTUCoFieNARvYWFtOpeeh',
        features: [
            'Everything in Pro',
            'Dedicated success manager',
            'Custom outreach to hiring managers',
            'Salary negotiation support',
            'LinkedIn profile optimization',
            'Weekly strategy calls',
            'Priority 24/7 support'
        ]
    }
};

// ============================================
// CUSTOMER LOOKUP (Sign-in)
// ============================================

/**
 * POST /api/stripe/lookup-customer
 * Look up a customer by email and return their subscription status.
 * Used by the sign-in page to route returning vs new users.
 */
router.post('/lookup-customer', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });

        const customers = await stripe.customers.list({ email: email.toLowerCase().trim(), limit: 1 });

        if (!customers.data.length) {
            return res.json({ customerExists: false, hasActiveSubscription: false });
        }

        const customer = customers.data[0];

        // Check for active subscriptions
        const subs = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            limit: 5
        });

        const activeSub = subs.data.find(s => s.status === 'active');

        if (!activeSub) {
            return res.json({ customerExists: true, hasActiveSubscription: false });
        }

        const planKey = activeSub.metadata?.plan || 'starter';

        return res.json({
            customerExists: true,
            hasActiveSubscription: true,
            customerId: customer.id,
            subscriptionId: activeSub.id,
            subscriptionStatus: activeSub.status,
            plan: planKey,
            planName: PLANS[planKey]?.name || planKey,
            guaranteeEnds: new Date(new Date(activeSub.created * 1000).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

    } catch (error) {
        console.error('Error looking up customer:', error);
        res.status(500).json({ success: false, message: 'Lookup failed' });
    }
});

// ============================================
// CREATE SUBSCRIPTION
// ============================================

/**
 * POST /api/stripe/create-subscription
 * Creates a new Stripe customer and subscription (immediate billing, 7-day money-back guarantee)
 */
router.post('/create-subscription', async (req, res) => {
    try {
        const { paymentMethodId, plan, priceId, email, name, onboardingData } = req.body;
        
        // Validate plan
        if (!PLANS[plan]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid plan selected' 
            });
        }
        
        const selectedPlan = PLANS[plan];
        // Allow frontend to pass priceId directly (e.g. after plan updates)
        const resolvedPriceId = priceId || selectedPlan.priceId;
        
        // Check if customer already exists in Stripe
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });
        if (existingCustomers.data.length > 0) {
            const existing = existingCustomers.data[0];
            const existingSubs = await stripe.subscriptions.list({ customer: existing.id, status: 'active', limit: 1 });
            if (existingSubs.data.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'An account with this email already exists' 
                });
            }
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
        
        // Create subscription (immediate billing — 7-day money-back guarantee policy)
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: resolvedPriceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                plan: plan,
                subscribedAt: new Date().toISOString()
            }
        });
        
        // Store onboarding data in Stripe customer metadata
        await stripe.customers.update(customer.id, {
            metadata: {
                plan,
                subscriptionStatus: 'active',
                onboardingData: JSON.stringify(onboardingData || {}).slice(0, 500)
            }
        });
        
        console.log(`✅ New subscriber: ${email} (${plan} plan)`);
        
        res.json({
            success: true,
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            customerId: customer.id
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
        case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object);
            break;

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

/**
 * checkout.session.completed
 * Fired when a Stripe Checkout Session payment is confirmed.
 * Syncs Stripe customer/subscription data back to MongoDB.
 * The user record may already exist (created on CreateAccount page) or not yet.
 */
async function handleCheckoutCompleted(session) {
    console.log(`\u2705 Checkout completed: session ${session.id}`);
    try {
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        if (!customerId) return;

        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email?.toLowerCase().trim();
        if (!email) return;

        let userPlan = 'pro';
        let subscriptionStatus = 'active';
        let currentPeriodEnd = null;

        if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const planKey = subscription.metadata?.plan || customer.metadata?.plan || 'pro';
            userPlan = PLAN_MAP[planKey] || 'pro';
            // Normalize status: treat 'trialing' as 'active' (no-trial policy)
            const rawStatus = subscription.status;
            subscriptionStatus = rawStatus === 'trialing' ? 'active' : rawStatus;
            if (subscription.current_period_end) currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }

        const update = {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId || 'pending',
            plan: userPlan,
            subscriptionStatus,
            updatedAt: new Date(),
        };
        if (currentPeriodEnd) update.currentPeriodEnd = currentPeriodEnd;

        const existing = await User.findOne({ email });
        if (existing) {
            await User.findOneAndUpdate({ email }, { $set: update });
            console.log(`\ud83d\udd04 Synced Stripe data to existing user: ${email}`);
        } else {
            // User hasn't set a password yet — create a placeholder record
            // They will complete registration on the CreateAccount page
            const placeholder = new User({
                email,
                name: customer.name || email.split('@')[0],
                passwordHash: 'PENDING_REGISTRATION',
                ...update,
                onboardingProgress: { step: 0, completedAt: null },
            });
            await placeholder.save();
            console.log(`\ud83c\udd95 Created placeholder user for: ${email} (awaiting password setup)`);
        }
    } catch (error) {
        console.error('Error handling checkout.session.completed:', error);
    }
}

async function handleTrialWillEnd(subscription) {
    // Talendro does not use free trials — immediate billing with 7-day money-back guarantee.
    // This event is a no-op but kept to avoid unhandled event errors from Stripe.
    console.log(`ℹ️  trial_will_end received for ${subscription.id} — no action taken (no-trial policy)`);
}

async function handleSubscriptionUpdated(subscription) {
    console.log(`\ud83d\udd04 Subscription updated: ${subscription.id} \u2014 status: ${subscription.status}`);
    try {
        const customer = await stripe.customers.retrieve(subscription.customer);
        const email = customer.email?.toLowerCase().trim();
        if (!email) return;
        const planKey = subscription.metadata?.plan || customer.metadata?.plan || 'pro';
        const userPlan = PLAN_MAP[planKey] || 'pro';
        const update = {
            plan: userPlan,
            subscriptionStatus: subscription.status,
            stripeSubscriptionId: subscription.id,
            updatedAt: new Date(),
        };
        if (subscription.cancel_at_period_end) update.subscriptionStatus = 'canceling';
        if (subscription.current_period_end) update.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        await User.findOneAndUpdate({ email }, { $set: update });
        console.log(`\u2705 Updated subscription status for ${email}: ${subscription.status}`);
    } catch (error) {
        console.error('Error handling subscription.updated:', error);
    }
}

async function handleSubscriptionDeleted(subscription) {
    console.log(`\u274c Subscription canceled: ${subscription.id}`);
    try {
        const customer = await stripe.customers.retrieve(subscription.customer);
        const email = customer.email?.toLowerCase().trim();
        if (!email) return;
        await User.findOneAndUpdate(
            { email },
            { $set: { subscriptionStatus: 'canceled', subscriptionEndedAt: new Date(), updatedAt: new Date() } }
        );
        console.log(`\u274c Marked subscription as canceled for: ${email}`);
    } catch (error) {
        console.error('Error handling subscription.deleted:', error);
    }
}

async function handlePaymentSucceeded(invoice) {
    console.log(`\ud83d\udcb0 Payment succeeded for invoice: ${invoice.id} \u2014 $${invoice.amount_paid / 100}`);
    try {
        if (!invoice.customer) return;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const email = customer.email?.toLowerCase().trim();
        if (!email) return;
        await User.findOneAndUpdate(
            { email },
            { $set: {
                subscriptionStatus: 'active',
                lastPaymentDate: new Date(),
                lastPaymentAmount: invoice.amount_paid / 100,
                updatedAt: new Date(),
            }}
        );
        console.log(`\u2705 Payment recorded for ${email}: $${invoice.amount_paid / 100}`);
    } catch (error) {
        console.error('Error handling invoice.payment_succeeded:', error);
    }
}

async function handlePaymentFailed(invoice) {
    console.log(`\u26a0\ufe0f Payment failed for invoice: ${invoice.id}`);
    try {
        if (!invoice.customer) return;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const email = customer.email?.toLowerCase().trim();
        if (!email) return;
        await User.findOneAndUpdate(
            { email },
            { $set: {
                subscriptionStatus: 'past_due',
                paymentFailedAt: new Date(),
                updatedAt: new Date(),
            }}
        );
        console.log(`\u26a0\ufe0f Marked payment_failed for ${email}`);
    } catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
    }
}

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================

/**
 * GET /api/stripe/subscription/:userId
 * Get current subscription status for a user
 */
router.get('/subscription/:customerId', async (req, res) => {
    try {
        const subs = await stripe.subscriptions.list({ customer: req.params.customerId, limit: 1 });
        if (!subs.data.length) {
            return res.status(404).json({ success: false, message: 'No subscription found' });
        }
        const subscription = subs.data[0];
        const planKey = subscription.metadata?.plan || 'starter';
        res.json({
            success: true,
            subscription: {
                status: subscription.status,
                plan: planKey,
                planName: PLANS[planKey]?.name || planKey,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            }
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
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
        const { subscriptionId } = req.body;
        if (!subscriptionId) return res.status(400).json({ success: false, message: 'subscriptionId required' });
        const subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
        res.json({
            success: true,
            message: 'Subscription will be canceled at period end',
            periodEnd: new Date(subscription.current_period_end * 1000)
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
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
        const { subscriptionId } = req.body;
        if (!subscriptionId) return res.status(400).json({ success: false, message: 'subscriptionId required' });
        await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
        res.json({ success: true, message: 'Subscription reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to reactivate subscription' });
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
        const { customerId, paymentMethodId } = req.body;
        if (!customerId || !paymentMethodId) return res.status(400).json({ success: false, message: 'customerId and paymentMethodId required' });
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
        await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
        res.json({ success: true, message: 'Payment method updated successfully' });
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ success: false, message: 'Failed to update payment method' });
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
        const { subscriptionId, newPlan } = req.body;
        if (!PLANS[newPlan]) return res.status(400).json({ success: false, message: 'Invalid plan' });
        if (!subscriptionId) return res.status(400).json({ success: false, message: 'subscriptionId required' });
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await stripe.subscriptions.update(subscriptionId, {
            items: [{ id: subscription.items.data[0].id, price: PLANS[newPlan].priceId }],
            proration_behavior: 'create_prorations',
        });
        res.json({ success: true, message: `Plan changed to ${PLANS[newPlan].name}`, newPlan });
    } catch (error) {
        console.error('Error changing plan:', error);
        res.status(500).json({ success: false, message: 'Failed to change plan' });
    }
});

// ============================================
// STRIPE CUSTOMER PORTAL
// ============================================

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe Customer Portal session so users can manage billing,
 * update payment methods, download invoices, or cancel.
 * Requires a valid JWT in the Authorization header.
 */
router.post('/create-portal-session', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const token = authHeader.split(' ')[1];

        let userId;
        try {
            const { default: jwt } = await import('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'talendro-secret-key');
            userId = decoded.userId;
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const user = await User.findById(userId).select('stripeCustomerId email');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (!user.stripeCustomerId) {
            return res.status(400).json({
                success: false,
                message: 'No billing account found. Please contact support@talendro.com.'
            });
        }

        const { returnUrl } = req.body;
        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: returnUrl || `${process.env.CLIENT_URL || 'https://talendro-app-1.onrender.com'}/app/billing`,
        });

        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ success: false, message: 'Failed to open billing portal. Please try again.' });
    }
});

export default router;
