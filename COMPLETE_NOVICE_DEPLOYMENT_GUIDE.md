# 🚀 Complete Novice Guide: Deploy Talendro to Railway + Connect talendro.com

**This guide assumes you know nothing about deployment. Every single step is explained in detail.**

**Your Goal**: Move Talendro from your MacBook to Railway, accessible at **talendro.com**

**Total Time**: 30-45 minutes

---

## 📋 What You'll Need

- ✅ Your MacBook with Talendro code
- ✅ GitHub account (we'll create if needed)
- ✅ Railway account (you mentioned you have this)
- ✅ Cloudflare account with talendro.com domain
- ✅ Your API keys (Claude/Anthropic if you have them)

---

# PART 1: Upload Your Code to GitHub (10 minutes)

## Step 1.1: Create a GitHub Account (if you don't have one)

1. **Open your web browser** (Chrome, Safari, Firefox - any browser works)
2. **Go to**: https://github.com
3. **Click** the green "Sign up" button (top right)
4. **Enter**:
   - Username (choose something like `yourname` or `gregjackson`)
   - Email address
   - Password
5. **Click** "Create account"
6. **Verify your email** (check your inbox, click the verification link)
7. **Complete the setup** (choose free plan, skip optional questions)

**✅ Done**: You now have a GitHub account!

---

## Step 1.2: Create a New Repository on GitHub

1. **Make sure you're logged into GitHub**
2. **Click the "+" icon** in the top right corner of GitHub
3. **Click** "New repository" from the dropdown menu
4. **Fill in the form**:
   - **Repository name**: Type `talendro-app` (or any name you like)
   - **Description**: (optional) "Talendro job search application"
   - **Visibility**: 
     - ✅ Click **"Private"** (recommended - keeps your code private)
     - ❌ Do NOT click "Public"
   - **DO NOT check** "Add a README file"
   - **DO NOT check** "Add .gitignore"
   - **DO NOT check** "Choose a license"
5. **Click the green** "Create repository" button at the bottom

**✅ Done**: Your repository is created!

---

## Step 1.3: Copy Your Repository URL

After creating the repository, GitHub will show you a page with setup instructions.

**Look for a section that says "Quick setup"** - you'll see a URL that looks like:

```
https://github.com/YOUR_USERNAME/talendro-app.git
```

**Example**: If your username is `gregjackson`, it would be:
```
https://github.com/gregjackson/talendro-app.git
```

**📋 COPY THIS URL** - you'll need it in the next step!

**How to copy**: 
- Click in the text box next to the URL
- Press `Cmd+A` (select all)
- Press `Cmd+C` (copy)
- Or right-click and select "Copy"

---

## Step 1.4: Open Terminal on Your MacBook

1. **Press** `Cmd + Space` (opens Spotlight search)
2. **Type**: `Terminal`
3. **Press** `Enter` (opens Terminal app)
4. **You'll see a window** with a command prompt like: `gregjackson@MacBook ~ %`

**✅ Done**: Terminal is open!

---

## Step 1.5: Navigate to Your Project Folder

**In Terminal, type this EXACT command** (then press Enter):

```bash
cd "/Users/gregjackson/Desktop/talendro-developer-package copy"
```

**What this does**: Changes directory to your project folder

**✅ Success**: You should see the prompt change to show you're in that folder

**If you get an error**: Make sure you typed it exactly, including the quotes and spaces

---

## Step 1.6: Connect Your Code to GitHub

**In Terminal, type this command** (replace `YOUR_USERNAME` and `talendro-app` with your actual values):

```bash
git remote add origin https://github.com/YOUR_USERNAME/talendro-app.git
```

**Example** (if your username is `gregjackson`):
```bash
git remote add origin https://github.com/gregjackson/talendro-app.git
```

**Press Enter**

**✅ Success**: You won't see any message - that's good! (No error = success)

**If you see an error**: 
- Make sure you copied the URL correctly
- Make sure you're in the right folder (Step 1.5)

---

## Step 1.7: Push Your Code to GitHub

**In Terminal, type this command**:

```bash
git push -u origin main
```

**Press Enter**

**You'll be asked for credentials:**

### Option A: If you have 2-Factor Authentication (2FA) enabled:

1. **Username**: Enter your GitHub username
2. **Password**: You CANNOT use your regular password
   - You need a **Personal Access Token**
   - **Get one now**:
     - Go to: https://github.com/settings/tokens
     - Click "Generate new token" → "Generate new token (classic)"
     - **Note**: Type "Railway deployment" (or anything)
     - **Expiration**: Choose "90 days" or "No expiration"
     - **Scopes**: Check ✅ **"repo"** (this gives full repository access)
     - Click "Generate token" at bottom
     - **COPY THE TOKEN** (you'll only see it once!)
     - **Use this token as your password** in Terminal

### Option B: If you DON'T have 2FA:

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
Branch 'main' set up to track 'remote branch 'main' from 'origin'.
```

**✅ Done**: Your code is now on GitHub!

**Verify**: Go to https://github.com/YOUR_USERNAME/talendro-app - you should see all your files!

---

# PART 2: Deploy to Railway (15 minutes)

## Step 2.1: Log Into Railway

1. **Open your web browser**
2. **Go to**: https://railway.app
3. **Click** "Login" (top right)
4. **Click** "Login with GitHub" (or use your Railway credentials if you have them)
5. **Authorize Railway** if asked (click "Authorize Railway App")

**✅ Done**: You're logged into Railway!

---

## Step 2.2: Create a New Project

1. **On Railway dashboard**, you'll see a big button that says **"New Project"**
2. **Click** "New Project"
3. **You'll see options**:
   - "Deploy from GitHub repo" ← **CLICK THIS ONE**
   - "Empty Project" (don't click this)
   - "Deploy a Template" (don't click this)
4. **If first time**: You'll be asked to **authorize Railway** to access GitHub
   - Click "Authorize Railway App"
   - You may need to enter your GitHub password
   - Click "Authorize" on the GitHub page
5. **You'll see a list of your GitHub repositories**
6. **Find and click** `talendro-app` (or whatever you named it)
7. **Railway will automatically start deploying!**

**✅ Done**: Railway is now building your app!

---

## Step 2.3: Wait for Initial Build (3-5 minutes)

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

**If it fails**: Don't panic! We'll fix it in the next steps.

---

## Step 2.4: Configure Build Settings

**Even if the build succeeded, we need to verify settings:**

1. **Click on your service** in Railway (the box showing your app name)
2. **Click the "Settings" tab** (looks like a gear icon ⚙️, usually on the right side)
3. **Scroll down** to find these sections:

### Build Command:

1. **Find** "Build Command" field
2. **Click in the field** (it might be empty or have something)
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

---

## Step 2.5: Add Environment Variables

**Still in the Settings tab**, scroll to find **"Variables"** section:

### Add NODE_ENV:

1. **Click** "New Variable" button
2. **Name field**: Type `NODE_ENV`
3. **Value field**: Type `production`
4. **Click** "Add" (or press Enter)
5. **Railway will automatically redeploy** (you'll see it start building again)

### Add Your API Keys (if you have them):

**For Claude API Key:**

1. **Click** "New Variable" again
2. **Name**: `CLAUDE_API_KEY`
3. **Value**: Paste your Claude API key (starts with `sk-ant-...`)
4. **Click** "Add"

**For Anthropic API Key** (if different from Claude):

1. **Click** "New Variable" again
2. **Name**: `ANTHROPIC_API_KEY`
3. **Value**: Paste your Anthropic API key
4. **Click** "Add"

**For Affinda** (if you're using it):

1. **Click** "New Variable" again
2. **Name**: `AFFINDA_API_KEY`
3. **Value**: Paste your Affinda API key
4. **Click** "Add"

**For MongoDB** (if you're using a database):

1. **Click** "New Variable" again
2. **Name**: `MONGODB_URI`
3. **Value**: Paste your MongoDB connection string
4. **Click** "Add"

**✅ Done**: All environment variables are set!

**⚠️ Important**: Railway redeploys automatically when you add variables. Wait for it to finish.

---

## Step 2.6: Get Your Railway URL

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

## Step 2.7: Test Your Railway URL

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

# PART 3: Connect talendro.com Domain (15 minutes)

## Step 3.1: Add Custom Domain in Railway

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

**✅ Done**: Domain added in Railway! Keep this page open.

---

## Step 3.2: Log Into Cloudflare

1. **Open a new browser tab** (keep Railway tab open)
2. **Go to**: https://dash.cloudflare.com
3. **Enter your email** and **password**
4. **Click** "Log in"

**✅ Done**: You're logged into Cloudflare!

---

## Step 3.3: Select Your Domain in Cloudflare

1. **On Cloudflare dashboard**, you'll see a list of your domains
2. **Find and click** `talendro.com` (your domain)
3. **You'll be taken to the domain's dashboard**

**✅ Done**: You're now managing talendro.com!

---

## Step 3.4: Add DNS Record for Root Domain (talendro.com)

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
   - **Paste the Target value** from Railway (Step 3.1)
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

**✅ Done**: DNS record added for talendro.com!

---

## Step 3.5: Add DNS Record for WWW (www.talendro.com)

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

**✅ Done**: Both talendro.com and www.talendro.com are configured!

---

## Step 3.6: Enable SSL/HTTPS in Cloudflare

1. **In Cloudflare**, look at the left sidebar
2. **Click** "SSL/TLS" (it has a lock icon 🔒)
3. **You'll see** "Encryption mode" section
4. **Click the dropdown** that says "Flexible" (or whatever it currently says)
5. **Select** "Full" or "Full (strict)" 
   - **"Full"** is recommended (works with Railway's SSL)
   - **"Full (strict)"** is more secure but requires Railway to have a valid certificate
6. **The setting saves automatically**

**✅ Done**: SSL/HTTPS is enabled!

---

## Step 3.7: Wait for DNS Propagation (5-10 minutes)

**What's happening**: 
- Cloudflare is updating DNS records worldwide
- This tells the internet that talendro.com points to Railway
- Takes 5-10 minutes (can take up to 24 hours, but usually fast)

**What to do**:
- **Wait 5-10 minutes**
- You can check status in Cloudflare (DNS page will show the records)
- You can test if it's ready (next step)

**✅ Done**: Waiting for DNS to propagate!

---

## Step 3.8: Test Your Domain

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

# PART 4: Update CORS for Production (5 minutes)

**This step allows your live domain to communicate with your API.**

## Step 4.1: Edit the CORS File

1. **On your MacBook**, open your code editor (VS Code, TextEdit, or any editor)
2. **Navigate to**: `server/index.js`
3. **Open the file**

## Step 4.2: Find the CORS Configuration

**Look for a section** that says something like:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...
]
```

**This is around line 251** in the file.

## Step 4.3: Add Your Domain

**Add these two lines** to the `allowedOrigins` array:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://talendro.com',        // ADD THIS LINE
  'https://www.talendro.com',    // ADD THIS LINE
];
```

**Make sure**:
- You have a comma after each line (except the last one)
- You use `https://` (not `http://`)
- You use your actual domain: `talendro.com`

## Step 4.4: Save the File

1. **Press** `Cmd + S` (or File → Save)
2. **File is saved!**

---

## Step 4.5: Push Changes to GitHub

**Back in Terminal** (on your MacBook):

1. **Make sure you're in the project folder**:
   ```bash
   cd "/Users/gregjackson/Desktop/talendro-developer-package copy"
   ```

2. **Add the changed file**:
   ```bash
   git add server/index.js
   ```

3. **Commit the changes**:
   ```bash
   git commit -m "Update CORS for production domain talendro.com"
   ```

4. **Push to GitHub**:
   ```bash
   git push
   ```

**✅ Success**: Changes are pushed to GitHub!

---

## Step 4.6: Wait for Railway to Redeploy

**Railway automatically detects GitHub changes and redeploys:**

1. **Go back to Railway dashboard**
2. **You'll see** a new deployment starting automatically
3. **Wait 2-3 minutes** for it to complete
4. **Status will show** "Deployed" when done

**✅ Done**: CORS is updated, app is redeployed!

---

# ✅ FINAL CHECKLIST

Use this to verify everything is working:

- [ ] Code pushed to GitHub (can see files at github.com)
- [ ] Railway project created and connected to GitHub
- [ ] Build completed successfully in Railway
- [ ] Build Command set: `npm run build`
- [ ] Start Command set: `cd server && npm start`
- [ ] Environment variables added (NODE_ENV, API keys)
- [ ] Railway URL works (test it in browser)
- [ ] Custom domain `talendro.com` added in Railway
- [ ] CNAME record added in Cloudflare for `@` (root)
- [ ] CNAME record added in Cloudflare for `www`
- [ ] Both Cloudflare records have orange cloud (proxied) ON
- [ ] SSL/TLS set to "Full" in Cloudflare
- [ ] Waited 5-10 minutes for DNS propagation
- [ ] `https://talendro.com` works in browser
- [ ] `https://www.talendro.com` works in browser
- [ ] CORS updated in server/index.js
- [ ] CORS changes pushed to GitHub
- [ ] Railway redeployed after CORS update

---

# 🐛 TROUBLESHOOTING

## Problem: Build Fails in Railway

**What to do**:
1. **In Railway**, click your service
2. **Click** "Deployments" tab
3. **Click** the latest deployment (the one that failed)
4. **Click** "View Logs"
5. **Scroll through the logs** - look for red error messages
6. **Common issues**:
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
3. **Common fixes**:
   - Missing environment variables → Add them in Railway Settings
   - Wrong start command → Verify it's `cd server && npm start`
   - Build didn't complete → Check build logs

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
1. **Verify** you updated CORS in `server/index.js` (Step 4.3)
2. **Verify** you pushed changes to GitHub (Step 4.5)
3. **Verify** Railway redeployed (check Deployments tab)
4. **Clear browser cache**: 
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

