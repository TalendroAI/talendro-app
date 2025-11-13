# 🚀 Step-by-Step: Transfer Talendro to Railway

**Complete novice-friendly guide to move your Talendro app from your MacBook to Railway**

**Your Goal**: Get Talendro running live at **talendro.com** on Railway

**Time Required**: 45-60 minutes

---

## 📋 BEFORE YOU START

**What You Need**:
- ✅ Your MacBook with Talendro code
- ✅ GitHub account (we'll create if needed)
- ✅ Railway account (you mentioned you have this)
- ✅ Cloudflare account with talendro.com domain
- ✅ Your API keys ready:
  - Anthropic/Claude API key (starts with `sk-ant-...`)
  - Stripe secret key (if using payments)
  - MongoDB connection string (if using database)
  - JWT secret (we'll generate one)

---

# PART 1: Prepare Your Code (10 minutes)

## Step 1.1: Open Terminal on Your MacBook

1. **Press** `Cmd + Space` (opens Spotlight search)
2. **Type**: `Terminal`
3. **Press** `Enter`
4. **You'll see a window** with a command prompt

**✅ Success**: Terminal is open!

---

## Step 1.2: Navigate to Your Project Folder

**In Terminal, type this EXACT command** (then press Enter):

```bash
cd "/Users/gregjackson/Desktop/talendro-developer-package copy"
```

**What this does**: Changes to your project directory

**✅ Success**: Your prompt should show the folder name

**If you get an error**: Make sure you typed it exactly, including the quotes

---

## Step 1.3: Check Git Status

**Type this command**:

```bash
git status
```

**What you might see**:
- If it says "not a git repository" → Skip to Step 1.4
- If it shows files → You already have git initialized (good!)

**✅ Success**: You know your git status

---

## Step 1.4: Initialize Git (if needed)

**Only do this if Step 1.3 said "not a git repository"**

**Type these commands one at a time**:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit - Talendro ready for Railway"
```

**✅ Success**: Git is initialized and your code is committed!

---

## Step 1.5: Verify Your Code is Ready

**Type this command**:

```bash
ls -la
```

**You should see**:
- `client/` folder
- `server/` folder
- `package.json` file
- `Procfile` file
- `railway.json` file

**✅ Success**: All files are present!

---

# PART 2: Upload Code to GitHub (15 minutes)

## Step 2.1: Create GitHub Account (if needed)

1. **Open your web browser** (Chrome, Safari, Firefox)
2. **Go to**: https://github.com
3. **Click** "Sign up" (top right, green button)
4. **Fill in**:
   - Username (choose something like `yourname`)
   - Email address
   - Password
5. **Click** "Create account"
6. **Verify your email** (check inbox, click verification link)
7. **Complete setup** (choose free plan, skip optional questions)

**✅ Success**: You have a GitHub account!

---

## Step 2.2: Create New Repository on GitHub

1. **Make sure you're logged into GitHub**
2. **Click the "+" icon** (top right)
3. **Click** "New repository"
4. **Fill in the form**:
   - **Repository name**: `talendro-app` (or any name you like)
   - **Description**: (optional) "Talendro job search application"
   - **Visibility**: 
     - ✅ Click **"Private"** (recommended)
     - ❌ Do NOT click "Public"
   - **DO NOT check** any boxes (README, .gitignore, license)
5. **Click** "Create repository" (green button at bottom)

**✅ Success**: Repository created!

---

## Step 2.3: Copy Your Repository URL

**After creating the repository, GitHub shows you a page with setup instructions**

**Look for a section that says "Quick setup"** - you'll see a URL like:

```
https://github.com/YOUR_USERNAME/talendro-app.git
```

**Example**: If your username is `gregjackson`, it would be:
```
https://github.com/gregjackson/talendro-app.git
```

**📋 COPY THIS URL** - you'll need it!

**How to copy**:
- Click in the text box next to the URL
- Press `Cmd+A` (select all)
- Press `Cmd+C` (copy)

**✅ Success**: URL is copied!

---

## Step 2.4: Connect Your Code to GitHub

**Back in Terminal** (make sure you're in your project folder):

**Type this command** (replace `YOUR_USERNAME` and `talendro-app` with your actual values):

```bash
git remote add origin https://github.com/YOUR_USERNAME/talendro-app.git
```

**Example** (if your username is `gregjackson`):
```bash
git remote add origin https://github.com/gregjackson/talendro-app.git
```

**Press Enter**

**✅ Success**: No error message = success!

**If you see an error**: 
- Make sure you copied the URL correctly
- Make sure you're in the right folder (Step 1.2)

---

## Step 2.5: Push Your Code to GitHub

**Type this command**:

```bash
git push -u origin main
```

**Press Enter**

**You'll be asked for credentials:**

### If you have 2-Factor Authentication (2FA) enabled:

1. **Username**: Enter your GitHub username
2. **Password**: You CANNOT use your regular password
   - You need a **Personal Access Token**
   - **Get one now**:
     - Go to: https://github.com/settings/tokens
     - Click "Generate new token" → "Generate new token (classic)"
     - **Note**: Type "Railway deployment"
     - **Expiration**: Choose "90 days" or "No expiration"
     - **Scopes**: Check ✅ **"repo"** (gives full repository access)
     - Click "Generate token" at bottom
     - **COPY THE TOKEN** (you'll only see it once!)
     - **Use this token as your password** in Terminal

### If you DON'T have 2FA:

1. **Username**: Enter your GitHub username
2. **Password**: Enter your GitHub password

**After entering credentials, press Enter**

**✅ Success**: You'll see output like:
```
Enumerating objects: XXXX, done.
Counting objects: 100% (XXXX/XXXX), done.
Writing objects: 100% (XXXX/XXXX), done.
To https://github.com/YOUR_USERNAME/talendro-app.git
 * [new branch]      main -> main
```

**✅ Done**: Your code is on GitHub!

**Verify**: Go to https://github.com/YOUR_USERNAME/talendro-app - you should see all your files!

---

# PART 3: Deploy to Railway (20 minutes)

## Step 3.1: Log Into Railway

1. **Open your web browser** (new tab)
2. **Go to**: https://railway.app
3. **Click** "Login" (top right)
4. **Click** "Login with GitHub"
5. **Authorize Railway** (click "Authorize Railway App" if asked)

**✅ Success**: You're logged into Railway!

---

## Step 3.2: Create New Project

1. **On Railway dashboard**, click **"New Project"** (big button)
2. **You'll see options**:
   - "Deploy from GitHub repo" ← **CLICK THIS ONE**
   - "Empty Project" (don't click)
   - "Deploy a Template" (don't click)
3. **If first time**: You'll be asked to **authorize Railway** to access GitHub
   - Click "Authorize Railway App"
   - Enter your GitHub password if asked
   - Click "Authorize"
4. **You'll see a list of your GitHub repositories**
5. **Find and click** `talendro-app` (or whatever you named it)
6. **Railway will automatically start deploying!**

**✅ Success**: Railway is building your app!

---

## Step 3.3: Wait for Initial Build (3-5 minutes)

**What's happening**: Railway is:
- Installing all your dependencies
- Building your React app
- Setting up your server

**You'll see**:
- A progress bar
- Logs scrolling by
- Status: "Building..." or "Deploying..."

**⚠️ IMPORTANT**: Don't close this page! Let it finish.

**✅ Success**: Status will change to "Deployed" or "Active" (usually green)

**If it fails**: Don't panic! We'll check logs in the next steps.

---

## Step 3.4: Configure Build Settings

**Even if the build succeeded, we need to verify settings:**

1. **Click on your service** in Railway (the box showing your app name)
2. **Click the "Settings" tab** (gear icon ⚙️, usually on the right)
3. **Scroll down** to find these sections:

### Build Command:

1. **Find** "Build Command" field
2. **Click in the field**
3. **Type exactly**: 
   ```
   npm run build
   ```
4. **Click outside** the field (Railway auto-saves)

### Start Command:

1. **Find** "Start Command" field (below Build Command)
2. **Click in the field**
3. **Type exactly**:
   ```
   cd server && npm start
   ```
4. **Click outside** the field (Railway auto-saves)

**✅ Done**: Settings are saved! Railway will automatically redeploy.

**Wait 2-3 minutes** for the redeployment to complete.

---

## Step 3.5: Add Environment Variables

**Still in the Settings tab**, scroll to find **"Variables"** section:

### Add NODE_ENV:

1. **Click** "New Variable" button
2. **Name field**: Type `NODE_ENV`
3. **Value field**: Type `production`
4. **Click** "Add" (or press Enter)
5. **Railway will automatically redeploy** (you'll see it start building again)

### Add JWT_SECRET:

**This is critical for authentication!**

1. **First, generate a secret**:
   - **In Terminal** (on your MacBook), type:
     ```bash
     openssl rand -base64 32
     ```
   - **Press Enter**
   - **Copy the output** (long random string)

2. **Back in Railway**:
   - **Click** "New Variable" again
   - **Name**: `JWT_SECRET`
   - **Value**: Paste the secret you just generated
   - **Click** "Add"

### Add Your API Keys:

**For Anthropic/Claude API Key:**

1. **Click** "New Variable" again
2. **Name**: `ANTHROPIC_API_KEY`
3. **Value**: Paste your Claude API key (starts with `sk-ant-...`)
4. **Click** "Add"

**For Stripe** (if using payments):

1. **Click** "New Variable" again
2. **Name**: `STRIPE_SECRET_KEY`
3. **Value**: Paste your Stripe secret key (starts with `sk_live_...` or `sk_test_...`)
4. **Click** "Add"

2. **Click** "New Variable" again
3. **Name**: `STRIPE_PRICE_ID_BASIC`
4. **Value**: Paste your Stripe Price ID for Basic plan (starts with `price_...`)
5. **Click** "Add"

6. **Repeat for** `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_PREMIUM` if you have them

**For MongoDB** (if using database):

1. **Click** "New Variable" again
2. **Name**: `MONGODB_URI`
3. **Value**: Paste your MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/talendro?retryWrites=true&w=majority`
4. **Click** "Add"

**For Domain Configuration:**

1. **Click** "New Variable" again
2. **Name**: `FRONTEND_URL`
3. **Value**: `https://talendro.com`
4. **Click** "Add"

2. **Click** "New Variable" again
3. **Name**: `DOMAIN`
4. **Value**: `https://talendro.com`
5. **Click** "Add"

**✅ Done**: All environment variables are set!

**⚠️ Important**: Railway redeploys automatically when you add variables. Wait for it to finish.

---

## Step 3.6: Get Your Railway URL

1. **Still in Settings tab**, scroll to **"Domains"** section
2. **You'll see** a Railway-generated domain that looks like:
   ```
   https://talendro-app-production.up.railway.app
   ```
   (Your actual URL will be different - Railway generates it)
3. **Click the copy icon** next to the URL (or click the URL to select it)
4. **Copy it** - you'll need this!

**✅ Done**: You have your Railway URL!

---

## Step 3.7: Test Your Railway URL

1. **Open a new browser tab**
2. **Paste your Railway URL** in the address bar
3. **Press Enter**
4. **You should see your Talendro app!** 🎉

**If you see**:
- ✅ Your Talendro homepage → **SUCCESS!**
- ❌ "Application Error" → Check Railway logs (we'll fix this)
- ❌ Blank page → Wait a minute, then refresh
- ❌ "Site can't be reached" → Wait for deployment to finish

**✅ Success**: Your app is live on Railway!

---

# PART 4: Connect talendro.com Domain (15 minutes)

## Step 4.1: Add Custom Domain in Railway

1. **In Railway**, go to your service → **Settings** → **Domains** section
2. **Click** "Add Domain" button
3. **In the text field**, type: `talendro.com` (your actual domain)
4. **Click** "Add" or press Enter
5. **Railway will process** this (takes 10-30 seconds)
6. **Railway will show you DNS instructions** - **LOOK FOR THIS!**

**You'll see something like**:

```
To connect talendro.com, add this DNS record:

Type: CNAME
Name: @
Target: talendro-app-production.up.railway.app
```

**📋 COPY THE TARGET VALUE** (the part after "Target:") - you'll need it!

**Example**: `talendro-app-production.up.railway.app`

**✅ Success**: Domain added in Railway! Keep this page open.

---

## Step 4.2: Log Into Cloudflare

1. **Open a new browser tab** (keep Railway tab open)
2. **Go to**: https://dash.cloudflare.com
3. **Enter your email** and **password**
4. **Click** "Log in"

**✅ Success**: You're logged into Cloudflare!

---

## Step 4.3: Select Your Domain in Cloudflare

1. **On Cloudflare dashboard**, you'll see a list of your domains
2. **Find and click** `talendro.com` (your domain)
3. **You'll be taken to the domain's dashboard**

**✅ Success**: You're now managing talendro.com!

---

## Step 4.4: Add DNS Record for Root Domain (talendro.com)

1. **In Cloudflare**, look at the left sidebar menu
2. **Click** "DNS" (it has a globe icon 🌐)
3. **You'll see a table** showing existing DNS records
4. **Click the blue** "Add record" button

### Fill in the DNS Record:

1. **Type dropdown**: 
   - Click the dropdown
   - Select **"CNAME"**

2. **Name field**:
   - Type: `@` 
   - (The @ symbol means "root domain" - this makes talendro.com work)

3. **Target field**:
   - **Paste the Target value** from Railway (Step 4.1)
   - Example: `talendro-app-production.up.railway.app`
   - **Make sure there are NO spaces** before or after

4. **Proxy status**:
   - **Look for an orange cloud icon** 🟠
   - **Make sure it's ON** (orange/proxied)
   - If it's gray, **click it** to turn it orange
   - (This enables Cloudflare's CDN and protection)

5. **TTL**:
   - Leave as "Auto" (default)

6. **Click** "Save" button (bottom right of the form)

**✅ Success**: DNS record added for talendro.com!

---

## Step 4.5: Add DNS Record for WWW (www.talendro.com)

**This makes www.talendro.com work too:**

1. **Click** "Add record" button again (same page)

### Fill in the DNS Record:

1. **Type**: Select **"CNAME"**

2. **Name**: Type `www` (just the letters www, nothing else)

3. **Target**: 
   - **Paste the SAME Target value** from Railway
   - Same as before: `talendro-app-production.up.railway.app`

4. **Proxy status**: 
   - **Make sure orange cloud is ON** 🟠

5. **TTL**: Leave as "Auto"

6. **Click** "Save"

**✅ Success**: Both talendro.com and www.talendro.com are configured!

---

## Step 4.6: Enable SSL/HTTPS in Cloudflare

1. **In Cloudflare**, look at the left sidebar
2. **Click** "SSL/TLS" (it has a lock icon 🔒)
3. **You'll see** "Encryption mode" section
4. **Click the dropdown** that says "Flexible" (or whatever it currently says)
5. **Select** "Full" or "Full (strict)" 
   - **"Full"** is recommended (works with Railway's SSL)
   - **"Full (strict)"** is more secure but requires Railway to have a valid certificate
6. **The setting saves automatically**

**✅ Success**: SSL/HTTPS is enabled!

---

## Step 4.7: Wait for DNS Propagation (5-10 minutes)

**What's happening**: 
- Cloudflare is updating DNS records worldwide
- This tells the internet that talendro.com points to Railway
- Takes 5-10 minutes (can take up to 24 hours, but usually fast)

**What to do**:
- **Wait 5-10 minutes**
- You can check status in Cloudflare (DNS page will show the records)
- You can test if it's ready (next step)

**✅ Success**: Waiting for DNS to propagate!

---

## Step 4.8: Test Your Domain

**After 5-10 minutes:**

1. **Open a new browser tab**
2. **Type in address bar**: `https://talendro.com`
3. **Press Enter**

**What you should see**:
- ✅ **Your Talendro app loads** → **SUCCESS!** 🎉
- ⏳ **"Site can't be reached"** → Wait longer (DNS still propagating)
- ⚠️ **"This site can't be reached"** → Check DNS records again
- 🔒 **SSL error** → Wait a bit longer, SSL is still setting up

**If it works**: **CONGRATULATIONS!** Your app is live at talendro.com! 🎉

**If it doesn't work after 15 minutes**: See troubleshooting section below.

---

# PART 5: Verify Everything Works (5 minutes)

## Step 5.1: Test Your Homepage

1. **Go to**: `https://talendro.com`
2. **Verify**: Homepage loads correctly
3. **Check**: No console errors (press F12, look at Console tab)

**✅ Success**: Homepage works!

---

## Step 5.2: Test Resume Upload

1. **Navigate to** the resume upload page
2. **Upload a test resume** (PDF or DOCX)
3. **Verify**: Resume parses correctly
4. **Check**: Data populates in forms

**✅ Success**: Resume parsing works!

---

## Step 5.3: Test API Endpoints

1. **Go to**: `https://talendro.com/api/health`
2. **You should see**: `{"ok":true,"service":"talendro-server"}`
3. **If you see this**: API is working!

**✅ Success**: API is responding!

---

## Step 5.4: Check Railway Logs

1. **Go back to Railway dashboard**
2. **Click on your service**
3. **Click** "Deployments" tab
4. **Click** the latest deployment
5. **Click** "View Logs"
6. **Check for errors**:
   - ✅ No red error messages = Good!
   - ❌ Red errors = Need to fix (see troubleshooting)

**✅ Success**: No critical errors in logs!

---

# ✅ FINAL CHECKLIST

Use this to verify everything is working:

- [ ] Code pushed to GitHub (can see files at github.com)
- [ ] Railway project created and connected to GitHub
- [ ] Build completed successfully in Railway
- [ ] Build Command set: `npm run build`
- [ ] Start Command set: `cd server && npm start`
- [ ] Environment variables added:
  - [ ] NODE_ENV = production
  - [ ] JWT_SECRET = (generated secret)
  - [ ] ANTHROPIC_API_KEY = (your key)
  - [ ] STRIPE_SECRET_KEY = (if using)
  - [ ] MONGODB_URI = (if using)
  - [ ] FRONTEND_URL = https://talendro.com
  - [ ] DOMAIN = https://talendro.com
- [ ] Railway URL works (test it in browser)
- [ ] Custom domain `talendro.com` added in Railway
- [ ] CNAME record added in Cloudflare for `@` (root)
- [ ] CNAME record added in Cloudflare for `www`
- [ ] Both Cloudflare records have orange cloud (proxied) ON
- [ ] SSL/TLS set to "Full" in Cloudflare
- [ ] Waited 5-10 minutes for DNS propagation
- [ ] `https://talendro.com` works in browser
- [ ] `https://www.talendro.com` works in browser
- [ ] Homepage loads correctly
- [ ] Resume upload works
- [ ] API endpoints respond
- [ ] No critical errors in Railway logs

---

# 🐛 TROUBLESHOOTING

## Problem: Build Fails in Railway

**What to do**:
1. **In Railway**, click your service
2. **Click** "Deployments" tab
3. **Click** the latest deployment (the one that failed)
4. **Click** "View Logs"
5. **Scroll through the logs** - look for red error messages

**Common issues**:
- "Command not found" → Check Build/Start commands are correct
- "Module not found" → Dependencies might be missing
- "Port already in use" → Railway handles ports automatically

**Fix**: 
- Check the error message
- Verify Build Command: `npm run build`
- Verify Start Command: `cd server && npm start`
- Make sure environment variables are set

---

## Problem: Application Error on Railway URL

**What to do**:
1. **Check Railway logs** (same as above - Deployments → View Logs)
2. **Look for**:
   - "Error: Cannot find module..."
   - "Port X is already in use"
   - "Environment variable missing"
   - "JWT_SECRET must be set"
   - "MongoDB connection error"

**Common fixes**:
- Missing environment variables → Add them in Railway Settings
- Wrong start command → Verify it's `cd server && npm start`
- Build didn't complete → Check build logs
- Missing JWT_SECRET → Generate and add it (Step 3.5)

---

## Problem: Domain Shows "Site Can't Be Reached"

**What to do**:
1. **First**: Test Railway URL directly
   - If Railway URL works → DNS issue
   - If Railway URL doesn't work → App issue (fix that first)

2. **Check DNS records in Cloudflare**:
   - Go to Cloudflare → DNS
   - Verify CNAME records exist
   - Verify Target matches Railway's CNAME value exactly
   - Verify orange cloud is ON (proxied)

3. **Wait longer**: DNS can take up to 24 hours (usually 5-10 min)

4. **Check Railway domain status**:
   - Railway → Settings → Domains
   - Should show "Active" or "Valid"

---

## Problem: SSL/HTTPS Not Working

**What to do**:
1. **In Cloudflare**, go to SSL/TLS
2. **Verify** encryption mode is "Full" (not "Flexible")
3. **Wait 10-15 minutes** - SSL certificates take time to provision
4. **Try accessing** `http://talendro.com` (without https) - should redirect to https

---

## Problem: CORS Errors in Browser Console

**What to do**:
1. **Verify** `talendro.com` is in CORS allowed origins (already done in code)
2. **Verify** environment variables `FRONTEND_URL` and `DOMAIN` are set
3. **Clear browser cache**: 
   - Chrome: `Cmd + Shift + Delete` → Clear cached images and files
   - Or try incognito/private browsing mode

---

## Problem: "Git push" Asks for Password But Doesn't Work

**What to do**:
1. **You need a Personal Access Token** (not your GitHub password)
2. **Get one**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "Railway deployment"
   - Expiration: 90 days (or no expiration)
   - Scopes: Check ✅ "repo"
   - Click "Generate token"
   - **COPY THE TOKEN** (you'll only see it once!)
3. **Use the token as your password** when Terminal asks

---

## Problem: Can't Find Settings in Railway

**What to do**:
1. **Click on your service** (the box with your app name)
2. **Look for tabs** at the top: "Deployments", "Metrics", "Settings"
3. **Click** "Settings" tab
4. **If you don't see it**: Make sure you clicked on the SERVICE, not the PROJECT

---

## Problem: DNS Records Don't Save in Cloudflare

**What to do**:
1. **Make sure** you're logged into the correct Cloudflare account
2. **Make sure** you selected the correct domain (talendro.com)
3. **Check** the Target value - make sure there are no extra spaces
4. **Try refreshing** the page and adding the record again

---

# 🎉 SUCCESS!

**Once everything is working:**

✅ **Your app is live at**: `https://talendro.com`  
✅ **Also works at**: `https://www.talendro.com`  
✅ **Railway URL** (backup): `https://your-app-name.up.railway.app`

**You can now**:
- Share `https://talendro.com` with anyone
- Access your app from anywhere
- No need to run it on your MacBook anymore!

---

# 📞 Need Help?

**If you get stuck at any step:**

1. **Check the logs first**:
   - Railway: Service → Deployments → View Logs
   - Cloudflare: DNS page shows record status

2. **Verify each step** was completed correctly

3. **Common mistakes**:
   - Forgot to add environment variables
   - Wrong build/start commands
   - DNS records not saved correctly
   - Didn't wait long enough for DNS propagation

**You've got this!** Take it one step at a time. 🚀

---

# 📝 Quick Command Reference

**For your reference, here are the key commands:**

```bash
# Navigate to project
cd "/Users/gregjackson/Desktop/talendro-developer-package copy"

# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Generate JWT secret
openssl rand -base64 32
```

---

**Good luck with your deployment!** 🎉

