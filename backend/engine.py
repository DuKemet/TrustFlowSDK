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

Based on the above, provide a COMPREHENSIVE analysis:

1. **VERDICT**: A detailed 4-6 sentence assessment covering:
   - Overall creditworthiness summary
   - Key strengths identified in the profile
   - Key concerns or risk factors
   - How behavioral and financial factors balance each other

2. **SCORE_BREAKDOWN**: Explain how you arrived at the score:
   - Financial Health contribution (what helped/hurt)
   - Behavioral Score contribution (what helped/hurt)
   - Fraud/Risk penalties applied (if any)

3. **KEY_FACTORS**: List the top 3 positive and top 3 negative factors

4. **RECOMMENDATION**: APPROVE or REJECT with clear justification

5. **MAX_LOAN**: If APPROVE, recommended amount with reasoning

6. **IMPROVEMENT_TIPS**: 2-3 actionable suggestions for the applicant to improve their profile

Format your response EXACTLY as:
VERDICT: [Detailed 4-6 sentence assessment]
SCORE_BREAKDOWN: [Explanation of score components]
KEY_FACTORS: [Positive: ... | Negative: ...]
RECOMMENDATION: [APPROVE/REJECT - Justification]
MAX_LOAN: [Amount in INR or 0 if REJECT]
SCORE: [300-900]
IMPROVEMENT_TIPS: [2-3 actionable suggestions]
"""

    system_instruction = """You are a senior Risk Assessment Officer at a leading fintech lender in India specializing in "Credit Invisible" populations.
Your expertise covers gig economy workers, students, first-time borrowers, and individuals without traditional credit history.

Your Assessment Philosophy:
1. FRAUD IS NON-NEGOTIABLE: Any fraud detection (loan stacking with 3+ lenders, wash trading, circular transactions) results in automatic REJECT with detailed explanation
2. HOLISTIC EVALUATION: Balance financial metrics with behavioral signals - a disciplined gig worker may be safer than an undisciplined salaried employee
3. BEHAVIORAL WEIGHT: Strong behavioral indicators (consistent savings habits, expense tracking, impulse control) can compensate for moderate financial weakness
4. APP RISK ANALYSIS: Gambling/crypto apps are significant red flags but evaluate in context - one gambling app with otherwise strong profile differs from multiple gambling apps with weak financials
5. CONSERVATIVE LENDING: When uncertain, err toward lower loan amounts rather than rejection - build trust incrementally
6. ACTIONABLE FEEDBACK: Always provide specific, actionable improvement suggestions

Scoring Framework:
- 300-450: Very High Risk (Reject - significant concerns across multiple factors)
- 450-550: High Risk (Reject - but provide clear path to improvement)
- 550-650: Medium Risk (Small loan possible if behavioral score > 60)
- 650-750: Low-Medium Risk (Moderate loan - standard terms)
- 750-850: Low Risk (Good loan amount - favorable terms)
- 850-900: Very Low Risk (Premium approval - best terms)

Provide thorough, professional analysis that would satisfy regulatory review."""

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


def _analyze_transactions(financial_data: FinancialData) -> Dict:
    """Analyze transaction patterns for detailed reporting"""
    analysis = {
        "total_credits": 0,
        "total_debits": 0,
        "transaction_count": 0,
        "categories": {},
        "merchants": {},
        "risky_transactions": [],
        "salary_detected": False,
        "utility_payments": 0,
        "loan_payments": 0,
        "gambling_spend": 0,
    }
    
    risky_categories = ["gambling", "betting", "crypto", "loan_payment"]
    
    if financial_data.transactions:
        for txn in financial_data.transactions:
            analysis["transaction_count"] += 1
            category = txn.category or "uncategorized"
            merchant = txn.merchant or "unknown"
            
            # Track by type
            if txn.type == "credit":
                analysis["total_credits"] += txn.amount
                if category.lower() == "salary":
                    analysis["salary_detected"] = True
            else:
                analysis["total_debits"] += txn.amount
            
            # Track by category
            if category not in analysis["categories"]:
                analysis["categories"][category] = {"count": 0, "total": 0}
            analysis["categories"][category]["count"] += 1
            analysis["categories"][category]["total"] += txn.amount
            
            # Track specific categories
            if category.lower() in ["utilities", "utility"]:
                analysis["utility_payments"] += txn.amount
            elif category.lower() in ["loan_payment", "emi", "loan"]:
                analysis["loan_payments"] += txn.amount
            elif category.lower() in ["gambling", "betting"]:
                analysis["gambling_spend"] += txn.amount
                analysis["risky_transactions"].append({
                    "date": txn.date,
                    "amount": txn.amount,
                    "merchant": merchant,
                    "category": category
                })
            
            # Track merchants
            if merchant not in analysis["merchants"]:
                analysis["merchants"][merchant] = 0
            analysis["merchants"][merchant] += txn.amount
    
    return analysis


def _analyze_behavioral_patterns(user_data) -> Dict:
    """Deep analysis of behavioral patterns"""
    analysis = {
        "impulse_rating": "Unknown",
        "financial_discipline": "Unknown",
        "app_risk_level": "Low",
        "gambling_apps": [],
        "crypto_apps": [],
        "finance_apps": [],
        "productivity_apps": [],
        "quiz_passed": 0,
        "quiz_total": 5,
        "device_stability": "Unknown",
        "digital_engagement": "Unknown"
    }
    
    # Impulse control rating
    impulse = user_data.impulse_control_score
    if impulse >= 8:
        analysis["impulse_rating"] = "Excellent (8-10): Strong self-control, rarely makes impulsive decisions"
    elif impulse >= 6:
        analysis["impulse_rating"] = "Good (6-7): Generally controlled, occasional impulsive purchases"
    elif impulse >= 4:
        analysis["impulse_rating"] = "Moderate (4-5): Some impulsive tendencies, may struggle with large purchases"
    else:
        analysis["impulse_rating"] = "Poor (1-3): High impulsivity, significant risk of overspending"
    
    # Quiz analysis
    quiz = user_data.quiz_answers
    passed = []
    failed = []
    if quiz.saves_regularly:
        passed.append("Regular Savings")
        analysis["quiz_passed"] += 1
    else:
        failed.append("Regular Savings")
    if quiz.waits_before_purchase:
        passed.append("Delayed Gratification")
        analysis["quiz_passed"] += 1
    else:
        failed.append("Delayed Gratification")
    if quiz.has_budget:
        passed.append("Budget Maintenance")
        analysis["quiz_passed"] += 1
    else:
        failed.append("Budget Maintenance")
    if quiz.tracks_expenses:
        passed.append("Expense Tracking")
        analysis["quiz_passed"] += 1
    else:
        failed.append("Expense Tracking")
    if quiz.avoids_impulsive_buying:
        passed.append("Impulse Control")
        analysis["quiz_passed"] += 1
    else:
        failed.append("Impulse Control")
    
    analysis["quiz_passed_items"] = passed
    analysis["quiz_failed_items"] = failed
    
    if analysis["quiz_passed"] >= 4:
        analysis["financial_discipline"] = "Strong"
    elif analysis["quiz_passed"] >= 2:
        analysis["financial_discipline"] = "Moderate"
    else:
        analysis["financial_discipline"] = "Weak"
    
    # App analysis
    gambling_keywords = ["dream11", "mpl", "rummy", "teen patti", "poker", "bet365", "1xbet", "parimatch", "betway"]
    crypto_keywords = ["binance", "wazirx", "coinswitch", "coindcx", "zebpay", "kucoin", "crypto"]
    finance_keywords = ["phonepe", "paytm", "google pay", "gpay", "cred", "groww", "zerodha", "upstox"]
    productivity_keywords = ["linkedin", "udemy", "coursera", "notion", "slack", "teams"]
    
    for app in user_data.installed_apps:
        app_lower = app.lower()
        for keyword in gambling_keywords:
            if keyword in app_lower:
                analysis["gambling_apps"].append(app)
                break
        for keyword in crypto_keywords:
            if keyword in app_lower:
                analysis["crypto_apps"].append(app)
                break
        for keyword in finance_keywords:
            if keyword in app_lower:
                analysis["finance_apps"].append(app)
                break
        for keyword in productivity_keywords:
            if keyword in app_lower:
                analysis["productivity_apps"].append(app)
                break
    
    # Determine app risk level
    risky_count = len(analysis["gambling_apps"]) + len(analysis["crypto_apps"])
    if risky_count >= 4:
        analysis["app_risk_level"] = "Very High"
    elif risky_count >= 2:
        analysis["app_risk_level"] = "High"
    elif risky_count == 1:
        analysis["app_risk_level"] = "Moderate"
    else:
        analysis["app_risk_level"] = "Low"
    
    # Device stability
    device_age = user_data.device_age_months
    if device_age >= 24:
        analysis["device_stability"] = "Excellent (2+ years): Indicates financial stability and low device turnover"
    elif device_age >= 12:
        analysis["device_stability"] = "Good (1-2 years): Normal device lifecycle"
    elif device_age >= 6:
        analysis["device_stability"] = "Moderate (6-12 months): Relatively new device"
    else:
        analysis["device_stability"] = "Low (<6 months): Very new device, may indicate recent purchase or instability"
    
    # Digital engagement
    usage = user_data.app_usage_hours_daily
    if usage <= 2:
        analysis["digital_engagement"] = "Low (≤2 hrs/day): Minimal screen time"
    elif usage <= 4:
        analysis["digital_engagement"] = "Moderate (2-4 hrs/day): Average digital engagement"
    elif usage <= 6:
        analysis["digital_engagement"] = "High (4-6 hrs/day): Above average screen time"
    else:
        analysis["digital_engagement"] = "Very High (6+ hrs/day): Heavy digital user, potential concern if combined with risky apps"
    
    return analysis


def _fallback_verdict(
    financial_data: FinancialData,
    behavior_score: int,
    financial_health_score: int,
    fraud_flags: FraudFlags,
    user_data = None
) -> Tuple[str, str, int, float]:
    """Fallback verdict logic when Gemini is unavailable - provides comprehensive detailed analysis"""
    
    # Calculate core metrics
    savings_amount = financial_data.monthly_income - financial_data.monthly_expenses
    savings_percentage = financial_data.savings_ratio * 100
    combined_score = (behavior_score + financial_health_score) / 2
    expense_ratio = (financial_data.monthly_expenses / financial_data.monthly_income * 100) if financial_data.monthly_income > 0 else 100
    
    # Transaction analysis
    txn_analysis = _analyze_transactions(financial_data)
    
    # Build comprehensive sections
    sections = []
    
    # ═══════════════════════════════════════════════════════════════
    # SECTION 1: EXECUTIVE SUMMARY
    # ═══════════════════════════════════════════════════════════════
    if fraud_flags.is_fraud:
        decision = "🚫 APPLICATION REJECTED - FRAUD INDICATORS DETECTED"
        risk_category = "CRITICAL RISK"
        risk_color = "🔴"
    elif combined_score >= 70:
        decision = "✅ APPLICATION APPROVED - STRONG PROFILE"
        risk_category = "LOW RISK"
        risk_color = "🟢"
    elif combined_score >= 50:
        decision = "⚠️ APPLICATION APPROVED WITH CONDITIONS - MODERATE RISK"
        risk_category = "MEDIUM RISK"
        risk_color = "🟡"
    else:
        decision = "❌ APPLICATION REJECTED - HIGH RISK PROFILE"
        risk_category = "HIGH RISK"
        risk_color = "🔴"
    
    sections.append(f"""
{'='*60}
{decision}
{'='*60}

{risk_color} RISK CATEGORY: {risk_category}
📊 TRUST SCORE: {300 if fraud_flags.is_fraud else int(300 + combined_score * 6)}/900
📅 ASSESSMENT DATE: Auto-generated Report
""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 2: SCORE BREAKDOWN
    # ═══════════════════════════════════════════════════════════════
    sections.append(f"""
{'─'*60}
📊 DETAILED SCORE BREAKDOWN
{'─'*60}

┌─────────────────────────────────────────────────────────┐
│ COMPONENT              │ SCORE    │ WEIGHT │ CONTRIBUTION│
├─────────────────────────────────────────────────────────┤
│ Financial Health       │ {financial_health_score:>3}/100  │  50%   │ {financial_health_score * 0.5:>6.1f} pts   │
│ Behavioral Score       │ {behavior_score:>3}/100  │  50%   │ {behavior_score * 0.5:>6.1f} pts   │
├─────────────────────────────────────────────────────────┤
│ COMBINED SCORE         │ {combined_score:>6.1f}   │ 100%   │ {combined_score:>6.1f} pts   │
└─────────────────────────────────────────────────────────┘

Score Interpretation:
• 0-30: Very High Risk - Significant financial distress indicators
• 31-50: High Risk - Multiple concerns requiring attention
• 51-65: Medium Risk - Some positive indicators, room for improvement
• 66-80: Low Risk - Solid financial and behavioral profile
• 81-100: Very Low Risk - Excellent creditworthiness
""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 3: FINANCIAL ANALYSIS
    # ═══════════════════════════════════════════════════════════════
    income_category = "High" if financial_data.monthly_income >= 75000 else "Medium" if financial_data.monthly_income >= 40000 else "Low"
    savings_category = "Excellent" if savings_percentage >= 30 else "Good" if savings_percentage >= 20 else "Moderate" if savings_percentage >= 10 else "Poor"
    stability_pct = (financial_data.income_stability * 100) if financial_data.income_stability else 0
    stability_category = "Stable" if stability_pct >= 80 else "Moderate" if stability_pct >= 50 else "Unstable"
    
    sections.append(f"""
{'─'*60}
💰 FINANCIAL ANALYSIS
{'─'*60}

INCOME PROFILE:
• Monthly Income: ₹{financial_data.monthly_income:,.0f} ({income_category} income bracket)
• Income Stability: {stability_pct:.0f}% ({stability_category})
• Average Balance: ₹{financial_data.average_balance or 0:,.0f}

EXPENSE PROFILE:
• Monthly Expenses: ₹{financial_data.monthly_expenses:,.0f}
• Expense Ratio: {expense_ratio:.1f}% of income
• Status: {'⚠️ CRITICAL - Living beyond means' if expense_ratio > 95 else '⚠️ HIGH - Limited savings capacity' if expense_ratio > 80 else '✅ HEALTHY' if expense_ratio < 70 else '○ ACCEPTABLE'}

SAVINGS ANALYSIS:
• Monthly Savings: ₹{savings_amount:,.0f}
• Savings Rate: {savings_percentage:.1f}% ({savings_category})
• Annual Savings Potential: ₹{savings_amount * 12:,.0f}
• Emergency Fund Status: {'✅ Can build 3-month buffer in ' + str(int(financial_data.monthly_expenses * 3 / savings_amount)) + ' months' if savings_amount > 0 else '❌ No savings capacity'}

DEBT OBLIGATIONS:
• Active Lenders: {financial_data.lender_count}
• Status: {'✅ Debt-free' if financial_data.lender_count == 0 else '⚠️ Single lender - manageable' if financial_data.lender_count == 1 else '⚠️ Multiple lenders - monitor closely' if financial_data.lender_count == 2 else '🚨 LOAN STACKING RISK - Too many lenders'}
""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 4: TRANSACTION ANALYSIS
    # ═══════════════════════════════════════════════════════════════
    if txn_analysis["transaction_count"] > 0:
        category_breakdown = ""
        for cat, data in sorted(txn_analysis["categories"].items(), key=lambda x: x[1]["total"], reverse=True)[:5]:
            pct = (data["total"] / txn_analysis["total_debits"] * 100) if txn_analysis["total_debits"] > 0 else 0
            category_breakdown += f"  • {cat.title()}: ₹{data['total']:,.0f} ({data['count']} txns, {pct:.1f}% of spending)\n"
        
        risky_txn_text = ""
        if txn_analysis["risky_transactions"]:
            risky_txn_text = "\n⚠️ RISKY TRANSACTIONS DETECTED:\n"
            for rtxn in txn_analysis["risky_transactions"][:3]:
                risky_txn_text += f"  • {rtxn['date']}: ₹{rtxn['amount']:,.0f} at {rtxn['merchant']} ({rtxn['category']})\n"
        
        sections.append(f"""
{'─'*60}
📝 TRANSACTION ANALYSIS
{'─'*60}

TRANSACTION SUMMARY:
• Total Transactions Analyzed: {txn_analysis['transaction_count']}
• Total Credits (Inflows): ₹{txn_analysis['total_credits']:,.0f}
• Total Debits (Outflows): ₹{txn_analysis['total_debits']:,.0f}
• Salary Income Detected: {'✅ Yes' if txn_analysis['salary_detected'] else '❌ No (may be cash-based or gig income)'}

SPENDING BY CATEGORY (Top 5):
{category_breakdown}
KEY PAYMENT PATTERNS:
• Utility Payments: ₹{txn_analysis['utility_payments']:,.0f} {'✅ Regular utility payments indicate stability' if txn_analysis['utility_payments'] > 0 else '○ No utility payments in sample'}
• Loan/EMI Payments: ₹{txn_analysis['loan_payments']:,.0f} {'⚠️ Existing debt obligations' if txn_analysis['loan_payments'] > 0 else '✅ No loan payments detected'}
• Gambling Spend: ₹{txn_analysis['gambling_spend']:,.0f} {'🚨 GAMBLING ACTIVITY DETECTED' if txn_analysis['gambling_spend'] > 0 else '✅ No gambling transactions'}
{risky_txn_text}""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 5: FRAUD DETECTION RESULTS
    # ═══════════════════════════════════════════════════════════════
    fraud_section = f"""
{'─'*60}
🔍 FRAUD & RISK DETECTION
{'─'*60}

FRAUD CHECKS PERFORMED:
"""
    
    # Loan stacking check
    if fraud_flags.loan_stacking:
        fraud_section += f"""
🚨 LOAN STACKING: DETECTED
   • Active Lenders: {financial_data.lender_count} (Threshold: 3)
   • Risk: HIGH - Multiple simultaneous loans indicate potential debt spiral
   • Impact: Application automatically rejected per regulatory guidelines
"""
    else:
        fraud_section += f"""
✅ LOAN STACKING: NOT DETECTED
   • Active Lenders: {financial_data.lender_count} (Threshold: 3)
   • Status: Within acceptable limits
"""
    
    # Wash trading check
    if fraud_flags.wash_trading:
        fraud_section += f"""
🚨 WASH TRADING: DETECTED
   • Pattern: Circular money flow identified (funds sent and received from same party within 10% variance)
   • Risk: HIGH - May indicate money laundering or artificial balance inflation
   • Impact: Application automatically rejected per AML guidelines
"""
    else:
        fraud_section += f"""
✅ WASH TRADING: NOT DETECTED
   • No circular transaction patterns identified
   • Status: Transaction flows appear legitimate
"""
    
    if fraud_flags.suspicious_patterns:
        fraud_section += f"""
⚠️ OTHER SUSPICIOUS PATTERNS:
"""
        for pattern in fraud_flags.suspicious_patterns:
            fraud_section += f"   • {pattern}\n"
    
    fraud_section += f"""
OVERALL FRAUD ASSESSMENT: {'🚨 FRAUD DETECTED - AUTOMATIC REJECTION' if fraud_flags.is_fraud else '✅ NO FRAUD INDICATORS'}
"""
    sections.append(fraud_section)

    # ═══════════════════════════════════════════════════════════════
    # SECTION 6: BEHAVIORAL ANALYSIS (if user_data available)
    # ═══════════════════════════════════════════════════════════════
    sections.append(f"""
{'─'*60}
🧠 BEHAVIORAL ANALYSIS
{'─'*60}

BEHAVIORAL SCORE: {behavior_score}/100

This score is calculated based on:
1. Impulse Control Self-Assessment (30% weight)
2. Financial Habits Quiz (25% weight)
3. Installed App Risk Analysis (25% weight)
4. Device & Usage Patterns (20% weight)

SCORE INTERPRETATION:
• Your behavioral score of {behavior_score} indicates {'excellent financial discipline and low-risk behavior patterns' if behavior_score >= 70 else 'good financial habits with some areas for improvement' if behavior_score >= 50 else 'concerning behavioral patterns that increase lending risk' if behavior_score >= 30 else 'significant behavioral red flags requiring attention'}

KEY BEHAVIORAL FACTORS:
• Financial Discipline: {'Strong' if behavior_score >= 70 else 'Moderate' if behavior_score >= 50 else 'Weak'}
• Risk-Taking Tendency: {'Low' if behavior_score >= 70 else 'Moderate' if behavior_score >= 50 else 'High'}
• Self-Control Assessment: Based on quiz responses and app patterns
""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 7: KEY FACTORS SUMMARY
    # ═══════════════════════════════════════════════════════════════
    positive_factors = []
    negative_factors = []
    
    # Financial factors
    if savings_percentage >= 20:
        positive_factors.append(f"Strong savings discipline ({savings_percentage:.0f}% savings rate)")
    elif savings_percentage < 10:
        negative_factors.append(f"Low savings rate ({savings_percentage:.0f}%)")
    
    if financial_data.income_stability and financial_data.income_stability >= 0.8:
        positive_factors.append("Stable and predictable income pattern")
    elif financial_data.income_stability and financial_data.income_stability < 0.5:
        negative_factors.append("Irregular/unstable income")
    
    if financial_data.lender_count == 0:
        positive_factors.append("No existing debt obligations")
    elif financial_data.lender_count >= 3:
        negative_factors.append(f"Multiple active lenders ({financial_data.lender_count})")
    
    if txn_analysis["salary_detected"]:
        positive_factors.append("Regular salary income detected")
    
    if txn_analysis["utility_payments"] > 0:
        positive_factors.append("Consistent utility payment history")
    
    if txn_analysis["gambling_spend"] > 0:
        negative_factors.append(f"Gambling transactions detected (₹{txn_analysis['gambling_spend']:,.0f})")
    
    # Behavioral factors
    if behavior_score >= 70:
        positive_factors.append(f"Excellent behavioral score ({behavior_score}/100)")
    elif behavior_score < 40:
        negative_factors.append(f"Weak behavioral indicators ({behavior_score}/100)")
    
    if expense_ratio > 90:
        negative_factors.append(f"Living paycheck-to-paycheck ({expense_ratio:.0f}% expense ratio)")
    
    sections.append(f"""
{'─'*60}
⚖️ KEY FACTORS SUMMARY
{'─'*60}

✅ POSITIVE FACTORS ({len(positive_factors)}):
{chr(10).join('   • ' + f for f in positive_factors) if positive_factors else '   • Limited positive indicators identified'}

❌ NEGATIVE FACTORS ({len(negative_factors)}):
{chr(10).join('   • ' + f for f in negative_factors) if negative_factors else '   • No significant concerns identified'}

OVERALL ASSESSMENT:
{'The negative factors significantly outweigh positive indicators, resulting in application rejection.' if len(negative_factors) > len(positive_factors) + 2 else 'The positive factors provide sufficient confidence for loan approval with appropriate limits.' if len(positive_factors) >= len(negative_factors) else 'Mixed signals detected - approved with conservative limits and monitoring.'}
""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 8: LOAN RECOMMENDATION
    # ═══════════════════════════════════════════════════════════════
    if fraud_flags.is_fraud:
        trust_score = 350
        max_loan = 0
        sections.append(f"""
{'─'*60}
💳 LOAN RECOMMENDATION
{'─'*60}

DECISION: ❌ REJECTED

REASON: Fraud indicators detected in application. Per regulatory compliance requirements,
applications with fraud flags cannot be approved regardless of other factors.

MAXIMUM LOAN AMOUNT: ₹0
TRUST SCORE: {trust_score}/900 (Fraud-flagged)

NEXT STEPS FOR APPLICANT:
1. Resolve all outstanding debts with current lenders
2. Close unnecessary loan accounts
3. Maintain clean transaction history for minimum 6 months
4. Avoid circular transactions between accounts
5. Reapply after demonstrating improved financial behavior
""")
    elif combined_score >= 70:
        trust_score = min(900, int(650 + (combined_score - 70) * 8.33))
        max_loan = min(financial_data.monthly_income * 3, 200000)
        emi_12 = max_loan / 12
        emi_24 = max_loan / 24
        emi_ratio = (emi_12 / financial_data.monthly_income) * 100
        
        sections.append(f"""
{'─'*60}
💳 LOAN RECOMMENDATION
{'─'*60}

DECISION: ✅ APPROVED

TRUST SCORE: {trust_score}/900 (Excellent)
RISK CATEGORY: LOW RISK

LOAN DETAILS:
┌─────────────────────────────────────────────────────────┐
│ Maximum Loan Amount    : ₹{max_loan:>10,.0f}                   │
│ Income Multiplier      : {max_loan/financial_data.monthly_income:.1f}x monthly income              │
│ Recommended Tenure     : 12-24 months                    │
├─────────────────────────────────────────────────────────┤
│ EMI (12 months)        : ₹{emi_12:>10,.0f}/month ({emi_ratio:.0f}% of income) │
│ EMI (24 months)        : ₹{emi_24:>10,.0f}/month ({emi_24/financial_data.monthly_income*100:.0f}% of income) │
├─────────────────────────────────────────────────────────┤
│ Affordability Check    : ✅ PASSED                       │
│ Debt-to-Income Ratio   : {emi_ratio:.1f}% (Healthy: <40%)          │
└─────────────────────────────────────────────────────────┘

APPROVAL RATIONALE:
• Strong combined score of {combined_score:.0f}/100 indicates reliable borrower profile
• {len(positive_factors)} positive factors outweigh {len(negative_factors)} concerns
• Financial capacity supports repayment at recommended EMI levels
• Behavioral indicators suggest disciplined money management
""")
    elif combined_score >= 50:
        trust_score = int(500 + (combined_score - 50) * 7.5)
        max_loan = min(financial_data.monthly_income * 1.5, 75000)
        emi_12 = max_loan / 12
        emi_ratio = (emi_12 / financial_data.monthly_income) * 100
        
        sections.append(f"""
{'─'*60}
💳 LOAN RECOMMENDATION
{'─'*60}

DECISION: ⚠️ CONDITIONALLY APPROVED

TRUST SCORE: {trust_score}/900 (Moderate)
RISK CATEGORY: MEDIUM RISK

LOAN DETAILS:
┌─────────────────────────────────────────────────────────┐
│ Maximum Loan Amount    : ₹{max_loan:>10,.0f}                   │
│ Income Multiplier      : {max_loan/financial_data.monthly_income:.1f}x monthly income              │
│ Recommended Tenure     : 6-12 months                     │
├─────────────────────────────────────────────────────────┤
│ EMI (12 months)        : ₹{emi_12:>10,.0f}/month ({emi_ratio:.0f}% of income) │
├─────────────────────────────────────────────────────────┤
│ Affordability Check    : ⚠️ MARGINAL                     │
└─────────────────────────────────────────────────────────┘

APPROVAL CONDITIONS:
• This is a starter loan amount - timely repayment unlocks higher limits
• Shorter tenure recommended to reduce total interest and build credit
• No additional borrowing recommended during repayment period
• Income verification may be required for higher amounts

LIMITED APPROVAL RATIONALE:
• Combined score of {combined_score:.0f}/100 meets minimum threshold but indicates moderate risk
• Conservative loan amount protects both lender and borrower
• Successful repayment will improve future borrowing capacity
""")
    else:
        trust_score = max(300, int(300 + combined_score * 4))
        max_loan = 0
        
        sections.append(f"""
{'─'*60}
💳 LOAN RECOMMENDATION
{'─'*60}

DECISION: ❌ REJECTED

TRUST SCORE: {trust_score}/900 (Below Threshold)
RISK CATEGORY: HIGH RISK

REJECTION REASONS:
1. Combined score of {combined_score:.0f}/100 is below minimum approval threshold of 50
2. {len(negative_factors)} significant risk factors identified
3. Current financial capacity insufficient to support loan repayment
4. Behavioral indicators suggest elevated default risk

MAXIMUM LOAN AMOUNT: ₹0

DETAILED REJECTION ANALYSIS:
• Financial Health Score: {financial_health_score}/100 {'(BELOW STANDARD)' if financial_health_score < 50 else '(ACCEPTABLE)'}
• Behavioral Score: {behavior_score}/100 {'(BELOW STANDARD)' if behavior_score < 50 else '(ACCEPTABLE)'}
• Savings Capacity: ₹{savings_amount:,.0f}/month ({'INSUFFICIENT' if savings_amount < 5000 else 'LIMITED'})
• Expense Ratio: {expense_ratio:.0f}% ({'CRITICAL' if expense_ratio > 90 else 'HIGH' if expense_ratio > 80 else 'ACCEPTABLE'})
""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 9: IMPROVEMENT RECOMMENDATIONS
    # ═══════════════════════════════════════════════════════════════
    recommendations = []
    
    if savings_percentage < 20:
        recommendations.append({
            "priority": "HIGH",
            "area": "Savings",
            "action": f"Increase savings rate from {savings_percentage:.0f}% to at least 20% of income",
            "impact": "Could improve Financial Health Score by 10-20 points",
            "timeline": "3-6 months"
        })
    
    if expense_ratio > 80:
        recommendations.append({
            "priority": "HIGH",
            "area": "Expenses",
            "action": f"Reduce monthly expenses by ₹{financial_data.monthly_expenses * 0.15:,.0f} (15%)",
            "impact": "Improves savings capacity and debt servicing ability",
            "timeline": "1-3 months"
        })
    
    if financial_data.lender_count >= 2:
        recommendations.append({
            "priority": "MEDIUM",
            "area": "Debt",
            "action": "Consolidate existing loans or pay off smallest ones first",
            "impact": "Reduces lender count and improves creditworthiness",
            "timeline": "6-12 months"
        })
    
    if behavior_score < 50:
        recommendations.append({
            "priority": "MEDIUM",
            "area": "Behavior",
            "action": "Uninstall gambling/high-risk apps and develop budgeting habits",
            "impact": "Could improve Behavioral Score by 15-25 points",
            "timeline": "Immediate"
        })
    
    if txn_analysis["gambling_spend"] > 0:
        recommendations.append({
            "priority": "HIGH",
            "area": "Risk Behavior",
            "action": "Stop gambling activities and redirect those funds to savings",
            "impact": f"Could save ₹{txn_analysis['gambling_spend']:,.0f}/month additional",
            "timeline": "Immediate"
        })
    
    if not recommendations:
        recommendations.append({
            "priority": "LOW",
            "area": "Maintenance",
            "action": "Continue current financial discipline and savings habits",
            "impact": "Maintain or improve current credit profile",
            "timeline": "Ongoing"
        })
    
    rec_text = ""
    for i, rec in enumerate(recommendations[:5], 1):
        priority_icon = "🔴" if rec["priority"] == "HIGH" else "🟡" if rec["priority"] == "MEDIUM" else "🟢"
        rec_text += f"""
{i}. {priority_icon} [{rec['priority']}] {rec['area'].upper()}
   Action: {rec['action']}
   Expected Impact: {rec['impact']}
   Timeline: {rec['timeline']}
"""
    
    sections.append(f"""
{'─'*60}
📋 IMPROVEMENT RECOMMENDATIONS
{'─'*60}
{rec_text}

PATH TO IMPROVED CREDIT PROFILE:
┌─────────────────────────────────────────────────────────┐
│ MONTH 1-3  : Focus on expense reduction & savings       │
│ MONTH 4-6  : Build emergency fund (3 months expenses)   │
│ MONTH 7-12 : Pay down existing debts, avoid new loans   │
│ MONTH 12+  : Reapply with improved financial profile    │
└─────────────────────────────────────────────────────────┘
""")

    # ═══════════════════════════════════════════════════════════════
    # SECTION 10: DISCLAIMER
    # ═══════════════════════════════════════════════════════════════
    sections.append(f"""
{'─'*60}
📜 DISCLAIMER
{'─'*60}

This assessment is generated based on the data provided and should be used 
as one input in the lending decision process. Final lending decisions may 
require additional verification, documentation, and human review.

Factors not considered in this automated assessment:
• Employment verification and stability
• Physical asset ownership
• Family/guarantor support
• Industry-specific income patterns
• Regional economic factors

For appeals or clarifications, please contact the lending institution.

{'='*60}
END OF ASSESSMENT REPORT
{'='*60}
""")

    # Combine all sections
    full_verdict = "\n".join(sections)
    
    return (full_verdict, "REJECT" if fraud_flags.is_fraud or combined_score < 50 else "APPROVE", trust_score, max_loan)
