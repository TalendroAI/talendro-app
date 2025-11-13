# 🚀 Quick Start: Deploy Talendro to Railway + Cloudflare

**Estimated Time**: 30-45 minutes

---

## STEP 1: Upload Code to GitHub (10 minutes)

### 1.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `talendro-app`
3. Make it **Private**
4. Click **"Create repository"**
5. **Copy the repository URL** (you'll need it)

### 1.2 Upload Your Code

Open **Terminal** on your MacBook and run:

```bash
# Navigate to your project
cd "/Users/gregjackson/Desktop/talendro-developer-package copy"

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Talendro ready for Railway"

# Connect to GitHub (REPLACE YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace**:
- `YOUR_USERNAME` = your GitHub username
- `YOUR_REPO_NAME` = the repository name you created

---

## STEP 2: Deploy to Railway (15 minutes)

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. **Authorize Railway** (if first time)
5. **Select your repository** (`talendro-app`)
6. Click **"Deploy Now"**

### 2.2 Configure Build Settings

1. Click on your **service** in Railway
2. Go to **"Settings"** tab
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `cd server && npm start`
5. **Save**

### 2.3 Add Environment Variables

1. Still in **Settings**, go to **"Variables"** tab
2. Click **"New Variable"** and add:

```
NODE_ENV = production
```

3. Add your API keys (if you have them):

```
CLAUDE_API_KEY = your-key-here
ANTHROPIC_API_KEY = your-key-here
```

4. **Save** each variable

### 2.4 Get Your Railway URL

1. Go to **"Settings"** → **"Domains"**
2. You'll see: `https://your-app-name.up.railway.app`
3. **Copy this URL** - you'll need it!
4. **Test it** - open in browser (might take 2-3 minutes to be ready)

---

## STEP 3: Connect Cloudflare Domain (10 minutes)

### 3.1 Add Domain in Railway

1. In Railway, go to **Settings** → **"Domains"**
2. Click **"Add Domain"**
3. Enter: `yourdomain.com` (your actual domain)
4. Click **"Add"**
5. Railway will show DNS instructions - **COPY THE CNAME VALUE**

You'll see something like:
```
CNAME: your-app-name.up.railway.app
```

### 3.2 Configure Cloudflare DNS

1. Go to https://dash.cloudflare.com
2. **Select your domain**
3. Click **"DNS"** in left sidebar
4. Click **"Add record"**

**For Root Domain:**
- **Type**: `CNAME`
- **Name**: `@` (or leave blank)
- **Target**: `your-app-name.up.railway.app` (from Railway)
- **Proxy status**: 🟠 **Proxied** (orange cloud ON)
- **Click "Save"**

**For WWW:**
- **Type**: `CNAME`
- **Name**: `www`
- **Target**: `your-app-name.up.railway.app`
- **Proxy status**: 🟠 **Proxied**
- **Click "Save"**

### 3.3 Enable SSL

1. In Cloudflare, click **"SSL/TLS"** in left sidebar
2. Set to: **"Full"** or **"Full (strict)"**
3. **Save**

### 3.4 Wait & Test

1. **Wait 5-10 minutes** for DNS to propagate
2. Visit: `https://yourdomain.com`
3. **You should see your app!** 🎉

---

## STEP 4: Update CORS (5 minutes)

After your domain is working, update CORS to allow your domain:

1. **Edit**: `server/index.js`
2. **Find** the `allowedOrigins` array (around line 251)
3. **Add your domain**:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://yourdomain.com',        // ADD THIS
  'https://www.yourdomain.com',    // ADD THIS
];
```

4. **Save and push to GitHub**:

```bash
git add server/index.js
git commit -m "Update CORS for production domain"
git push
```

Railway will automatically redeploy!

---

## ✅ You're Done!

Your app is now live at:
- **Your Domain**: `https://yourdomain.com`
- **Railway URL**: `https://your-app-name.up.railway.app` (backup)

---

## 🆘 Troubleshooting

### App shows "Application Error"
- Check Railway logs: Service → Deployments → View logs
- Verify environment variables are set
- Check build completed successfully

### Domain doesn't work
- Wait longer (DNS can take up to 24 hours, usually 5-10 minutes)
- Test Railway URL first to verify app works
- Check DNS records in Cloudflare match Railway's instructions

### CORS errors
- Update CORS settings (Step 4 above)
- Wait for Railway to redeploy after pushing changes

---

## 📞 Need Help?

1. **Railway Logs**: Always check these first!
2. **Cloudflare DNS**: Verify records match Railway's instructions
3. **Test Railway URL**: Make sure app works there before testing domain

**You've got this!** 🚀

