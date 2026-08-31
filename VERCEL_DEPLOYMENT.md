# Deploying OFENetworks Frontend on Vercel

Vercel is the official host for Next.js applications and provides instant automated deployment, global CDN edge performance, automatic SSL certificates, and zero static-export configuration issues.

---

## Quick Setup Guide (3 Steps)

### Step 1: Connect your GitHub Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import your GitHub repository (`Ofenetwork_backend` or your frontend repo).

### Step 2: Configure Project Settings
When importing the project in Vercel:
- **Framework Preset**: `Next.js`
- **Root Directory**: `frontend` *(Click Edit and select the `frontend` directory)*
- **Build Command**: `npm run build` *(Auto-detected)*
- **Output Directory**: `.next` *(Auto-detected)*

### Step 3: Add Environment Variables
In the **Environment Variables** section on Vercel, add:

| Key | Value | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Your live backend API URL | `https://ofenetwork-backend.onrender.com/api` |

Click **Deploy**! Vercel will build and launch your application in under 60 seconds with a free `.vercel.app` URL and automatic custom domain support.

---

## Custom Domain Setup (Optional)

1. In your Vercel Project Settings, navigate to **Domains**.
2. Enter your domain name (e.g. `ofenetworks.com` or `app.ofenetworks.com`).
3. Point your domain's DNS CNAME/A records to Vercel as instructed on screen.
4. SSL certification is automatically issued and renewed by Vercel.

---

## Backend CORS Configuration

Ensure your live backend environment variable (`CORS_ORIGIN`) includes your new Vercel domain:
```env
CORS_ORIGIN=https://your-app-name.vercel.app,https://your-custom-domain.com
```
