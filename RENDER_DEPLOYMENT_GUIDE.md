# 🚀 Complete Render Deployment Guide for Talendro

**Migration from Railway to Render**

This comprehensive guide will walk you through deploying your Talendro application to Render and connecting it to your custom domain.

---

## 📋 PREREQUISITES

Before you begin, make sure you have:

- ✅ **Render account** created at https://render.com
- ✅ **GitHub account** with your Talendro repository
- ✅ **MongoDB Atlas account** (or MongoDB database connection string)
- ✅ **Stripe account** (for payment processing)
- ✅ **Anthropic API key** (for Claude AI)
- ✅ **Custom domain** (talendro.com) - optional but recommended

---

## PART 1: Prepare Your Code for Render

### Step 1.1: Verify Your Repository

Your code is already prepared! The following files are in place:

- ✅ `render.yaml` - Render configuration file
- ✅ `Procfile` - Process file for web service
- ✅ `package.json` - Root package.json with build scripts
- ✅ `server/package.json` - Server dependencies
- ✅ `client/package.json` - Client dependencies

### Step 1.2: Push to GitHub (if not already done)

1. **Open Terminal** on your MacBook
2. **Navigate to your project**:
   ```bash
   cd ~/Desktop/talendro-developer-package\ copy
   ```

3. **Check git status**:
   ```bash
   git status
   ```

4. **Add all files**:
   ```bash
   git add .
   ```

5. **Commit changes**:
   ```bash
   git commit -m "Migrate to Render - add render.yaml and update configuration"
   ```

6. **Push to GitHub**:
   ```bash
   git push origin main
   ```

**✅ Success**: Your code is now on GitHub and ready for Render!

---

## PART 2: Deploy to Render

### Step 2.1: Log Into Render

1. **Open your browser**
2. **Go to**: https://render.com
3. **Click** "Get Started" or "Log In"
4. **Sign in** with GitHub (recommended) or email
5. **Authorize Render** to access your GitHub (if first time)

**✅ Success**: You're logged into Render!

---

### Step 2.2: Create New Web Service

1. **On Render dashboard**, click **"New +"** button (top right)
2. **Select** "Web Service"
3. **Connect your GitHub repository**:
   - If first time: Click "Connect GitHub" and authorize
   - Select your repository: `talendro-developer-package` (or your repo name)
   - Click "Connect"

4. **Configure your service**:
   - **Name**: `talendro-app` (or any name you prefer)
   - **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave blank (uses repository root)
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `cd server && npm start`

5. **Click** "Create Web Service"

**✅ Success**: Render is now building your app!

---

### Step 2.3: Wait for Initial Build

**What's happening**: Render is:
- Installing Node.js dependencies
- Running `npm run install:all` (installs client and server deps)
- Running `npm run build` (builds React frontend)
- Preparing to start your server

**This usually takes 3-5 minutes**

**Watch the build logs**:
- Click on your service in Render dashboard
- You'll see real-time build logs
- Wait for "Build successful ✅"

---

### Step 2.4: Set Environment Variables

**⚠️ CRITICAL**: Your app needs these environment variables to work!

1. **In Render**, go to your service
2. **Click** "Environment" tab (left sidebar)
3. **Click** "Add Environment Variable" for each:

#### Required Variables:

**1. NODE_ENV**
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Click** "Save Changes"

**2. MONGODB_URI**
- **Key**: `MONGODB_URI`
- **Value**: Your MongoDB connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/talendro?retryWrites=true&w=majority`
  - Get this from MongoDB Atlas dashboard
- **Click** "Save Changes"

**3. JWT_SECRET**
- **Key**: `JWT_SECRET`
- **Value**: Generate a secure random string:
  ```bash
  openssl rand -base64 32
  ```
  - Copy the output and paste as value
- **Click** "Save Changes"

**4. ANTHROPIC_API_KEY**
- **Key**: `ANTHROPIC_API_KEY`
- **Value**: Your Anthropic/Claude API key (starts with `sk-ant-...`)
- **Click** "Save Changes"

**5. STRIPE_SECRET_KEY**
- **Key**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe secret key (starts with `sk_live_...` or `sk_test_...`)
- **Click** "Save Changes"

**6. STRIPE_PRICE_ID_BASIC**
- **Key**: `STRIPE_PRICE_ID_BASIC`
- **Value**: Your Stripe Price ID for Basic plan (starts with `price_...`)
- **Click** "Save Changes"

**7. STRIPE_PRICE_ID_PRO**
- **Key**: `STRIPE_PRICE_ID_PRO`
- **Value**: Your Stripe Price ID for Pro plan (starts with `price_...`)
- **Click** "Save Changes"

**8. STRIPE_PRICE_ID_PREMIUM**
- **Key**: `STRIPE_PRICE_ID_PREMIUM`
- **Value**: Your Stripe Price ID for Premium plan (starts with `price_...`)
- **Click** "Save Changes"

**9. STRIPE_WEBHOOK_SECRET**
- **Key**: `STRIPE_WEBHOOK_SECRET`
- **Value**: Your Stripe webhook signing secret (starts with `whsec_...`)
- **Click** "Save Changes"

#### Optional Variables:

**10. FRONTEND_URL**
- **Key**: `FRONTEND_URL`
- **Value**: `https://talendro.com` (or your Render URL)
- **Click** "Save Changes"

**11. DOMAIN**
- **Key**: `DOMAIN`
- **Value**: `https://talendro.com`
- **Click** "Save Changes"

**⚠️ Important**: Render automatically redeploys when you add variables. Wait for deployment to complete.

---

### Step 2.5: Get Your Render URL

1. **Click on your service** in Render dashboard
2. **Look at the top** of the service page
3. **You'll see a Render-generated URL** like:
   ```
   https://talendro-app.onrender.com
   ```
   (Your actual URL will be different - Render generates it)

4. **Copy this URL** - you'll need it for custom domain setup!

**✅ Success**: You have your Render URL!

---

### Step 2.6: Test Your Render URL

1. **Open a new browser tab**
2. **Paste your Render URL** in the address bar
3. **Press Enter**

**Expected Results**:
- ✅ **App loads** → Great! Your app is live!
- ❌ **"Application Error"** → Check Render logs (we'll fix this)
- ❌ **"Service Unavailable"** → Wait a few minutes, then refresh

**✅ Success**: Your app is live on Render!

---

## PART 3: Connect Custom Domain to Render

### Step 3.1: Add Custom Domain in Render

1. **In Render**, go to your service → **Settings** tab
2. **Scroll to** "Custom Domains" section
3. **Click** "Add Custom Domain"
4. **Enter your domain**: `talendro.com` (or `www.talendro.com`)
5. **Click** "Save"
6. **Render will show you DNS instructions** - **LOOK FOR THIS!**

**You'll see something like**:
```
Type: CNAME
Name: @ (or leave blank)
Target: talendro-app.onrender.com
```

**OR**:
```
Type: A
Name: @
Target: 216.3.128.12 (example IP - yours will be different)
```

**✅ Success**: Domain added in Render! Keep this page open.

---

### Step 3.2: Update DNS Records

**This step depends on your DNS provider** (Cloudflare, GoDaddy, Namecheap, etc.)

#### If using Cloudflare:

1. **Open a new browser tab** (keep Render tab open)
2. **Go to**: https://dash.cloudflare.com
3. **Log in** to your Cloudflare account
4. **Select** your domain (`talendro.com`)
5. **Click** "DNS" in the left sidebar
6. **Click** "Add record"

**For Root Domain (talendro.com)**:

- **Type**: `CNAME` (if Render gave you a CNAME) OR `A` (if Render gave you an IP)
- **Name**: `@` (or leave blank for root domain)
- **Target**: 
  - **If CNAME**: Paste the Target value from Render (e.g., `talendro-app.onrender.com`)
  - **If A Record**: Paste the IP address from Render
- **Proxy status**: 
  - **"DNS only"** (gray cloud) - recommended for initial setup
  - **"Proxied"** (orange cloud) - works but may need SSL configuration
- **Click** "Save"

**For WWW Subdomain (www.talendro.com)**:

1. **Click** "Add record" again
2. **Type**: `CNAME`
3. **Name**: `www`
4. **Target**: Same as root domain target (e.g., `talendro-app.onrender.com`)
5. **Proxy status**: Same as root domain
6. **Click** "Save"

**✅ Success**: DNS records added!

---

#### If using other DNS providers (GoDaddy, Namecheap, etc.):

1. **Log in** to your DNS provider
2. **Navigate to** DNS Management / DNS Records
3. **Add the records** Render provided:
   - **CNAME** or **A Record** for root domain
   - **CNAME** for www subdomain
4. **Save** the records

**✅ Success**: DNS records updated!

---

### Step 3.3: Wait for DNS Propagation

**DNS changes take time to propagate**:
- Usually **5-30 minutes**, but can take up to 48 hours
- You can check propagation status at: https://dnschecker.org

**While waiting**:
- Your Render URL still works: `https://talendro-app.onrender.com`
- You can continue testing your app

---

### Step 3.4: Verify Domain Connection

1. **Go back to Render** → Your service → Settings → Custom Domains
2. **Check domain status**:
   - ✅ **"Valid"** → Domain is connected!
   - ⏳ **"Pending"** → Still waiting for DNS propagation
   - ❌ **"Invalid"** → Check DNS records

3. **Once status is "Valid"**:
   - Render automatically provisions SSL certificate
   - This takes 5-10 minutes
   - Your domain will show "SSL Certificate Active" when ready

**✅ Success**: Domain connected and SSL active!

---

### Step 3.5: Test Your Custom Domain

1. **Open a new browser tab**
2. **Go to**: `https://talendro.com`
3. **You should see** your Talendro app!

**✅ Success**: Your app is live at talendro.com!

---

## PART 4: Configure Stripe Webhooks for Render

### Step 4.1: Update Stripe Webhook Endpoint

**Important**: Stripe webhooks need to point to your Render URL!

1. **Go to**: https://dashboard.stripe.com
2. **Navigate to**: Developers → Webhooks
3. **Find your webhook endpoint** (or create new one)
4. **Update the endpoint URL** to:
   ```
   https://talendro-app.onrender.com/api/webhooks/stripe
   ```
   (Use your actual Render URL)

5. **Or if using custom domain**:
   ```
   https://talendro.com/api/webhooks/stripe
   ```

6. **Select events** to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

7. **Click** "Add endpoint" or "Save"

8. **Copy the webhook signing secret**:
   - Click on your webhook endpoint
   - Find "Signing secret"
   - Click "Reveal" and copy
   - This is your `STRIPE_WEBHOOK_SECRET` value

9. **Update in Render**:
   - Go to Render → Your service → Environment
   - Update `STRIPE_WEBHOOK_SECRET` with the new value
   - Save changes

**✅ Success**: Stripe webhooks configured for Render!

---

## PART 5: Verify Everything Works

### Step 5.1: Test Checklist

Run through these tests:

- [ ] **Homepage loads**: Visit `https://talendro.com` (or your Render URL)
- [ ] **API health check**: Visit `https://talendro.com/api/health`
  - Should return: `{"ok":true,"service":"talendro-server"}`
- [ ] **User registration**: Try creating a new account
- [ ] **User login**: Try logging in
- [ ] **Resume parsing**: Try uploading a resume (if available)
- [ ] **Stripe checkout**: Test payment flow (use test mode)
- [ ] **Dashboard**: Access user dashboard after login

---

### Step 5.2: Check Render Logs

1. **In Render**, go to your service
2. **Click** "Logs" tab
3. **Look for**:
   - ✅ "✅ MongoDB connected"
   - ✅ "✅ Talendro API server running on port..."
   - ✅ "✅ Anthropic API key configured: true"
   - ❌ Any error messages (red text)

**If you see errors**:
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check API keys are valid

---

## PART 6: Troubleshooting

### Problem: Build Fails in Render

**Symptoms**: Build logs show errors

**Solutions**:
1. **Check build logs** in Render dashboard
2. **Common issues**:
   - Missing dependencies → Check `package.json` files
   - Build command error → Verify `npm run build` works locally
   - Node version mismatch → Render uses Node 18+ by default
3. **Fix the issue** and push to GitHub (Render auto-redeploys)

---

### Problem: Application Error on Render URL

**Symptoms**: App shows "Application Error" or blank page

**Solutions**:
1. **Check Render logs** (Service → Logs tab)
2. **Common causes**:
   - Missing environment variables → Add them in Environment tab
   - MongoDB connection failed → Check `MONGODB_URI`
   - Port binding error → Render sets PORT automatically, don't override
   - Missing React build → Check build completed successfully
3. **Fix the issue** and wait for redeployment

---

### Problem: Custom Domain Not Working

**Symptoms**: Domain shows "Pending" or doesn't load

**Solutions**:
1. **First**: Test Render URL directly
   - If Render URL works → DNS issue
   - If Render URL doesn't work → App issue (fix that first)

2. **Check DNS records**:
   - Verify CNAME/A record points to correct Render target
   - Check DNS propagation: https://dnschecker.org
   - Wait up to 48 hours for full propagation

3. **Check Render domain status**:
   - Render → Settings → Custom Domains
   - Should show "Valid" when DNS is correct

4. **SSL Certificate**:
   - Render auto-provisions SSL
   - Takes 5-10 minutes after domain is valid
   - Check "SSL Certificate Active" status

---

### Problem: CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
1. **Check CORS configuration** in `server/index.js`
2. **Verify environment variables**:
   - `FRONTEND_URL` should be your domain
   - `DOMAIN` should be your domain
3. **Render domains** are automatically allowed (`.onrender.com`)
4. **Update and redeploy** if needed

---

### Problem: Stripe Webhooks Not Working

**Symptoms**: Stripe events not received

**Solutions**:
1. **Check webhook URL** in Stripe dashboard
   - Should be: `https://your-app.onrender.com/api/webhooks/stripe`
2. **Verify webhook secret** in Render environment variables
3. **Check Render logs** for webhook requests
4. **Test webhook** using Stripe CLI or dashboard

---

## 📋 DEPLOYMENT CHECKLIST

Use this checklist to ensure everything is set up:

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] `render.yaml` file exists
- [ ] `Procfile` exists and is correct
- [ ] Build scripts work locally (`npm run build`)

### Render Setup
- [ ] Render account created
- [ ] Web service created and connected to GitHub
- [ ] Build completed successfully
- [ ] All environment variables set
- [ ] Render URL works (test in browser)

### Domain Configuration
- [ ] Custom domain added in Render
- [ ] DNS records updated (CNAME or A record)
- [ ] DNS propagation complete (check dnschecker.org)
- [ ] Domain status shows "Valid" in Render
- [ ] SSL certificate active
- [ ] Custom domain works (test in browser)

### Integration Setup
- [ ] Stripe webhook endpoint updated
- [ ] Stripe webhook secret updated in Render
- [ ] MongoDB connection working (check logs)
- [ ] API health check works (`/api/health`)

### Testing
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Resume parsing works (if applicable)
- [ ] Payment flow works (test mode)
- [ ] Dashboard accessible after login
- [ ] No critical errors in Render logs

---

## 🎯 QUICK REFERENCE

### Render URLs
- **Dashboard**: https://dashboard.render.com
- **Your Service**: https://dashboard.render.com/web/[your-service-id]
- **Your App URL**: `https://your-app-name.onrender.com`

### Important Commands
```bash
# Local build test
npm run install:all
npm run build
cd server && npm start

# Git commands
git add .
git commit -m "Your message"
git push origin main
```

### Environment Variables Summary
```
Required:
- NODE_ENV=production
- MONGODB_URI=mongodb+srv://...
- JWT_SECRET=...
- ANTHROPIC_API_KEY=sk-ant-...
- STRIPE_SECRET_KEY=sk_live_... or sk_test_...
- STRIPE_PRICE_ID_BASIC=price_...
- STRIPE_PRICE_ID_PRO=price_...
- STRIPE_PRICE_ID_PREMIUM=price_...
- STRIPE_WEBHOOK_SECRET=whsec_...

Optional:
- FRONTEND_URL=https://talendro.com
- DOMAIN=https://talendro.com
```

---

## 📚 ADDITIONAL RESOURCES

- **Render Documentation**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Render Community**: https://community.render.com

---

## ✅ MIGRATION COMPLETE!

Your Talendro application is now running on Render! 🎉

**Next Steps**:
1. Monitor your app in Render dashboard
2. Set up monitoring/alerting (optional)
3. Configure auto-scaling if needed (Render Pro plan)
4. Set up backups for MongoDB (if using MongoDB Atlas)

**Support**:
- Render Support: https://render.com/docs/support
- Check Render logs for any issues
- Review this guide for troubleshooting

---

**Last Updated**: Migration from Railway to Render
**Status**: ✅ Ready for Production

