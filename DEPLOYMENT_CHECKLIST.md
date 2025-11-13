# ✅ Deployment Checklist - Quick Reference

Use this checklist as you go through the deployment process.

## Phase 1: Prepare Code ✅

- [ ] Create GitHub account (if needed)
- [ ] Create new GitHub repository
- [ ] Push code to GitHub
- [ ] Verify code is on GitHub

## Phase 2: Deploy to Railway ✅

- [ ] Log into Railway
- [ ] Create new project
- [ ] Connect to GitHub repository
- [ ] Wait for initial build
- [ ] Set Build Command: `npm run build`
- [ ] Set Start Command: `cd server && npm start`
- [ ] Add environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `CLAUDE_API_KEY` (if you have it)
  - [ ] `ANTHROPIC_API_KEY` (if you have it)
  - [ ] `AFFINDA_API_KEY` (if using)
  - [ ] `MONGODB_URI` (if using database)
- [ ] Wait for deployment to complete
- [ ] Test Railway URL (should see your app!)

## Phase 3: Connect Domain ✅

- [ ] Add custom domain in Railway
- [ ] Copy DNS instructions from Railway
- [ ] Log into Cloudflare
- [ ] Go to DNS settings
- [ ] Add CNAME record for root domain (@)
- [ ] Add CNAME record for www subdomain
- [ ] Set SSL/TLS to "Full" in Cloudflare
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Test your domain (should see your app!)

## Phase 4: Final Configuration ✅

- [ ] Update CORS in `server/index.js` with your domain
- [ ] Push changes to GitHub
- [ ] Wait for Railway to redeploy
- [ ] Test everything works:
  - [ ] Homepage loads
  - [ ] Resume upload works
  - [ ] API endpoints respond
  - [ ] Forms populate correctly

## 🎉 Success!

Your app is now live at: `https://yourdomain.com`

---

## Quick Commands Reference

```bash
# Navigate to project
cd "/Users/gregjackson/Desktop/talendro-developer-package copy"

# Git commands (first time)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# Git commands (after changes)
git add .
git commit -m "Description of changes"
git push
```

---

## Important URLs to Save

- **Railway Dashboard**: https://railway.app
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub Repository**: https://github.com/YOUR_USERNAME/YOUR_REPO
- **Your Live Site**: https://yourdomain.com
- **Railway URL**: https://your-app-name.up.railway.app

---

## Need Help?

1. Check Railway logs first (Service → Deployments → View logs)
2. Check Cloudflare DNS records match Railway's instructions
3. Test Railway URL before testing custom domain
4. Verify environment variables are set correctly

