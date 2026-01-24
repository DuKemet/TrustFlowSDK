import { useState } from 'react'
import { Bell, Settings, BarChart3, CheckCircle, XCircle } from 'lucide-react'
import './index.css'
import Sidebar from './components/Sidebar'
import UploadCard from './components/UploadCard'
import FraudAlert from './components/FraudAlert'
import ScoreGauge from './components/ScoreGauge'
import InsightCards from './components/InsightCards'

// Demo persona data - Gig Worker with stable income but one gambling app
const DEMO_PERSONA = {
  financial: {
    monthly_income: 45000,
    monthly_expenses: 32000,
    lender_count: 1,
    savings_ratio: 0.28,
    income_stability: 0.75,
    average_balance: 25000,
    transactions: [
      { date: "2024-01-15", amount: 45000, type: "credit", category: "salary", merchant: "Zomato Partner" },
      { date: "2024-01-16", amount: 8000, type: "debit", category: "rent", merchant: "Landlord" },
      { date: "2024-01-18", amount: 3500, type: "debit", category: "utilities", merchant: "BESCOM" },
      { date: "2024-01-20", amount: 5000, type: "debit", category: "groceries", merchant: "BigBasket" },
      { date: "2024-01-25", amount: 2000, type: "debit", category: "entertainment", merchant: "Dream11" }
    ]
  },
  behavioral: {
    impulse_control_score: 7,
    installed_apps: ["PhonePe", "Google Pay", "Swiggy", "Zomato", "Dream11", "LinkedIn"],
    quiz_answers: {
      saves_regularly: true,
      waits_before_purchase: true,
      has_budget: false,
      tracks_expenses: true,
      avoids_impulsive_buying: false
    },
    device_age_months: 18,
    app_usage_hours_daily: 4.5
  }
}

const API_BASE = 'http://localhost:8000'

function App() {
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [personaLoaded, setPersonaLoaded] = useState(false)

  const handleLoadDemoPersona = async () => {
    setIsLoading(true)
    setError(null)
    setPersonaLoaded(true)

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(DEMO_PERSONA),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setAnalysisResult(data)
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err.message || 'Failed to analyze. Make sure the backend is running on port 8000.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setAnalysisResult(null)
    setPersonaLoaded(false)
    setError(null)
  }

  const handleUploadJson = async (jsonData) => {
    setIsLoading(true)
    setError(null)
    setPersonaLoaded(true)

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setAnalysisResult(data)
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err.message || 'Failed to analyze. Make sure the backend is running on port 8000.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <h1 className="top-header-title">Credit Assessment</h1>
          <div className="top-header-actions">
            <button className="header-btn" title="Notifications">
              <Bell size={20} />
            </button>
            <button className="header-btn" title="Settings">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">Risk Analysis Dashboard</h1>
            <p className="page-subtitle">
              AI-powered credit assessment for underserved borrowers using alternative data signals
            </p>
          </div>

          {/* Upload/Demo Card */}
          <UploadCard
            onLoadDemo={handleLoadDemoPersona}
            onReset={handleReset}
            onUpload={handleUploadJson}
            isLoading={isLoading}
            personaLoaded={personaLoaded}
            demoData={DEMO_PERSONA}
          />

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <span className="error-banner-icon">
                <XCircle size={20} />
              </span>
              <span className="error-banner-text">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="card">
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">Analyzing applicant profile with AI...</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {analysisResult && !isLoading && (
            <div className="animate-fade-in">
              {/* Fraud Alert (if detected) */}
              {analysisResult.is_fraud && (
                <FraudAlert fraudFlags={analysisResult.fraud_flags} />
              )}

              {/* Score Gauge */}
              <div className="score-section">
                <ScoreGauge
                  score={analysisResult.score}
                  riskLevel={analysisResult.risk_level}
                  recommendation={analysisResult.recommendation}
                  maxLoanAmount={analysisResult.max_loan_amount}
                />

                {/* Quick Stats */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">Quick Summary</h3>
                      <p className="card-subtitle">Key metrics at a glance</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Financial Score</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{analysisResult.financial_health_score}/100</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Behavioral Score</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{analysisResult.behavioral_score}/100</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Risk Level</span>
                      <span style={{
                        fontWeight: 600,
                        color: analysisResult.risk_level === 'Low' ? 'var(--success)' :
                          analysisResult.risk_level === 'Medium' ? 'var(--warning)' : 'var(--danger)'
                      }}>{analysisResult.risk_level}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Fraud Detected</span>
                      <span style={{
                        fontWeight: 600,
                        color: analysisResult.is_fraud ? 'var(--danger)' : 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {analysisResult.is_fraud ? (
                          <><XCircle size={16} /> Yes</>
                        ) : (
                          <><CheckCircle size={16} /> No</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight Cards */}
              <InsightCards
                financialScore={analysisResult.financial_health_score}
                behavioralScore={analysisResult.behavioral_score}
                aiVerdict={analysisResult.ai_verdict}
                reasoning={analysisResult.reasoning}
              />
            </div>
          )}

          {/* Empty State */}
          {!analysisResult && !isLoading && !personaLoaded && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <BarChart3 size={40} />
                </div>
                <h3 className="empty-state-title">No Analysis Yet</h3>
                <p className="empty-state-text">
                  Upload applicant data or try the demo profile to see our AI-powered credit assessment in action.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
