import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook endpoint - MUST use raw body
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
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

  try {
    switch (event.type) {
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
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

async function handleTrialWillEnd(subscription) {
  console.log('🔔 Trial will end soon:', subscription.id);
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    console.log(`📧 TODO: Send trial ending email to ${customer.email}`);
  } catch (e) { console.error('handleTrialWillEnd error:', e.message); }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id, '— status:', subscription.status);
  // Status tracked in Stripe; no local DB needed
}

async function handlePaymentSucceeded(invoice) {
  console.log('💳 Payment succeeded:', invoice.id);
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    console.log(`✅ Payment successful for ${customer.email}`);
    console.log(`📧 TODO: Send payment receipt to ${customer.email}`);
  } catch (e) { console.error('handlePaymentSucceeded error:', e.message); }
}

async function handlePaymentFailed(invoice) {
  console.log('❌ Payment failed:', invoice.id);
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    console.log(`⚠️ Payment failed for ${customer.email}`);
    console.log(`📧 TODO: Send payment failed email to ${customer.email}`);
  } catch (e) { console.error('handlePaymentFailed error:', e.message); }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('🚫 Subscription canceled:', subscription.id);
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    console.log(`❌ Subscription canceled for ${customer.email}`);
    console.log(`📧 TODO: Send cancellation confirmation to ${customer.email}`);
  } catch (e) { console.error('handleSubscriptionDeleted error:', e.message); }
}

export default router;
