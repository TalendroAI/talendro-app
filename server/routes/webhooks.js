import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook endpoint - MUST use raw body
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook received:', event.type);

  // Handle the event
  try {
    switch (event.type) {
      
      // Trial will end in 3 days
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      // Subscription updated (trial → active, plan changes)
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      // Payment succeeded
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      // Payment failed
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      // Subscription deleted/canceled
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// ============================================
// WEBHOOK HANDLERS
// ============================================

// Trial ending in 3 days
async function handleTrialWillEnd(subscription) {
  console.log('🔔 Trial will end soon:', subscription.id);
  
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  
  if (user) {
    console.log(`📧 TODO: Send trial ending email to ${user.email}`);
    // TODO: Send email notification
    // For now, just log it
  }
}

// Subscription updated
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  
  if (user) {
    // Update user subscription status
    user.subscriptionStatus = subscription.status;
    
    // If trial just ended and now active
    if (subscription.status === 'active' && user.subscriptionStatus === 'trialing') {
      console.log(`✅ User ${user.email} converted from trial to active`);
    }
    
    await user.save();
    console.log(`Updated user ${user.email} status to: ${subscription.status}`);
  }
}

// Payment succeeded
async function handlePaymentSucceeded(invoice) {
  console.log('💳 Payment succeeded:', invoice.id);
  
  const user = await User.findOne({ stripeCustomerId: invoice.customer });
  
  if (user) {
    // Update subscription status to active
    user.subscriptionStatus = 'active';
    await user.save();
    
    console.log(`✅ Payment successful for ${user.email}`);
    console.log(`📧 TODO: Send payment receipt to ${user.email}`);
    // TODO: Send payment receipt email
  }
}

// Payment failed
async function handlePaymentFailed(invoice) {
  console.log('❌ Payment failed:', invoice.id);
  
  const user = await User.findOne({ stripeCustomerId: invoice.customer });
  
  if (user) {
    // Update subscription status
    user.subscriptionStatus = 'past_due';
    await user.save();
    
    console.log(`⚠️ Payment failed for ${user.email}`);
    console.log(`📧 TODO: Send payment failed email to ${user.email}`);
    // TODO: Send payment failed email with retry instructions
  }
}

// Subscription canceled
async function handleSubscriptionDeleted(subscription) {
  console.log('🚫 Subscription canceled:', subscription.id);
  
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  
  if (user) {
    // Update user status
    user.subscriptionStatus = 'canceled';
    await user.save();
    
    console.log(`❌ Subscription canceled for ${user.email}`);
    console.log(`📧 TODO: Send cancellation confirmation to ${user.email}`);
    // TODO: Send cancellation confirmation email
  }
}

export default router;
