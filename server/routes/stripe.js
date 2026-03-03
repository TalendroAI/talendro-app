/**
 * STRIPE SUBSCRIPTION ROUTES
 * Backend API for handling Stripe payments and subscriptions
 * 
 * Place this file in: /server/routes/stripe.js
 */

import express from 'express';
import Stripe from 'stripe';
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
            const trialSubs = await stripe.subscriptions.list({ customer: existing.id, status: 'trialing', limit: 1 });
            if (existingSubs.data.length > 0 || trialSubs.data.length > 0) {
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
        
        // Create subscription with trial
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: resolvedPriceId }],
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
        
        // Store onboarding data in Stripe customer metadata
        await stripe.customers.update(customer.id, {
            metadata: {
                plan,
                subscriptionStatus: 'trialing',
                trialEndsAt: trialEnd.toISOString(),
                onboardingData: JSON.stringify(onboardingData || {}).slice(0, 500)
            }
        });
        
        console.log(`✅ New subscriber: ${email} (${plan} plan, trial until ${trialEnd.toLocaleDateString()})`);
        
        res.json({
            success: true,
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            customerId: customer.id,
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
        const customer = await stripe.customers.retrieve(subscription.customer);
        console.log(`📧 Should send trial ending reminder to: ${customer.email}`);
        // TODO: Implement email service
    } catch (error) {
        console.error('Error handling trial_will_end:', error);
    }
}

async function handleSubscriptionUpdated(subscription) {
    console.log(`🔄 Subscription updated: ${subscription.id} — status: ${subscription.status}`);
    // Status tracked in Stripe; no local DB update needed
}

async function handleSubscriptionDeleted(subscription) {
    console.log(`❌ Subscription canceled: ${subscription.id}`);
    try {
        const customer = await stripe.customers.retrieve(subscription.customer);
        console.log(`Subscription canceled for: ${customer.email}`);
        // TODO: Send cancellation email
    } catch (error) {
        console.error('Error handling subscription.deleted:', error);
    }
}

async function handlePaymentSucceeded(invoice) {
    console.log(`💰 Payment succeeded for invoice: ${invoice.id} — $${invoice.amount_paid / 100}`);
    // Payment data available in Stripe dashboard; no local DB needed
}

async function handlePaymentFailed(invoice) {
    console.log(`⚠️ Payment failed for invoice: ${invoice.id}`);
    try {
        const customer = await stripe.customers.retrieve(invoice.customer);
        console.log(`📧 Should send payment failed email to: ${customer.email}`);
        // TODO: Implement payment failed email
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

export default router;
