# 🚀 Railway to Render Migration Summary

**Quick reference for migrating Talendro from Railway to Render**

---

## ✅ WHAT'S BEEN UPDATED

### 1. Configuration Files
- ✅ **`render.yaml`** - Created Render configuration file
- ✅ **`Procfile`** - Already exists and works with Render (no changes needed)

### 2. Code Updates
- ✅ **`server/index.js`** - Removed Railway-specific CORS references, kept Render support
- ✅ **`client/src/utils/api.js`** - Removed Railway detection, kept Render support

### 3. Documentation
- ✅ **`RENDER_DEPLOYMENT_GUIDE.md`** - Complete step-by-step deployment guide
- ✅ **`RENDER_ENVIRONMENT_VARIABLES.md`** - Environment variables reference

---

## 🎯 QUICK START

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Migrate to Render - add render.yaml and update configuration"
git push origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` configuration
5. Set environment variables (see `RENDER_ENVIRONMENT_VARIABLES.md`)
6. Deploy!

### Step 3: Set Environment Variables
Copy all environment variables from Railway to Render:
- `MONGODB_URI`
- `JWT_SECRET`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_BASIC`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_PREMIUM`
- `STRIPE_WEBHOOK_SECRET`
- `NODE_ENV=production`
- `FRONTEND_URL` (optional)
- `DOMAIN` (optional)

### Step 4: Update Stripe Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Update webhook URL to: `https://your-app.onrender.com/api/webhooks/stripe`
3. Copy new webhook secret
4. Update `STRIPE_WEBHOOK_SECRET` in Render

### Step 5: Add Custom Domain
1. In Render → Settings → Custom Domains
2. Add `talendro.com`
3. Update DNS records (CNAME to Render URL)
4. Wait for SSL certificate (5-10 minutes)

---

## 📋 KEY DIFFERENCES: Railway vs Render

| Feature | Railway | Render |
|---------|---------|--------|
| **Config File** | `railway.json` | `render.yaml` |
| **Procfile** | ✅ Supported | ✅ Supported |
| **Auto Deploy** | ✅ Yes | ✅ Yes (from GitHub) |
| **Environment Vars** | Dashboard | Dashboard |
| **Custom Domain** | ✅ Yes | ✅ Yes |
| **SSL** | ✅ Auto | ✅ Auto |
| **Free Tier** | Limited | ✅ Generous |
| **Build Logs** | ✅ Yes | ✅ Yes |

---

## 🔄 MIGRATION CHECKLIST

### Pre-Migration
- [ ] Export environment variables from Railway (screenshot or copy)
- [ ] Note your Railway MongoDB connection string
- [ ] Note your Stripe webhook endpoint URL
- [ ] Backup any important data

### During Migration
- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] Create new Web Service on Render
- [ ] Set all environment variables
- [ ] Update Stripe webhook endpoint
- [ ] Test Render URL
- [ ] Add custom domain
- [ ] Update DNS records
- [ ] Verify SSL certificate

### Post-Migration
- [ ] Test all functionality
- [ ] Verify payments work
- [ ] Check user authentication
- [ ] Test resume parsing
- [ ] Monitor Render logs
- [ ] Cancel Railway subscription (after confirming Render works)

---

## ⚠️ IMPORTANT NOTES

1. **Database**: Your MongoDB connection string should work as-is (if using MongoDB Atlas)
2. **Stripe Webhooks**: Must update webhook URL in Stripe dashboard
3. **DNS Propagation**: Can take 5-30 minutes (up to 48 hours)
4. **SSL Certificate**: Render auto-provisions SSL (takes 5-10 minutes)
5. **Environment Variables**: Copy all from Railway to Render

---

## 🐛 COMMON ISSUES

### Build Fails
- Check `render.yaml` syntax
- Verify build command: `npm run install:all && npm run build`
- Check Render logs for specific errors

### App Not Loading
- Check environment variables are set
- Verify MongoDB connection
- Check Render logs for errors

### Domain Not Working
- Verify DNS records point to Render
- Check DNS propagation: https://dnschecker.org
- Wait for SSL certificate to provision

---

## 📚 DOCUMENTATION

- **Full Deployment Guide**: `RENDER_DEPLOYMENT_GUIDE.md`
- **Environment Variables**: `RENDER_ENVIRONMENT_VARIABLES.md`
- **Render Docs**: https://render.com/docs

---

## ✅ NEXT STEPS

1. **Read** `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions
2. **Review** `RENDER_ENVIRONMENT_VARIABLES.md` for all required variables
3. **Deploy** to Render following the guide
4. **Test** everything thoroughly
5. **Cancel** Railway subscription once confirmed working

---

**Migration Status**: ✅ Ready to Deploy
**Last Updated**: Migration from Railway to Render

