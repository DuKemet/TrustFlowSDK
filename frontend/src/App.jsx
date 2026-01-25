import { useState, useMemo } from 'react'
import { Bell, Settings, Sparkles, Package } from 'lucide-react'
import './index.css'
import Sidebar from './components/Sidebar'
import StepProgress from './components/StepProgress'
import SDKBanner from './components/SDKBanner'
import AAConsentStep from './components/steps/AAConsentStep'
import BankFetchingStep from './components/steps/BankFetchingStep'
import QuestionnaireStep from './components/steps/QuestionnaireStep'
import ProcessingStep from './components/steps/ProcessingStep'
import ResultsStep from './components/steps/ResultsStep'

// Random bank statement generator - simulates AA data fetch
function generateRandomBankData() {
  // Random income bracket (30k-80k for gig workers)
  const incomeMin = 25000
  const incomeMax = 85000
  const monthlyIncome = Math.floor(Math.random() * (incomeMax - incomeMin) + incomeMin)

  // Random expense ratio (50-90% of income)
  const expenseRatio = 0.5 + Math.random() * 0.4
  const monthlyExpenses = Math.floor(monthlyIncome * expenseRatio)

  // Random lender count (0-4, with higher probability of low numbers)
  const lenderCount = Math.random() < 0.6 ? 0 : Math.random() < 0.8 ? 1 : Math.floor(Math.random() * 3) + 2

  // Calculate derived metrics
  const savingsRatio = 1 - expenseRatio
  const incomeStability = 0.5 + Math.random() * 0.5 // 50-100%
  const averageBalance = Math.floor(monthlyIncome * (0.3 + Math.random() * 0.7))

  // Generate random transactions for 6 months
  const transactions = []
  const transactionTypes = [
    { category: 'salary', merchants: ['Zomato Partner', 'Urban Company', 'Swiggy Delivery', 'Ola Driver', 'Freelance Payment', 'Contract Work'] },
    { category: 'rent', merchants: ['Landlord', 'Property Owner', 'Housing Society'] },
    { category: 'utilities', merchants: ['BESCOM', 'BWSSB', 'Jio Fiber', 'Airtel DTH', 'Gas Connection'] },
    { category: 'groceries', merchants: ['BigBasket', 'Zepto', 'Blinkit', 'DMart', 'Reliance Fresh'] },
    { category: 'food', merchants: ['Swiggy', 'Zomato', 'Local Restaurant', 'Street Food'] },
    { category: 'entertainment', merchants: ['Netflix', 'Amazon Prime', 'Hotstar', 'PVR Cinemas', 'BookMyShow'] },
    { category: 'shopping', merchants: ['Amazon', 'Flipkart', 'Myntra', 'Local Market'] },
    { category: 'transport', merchants: ['Ola', 'Uber', 'Rapido', 'Metro Card', 'Petrol Pump'] },
    { category: 'emi', merchants: ['HDFC EMI', 'Bajaj Finance', 'KreditBee', 'MoneyView'] },
    { category: 'gambling', merchants: ['Dream11', 'MPL', 'WinZO', 'Rummy Circle'] },
  ]

  // Add salary credits (1-2 per month for 6 months)
  for (let month = 0; month < 6; month++) {
    const salaryDate = new Date(2024, month, Math.floor(Math.random() * 5) + 1)
    const salaryVariation = monthlyIncome * (0.9 + Math.random() * 0.2) // ±10% variation
    transactions.push({
      date: salaryDate.toISOString().split('T')[0],
      amount: Math.floor(salaryVariation),
      type: 'credit',
      category: 'salary',
      merchant: transactionTypes[0].merchants[Math.floor(Math.random() * transactionTypes[0].merchants.length)]
    })
  }

  // Add regular debits
  for (let month = 0; month < 6; month++) {
    // Rent (once per month)
    transactions.push({
      date: new Date(2024, month, 5).toISOString().split('T')[0],
      amount: Math.floor(monthlyIncome * (0.2 + Math.random() * 0.1)),
      type: 'debit',
      category: 'rent',
      merchant: transactionTypes[1].merchants[Math.floor(Math.random() * transactionTypes[1].merchants.length)]
    })

    // Utilities
    transactions.push({
      date: new Date(2024, month, 10 + Math.floor(Math.random() * 5)).toISOString().split('T')[0],
      amount: Math.floor(1500 + Math.random() * 3000),
      type: 'debit',
      category: 'utilities',
      merchant: transactionTypes[2].merchants[Math.floor(Math.random() * transactionTypes[2].merchants.length)]
    })

    // Multiple food/groceries transactions
    const foodCount = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < foodCount; i++) {
      transactions.push({
        date: new Date(2024, month, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        amount: Math.floor(200 + Math.random() * 1500),
        type: 'debit',
        category: Math.random() > 0.5 ? 'food' : 'groceries',
        merchant: transactionTypes[Math.random() > 0.5 ? 3 : 4].merchants[Math.floor(Math.random() * 4)]
      })
    }

    // Random shopping/entertainment
    if (Math.random() > 0.3) {
      transactions.push({
        date: new Date(2024, month, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        amount: Math.floor(500 + Math.random() * 5000),
        type: 'debit',
        category: Math.random() > 0.5 ? 'shopping' : 'entertainment',
        merchant: transactionTypes[Math.random() > 0.5 ? 6 : 5].merchants[Math.floor(Math.random() * 4)]
      })
    }

    // Random EMI if they have lenders
    if (lenderCount > 0 && Math.random() > 0.3) {
      transactions.push({
        date: new Date(2024, month, 5).toISOString().split('T')[0],
        amount: Math.floor(2000 + Math.random() * 5000),
        type: 'debit',
        category: 'emi',
        merchant: transactionTypes[8].merchants[Math.floor(Math.random() * transactionTypes[8].merchants.length)]
      })
    }

    // Random gambling (20% chance per month)
    if (Math.random() > 0.8) {
      transactions.push({
        date: new Date(2024, month, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        amount: Math.floor(200 + Math.random() * 2000),
        type: 'debit',
        category: 'gambling',
        merchant: transactionTypes[9].merchants[Math.floor(Math.random() * transactionTypes[9].merchants.length)]
      })
    }
  }

  // Sort by date
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date))

  return {
    monthly_income: monthlyIncome,
    monthly_expenses: monthlyExpenses,
    lender_count: lenderCount,
    savings_ratio: parseFloat(savingsRatio.toFixed(2)),
    income_stability: parseFloat(incomeStability.toFixed(2)),
    average_balance: averageBalance,
    transactions: transactions.slice(0, 50) // Limit to 50 transactions
  }
}

const BANKS = {
  sbi: 'State Bank of India',
  hdfc: 'HDFC Bank',
  icici: 'ICICI Bank',
  axis: 'Axis Bank',
  kotak: 'Kotak Mahindra',
  pnb: 'Punjab National Bank'
}

// Use environment variable in production, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedBank, setSelectedBank] = useState(null)
  const [bankData, setBankData] = useState(null) // Store generated bank data
  const [behavioralData, setBehavioralData] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleConsentComplete = () => {
    // Generate random bank data when user consents (simulates AA fetch)
    const generatedData = generateRandomBankData()
    setBankData(generatedData)
    setCurrentStep(2) // Move to bank fetching
  }

  const handleBankFetchComplete = () => {
    setCurrentStep(3) // Move to questionnaire
  }

  const handleQuestionnaireComplete = async (behavioralAnswers) => {
    setBehavioralData(behavioralAnswers)
    setCurrentStep(4) // Move to processing
    setIsLoading(true)
    setError(null)

    try {
      // Combine generated bank data with questionnaire answers
      const requestData = {
        financial: bankData,
        behavioral: behavioralAnswers
      }

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Add a slight delay for the processing animation to show
      setTimeout(() => {
        setAnalysisResult(data)
        setCurrentStep(5) // Move to results
        setIsLoading(false)
      }, 3000)

    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err.message || 'Failed to analyze. Make sure the backend is running on port 8000.')
      setIsLoading(false)
      setCurrentStep(5) // Still move to results to show error
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedBank(null)
    setBankData(null) // Clear bank data so new data is generated
    setBehavioralData(null)
    setAnalysisResult(null)
    setError(null)
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AAConsentStep
            onNext={handleConsentComplete}
            selectedBank={selectedBank}
            setSelectedBank={setSelectedBank}
          />
        )
      case 2:
        return (
          <BankFetchingStep
            onNext={handleBankFetchComplete}
            bankName={BANKS[selectedBank]}
          />
        )
      case 3:
        return (
          <QuestionnaireStep
            onNext={() => { }}
            onDataCollected={handleQuestionnaireComplete}
          />
        )
      case 4:
        return (
          <ProcessingStep
            onComplete={() => setCurrentStep(5)}
          />
        )
      case 5:
        return (
          <>
            {error && (
              <div className="error-banner">
                <span className="error-banner-text">{error}</span>
              </div>
            )}
            <ResultsStep
              result={analysisResult}
              onReset={handleReset}
            />
          </>
        )
      default:
        return null
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
            <div className="sdk-demo-badge">
              <Package size={14} />
              <span>SDK DEMONSTRATION</span>
            </div>
            <h1 className="page-title">
              <Sparkles className="title-icon" size={28} />
              TrustFlow Credit SDK
            </h1>
            <p className="page-subtitle">
              Embeddable AI-powered credit assessment using Account Aggregator data and behavioral signals
            </p>
          </div>

          {/* SDK Info Banner */}
          <SDKBanner />

          {/* Step Progress Indicator */}
          <StepProgress currentStep={currentStep} />

          {/* Current Step Content */}
          <div className="wizard-container">
            {renderCurrentStep()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
