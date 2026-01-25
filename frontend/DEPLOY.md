# TrustFlow Frontend Deployment

## Vercel Deployment

This frontend is configured for deployment on Vercel.

### Prerequisites

1. Deploy the backend first (to Render/Railway)
2. Get the backend URL (e.g., `https://trustflow-api.onrender.com`)

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the **Root Directory** to `frontend`
4. Add environment variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.onrender.com`
5. Deploy!

### Environment Variable

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://trustflow-api.onrender.com` |

### After Deployment

1. Copy your Vercel frontend URL (e.g., `https://trustflow.vercel.app`)
2. Go to your backend deployment
3. Add to `ALLOWED_ORIGINS`: `https://trustflow.vercel.app`
4. Redeploy backend

### Build Locally

```bash
npm run build
npm run preview  # Test production build
```
