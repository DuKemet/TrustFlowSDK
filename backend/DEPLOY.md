# TrustFlow Backend Deployment

## Render / Railway Deployment

This backend is configured for deployment on Render or Railway.

### Environment Variables Required

Set these in your deployment platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Gemini API key for AI verdicts | `AIzaSy...` |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs | `https://your-app.vercel.app` |

### Deploy to Render

1. Go to [render.com](https://render.com)
2. Connect your GitHub repo
3. Select "Web Service"
4. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy!

### Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Railway auto-detects Python
4. Add environment variables
5. Deploy!

### Health Check

After deployment, verify at:
```
https://your-backend-url.onrender.com/health
```
