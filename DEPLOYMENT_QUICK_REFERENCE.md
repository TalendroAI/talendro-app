# 🚀 Quick Reference: Railway Deployment

**For detailed instructions, see: `COMPLETE_NOVICE_DEPLOYMENT_GUIDE.md`**

---

## ⚡ Quick Steps Summary

### 1. GitHub Setup (5 min)
```bash
# In Terminal, from your project folder:
git remote add origin https://github.com/YOUR_USERNAME/talendro-app.git
git push -u origin main
```

### 2. Railway Setup (10 min)
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `talendro-app` repository
4. Wait for build to complete

### 3. Railway Configuration (5 min)
**In Railway Settings → Variables:**
- `NODE_ENV` = `production`
- `ANTHROPIC_API_KEY` = (your API key)
- `MONGODB_URI` = (your MongoDB connection string)

**In Railway Settings → Build/Start:**
- Build Command: `npm run build`
- Start Command: `cd server && npm start`

### 4. Domain Setup (10 min)
**In Railway:**
- Settings → Domains → Add Domain: `talendro.com`
- Copy the CNAME target (e.g., `app-name.up.railway.app`)

**In Cloudflare:**
- DNS → Add Record:
  - Type: `CNAME`
  - Name: `@`
  - Target: (paste Railway CNAME)
  - Proxy: ON (orange cloud)
- DNS → Add Record:
  - Type: `CNAME`
  - Name: `www`
  - Target: (same Railway CNAME)
  - Proxy: ON (orange cloud)
- SSL/TLS → Encryption mode: `Full`

### 5. Wait & Test (5-10 min)
- Wait 5-10 minutes for DNS propagation
- Test: `https://talendro.com`
- Test: `https://www.talendro.com`

---

## 🔑 Key Commands

```bash
# Navigate to project
cd "/Users/gregjackson/Desktop/talendro-developer-package copy"

# Check git status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# View Railway logs (in Railway dashboard)
# Service → Deployments → View Logs
```

---

## 📍 Important URLs

- **GitHub**: https://github.com/YOUR_USERNAME/talendro-app
- **Railway Dashboard**: https://railway.app
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Your Live Site**: https://talendro.com

---

## ⚙️ Railway Settings Checklist

- [ ] Build Command: `npm run build`
- [ ] Start Command: `cd server && npm start`
- [ ] NODE_ENV = `production`
- [ ] API keys added (ANTHROPIC_API_KEY, etc.)
- [ ] MongoDB URI added (if using database)
- [ ] Custom domain added: `talendro.com`

---

## 🌐 Cloudflare DNS Checklist

- [ ] CNAME record for `@` (root domain)
- [ ] CNAME record for `www`
- [ ] Both records have orange cloud ON (proxied)
- [ ] SSL/TLS mode set to `Full`
- [ ] Target matches Railway's CNAME exactly

---

## 🐛 Quick Troubleshooting

**Build fails?**
→ Check Railway logs: Service → Deployments → View Logs

**Domain not working?**
→ Wait 10 minutes, check DNS records in Cloudflare

**CORS errors?**
→ Verify `talendro.com` is in `server/index.js` allowedOrigins

**SSL errors?**
→ Set Cloudflare SSL/TLS to "Full", wait 15 minutes

---

**Need more help?** See `COMPLETE_NOVICE_DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

