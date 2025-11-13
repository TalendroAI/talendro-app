# ✅ STRIPE CHECKOUT - QUICK IMPLEMENTATION CHECKLIST

Copy this checklist to track your progress!

---

## 🎯 PHASE 1: STRIPE SETUP (15 min)

### Account & Keys
- [ ] Created Stripe account at stripe.com
- [ ] Confirmed email
- [ ] In TEST MODE (toggle in dashboard)
- [ ] Copied Publishable Key (pk_test_...)
- [ ] Copied Secret Key (sk_test_...)

### Products & Pricing
- [ ] Created "Talendro Basic" product ($29/month)
  - Price ID: ________________
- [ ] Created "Talendro Pro" product ($49/month)
  - Price ID: ________________
- [ ] Created "Talendro Premium" product ($99/month)
  - Price ID: ________________

---

## 🎯 PHASE 2: CURSOR INTEGRATION (10 min)

### File Placement
- [ ] Copied `checkout.html` to `/client/public/checkout.html`
- [ ] Copied `stripe_routes.js` to `/server/routes/stripe.js`
- [ ] Copied `User_model.js` to `/server/models/User.js`
- [ ] Created `.env` file in `/server/` (from .env.example)

### Environment Variables
- [ ] Added STRIPE_SECRET_KEY to .env
- [ ] Added STRIPE_PUBLISHABLE_KEY to .env
- [ ] Added STRIPE_PRICE_ID_BASIC to .env
- [ ] Added STRIPE_PRICE_ID_PRO to .env
- [ ] Added STRIPE_PRICE_ID_PREMIUM to .env
- [ ] Added MONGODB_URI to .env

### Code Updates
- [ ] Updated Stripe key in `checkout.html` line 166
- [ ] Updated API_BASE_URL in `checkout.html` line 167 (if needed)
- [ ] Added Stripe routes to `server/index.js`:
  ```javascript
  const stripeRoutes = require('./routes/stripe');
  app.use('/api/stripe', stripeRoutes);
  ```

### Dependencies
- [ ] Ran `npm install stripe mongoose dotenv` in `/server`

---

## 🎯 PHASE 3: TESTING (5 min)

### Start Servers
- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] MongoDB running

### Test Flow
- [ ] Completed Steps 1-4 of onboarding
- [ ] Clicked "Proceed to Payment" → Landed on checkout page ✅
- [ ] Selected a plan (pricing cards work)
- [ ] Entered test card: 4242 4242 4242 4242
- [ ] Clicked "Start 7-Day Free Trial"
- [ ] Saw success message
- [ ] Verified user created in Stripe Dashboard
- [ ] Verified user created in MongoDB

---

## 🎯 PHASE 4: WEBHOOK SETUP (Optional - 5 min)

- [ ] Installed Stripe CLI
- [ ] Ran `stripe listen --forward-to localhost:5001/api/stripe/webhook`
- [ ] Copied webhook secret (whsec_...)
- [ ] Added STRIPE_WEBHOOK_SECRET to .env
- [ ] Tested webhook by creating test subscription

---

## 🎯 VERIFICATION CHECKLIST

### Stripe Dashboard Checks
- [ ] Go to https://dashboard.stripe.com/test/customers
- [ ] New customer appears with correct email
- [ ] Customer has payment method attached
- [ ] Subscription shows "Trialing" status
- [ ] Trial end date is 7 days from now

### Database Checks
```bash
# Run in terminal
mongo talendro
db.users.find().pretty()
```

- [ ] User exists in MongoDB
- [ ] subscriptionStatus = "trialing"
- [ ] plan = (selected plan)
- [ ] trialEndsAt = (7 days from now)
- [ ] stripeCustomerId exists
- [ ] stripeSubscriptionId exists
- [ ] onboardingData populated

### Frontend Checks
- [ ] checkout.html loads properly
- [ ] Pricing cards display correctly
- [ ] "Most Popular" badge on Pro plan
- [ ] Plan selection works (cards highlight)
- [ ] Stripe card element loads
- [ ] Card validation works (try invalid card)
- [ ] Success message appears after payment
- [ ] Redirects to /dashboard after 3 seconds

### Backend Checks
- [ ] POST /api/stripe/create-subscription works
- [ ] Returns subscriptionId and customerId
- [ ] Creates user in database
- [ ] Logs success message in console

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "No such price"
**Fix:** Copy correct Price ID from Stripe Dashboard → Products

### Issue: Stripe card element not loading
**Fix:** Check STRIPE_PUBLISHABLE_KEY in checkout.html line 166

### Issue: Payment succeeds but no user created
**Fix:** 
1. Check MongoDB is running
2. Check MONGODB_URI in .env
3. Check server console for errors

### Issue: 404 on /api/stripe/create-subscription
**Fix:** Make sure stripe.js is imported in server/index.js

### Issue: CORS error
**Fix:** Add to server/index.js:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📊 SUCCESS METRICS

After implementation, you should have:

✅ **Working checkout flow** (onboarding → payment → success)
✅ **7-day trial with card required**
✅ **Users created in Stripe**
✅ **Users created in MongoDB**
✅ **Webhooks handling events**
✅ **All 3 plans selectable**

---

## 🎯 READY FOR PRODUCTION?

Before going live, complete:

- [ ] Switch Stripe to LIVE mode
- [ ] Get live API keys
- [ ] Create live products/prices
- [ ] Set up production webhook endpoint
- [ ] Add SSL certificate (Stripe requires HTTPS)
- [ ] Test with real card (small amount)
- [ ] Set up email notifications
- [ ] Add terms of service acceptance
- [ ] Add privacy policy link
- [ ] Enable Stripe Radar (fraud prevention)

---

## 🚀 NEXT STEPS AFTER CHECKOUT WORKS

1. **Build Dashboard** 
   - User profile
   - Subscription management
   - Job search interface

2. **Add Authentication**
   - Login/logout
   - Password reset
   - Session management

3. **Job Search Engine**
   - API integrations
   - Matching algorithm
   - Auto-apply system

---

## 📞 NEED HELP?

**Check these resources:**
1. STRIPE_INTEGRATION_GUIDE.md (detailed guide)
2. Stripe Dashboard → Logs (see all API calls)
3. Browser Console (F12) for frontend errors
4. Server console for backend errors

**Test Cards:**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Auth Required: 4000 0025 0000 3155

---

**Estimated Time: 30 minutes total** ⏱️

**Let's get it done!** 🚀
