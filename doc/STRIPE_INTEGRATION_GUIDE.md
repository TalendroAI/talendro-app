# 🚀 STRIPE CHECKOUT INTEGRATION GUIDE

## 📦 What You Have

1. ✅ **checkout.html** - Complete Talendro-branded checkout page
2. ✅ **stripe_routes.js** - Backend API routes for subscriptions
3. ✅ **User_model.js** - MongoDB user schema with subscription fields
4. ✅ **.env.example** - Environment variables template

---

## 🎯 Quick Setup (30 Minutes)

### STEP 1: Create Stripe Account (5 min)

1. Go to https://stripe.com
2. Click "Sign up"
3. Enter business details (can use test mode for now)
4. Verify email
5. You're ready!

---

### STEP 2: Get Stripe Keys (3 min)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)
4. Save these for Step 4

**⚠️ IMPORTANT:** Start in **TEST MODE** (toggle in top right)

---

### STEP 3: Create Stripe Products & Prices (10 min)

You need to create 3 subscription products in Stripe:

#### Create Basic Plan:
1. Go to https://dashboard.stripe.com/test/products
2. Click "+ Add product"
3. Enter:
   - **Name:** Talendro Basic
   - **Description:** Daily job searches, 50 applications/month
   - **Pricing Model:** Standard pricing
   - **Price:** $29.00
   - **Billing period:** Monthly
   - **Currency:** USD
4. Click "Save product"
5. **Copy the Price ID** (starts with `price_`) - You'll need this!

#### Create Pro Plan:
1. Click "+ Add product" again
2. Enter:
   - **Name:** Talendro Pro
   - **Description:** Hourly searches, unlimited applications
   - **Price:** $49.00
   - **Billing period:** Monthly
3. Click "Save product"
4. **Copy the Price ID**

#### Create Premium Plan:
1. Click "+ Add product" again
2. Enter:
   - **Name:** Talendro Premium
   - **Description:** Real-time alerts, dedicated success manager
   - **Price:** $99.00
   - **Billing period:** Monthly
3. Click "Save product"
4. **Copy the Price ID**

---

### STEP 4: Configure Environment Variables (5 min)

In your `/server/.env` file, add:

```env
# Stripe Keys (from Step 2)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Stripe Price IDs (from Step 3)
STRIPE_PRICE_ID_BASIC=price_YOUR_BASIC_PRICE_ID_HERE
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID_HERE
STRIPE_PRICE_ID_PREMIUM=price_YOUR_PREMIUM_PRICE_ID_HERE

# MongoDB
MONGODB_URI=mongodb://localhost:27017/talendro

# Server
PORT=5001
FRONTEND_URL=http://localhost:3000

# JWT (generate random string)
JWT_SECRET=your_random_secret_key_here
```

---

### STEP 5: Install Dependencies (2 min)

In your `/server` directory:

```bash
npm install stripe mongoose dotenv express cors
```

---

### STEP 6: Add Files to Cursor Project (5 min)

#### A. Add checkout.html
```
Place in: /client/public/checkout.html
```

**Update the Stripe key in checkout.html (line 166):**
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
```

#### B. Add Stripe routes
```
Place in: /server/routes/stripe.js
```

#### C. Add User model
```
Place in: /server/models/User.js
```

#### D. Update server/index.js

Add these lines to your existing `server/index.js`:

```javascript
// Import Stripe routes
const stripeRoutes = require('./routes/stripe');

// Use Stripe routes
app.use('/api/stripe', stripeRoutes);

// IMPORTANT: Webhook route needs raw body
// Add this BEFORE your express.json() middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
```

---

### STEP 7: Set Up Webhook (Optional but Recommended) (5 min)

Webhooks let Stripe notify your server about events (trial ending, payment failed, etc.)

#### For Development (using Stripe CLI):

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:5001/api/stripe/webhook`
3. Copy the webhook signing secret (starts with `whsec_`)
4. Add to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

#### For Production (later):

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Events to listen for:
   - `customer.subscription.trial_will_end`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret to `.env`

---

## 🧪 Testing

### Test the Complete Flow:

1. **Start your servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   cd client
   npm start
   ```

2. **Complete onboarding:**
   - Go through Steps 1-4
   - Click "Proceed to Payment & Activate" on Step 4

3. **Test checkout:**
   - You'll land on the checkout page
   - Select a plan (try Pro)
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
   - Click "Start 7-Day Free Trial"

4. **Verify in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/test/customers
   - You should see a new customer
   - Click on customer → should see subscription with "Trialing" status

5. **Verify in Database:**
   ```bash
   # Open MongoDB shell
   mongo talendro
   
   # Find the user
   db.users.find().pretty()
   
   # Should see user with:
   # - subscriptionStatus: "trialing"
   # - plan: "pro"
   # - trialEndsAt: (7 days from now)
   ```

---

## 🧪 Stripe Test Cards

Use these cards to test different scenarios:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0341 | Declined (lost card) |

More test cards: https://stripe.com/docs/testing

---

## 🔄 User Flow Diagram

```
Step 4 Complete
       ↓
[Proceed to Payment] button
       ↓
   checkout.html
       ↓
Select Plan (Basic/Pro/Premium)
       ↓
Enter Payment Info (Stripe Elements)
       ↓
[Start 7-Day Free Trial] button
       ↓
Frontend: Creates payment method via Stripe.js
       ↓
Backend: POST /api/stripe/create-subscription
       ↓
Backend: Creates Stripe customer & subscription
       ↓
Backend: Saves user to MongoDB
       ↓
Frontend: Shows success message
       ↓
Redirects to /dashboard (after 3 seconds)
       ↓
[User can now log in and use Talendro!]
```

---

## 📊 What Happens During Trial?

**Days 1-7:**
- User has FULL access to all plan features
- No charges to credit card
- Can cancel anytime (no charge)
- Can use job search, applications, etc.

**Day 5:**
- Webhook: `customer.subscription.trial_will_end`
- Email sent: "Your trial ends in 2 days"

**Day 7 (Trial End):**
- Stripe automatically charges the card
- Subscription status: `trialing` → `active`
- Webhook: `customer.subscription.updated`
- Webhook: `invoice.payment_succeeded`
- User continues with paid subscription

**If Payment Fails:**
- Webhook: `invoice.payment_failed`
- Email sent: "Payment failed, please update card"
- Subscription status: → `past_due`
- Stripe retries payment (smart retries enabled)

---

## 🎯 Subscription Lifecycle

```
Registration → Trialing (7 days) → Active (paying)
                    ↓                      ↓
              Cancel Early          Cancel/Payment Fails
                    ↓                      ↓
            No Charge Ever              Canceled
```

---

## 🛠️ Available API Endpoints

Your backend now supports:

### Create Subscription
```javascript
POST /api/stripe/create-subscription
Body: {
  paymentMethodId: "pm_xxx",
  plan: "pro",
  email: "user@example.com",
  name: "John Doe",
  onboardingData: {...}
}
```

### Get Subscription Status
```javascript
GET /api/stripe/subscription/:userId
Response: {
  status: "trialing",
  plan: "pro",
  trialEnd: "2025-11-14T00:00:00Z"
}
```

### Cancel Subscription
```javascript
POST /api/stripe/cancel-subscription
Body: { userId: "xxx" }
```

### Reactivate Subscription
```javascript
POST /api/stripe/reactivate-subscription
Body: { userId: "xxx" }
```

### Change Plan
```javascript
POST /api/stripe/change-plan
Body: { userId: "xxx", newPlan: "premium" }
```

### Update Payment Method
```javascript
POST /api/stripe/update-payment-method
Body: { userId: "xxx", paymentMethodId: "pm_xxx" }
```

---

## 📧 Email Notifications (To Add Later)

You'll want to send emails for:
- ✅ Trial started (welcome email)
- ⏰ Trial ending in 2 days
- 💰 First payment successful
- ⚠️ Payment failed
- ❌ Subscription canceled
- 🎉 Subscription reactivated

We'll add SendGrid integration for this in the next phase.

---

## 🔒 Security Best Practices

### Current (Development):
✅ Stripe keys in `.env` (gitignored)
✅ HTTPS required by Stripe (in production)
✅ Webhook signature verification
✅ Payment methods attached securely

### For Production:
- [ ] Move sensitive keys to environment variables
- [ ] Enable Stripe webhook signature verification
- [ ] Add rate limiting on payment endpoints
- [ ] Add CAPTCHA on signup
- [ ] Monitor for fraudulent signups
- [ ] Set up Stripe Radar (fraud detection)

---

## 🐛 Troubleshooting

### Issue: "No such price: price_xxx"
**Fix:** Make sure you copied the correct Price ID from Stripe Dashboard

### Issue: "Invalid API Key"
**Fix:** Check your `.env` file has correct `STRIPE_SECRET_KEY`

### Issue: Webhook not working
**Fix:** 
1. Make sure Stripe CLI is running: `stripe listen --forward-to localhost:5001/api/stripe/webhook`
2. Check webhook secret in `.env`

### Issue: Payment succeeds but user not created
**Fix:** 
1. Check MongoDB is running: `mongod`
2. Check database connection in server logs
3. Verify User model is imported correctly

### Issue: "Cannot read property 'id' of undefined"
**Fix:** Make sure payment method was created successfully before calling backend

---

## 📈 Monitoring & Analytics

### Track These Metrics:

**Conversion:**
- Onboarding completion rate
- Plan selection (Basic vs Pro vs Premium)
- Payment success rate
- Trial to paid conversion rate

**Retention:**
- Trial cancellation rate
- Monthly churn rate
- Failed payment recovery rate

**Revenue:**
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)

### View in Stripe Dashboard:
- https://dashboard.stripe.com/test/dashboard
- Subscriptions: https://dashboard.stripe.com/test/subscriptions
- Customers: https://dashboard.stripe.com/test/customers
- Revenue: https://dashboard.stripe.com/test/revenue

---

## 🎉 You're Done!

After completing this setup:

✅ Users can complete onboarding (Steps 1-4)
✅ Users can select a plan and subscribe
✅ 7-day free trial with card required
✅ Automatic billing after trial
✅ Subscription management (cancel, reactivate, change plan)
✅ Webhook handling for Stripe events
✅ User data stored in MongoDB

---

## 🚀 Next Steps

After payment system is working:

1. **Add Authentication** (Task #1 from roadmap)
   - Login/logout
   - JWT tokens
   - Password reset
   - Session management

2. **Build Dashboard** 
   - Job search results
   - Application tracking
   - Analytics
   - Profile management

3. **Add Job Search Engine**
   - Indeed API integration
   - LinkedIn scraper
   - Boolean search implementation
   - Job matching algorithm

4. **Add Application Automation**
   - Form filling engine
   - Resume customization
   - Application submission
   - Status tracking

---

## 💡 Pro Tips

1. **Always test in Stripe test mode first**
2. **Use webhook events, don't poll**
3. **Handle failed payments gracefully**
4. **Give users 3-7 days to fix payment issues**
5. **Send reminder emails before trial ends**
6. **Make cancellation easy (reduces chargebacks)**
7. **Monitor Stripe Dashboard daily during beta**

---

## 📞 Support

**Stripe Documentation:**
- Getting Started: https://stripe.com/docs
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks

**Stripe Support:**
- Email: support@stripe.com
- Dashboard: https://dashboard.stripe.com/support

---

**Ready to test? Follow the steps above and you'll have payments working in 30 minutes!** 🎯
