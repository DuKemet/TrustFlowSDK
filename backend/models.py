"""
TrustFlow SDK - Pydantic Data Models
Models for user behavioral data, financial data, and risk scoring output.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class QuizAnswers(BaseModel):
    """Behavioral quiz answers for impulse control assessment"""
    saves_regularly: bool = Field(default=False, description="User saves money regularly")
    waits_before_purchase: bool = Field(default=False, description="User waits before making big purchases")
    has_budget: bool = Field(default=False, description="User maintains a budget")
    tracks_expenses: bool = Field(default=False, description="User tracks their expenses")
    avoids_impulsive_buying: bool = Field(default=False, description="User avoids impulsive purchases")


class UserData(BaseModel):
    """Behavioral data from user quiz and app usage metadata"""
    impulse_control_score: int = Field(ge=1, le=10, description="Self-reported impulse control (1-10)")
    installed_apps: List[str] = Field(default_factory=list, description="List of installed apps")
    quiz_answers: QuizAnswers = Field(default_factory=QuizAnswers)
    device_age_months: Optional[int] = Field(default=None, description="Age of device in months")
    app_usage_hours_daily: Optional[float] = Field(default=None, description="Daily app usage in hours")


class Transaction(BaseModel):
    """Individual transaction from Account Aggregator data"""
    date: str
    amount: float
    type: str  # "credit" or "debit"
    category: str
    merchant: Optional[str] = None
    counterparty: Optional[str] = None


class FinancialData(BaseModel):
    """Financial data from Account Aggregator (AA) JSON"""
    monthly_income: float = Field(ge=0, description="Monthly income in INR")
    monthly_expenses: float = Field(ge=0, description="Monthly expenses in INR")
    lender_count: int = Field(ge=0, description="Number of active lenders")
    savings_ratio: float = Field(ge=0, le=1, description="Savings as ratio of income")
    transactions: List[Transaction] = Field(default_factory=list)
    average_balance: Optional[float] = Field(default=None, description="Average account balance")
    income_stability: Optional[float] = Field(default=None, ge=0, le=1, description="Income stability score")


class AnalysisRequest(BaseModel):
    """Combined request payload for /analyze endpoint"""
    financial: FinancialData
    behavioral: UserData


class FraudFlags(BaseModel):
    """Fraud detection flags"""
    is_fraud: bool = False
    loan_stacking: bool = Field(default=False, description="3+ active lenders detected")
    wash_trading: bool = Field(default=False, description="Circular transactions detected")
    suspicious_patterns: List[str] = Field(default_factory=list)


class RiskScore(BaseModel):
    """Final risk assessment output"""
    score: int = Field(ge=300, le=900, description="Trust Score (300-900)")
    risk_level: RiskLevel
    is_fraud: bool = False
    fraud_flags: Optional[FraudFlags] = None
    reasoning: List[str] = Field(default_factory=list, description="Explanation for the score")
    recommendation: str = Field(default="", description="Loan recommendation")
    max_loan_amount: Optional[float] = Field(default=None, description="Maximum recommended loan in INR")
    financial_health_score: Optional[int] = Field(default=None, ge=0, le=100)
    behavioral_score: Optional[int] = Field(default=None, ge=0, le=100)
    ai_verdict: Optional[str] = Field(default=None, description="Gemini AI's detailed analysis")
