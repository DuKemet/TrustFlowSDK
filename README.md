# TrustFlow Credit SDK

<p align="center">
  <img src="https://img.shields.io/badge/SDK-v1.0.0-00fff2?style=for-the-badge" />
  <img src="https://img.shields.io/badge/API-REST-bf00ff?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Gemini%20Powered-00ff88?style=for-the-badge" />
</p>

## 🚀 What is TrustFlow?

**TrustFlow is an embeddable SDK** that enables lending platforms to perform AI-powered credit assessments using India's Account Aggregator framework and behavioral signals.

> ⚠️ **For Hackathon Evaluators**: This repository contains a **demonstration application** showcasing the SDK capabilities. In production, the entire credit assessment flow is embedded as a white-label component into partner lending applications.

---

## 🎯 Problem Statement

Traditional credit scoring relies on:
- ❌ Credit bureau data (unavailable for 400M+ Indians)
- ❌ Collateral requirements (excludes gig workers)
- ❌ Employment verification (doesn't work for informal sector)

**TrustFlow solves this by:**
- ✅ Analyzing Account Aggregator bank data (AA Framework)
- ✅ Behavioral psychometric signals
- ✅ AI-powered fraud detection
- ✅ Real-time decisioning

---

## 🔌 SDK Integration

### Installation

```bash
npm install @trustflow/credit-sdk
```

### Quick Start

```javascript
import { TrustFlow } from '@trustflow/credit-sdk';

// Initialize SDK
const trustflow = new TrustFlow({
    apiKey: 'your_api_key',
    environment: 'production'
});

// Trigger credit assessment
const assessment = await trustflow.assess({
    aaConsentToken: userConsentToken,
    behavioralData: quizResponses
});

// Use the result
console.log(assessment.score);        // 300-900
console.log(assessment.maxLoanAmount); // Recommended amount
console.log(assessment.verdict);       // AI-generated explanation
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PARTNER LENDING APP                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              TrustFlow SDK (Embedded)                   ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ ││
│  │  │AA Consent│→ │Bank Fetch│→ │  Quiz    │→ │ Result  │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TrustFlow Backend API                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────────┐│
│  │Transaction │  │  Fraud     │  │    Gemini AI Engine     ││
│  │ Analyzer   │  │ Detection  │  │  (Verdict Generation)   ││
│  └────────────┘  └────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Scoring Components

| Component | Weight | Signals Used |
|-----------|--------|--------------|
| **Financial Health** | 50% | Income stability, savings ratio, expense patterns, lender count |
| **Behavioral** | 50% | Quiz responses, impulse control, installed apps, device age |

### Fraud Detection
- 🔍 **Loan Stacking**: Detects multiple simultaneous lenders
- 🔍 **Wash Trading**: Identifies circular transaction patterns
- 🔍 **Risk Apps**: Flags gambling/crypto app usage

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/assess` | Full credit assessment |
| `GET` | `/api/v1/score/:id` | Retrieve assessment result |
| `POST` | `/api/v1/fraud-check` | Standalone fraud detection |
| `POST` | `/api/v1/webhook` | Configure result webhooks |

---

## 🏃 Running the Demo

### Prerequisites
- Python 3.9+
- Node.js 18+
- Gemini API key (optional, for AI verdicts)

### Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** to see the SDK demonstration.

---

## 📁 Project Structure

```
BnGFinal/
├── backend/
│   ├── main.py          # FastAPI server
│   ├── engine.py        # Scoring & fraud detection engine
│   ├── models.py        # Pydantic data models
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── steps/   # Wizard step components
│   │   │   ├── SDKBanner.jsx
│   │   │   └── ...
│   │   ├── App.jsx      # Main wizard flow
│   │   └── index.css    # Cyberpunk theme
│   └── package.json
└── README.md
```

---

## 👥 Team

Built for **Bits & Gigs Hackathon** 🏆

---

## 📄 License

MIT License - For demonstration purposes only.
