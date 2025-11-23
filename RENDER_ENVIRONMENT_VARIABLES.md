# 🔐 Render Environment Variables Guide

**Complete list of environment variables needed for Talendro on Render**

---

## 📋 REQUIRED ENVIRONMENT VARIABLES

These variables **MUST** be set in Render for your app to work:

### 1. NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Purpose**: Sets Node.js to production mode
- **Location**: Render → Environment → Add Variable

---

### 2. MONGODB_URI
- **Key**: `MONGODB_URI`
- **Value**: `mongodb+srv://username:password@cluster.mongodb.net/talendro?retryWrites=true&w=majority`
- **Purpose**: MongoDB database connection string
- **How to get**:
  1. Go to MongoDB Atlas: https://cloud.mongodb.com
  2. Navigate to your cluster
  3. Click "Connect"
  4. Choose "Connect your application"
  5. Copy the connection string
  6. Replace `<password>` with your database password
- **⚠️ Important**: Keep this secret! Never commit to GitHub.

---

### 3. JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: A secure random string (minimum 32 characters)
- **Purpose**: Secret key for JWT token signing/verification
- **How to generate**:
  ```bash
  openssl rand -base64 32
  ```
  - Copy the output and use as value
- **⚠️ Critical**: Must be set for authentication to work
- **⚠️ Important**: Use a different secret for production vs development

---

### 4. ANTHROPIC_API_KEY
- **Key**: `ANTHROPIC_API_KEY`
- **Value**: `sk-ant-...` (your Anthropic API key)
- **Purpose**: API key for Claude AI (resume parsing)
- **How to get**:
  1. Go to Anthropic Console: https://console.anthropic.com
  2. Navigate to API Keys
  3. Create a new key or copy existing one
  4. Key starts with `sk-ant-`
- **⚠️ Important**: Keep this secret! Never commit to GitHub.

---

### 5. STRIPE_SECRET_KEY
- **Key**: `STRIPE_SECRET_KEY`
- **Value**: `sk_live_...` (production) or `sk_test_...` (testing)
- **Purpose**: Stripe API secret key for payment processing
- **How to get**:
  1. Go to Stripe Dashboard: https://dashboard.stripe.com
  2. Navigate to Developers → API keys
  3. Copy "Secret key" (use "Publishable key" for frontend)
  4. Use `sk_live_...` for production, `sk_test_...` for testing
- **⚠️ Important**: Keep this secret! Never commit to GitHub.

---

### 6. STRIPE_PRICE_ID_BASIC
- **Key**: `STRIPE_PRICE_ID_BASIC`
- **Value**: `price_...` (your Stripe Price ID)
- **Purpose**: Stripe Price ID for Basic subscription plan
- **How to get**:
  1. Go to Stripe Dashboard: https://dashboard.stripe.com
  2. Navigate to Products → Pricing
  3. Find your Basic plan product
  4. Click on the price
  5. Copy the Price ID (starts with `price_`)

---

### 7. STRIPE_PRICE_ID_PRO
- **Key**: `STRIPE_PRICE_ID_PRO`
- **Value**: `price_...` (your Stripe Price ID)
- **Purpose**: Stripe Price ID for Pro subscription plan
- **How to get**: Same as STRIPE_PRICE_ID_BASIC, but for Pro plan

---

### 8. STRIPE_PRICE_ID_PREMIUM
- **Key**: `STRIPE_PRICE_ID_PREMIUM`
- **Value**: `price_...` (your Stripe Price ID)
- **Purpose**: Stripe Price ID for Premium subscription plan
- **How to get**: Same as STRIPE_PRICE_ID_BASIC, but for Premium plan

---

### 9. STRIPE_WEBHOOK_SECRET
- **Key**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_...` (your Stripe webhook signing secret)
- **Purpose**: Stripe webhook signing secret for verifying webhook requests
- **How to get**:
  1. Go to Stripe Dashboard: https://dashboard.stripe.com
  2. Navigate to Developers → Webhooks
  3. Click on your webhook endpoint (or create one)
  4. Find "Signing secret"
  5. Click "Reveal" and copy the secret
  6. Secret starts with `whsec_`
- **⚠️ Important**: 
  - Webhook URL should be: `https://your-app.onrender.com/api/webhooks/stripe`
  - Or with custom domain: `https://talendro.com/api/webhooks/stripe`
  - Update webhook endpoint in Stripe after deploying to Render

---

## 📋 OPTIONAL ENVIRONMENT VARIABLES

These variables are optional but recommended:

### 10. FRONTEND_URL
- **Key**: `FRONTEND_URL`
- **Value**: `https://talendro.com` (or your Render URL)
- **Purpose**: Used for CORS configuration
- **Default**: Not set (CORS allows Render domains automatically)

---

### 11. DOMAIN
- **Key**: `DOMAIN`
- **Value**: `https://talendro.com`
- **Purpose**: Alternative CORS domain variable
- **Default**: Not set

---

### 12. PORT
- **Key**: `PORT`
- **Value**: (Auto-set by Render)
- **Purpose**: Server port (Render sets this automatically)
- **⚠️ Note**: Don't manually set this - Render handles it

---

## 🔧 HOW TO SET ENVIRONMENT VARIABLES IN RENDER

### Step-by-Step:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click on your service** (e.g., `talendro-app`)
3. **Click "Environment"** tab (left sidebar)
4. **Click "Add Environment Variable"**
5. **Enter**:
   - **Key**: The variable name (e.g., `MONGODB_URI`)
   - **Value**: The variable value (e.g., `mongodb+srv://...`)
6. **Click "Save Changes"**
7. **Repeat** for each variable

**⚠️ Important**: 
- Render automatically redeploys when you add/update variables
- Wait for deployment to complete before testing
- Variables are encrypted and secure in Render

---

## ✅ ENVIRONMENT VARIABLES CHECKLIST

Copy this checklist when setting up Render:

```
Required Variables:
☐ NODE_ENV=production
☐ MONGODB_URI=mongodb+srv://...
☐ JWT_SECRET=(generate with: openssl rand -base64 32)
☐ ANTHROPIC_API_KEY=sk-ant-...
☐ STRIPE_SECRET_KEY=sk_live_... or sk_test_...
☐ STRIPE_PRICE_ID_BASIC=price_...
☐ STRIPE_PRICE_ID_PRO=price_...
☐ STRIPE_PRICE_ID_PREMIUM=price_...
☐ STRIPE_WEBHOOK_SECRET=whsec_...

Optional Variables:
☐ FRONTEND_URL=https://talendro.com
☐ DOMAIN=https://talendro.com
```

---

## 🔒 SECURITY BEST PRACTICES

1. **Never commit secrets to GitHub**
   - Use `.gitignore` to exclude `.env` files
   - Use Render environment variables instead

2. **Use different secrets for production vs development**
   - Generate new `JWT_SECRET` for production
   - Use Stripe live keys for production, test keys for development

3. **Rotate secrets regularly**
   - Update `JWT_SECRET` periodically
   - Rotate API keys if compromised

4. **Limit access to Render dashboard**
   - Only give access to trusted team members
   - Use Render's team features for access control

5. **Monitor for exposed secrets**
   - Use tools like GitGuardian to scan for secrets
   - Review logs for any sensitive data

---

## 🐛 TROUBLESHOOTING

### Problem: App shows "Application Error"

**Possible causes**:
- Missing required environment variable
- Invalid environment variable value
- MongoDB connection failed (check `MONGODB_URI`)

**Solution**:
1. Check Render logs (Service → Logs tab)
2. Verify all required variables are set
3. Check variable values are correct (no extra spaces, correct format)

---

### Problem: Authentication not working

**Possible causes**:
- `JWT_SECRET` not set or incorrect
- `JWT_SECRET` changed after users logged in

**Solution**:
1. Verify `JWT_SECRET` is set in Render
2. Check server logs for JWT errors
3. Users may need to log in again if secret changed

---

### Problem: Stripe payments not working

**Possible causes**:
- `STRIPE_SECRET_KEY` not set or incorrect
- `STRIPE_PRICE_ID_*` variables not set
- Webhook secret incorrect

**Solution**:
1. Verify all Stripe variables are set
2. Check Stripe dashboard for API key status
3. Verify webhook endpoint URL in Stripe
4. Check webhook secret matches Render variable

---

### Problem: Resume parsing not working

**Possible causes**:
- `ANTHROPIC_API_KEY` not set or incorrect
- API key expired or invalid
- API quota exceeded

**Solution**:
1. Verify `ANTHROPIC_API_KEY` is set
2. Check Anthropic console for API key status
3. Verify API key has sufficient credits/quota
4. Check server logs for API errors

---

## 📚 ADDITIONAL RESOURCES

- **Render Environment Variables**: https://render.com/docs/environment-variables
- **MongoDB Atlas Connection**: https://docs.atlas.mongodb.com/getting-started/
- **Stripe API Keys**: https://stripe.com/docs/keys
- **Anthropic API Keys**: https://docs.anthropic.com/claude/reference/getting-started-with-the-api

---

**Last Updated**: Migration to Render
**Status**: ✅ Complete

