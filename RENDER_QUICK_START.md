# ⚡ Render Quick Start - 5 Minute Setup

**Get Talendro running on Render in 5 minutes**

---

## 🚀 Step 1: Push to GitHub (1 min)

```bash
git add .
git commit -m "Migrate to Render"
git push origin main
```

---

## 🚀 Step 2: Create Render Service (2 min)

1. Go to https://render.com → Sign in
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub → Select your repo
4. **Name**: `talendro-app`
5. **Build Command**: `npm run install:all && npm run build`
6. **Start Command**: `cd server && npm start`
7. Click **"Create Web Service"**

---

## 🚀 Step 3: Set Environment Variables (2 min)

In Render → Your Service → **Environment** tab:

**Copy these from Railway:**
- `MONGODB_URI`
- `JWT_SECRET`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_BASIC`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_PREMIUM`
- `STRIPE_WEBHOOK_SECRET`

**Add these:**
- `NODE_ENV` = `production`

---

## ✅ Done!

Your app will be live at: `https://your-app-name.onrender.com`

**Next**: Add custom domain in Render Settings → Custom Domains

---

**Full Guide**: See `RENDER_DEPLOYMENT_GUIDE.md`

