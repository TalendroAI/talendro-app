# 🚂 Complete Railway Deployment Guide for Talendro

This guide will walk you through deploying your Talendro application to Railway and connecting it to your Cloudflare domain.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- ✅ Railway account created (you mentioned you just did this!)
- ✅ Cloudflare account with your domain
- ✅ Your code on your MacBook (we'll upload it)
- ✅ Environment variables ready (API keys, etc.)

---

## PART 1: Prepare Your Code for Railway

### Step 1: Create a GitHub Repository (Recommended)

Railway works best when connected to GitHub. Let's set this up:

1. **Go to GitHub.com** and sign in (or create an account)
2. **Click the "+" icon** in the top right → "New repository"
3. **Name it**: `talendro-app` (or whatever you like)
4. **Make it Private** (recommended for now)
5. **Don't initialize** with README (we'll push existing code)
6. **Click "Create repository"**

### Step 2: Upload Your Code to GitHub

Open Terminal on your MacBook and run these commands:

```bash
# Navigate to your project folder
cd "/Users/gregjackson/Desktop/talendro-developer-package copy"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Talendro app ready for Railway"

# Connect to GitHub (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

---

## PART 2: Deploy to Railway

### Step 3: Create New Project on Railway

1. **Go to Railway**: https://railway.app
2. **Click "New Project"** (big button)
3. **Select "Deploy from GitHub repo"**
4. **Authorize Railway** to access your GitHub (if first time)
5. **Select your repository** (`talendro-app` or whatever you named it)
6. **Click "Deploy Now"**

Railway will automatically detect it's a Node.js app and start building!

### Step 4: Configure Build Settings

Railway might need some help understanding your project structure:

1. **Click on your project** in Railway dashboard
2. **Click on the service** (should show "Deploying...")
3. **Go to "Settings" tab**
4. **Scroll to "Build Command"** and set it to:
   ```
   npm run build
   ```
5. **Scroll to "Start Command"** and set it to:
   ```
   cd server && npm start
   ```
6. **Scroll to "Root Directory"** - leave this blank (it should use the root)

### Step 5: Set Environment Variables

This is CRITICAL - your app needs API keys to work:

1. **In Railway**, go to your service
2. **Click "Variables" tab**
3. **Click "New Variable"** for each of these:

   **Required Variables:**
   ```
   NODE_ENV = production
   PORT = (Railway sets this automatically, but you can leave it)
   ```

   **API Keys (if you have them):**
   ```
   CLAUDE_API_KEY = your-claude-api-key-here
   ANTHROPIC_API_KEY = your-anthropic-api-key-here
   AFFINDA_API_KEY = your-affinda-api-key-here (if using)
   ```

   **Database (if using MongoDB):**
   ```
   MONGODB_URI = your-mongodb-connection-string
   ```

4. **Click "Add"** after each variable
5. **Railway will automatically redeploy** when you add variables

### Step 6: Wait for Deployment

- Railway will show build logs - watch for any errors
- This usually takes 2-5 minutes
- When done, you'll see "Deployed successfully" ✅

### Step 7: Get Your Railway URL

1. **Click on your service** in Railway
2. **Go to "Settings" tab**
3. **Scroll to "Domains" section**
4. **You'll see a Railway-generated URL** like: `https://your-app-name.up.railway.app`
5. **Copy this URL** - you'll need it for Cloudflare!

**Test it**: Open the URL in your browser. You should see your Talendro app! 🎉

---

## PART 3: Connect Cloudflare Domain to Railway

### Step 8: Add Custom Domain in Railway

1. **In Railway**, go to your service → **Settings** → **Domains**
2. **Click "Add Domain"**
3. **Enter your domain**: `yourdomain.com` (or `www.yourdomain.com`)
4. **Click "Add"**
5. **Railway will show you DNS records** you need to add - **COPY THESE!**

You'll see something like:
```
Type: CNAME
Name: @ (or www)
Value: your-app-name.up.railway.app
```

### Step 9: Configure DNS in Cloudflare

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select your domain**
3. **Click "DNS"** in the left sidebar
4. **Click "Add record"**

#### For Root Domain (yourdomain.com):

**Option A: Using CNAME (Recommended)**
- **Type**: `CNAME`
- **Name**: `@` (or leave blank for root)
- **Target**: `your-app-name.up.railway.app` (from Railway)
- **Proxy status**: 🟠 Proxied (orange cloud)
- **Click "Save"**

**Option B: Using A Record (if CNAME doesn't work)**
- Railway will give you an IP address
- **Type**: `A`
- **Name**: `@`
- **IPv4 address**: (Railway's IP)
- **Proxy status**: 🟠 Proxied
- **Click "Save"**

#### For WWW Subdomain (www.yourdomain.com):

- **Type**: `CNAME`
- **Name**: `www`
- **Target**: `your-app-name.up.railway.app`
- **Proxy status**: 🟠 Proxied
- **Click "Save"**

### Step 10: Enable SSL in Cloudflare

1. **In Cloudflare**, go to **SSL/TLS** in left sidebar
2. **Set encryption mode** to: **"Full"** or **"Full (strict)"**
3. This ensures HTTPS works properly

### Step 11: Wait for DNS Propagation

- DNS changes can take **5 minutes to 24 hours** (usually 5-15 minutes)
- Cloudflare usually propagates quickly (5-10 minutes)
- You can check status in Cloudflare dashboard

### Step 12: Test Your Live Site!

1. **Wait 5-10 minutes** after adding DNS records
2. **Visit**: `https://yourdomain.com`
3. **You should see your Talendro app!** 🎉

---

## PART 4: Update Your App for Production

### Step 13: Update CORS Settings

Your app needs to allow requests from your live domain:

1. **Edit**: `server/index.js`
2. **Find the CORS configuration** (around line 246)
3. **Update allowed origins** to include your domain:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://yourdomain.com',        // Add this
  'https://www.yourdomain.com',    // Add this
];
```

4. **Commit and push** to GitHub:
```bash
git add server/index.js
git commit -m "Update CORS for production domain"
git push
```

Railway will automatically redeploy!

---

## 🎯 Quick Reference: What You'll Have

After setup:
- **Railway URL**: `https://your-app-name.up.railway.app`
- **Your Domain**: `https://yourdomain.com`
- **Both URLs work!** (Railway URL is a backup)

---

## 🐛 Troubleshooting

### "Application Error" or Blank Page

1. **Check Railway logs**: Service → Deployments → Click latest → View logs
2. **Check environment variables** are set correctly
3. **Verify build completed** successfully

### "Cannot connect" or Timeout

1. **Check DNS records** in Cloudflare match Railway's instructions
2. **Wait longer** for DNS propagation (can take up to 24 hours)
3. **Try the Railway URL directly** to test if app works

### CORS Errors

1. **Update CORS settings** in `server/index.js` (Step 13 above)
2. **Redeploy** after changes

### API Not Working

1. **Check environment variables** in Railway are set
2. **Verify API keys** are correct
3. **Check Railway logs** for error messages

---

## 📝 Important Notes

1. **Free Tier Limits**: Railway free tier has usage limits. Monitor your usage in Railway dashboard.

2. **Environment Variables**: Never commit API keys to GitHub! Always use Railway's environment variables.

3. **Auto-Deploy**: Railway automatically redeploys when you push to GitHub (if connected).

4. **Build Time**: First build takes longer (5-10 minutes). Subsequent builds are faster.

5. **SSL/HTTPS**: Cloudflare provides free SSL certificates automatically when you proxy through them.

---

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created and connected to GitHub
- [ ] Build completed successfully
- [ ] Environment variables set
- [ ] Railway URL works (test it!)
- [ ] Custom domain added in Railway
- [ ] DNS records added in Cloudflare
- [ ] SSL enabled in Cloudflare
- [ ] Your domain works! 🎉

---

## 🆘 Need Help?

**Railway Support**: https://railway.app/docs
**Cloudflare Support**: https://support.cloudflare.com

**Common Issues**:
- Check Railway logs first
- Verify environment variables
- Test Railway URL before testing custom domain
- Wait for DNS propagation

---

**You're all set!** Once DNS propagates, your Talendro app will be live at `https://yourdomain.com` and accessible to anyone! 🚀

