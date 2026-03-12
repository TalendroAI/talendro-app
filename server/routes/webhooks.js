/**
 * webhooks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stripe webhook handler.
 *
 * Handles all Stripe lifecycle events and keeps the User model in sync.
 * Also dispatches SMS and email notifications for billing events.
 *
 * Events handled:
 *   - customer.subscription.trial_will_end  → SMS + email reminder
 *   - customer.subscription.updated         → Sync plan + status to User
 *   - invoice.payment_succeeded             → Sync status, email receipt
 *   - invoice.payment_failed                → Mark past_due, SMS + email alert
 *   - customer.subscription.deleted         → Downgrade plan, SMS + email confirm
 * ─────────────────────────────────────────────────────────────────────────────
 */
import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import smsService from '../services/smsService.js';

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PLAN_MAP = { starter: 'starter', pro: 'pro', concierge: 'concierge' };

// ─── Webhook Entry Point ──────────────────────────────────────────────────────
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    console.warn('[webhooks] Stripe not initialized — STRIPE_SECRET_KEY missing');
    return res.status(200).json({ received: true });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhooks] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[webhooks] Received: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object); break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object); break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object); break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object); break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object); break;
      default:
        console.log(`[webhooks] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error('[webhooks] Handler error:', error.message);
    res.json({ received: true, warning: 'Handler error logged for review' });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getUserByStripeCustomerId(customerId) {
  return User.findOne({ stripeCustomerId: customerId }) || null;
}

// ─── Trial Will End ───────────────────────────────────────────────────────────
async function handleTrialWillEnd(subscription) {
  try {
    const user = await getUserByStripeCustomerId(subscription.customer);
    if (!user) return;
    const daysLeft = Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
    const planName = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'your';

    if (user.phone) {
      await smsService.sendSms({
        to: user.phone,
        body: `Talendro: Your ${planName} plan trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Your subscription continues automatically. Questions? Reply HELP.`,
      }).catch(e => console.error('[webhooks] Trial SMS error:', e.message));
    }

    await emailService.sendEmail({
      to: user.email,
      subject: `Your Talendro trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      html: `<p>Hi ${user.name || 'there'},</p><p>Your Talendro <strong>${planName}</strong> plan trial ends in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>. Your subscription will continue automatically — no action needed.</p><p>Questions? Visit your <a href="https://talendro.com/app/billing">billing page</a> or reply to this email.</p><p>— The Talendro Team</p>`,
      text: `Your Talendro ${planName} trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Subscription continues automatically.`,
    }).catch(e => console.error('[webhooks] Trial email error:', e.message));

    console.log(`[webhooks] Trial ending notice sent to ${user.email}`);
  } catch (e) { console.error('[webhooks] handleTrialWillEnd error:', e.message); }
}

// ─── Subscription Updated ─────────────────────────────────────────────────────
async function handleSubscriptionUpdated(subscription) {
  try {
    const user = await getUserByStripeCustomerId(subscription.customer);
    if (!user) return;

    const planKey = subscription.metadata?.plan || user.plan || 'starter';
    const resolvedPlan = PLAN_MAP[planKey] || 'starter';

    const updates = {
      plan: resolvedPlan,
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
    };
    if (subscription.current_period_end) {
      updates.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }

    await User.findByIdAndUpdate(user._id, updates);
    console.log(`[webhooks] User ${user.email} synced — plan: ${resolvedPlan}, status: ${subscription.status}`);
  } catch (e) { console.error('[webhooks] handleSubscriptionUpdated error:', e.message); }
}

// ─── Payment Succeeded ────────────────────────────────────────────────────────
async function handlePaymentSucceeded(invoice) {
  try {
    const user = await getUserByStripeCustomerId(invoice.customer);
    if (!user) return;

    await User.findByIdAndUpdate(user._id, { subscriptionStatus: 'active' });

    if (!invoice.amount_paid || invoice.amount_paid === 0) return; // Skip $0 invoices

    const amount = `$${(invoice.amount_paid / 100).toFixed(2)}`;
    const planName = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Talendro';
    const periodEnd = invoice.period_end
      ? new Date(invoice.period_end * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'next billing date';

    await emailService.sendEmail({
      to: user.email,
      subject: `Payment receipt — ${amount} for Talendro ${planName}`,
      html: `<p>Hi ${user.name || 'there'},</p><p>We received your payment of <strong>${amount}</strong> for Talendro <strong>${planName}</strong>. Your subscription is active through <strong>${periodEnd}</strong>.</p>${invoice.hosted_invoice_url ? `<p><a href="${invoice.hosted_invoice_url}">View or download your invoice →</a></p>` : ''}<p>Thank you for being a Talendro member.</p><p>— The Talendro Team</p>`,
      text: `Payment of ${amount} received for Talendro ${planName}. Active through ${periodEnd}.`,
    }).catch(e => console.error('[webhooks] Receipt email error:', e.message));

    console.log(`[webhooks] Receipt sent to ${user.email} for ${amount}`);
  } catch (e) { console.error('[webhooks] handlePaymentSucceeded error:', e.message); }
}

// ─── Payment Failed ───────────────────────────────────────────────────────────
async function handlePaymentFailed(invoice) {
  try {
    const user = await getUserByStripeCustomerId(invoice.customer);
    if (!user) return;

    await User.findByIdAndUpdate(user._id, { subscriptionStatus: 'past_due' });

    const planName = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Talendro';
    const amount = invoice.amount_due ? ` of $${(invoice.amount_due / 100).toFixed(2)}` : '';

    if (user.phone) {
      await smsService.sendSms({
        to: user.phone,
        body: `Talendro: We couldn't process your ${planName} payment${amount}. Update your payment method at talendro.com/app/billing to keep your job search running. Reply HELP for support.`,
      }).catch(e => console.error('[webhooks] Payment failed SMS error:', e.message));
    }

    await emailService.sendEmail({
      to: user.email,
      subject: `Action required — payment failed for Talendro ${planName}`,
      html: `<p>Hi ${user.name || 'there'},</p><p>We were unable to process your Talendro <strong>${planName}</strong> payment${amount}. Your job search is currently paused.</p><p><strong><a href="https://talendro.com/app/billing">Update your payment method →</a></strong></p><p>Stripe will automatically retry. If the retry succeeds, your subscription resumes immediately. Need help? Reply to this email.</p><p>— The Talendro Team</p>`,
      text: `Payment failed for Talendro ${planName}. Update your payment method at talendro.com/app/billing.`,
    }).catch(e => console.error('[webhooks] Payment failed email error:', e.message));

    console.log(`[webhooks] Payment failed alert sent to ${user.email}`);
  } catch (e) { console.error('[webhooks] handlePaymentFailed error:', e.message); }
}

// ─── Subscription Deleted (Canceled) ─────────────────────────────────────────
async function handleSubscriptionDeleted(subscription) {
  try {
    const user = await getUserByStripeCustomerId(subscription.customer);
    if (!user) return;

    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'canceled',
      plan: 'starter',
    });

    const planName = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Talendro';

    if (user.phone) {
      await smsService.sendSms({
        to: user.phone,
        body: `Talendro: Your ${planName} subscription has been canceled. Your history and documents are saved. Reactivate anytime at talendro.com/app/billing.`,
      }).catch(e => console.error('[webhooks] Cancellation SMS error:', e.message));
    }

    await emailService.sendEmail({
      to: user.email,
      subject: `Your Talendro ${planName} subscription has been canceled`,
      html: `<p>Hi ${user.name || 'there'},</p><p>Your Talendro <strong>${planName}</strong> subscription has been canceled. Your account, application history, and documents are saved.</p><p>Whenever you're ready to restart your job search, <a href="https://talendro.com/app/billing">reactivate your subscription</a> in seconds.</p><p>If there's anything we could have done better, we'd genuinely like to know — just reply to this email.</p><p>— The Talendro Team</p>`,
      text: `Your Talendro ${planName} subscription has been canceled. History saved. Reactivate anytime at talendro.com/app/billing.`,
    }).catch(e => console.error('[webhooks] Cancellation email error:', e.message));

    console.log(`[webhooks] Cancellation confirmation sent to ${user.email}`);
  } catch (e) { console.error('[webhooks] handleSubscriptionDeleted error:', e.message); }
}

export default router;
