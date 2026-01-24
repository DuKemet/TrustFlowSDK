import { useState } from 'react'
import { CheckCircle, XCircle, Download, RotateCcw, TrendingUp, TrendingDown, AlertTriangle, FileText } from 'lucide-react'
import ScoreGauge from '../ScoreGauge'
import InsightCards from '../InsightCards'
import FraudAlert from '../FraudAlert'

function ResultsStep({ result, onReset }) {
    const [showFullVerdict, setShowFullVerdict] = useState(false)

    if (!result) return null

    const isApproved = result.recommendation === 'APPROVE'
    const riskColor = result.risk_level === 'Low' ? 'var(--success)' :
        result.risk_level === 'Medium' ? 'var(--warning)' : 'var(--danger)'

    const handleDownloadReport = () => {
        const reportContent = `
TRUSTFLOW CREDIT ASSESSMENT REPORT
===================================

Generated: ${new Date().toLocaleString()}

DECISION: ${result.recommendation}
TRUST SCORE: ${result.score}/900
RISK LEVEL: ${result.risk_level}

FINANCIAL HEALTH SCORE: ${result.financial_health_score}/100
BEHAVIORAL SCORE: ${result.behavioral_score}/100

MAX LOAN AMOUNT: ₹${result.max_loan_amount?.toLocaleString() || 0}

AI VERDICT:
${result.ai_verdict}

DETAILED REASONING:
${result.reasoning?.join('\n') || 'N/A'}

---
This is an auto-generated report from TrustFlow Alternative Credit Scoring System.
        `.trim()

        const blob = new Blob([reportContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `TrustFlow_Report_${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="wizard-step results-step">
            {/* Decision Banner */}
            <div className={`decision-banner ${isApproved ? 'approved' : 'rejected'}`}>
                <div className="decision-icon">
                    {isApproved ? <CheckCircle size={48} /> : <XCircle size={48} />}
                </div>
                <div className="decision-content">
                    <h2 className="decision-title">
                        {isApproved ? 'Application Approved' : 'Application Rejected'}
                    </h2>
                    <p className="decision-subtitle">
                        {isApproved
                            ? `Maximum loan amount: ₹${result.max_loan_amount?.toLocaleString() || 0}`
                            : 'Please review the assessment for improvement areas'}
                    </p>
                </div>
                <div className="decision-score">
                    <span className="score-value">{result.score}</span>
                    <span className="score-label">Trust Score</span>
                </div>
            </div>

            {/* Fraud Alert */}
            {result.is_fraud && (
                <FraudAlert fraudFlags={result.fraud_flags} />
            )}

            {/* Quick Stats Grid */}
            <div className="results-stats-grid">
                <div className="stats-card">
                    <div className="stats-icon" style={{ color: 'var(--accent-primary)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stats-content">
                        <span className="stats-value">{result.financial_health_score}/100</span>
                        <span className="stats-label">Financial Health</span>
                    </div>
                </div>
                <div className="stats-card">
                    <div className="stats-icon" style={{ color: 'var(--accent-secondary)' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div className="stats-content">
                        <span className="stats-value">{result.behavioral_score}/100</span>
                        <span className="stats-label">Behavioral Score</span>
                    </div>
                </div>
                <div className="stats-card">
                    <div className="stats-icon" style={{ color: riskColor }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stats-content">
                        <span className="stats-value" style={{ color: riskColor }}>{result.risk_level}</span>
                        <span className="stats-label">Risk Level</span>
                    </div>
                </div>
                <div className="stats-card">
                    <div className="stats-icon" style={{ color: result.is_fraud ? 'var(--danger)' : 'var(--success)' }}>
                        {result.is_fraud ? <XCircle size={24} /> : <CheckCircle size={24} />}
                    </div>
                    <div className="stats-content">
                        <span className="stats-value">{result.is_fraud ? 'Detected' : 'Clear'}</span>
                        <span className="stats-label">Fraud Check</span>
                    </div>
                </div>
            </div>

            {/* Score Gauge */}
            <ScoreGauge
                score={result.score}
                riskLevel={result.risk_level}
                recommendation={result.recommendation}
                maxLoanAmount={result.max_loan_amount}
            />

            {/* AI Verdict Section */}
            <div className="verdict-section card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">AI Assessment Report</h3>
                        <p className="card-subtitle">Detailed analysis powered by Gemini AI</p>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowFullVerdict(!showFullVerdict)}
                    >
                        <FileText size={16} />
                        {showFullVerdict ? 'Show Less' : 'Show Full Report'}
                    </button>
                </div>
                <div className={`verdict-content ${showFullVerdict ? 'expanded' : ''}`}>
                    <pre className="verdict-text">
                        {showFullVerdict ? result.ai_verdict : (result.ai_verdict?.slice(0, 500) + '...')}
                    </pre>
                </div>
            </div>

            {/* Insight Cards */}
            <InsightCards
                financialScore={result.financial_health_score}
                behavioralScore={result.behavioral_score}
                aiVerdict={result.ai_verdict}
                reasoning={result.reasoning}
            />

            {/* Action Buttons */}
            <div className="results-actions">
                <button className="btn btn-secondary btn-lg" onClick={handleDownloadReport}>
                    <Download size={20} />
                    Download Report
                </button>
                <button className="btn btn-primary btn-lg" onClick={onReset}>
                    <RotateCcw size={20} />
                    Start New Assessment
                </button>
            </div>
        </div>
    )
}

export default ResultsStep
