# TrustFlow - B2B Fintech Dashboard

A full-stack alternative credit scoring platform for assessing "Credit Invisible" users (Gig workers, Students) using **behavioral signals** and **account aggregator data** instead of traditional CIBIL scores.

![TrustFlow Dashboard](https://via.placeholder.com/800x400?text=TrustFlow+Dashboard)

## 🏗️ Architecture

```
┌─────────────────┐     REST API     ┌─────────────────┐
│                 │    (JSON)        │                 │
│  React + Vite   │◄───────────────►│    FastAPI      │
│  (Dashboard)    │                  │  (TrustFlow SDK)│
│                 │                  │                 │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              ▼
                                     ┌────────────────┐
                                     │  Gemini 2.0    │
                                     │  Flash AI      │
                                     └────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

## 📡 API Endpoints

### `POST /analyze`
Analyze a loan applicant using financial and behavioral data.

**Request Body:**
```json
{
  "financial": {
    "monthly_income": 45000,
    "monthly_expenses": 32000,
    "lender_count": 1,
    "savings_ratio": 0.28,
    "transactions": []
  },
  "behavioral": {
    "impulse_control_score": 7,
    "installed_apps": ["PhonePe", "Swiggy", "Dream11"],
    "quiz_answers": {
      "saves_regularly": true,
      "waits_before_purchase": true
    }
  }
}
```

**Response:**
```json
{
  "score": 720,
  "risk_level": "Medium",
  "is_fraud": false,
  "recommendation": "APPROVE",
  "max_loan_amount": 67500,
  "financial_health_score": 75,
  "behavioral_score": 62,
  "ai_verdict": "Strong profile with disciplined savings...",
  "reasoning": ["✓ Good savings ratio: 28%", "⚠ Risky apps: Dream11"]
}
```

### `GET /health`
Health check endpoint.

### `GET /demo-persona`
Returns a sample Gig Worker persona for testing.

## 🛡️ Features

### Backend (TrustFlow SDK)
- **Fraud Detection**: Loan Stacking (3+ lenders), Wash Trading
- **Behavioral Scoring**: Impulse control quiz, Risky apps detection
- **Financial Health**: Savings ratio, Income stability analysis
- **AI Verdict**: Gemini 2.0 Flash integration with Risk Officer persona

### Frontend (Lender Dashboard)
- **Score Gauge**: Semi-circle visualization (300-900)
- **Fraud Alert**: Red banner for security risks
- **Insight Cards**: Financial Health, Behavioral Stability, AI Verdict
- **Demo Mode**: Pre-loaded Gig Worker persona

## 📁 Project Structure

```
BnGFinal/
├── backend/
│   ├── main.py           # FastAPI routes
│   ├── engine.py         # Risk analysis logic
│   ├── models.py         # Pydantic data models
│   ├── requirements.txt  # Python dependencies
│   └── .env              # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main dashboard
│   │   ├── index.css         # Tailwind + custom styles
│   │   └── components/
│   │       ├── Sidebar.jsx
│   │       ├── UploadCard.jsx
│   │       ├── FraudAlert.jsx
│   │       ├── ScoreGauge.jsx
│   │       └── InsightCards.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🧪 Testing

### Test the Backend
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"financial":{"monthly_income":45000,"monthly_expenses":30000,"lender_count":1,"savings_ratio":0.15,"transactions":[]},"behavioral":{"impulse_control_score":7,"installed_apps":["PhonePe"],"quiz_answers":{"saves_regularly":true}}}'
```

### Test Fraud Detection
Set `lender_count` to 5 to trigger the Loan Stacking fraud flag:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"financial":{"monthly_income":45000,"monthly_expenses":30000,"lender_count":5,"savings_ratio":0.15,"transactions":[]},"behavioral":{"impulse_control_score":7,"installed_apps":[],"quiz_answers":{}}}'
```

## 📄 License

MIT License
