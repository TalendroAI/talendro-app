# Talendro — Environment Variable Setup Guide

This document lists every environment variable required to run Talendro in production,
where to get each value, and what happens if it is missing.

---

## How to Set Variables in Render.com

1. Go to your Render.com dashboard → select the **talendro-app** service
2. Click **Environment** in the left sidebar
3. Click **Add Environment Variable** for each variable below
4. Click **Save Changes** — Render will automatically redeploy

---

## Required Variables (Service will not function without these)

| Variable | Where to Get It | Notes |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers | Format: `mongodb+srv://user:pass@cluster.mongodb.net/talendro` |
| `JWT_SECRET` | Generate: `openssl rand -hex 64` | Must be at least 32 characters |
| `OPENAI_API_KEY` | platform.openai.com → API Keys | Required for all AI features |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API Keys | Use `sk_live_...` in production |
| `STRIPE_PUBLISHABLE_KEY` | Same page as above | Use `pk_live_...` in production |
| `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → Webhooks → your endpoint → Signing secret | Format: `whsec_...` |
| `STRIPE_PRICE_ID_STARTER_APPLY` | Stripe → Products → Starter plan → Price ID | Format: `price_...` |
| `STRIPE_PRICE_ID_PRO_APPLY` | Stripe → Products → Pro plan → Price ID | Format: `price_...` |
| `STRIPE_PRICE_ID_CONCIERGE_APPLY` | Stripe → Products → Concierge plan → Price ID | Format: `price_...` |
| `RESEND_API_KEY` | resend.com → API Keys | Required for all transactional emails |
| `TWILIO_ACCOUNT_SID` | console.twilio.com → Account Info | Required for SMS alerts |
| `TWILIO_AUTH_TOKEN` | console.twilio.com → Account Info | Required for SMS alerts |
| `TWILIO_FROM_NUMBER` | Twilio → Phone Numbers | Format: `+15551234567` |
| `ADMIN_SECRET_KEY` | Generate: `openssl rand -hex 32` | Protects the `/api/admin/*` endpoints |

---

## Recommended Variables (Degrades functionality if missing)

| Variable | Where to Get It | Impact if Missing |
|---|---|---|
| `CAPSOLVER_API_KEY` | capsolver.com → Dashboard | CAPTCHA solving disabled — more applications will be blocked |
| `RAPIDAPI_KEY` | rapidapi.com → My Apps | JSearch and Fantastic.jobs job sources disabled |
| `USAJOBS_API_KEY` | developer.usajobs.gov | Federal government jobs disabled |
| `USAJOBS_USER_AGENT` | Your email address | Required alongside USAJOBS_API_KEY |
| `REDIS_URL` | Render.com → Create Redis → Internal URL | Falls back to in-memory queue (fine for beta, not for scale) |

---

## Optional Variables

| Variable | Where to Get It | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Fallback AI model (Claude) |
| `XAI_API_KEY` | x.ai | Fallback AI model (Grok) |
| `ZIPRECRUITER_API_KEY` | Contact ZipRecruiter | Partner API access required |
| `GREENHOUSE_API_KEY` | Only needed if posting jobs | Not required for reading public boards |

---

## Stripe Webhook Setup

After deploying to Render.com, configure the Stripe webhook:

1. Go to dashboard.stripe.com → Developers → Webhooks
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://your-render-url.onrender.com/api/webhooks/stripe`
4. Select these events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
5. Copy the **Signing secret** → paste into `STRIPE_WEBHOOK_SECRET`

---

## Admin Panel Usage

Once `ADMIN_SECRET_KEY` is set, you can query the admin API from any HTTP client:

```bash
# Health check
curl https://your-app.onrender.com/api/admin/health \
  -H "x-admin-key: YOUR_ADMIN_SECRET_KEY"

# Platform stats
curl https://your-app.onrender.com/api/admin/stats \
  -H "x-admin-key: YOUR_ADMIN_SECRET_KEY"

# Recent errors
curl https://your-app.onrender.com/api/admin/errors \
  -H "x-admin-key: YOUR_ADMIN_SECRET_KEY"

# Reset a user's monthly quota
curl -X POST https://your-app.onrender.com/api/admin/user/USER_ID/reset-quota \
  -H "x-admin-key: YOUR_ADMIN_SECRET_KEY"
```

---

## Redis Setup (Recommended for Production)

1. In Render.com dashboard → click **New** → **Redis**
2. Choose **Free** tier (sufficient for beta)
3. After creation, copy the **Internal URL**
4. Paste into `REDIS_URL` environment variable on the talendro-app service
5. Redeploy — BullMQ activates automatically

