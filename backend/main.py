"""
TrustFlow SDK - FastAPI Backend
REST API for alternative credit scoring using behavioral and financial signals.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from models import AnalysisRequest, RiskScore, RiskLevel
from engine import (
    detect_fraud,
    calculate_behavior_score,
    calculate_financial_health,
    get_gemini_verdict
)

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    print("🚀 TrustFlow SDK Engine starting...")
    print(f"📊 Gemini API: {'Configured' if os.getenv('GOOGLE_API_KEY') else 'Not configured (using fallback)'}")
    yield
    print("👋 TrustFlow SDK Engine shutting down...")


app = FastAPI(
    title="TrustFlow SDK",
    description="Alternative Credit Scoring Engine for Credit Invisible Users",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TrustFlow SDK",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "gemini_configured": bool(os.getenv("GOOGLE_API_KEY")),
        "engine": "operational"
    }


@app.post("/analyze", response_model=RiskScore)
async def analyze_applicant(request: AnalysisRequest):
    """
    Analyze a loan applicant using financial and behavioral data.
    
    Returns a comprehensive risk assessment with:
    - Trust Score (300-900)
    - Risk Level (Low/Medium/High)
    - Fraud Detection Results
    - AI-Powered Verdict and Reasoning
    """
    try:
        # Step 1: Detect Fraud
        fraud_flags = detect_fraud(request.financial)
        
        # Step 2: Calculate Behavioral Score
        behavior_score, behavior_reasoning = calculate_behavior_score(request.behavioral)
        
        # Step 3: Calculate Financial Health Score
        financial_health_score, financial_reasoning = calculate_financial_health(request.financial)
        
        # Step 4: Get AI Verdict
        ai_verdict, recommendation, final_score, max_loan = await get_gemini_verdict(
            financial_data=request.financial,
            behavior_score=behavior_score,
            financial_health_score=financial_health_score,
            fraud_flags=fraud_flags,
            behavior_reasoning=behavior_reasoning,
            financial_reasoning=financial_reasoning
        )
        
        # If fraud detected, override with rejection
        if fraud_flags.is_fraud:
            final_score = min(final_score, 400)
            recommendation = "REJECT"
            max_loan = 0.0
        
        # Determine risk level from score
        if final_score >= 750:
            risk_level = RiskLevel.LOW
        elif final_score >= 550:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.HIGH
        
        # Compile all reasoning
        all_reasoning = []
        all_reasoning.extend(financial_reasoning)
        all_reasoning.extend(behavior_reasoning)
        if fraud_flags.suspicious_patterns:
            all_reasoning.extend(fraud_flags.suspicious_patterns)
        
        return RiskScore(
            score=final_score,
            risk_level=risk_level,
            is_fraud=fraud_flags.is_fraud,
            fraud_flags=fraud_flags,
            reasoning=all_reasoning,
            recommendation=recommendation,
            max_loan_amount=max_loan if max_loan > 0 else None,
            financial_health_score=financial_health_score,
            behavioral_score=behavior_score,
            ai_verdict=ai_verdict
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Demo endpoint for testing
@app.get("/demo-persona")
async def get_demo_persona():
    """Returns a demo persona for testing the dashboard"""
    return {
        "financial": {
            "monthly_income": 45000,
            "monthly_expenses": 32000,
            "lender_count": 1,
            "savings_ratio": 0.28,
            "income_stability": 0.75,
            "average_balance": 25000,
            "transactions": [
                {"date": "2024-01-15", "amount": 45000, "type": "credit", "category": "salary", "merchant": "Zomato Partner"},
                {"date": "2024-01-16", "amount": 8000, "type": "debit", "category": "rent", "merchant": "Landlord"},
                {"date": "2024-01-18", "amount": 3500, "type": "debit", "category": "utilities", "merchant": "BESCOM"},
                {"date": "2024-01-20", "amount": 5000, "type": "debit", "category": "groceries", "merchant": "BigBasket"},
                {"date": "2024-01-25", "amount": 2000, "type": "debit", "category": "entertainment", "merchant": "Dream11"}
            ]
        },
        "behavioral": {
            "impulse_control_score": 7,
            "installed_apps": ["PhonePe", "Google Pay", "Swiggy", "Zomato", "Dream11", "LinkedIn"],
            "quiz_answers": {
                "saves_regularly": True,
                "waits_before_purchase": True,
                "has_budget": False,
                "tracks_expenses": True,
                "avoids_impulsive_buying": False
            },
            "device_age_months": 18,
            "app_usage_hours_daily": 4.5
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
