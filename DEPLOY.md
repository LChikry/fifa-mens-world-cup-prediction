# World Cup Predictor - Deployment Guide

## Prerequisites

1. **Model Artifacts from Google Drive**
2. **Railway Account** (https://railway.app)
3. **Node.js 18+** and **Python 3.11+** for local testing

---

## Step 1: Place Model Artifacts

Download from Google Drive and place in `backend/`:

```
backend/
├── model_artifacts/
│   ├── model_home_goals.joblib
│   ├── model_away_goals.joblib
│   ├── elo_ratings.json
│   ├── player_aggregates.csv
│   ├── feature_columns.json
│   ├── recent_form.json
│   └── country_name_map.json (optional)
│   └── teams_metadata.json (optional - generated if missing)
└── simulations/
    ├── wc2022_simulation.json
    └── wc2026_simulation.json
```

Also place `wc22.json` (2022 World Cup groups) at the project root or in `backend/`.

---

## Step 2: Local Testing

### Backend

```bash
cd backend
conda activate py13  # or your Python environment
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Test at: http://localhost:8000/api/teams

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

---

## Step 3: Deploy to Railway

### Option A: Deploy via Railway Dashboard

1. Go to https://railway.app and create a new project
2. Click "New Service" → "GitHub Repo" and select this repository
3. Create **two services**:

#### Backend Service:
- Root Directory: `backend`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add environment variable: (none required)

#### Frontend Service:
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Add environment variable:
  - `VITE_API_URL` = `https://your-backend-service.railway.app`

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy backend
cd backend
railway up

# Deploy frontend (in separate service)
cd ../frontend
railway up
```

---

## Step 4: Configure Environment Variables

In Railway dashboard, set for the **frontend** service:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend-url.railway.app` |

---

## File Structure

```
world-cup-prediction/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── predictor.py         # ML prediction logic
│   ├── iso_codes.py         # Country code mapping
│   ├── requirements.txt     # Python dependencies
│   ├── Procfile            # Railway/Heroku start command
│   ├── runtime.txt         # Python version
│   ├── railway.toml        # Railway config
│   ├── model_artifacts/    # ML models (from Google Drive)
│   └── simulations/        # Pre-computed results
├── frontend/
│   ├── src/                # React app source
│   ├── package.json        # Node dependencies
│   ├── vite.config.ts      # Vite configuration
│   └── railway.toml        # Railway config
├── railway.json            # Root Railway config
└── wc22.json              # 2022 World Cup groups
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/teams` | GET | List all available teams |
| `/api/presets` | GET | List available presets |
| `/api/presets/{name}` | GET | Get preset (wc2022, wc2026) |
| `/api/predict` | POST | Predict single match |
| `/api/simulate` | POST | Run tournament simulation |

---

## Troubleshooting

### "Models not found" error
- Ensure `model_artifacts/` folder contains all required files
- Check file permissions

### "Cannot connect to API" on frontend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in `backend/main.py`

### Slow first request
- Models load on first request (~5-10 seconds)
- Subsequent requests are fast

---

## Cost Considerations

Railway offers:
- **Free tier**: 500 hours/month, 512MB RAM
- **Hobby tier**: $5/month per service

For production, consider:
- Capping simulation iterations (default: 100, max: 500)
- Using precomputed results for presets
