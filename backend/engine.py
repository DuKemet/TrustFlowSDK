"""
TrustFlow SDK - Risk Analysis Engine
Core logic for fraud detection, behavioral scoring, and AI-powered verdict.
"""

import os
from typing import Dict, List, Tuple
from models import FinancialData, UserData, FraudFlags, RiskLevel
from google import genai
from google.genai import types


# Risky app categories
GAMBLING_APPS = ["dream11", "mpl", "rummy", "teen patti", "poker", "bet365", "1xbet", "parimatch", "betway"]
CRYPTO_APPS = ["binance", "wazirx", "coinswitch", "coindcx", "zebpay", "kucoin"]
HIGH_RISK_APPS = GAMBLING_APPS + CRYPTO_APPS


def detect_fraud(financial_data: FinancialData) -> FraudFlags:
    """
    Detect fraudulent patterns in financial data.
    
    Checks for:
    1. Loan Stacking: 3+ active lenders is a red flag
    2. Wash Trading: Circular transactions (money going out and coming back)
    """
    flags = FraudFlags()
    suspicious_patterns = []
    
    # Check for Loan Stacking
    if financial_data.lender_count >= 3:
        flags.loan_stacking = True
        suspicious_patterns.append(f"Loan Stacking Alert: {financial_data.lender_count} active lenders detected")
    
    # Check for Wash Trading (simplified: look for matching in/out transactions)
    if financial_data.transactions:
        credits = {}
        debits = {}
        
        for txn in financial_data.transactions:
            counterparty = txn.counterparty or txn.merchant or "unknown"
            if txn.type == "credit":
                credits[counterparty] = credits.get(counterparty, 0) + txn.amount
            else:
                debits[counterparty] = debits.get(counterparty, 0) + txn.amount
        
        # Find potential wash trading (same counterparty with similar in/out amounts)
        for party in credits:
            if party in debits:
                credit_amt = credits[party]
                debit_amt = debits[party]
                # If amounts are within 10% of each other, suspicious
                if credit_amt > 0 and abs(credit_amt - debit_amt) / credit_amt < 0.1:
                    flags.wash_trading = True
                    suspicious_patterns.append(f"Wash Trading Suspected: Circular flow with {party}")
    
    # High expense ratio is suspicious
    if financial_data.monthly_income > 0:
        expense_ratio = financial_data.monthly_expenses / financial_data.monthly_income
        if expense_ratio > 0.95:
            suspicious_patterns.append("Expense ratio exceeds 95% of income")
    
    flags.suspicious_patterns = suspicious_patterns
    flags.is_fraud = flags.loan_stacking or flags.wash_trading
    
    return flags


def calculate_behavior_score(user_data: UserData) -> Tuple[int, List[str]]:
    """
    Calculate behavioral score based on impulse control quiz and app usage.
    
    Returns:
        Tuple of (score 0-100, list of reasoning)
    """
    score = 50  # Base score
    reasoning = []
    
    # Impulse Control Score contribution (up to 30 points)
    impulse_points = (user_data.impulse_control_score / 10) * 30
    score += impulse_points - 15  # Center around 0
    reasoning.append(f"Impulse control self-rating: {user_data.impulse_control_score}/10")
    
    # Quiz answers contribution (up to 25 points)
    quiz = user_data.quiz_answers
    quiz_score = 0
    if quiz.saves_regularly:
        quiz_score += 5
        reasoning.append("✓ Saves money regularly")
    if quiz.waits_before_purchase:
        quiz_score += 5
        reasoning.append("✓ Waits before big purchases")
    if quiz.has_budget:
        quiz_score += 5
        reasoning.append("✓ Maintains a budget")
    if quiz.tracks_expenses:
        quiz_score += 5
        reasoning.append("✓ Tracks expenses")
    if quiz.avoids_impulsive_buying:
        quiz_score += 5
        reasoning.append("✓ Avoids impulsive buying")
    
    score += quiz_score - 12.5  # Center around 0
    
    # Risky Apps penalty (up to -25 points)
    risky_apps_found = []
    for app in user_data.installed_apps:
        app_lower = app.lower()
        for risky in HIGH_RISK_APPS:
            if risky in app_lower:
                risky_apps_found.append(app)
                break
    
    if risky_apps_found:
        penalty = min(len(risky_apps_found) * 10, 25)
        score -= penalty
        reasoning.append(f"⚠ Risky apps detected: {', '.join(risky_apps_found)}")
    else:
        score += 10
        reasoning.append("✓ No high-risk apps detected")
    
    # Clamp score to 0-100
    score = max(0, min(100, int(score)))
    
    return score, reasoning


def calculate_financial_health(financial_data: FinancialData) -> Tuple[int, List[str]]:
    """
    Calculate financial health score based on income, expenses, and savings.
    
    Returns:
        Tuple of (score 0-100, list of reasoning)
    """
    score = 50
    reasoning = []
    
    # Savings ratio contribution (up to 30 points)
    if financial_data.savings_ratio >= 0.3:
        score += 30
        reasoning.append(f"✓ Excellent savings ratio: {financial_data.savings_ratio:.0%}")
    elif financial_data.savings_ratio >= 0.2:
        score += 20
        reasoning.append(f"✓ Good savings ratio: {financial_data.savings_ratio:.0%}")
    elif financial_data.savings_ratio >= 0.1:
        score += 10
        reasoning.append(f"○ Moderate savings ratio: {financial_data.savings_ratio:.0%}")
    else:
        score -= 10
        reasoning.append(f"⚠ Low savings ratio: {financial_data.savings_ratio:.0%}")
    
    # Income stability
    if financial_data.income_stability is not None:
        if financial_data.income_stability >= 0.8:
            score += 15
            reasoning.append("✓ Stable income pattern")
        elif financial_data.income_stability >= 0.5:
            score += 5
            reasoning.append("○ Moderately stable income")
        else:
            score -= 10
            reasoning.append("⚠ Irregular income pattern")
    
    # Lender count impact
    if financial_data.lender_count == 0:
        score += 10
        reasoning.append("✓ No existing loans")
    elif financial_data.lender_count == 1:
        score += 5
        reasoning.append("○ One existing lender")
    elif financial_data.lender_count == 2:
        reasoning.append("⚠ Two existing lenders")
    else:
        score -= 20
        reasoning.append(f"⛔ Multiple lenders: {financial_data.lender_count}")
    
    # Clamp score
    score = max(0, min(100, int(score)))
    
    return score, reasoning


async def get_gemini_verdict(
    financial_data: FinancialData,
    behavior_score: int,
    financial_health_score: int,
    fraud_flags: FraudFlags,
    behavior_reasoning: List[str],
    financial_reasoning: List[str]
) -> Tuple[str, str, int, float]:
    """
    Call Google Gemini API to synthesize all data into a final decision.
    
    Returns:
        Tuple of (verdict_text, recommendation, final_score, max_loan_amount)
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        # Fallback logic without Gemini
        return _fallback_verdict(financial_data, behavior_score, financial_health_score, fraud_flags)
    
    client = genai.Client(api_key=api_key)
    
    # Prepare the analysis prompt
    prompt = f"""
Analyze this loan applicant and provide your verdict:

## Financial Profile
- Monthly Income: ₹{financial_data.monthly_income:,.0f}
- Monthly Expenses: ₹{financial_data.monthly_expenses:,.0f}
- Savings Ratio: {financial_data.savings_ratio:.1%}
- Number of Active Lenders: {financial_data.lender_count}
- Financial Health Score: {financial_health_score}/100

Financial Analysis:
{chr(10).join('- ' + r for r in financial_reasoning)}

## Behavioral Profile
- Behavioral Score: {behavior_score}/100

Behavioral Analysis:
{chr(10).join('- ' + r for r in behavior_reasoning)}

## Fraud Detection
- Is Fraud Detected: {fraud_flags.is_fraud}
- Loan Stacking: {fraud_flags.loan_stacking}
- Wash Trading: {fraud_flags.wash_trading}
- Suspicious Patterns: {', '.join(fraud_flags.suspicious_patterns) if fraud_flags.suspicious_patterns else 'None'}

Based on the above, provide:
1. Your overall assessment (2-3 sentences)
2. APPROVE or REJECT recommendation
3. If APPROVE, recommended maximum loan amount in INR
4. Trust Score (300-900 scale)

Format your response as:
VERDICT: [Your assessment]
RECOMMENDATION: [APPROVE/REJECT]
MAX_LOAN: [Amount in INR or 0 if REJECT]
SCORE: [300-900]
"""

    system_instruction = """You are a conservative Risk Officer at a modern fintech lender in India. 
Your role is to assess loan applications for "Credit Invisible" users - gig workers, students, and first-time borrowers.

Rules:
1. If ANY fraud is detected (loan stacking, wash trading), you MUST REJECT
2. If financials are weak but behavioral discipline is strong (consistent savings, good impulse control), you may APPROVE a small loan
3. High-risk apps (gambling, crypto) are red flags but not automatic rejections if other factors are strong
4. Consider the holistic picture - a gig worker with variable income but consistent savings is better than a salaried person living paycheck to paycheck
5. Be conservative - when in doubt, reject or approve a smaller amount

Scoring Guide:
- 300-500: High Risk (Reject)
- 500-650: Medium Risk (Small loan if behavioral score is strong)
- 650-750: Low-Medium Risk (Moderate loan)
- 750-900: Low Risk (Full loan approval)"""

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
            )
        )
        
        response_text = response.text
        
        # Parse the response
        verdict = ""
        recommendation = "REJECT"
        max_loan = 0.0
        score = 500
        
        for line in response_text.split('\n'):
            line = line.strip()
            if line.startswith("VERDICT:"):
                verdict = line.replace("VERDICT:", "").strip()
            elif line.startswith("RECOMMENDATION:"):
                rec = line.replace("RECOMMENDATION:", "").strip().upper()
                recommendation = "APPROVE" if "APPROVE" in rec else "REJECT"
            elif line.startswith("MAX_LOAN:"):
                try:
                    loan_str = line.replace("MAX_LOAN:", "").strip()
                    loan_str = ''.join(c for c in loan_str if c.isdigit() or c == '.')
                    max_loan = float(loan_str) if loan_str else 0.0
                except:
                    max_loan = 0.0
            elif line.startswith("SCORE:"):
                try:
                    score_str = line.replace("SCORE:", "").strip()
                    score_str = ''.join(c for c in score_str if c.isdigit())
                    score = int(score_str) if score_str else 500
                    score = max(300, min(900, score))
                except:
                    score = 500
        
        return verdict, recommendation, score, max_loan
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return _fallback_verdict(financial_data, behavior_score, financial_health_score, fraud_flags)


def _fallback_verdict(
    financial_data: FinancialData,
    behavior_score: int,
    financial_health_score: int,
    fraud_flags: FraudFlags
) -> Tuple[str, str, int, float]:
    """Fallback verdict logic when Gemini is unavailable"""
    
    if fraud_flags.is_fraud:
        return (
            "Application rejected due to detected fraud indicators. Multiple red flags found in transaction patterns.",
            "REJECT",
            350,
            0.0
        )
    
    combined_score = (behavior_score + financial_health_score) / 2
    
    if combined_score >= 70:
        trust_score = int(650 + (combined_score - 70) * 8.33)
        max_loan = min(financial_data.monthly_income * 3, 200000)
        return (
            f"Strong profile with good financial discipline and behavioral indicators. Recommended for loan approval.",
            "APPROVE",
            min(900, trust_score),
            max_loan
        )
    elif combined_score >= 50:
        trust_score = int(500 + (combined_score - 50) * 7.5)
        max_loan = min(financial_data.monthly_income * 1.5, 75000)
        return (
            f"Moderate risk profile. Financial health is acceptable and behavioral signals show discipline.",
            "APPROVE",
            trust_score,
            max_loan
        )
    else:
        trust_score = int(300 + combined_score * 4)
        return (
            f"High risk profile. Recommend building credit history before applying.",
            "REJECT",
            max(300, trust_score),
            0.0
        )
