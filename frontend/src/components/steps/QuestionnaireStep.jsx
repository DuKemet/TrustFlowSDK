import { useState, useMemo } from 'react'
import { ClipboardList, ChevronRight, Smartphone, Clock, Brain } from 'lucide-react'

// Full question pool organized by category
const QUESTION_POOL = {
    // Core questions (always asked first)
    core: [
        {
            id: 'salary_behavior',
            question: 'When you receive your salary, what do you typically do first?',
            options: [
                { value: 'a', text: 'Transfer some amount to savings/investments', trait: 'saves_regularly', score: 5, nextCategory: 'savings' },
                { value: 'b', text: 'Pay off pending bills and daily expenses', trait: 'practical', score: 3, nextCategory: 'spending' }
            ]
        },
        {
            id: 'flash_sale',
            question: 'A product you\'ve been wanting is on 50% flash sale (ends in 2 hours). You:',
            options: [
                { value: 'a', text: 'Buy it immediately before the offer expires', trait: 'impulsive', score: -3, nextCategory: 'impulse_control' },
                { value: 'b', text: 'Wait and check if you really need it, even if the sale ends', trait: 'waits_before_purchase', score: 5, nextCategory: 'planning' }
            ]
        }
    ],

    // Follow-up for savings-focused users
    savings: [
        {
            id: 'savings_method',
            question: 'How do you primarily save money?',
            options: [
                { value: 'a', text: 'Automatic SIP/RD - money moves before I can spend it', trait: 'disciplined_saver', score: 5 },
                { value: 'b', text: 'Manual transfers when I remember or have surplus', trait: 'irregular_saver', score: 2 }
            ]
        },
        {
            id: 'savings_goal',
            question: 'What motivates your savings the most?',
            options: [
                { value: 'a', text: 'Specific goals (house, car, emergency fund)', trait: 'goal_oriented', score: 4 },
                { value: 'b', text: 'General security - I just like having money saved', trait: 'security_focused', score: 3 }
            ]
        }
    ],

    // Follow-up for spending-focused users
    spending: [
        {
            id: 'bill_priority',
            question: 'When paying bills, which do you prioritize?',
            options: [
                { value: 'a', text: 'EMIs and loans first, then utilities', trait: 'debt_responsible', score: 4 },
                { value: 'b', text: 'Whatever is due soonest or has penalties', trait: 'reactive', score: 1 }
            ]
        },
        {
            id: 'leftover_money',
            question: 'After paying all bills, if you have ₹5,000 left over, you typically:',
            options: [
                { value: 'a', text: 'Save at least half of it', trait: 'partial_saver', score: 4 },
                { value: 'b', text: 'Spend it - I\'ve already covered necessities', trait: 'full_spender', score: 0 }
            ]
        }
    ],

    // Follow-up for impulsive buyers
    impulse_control: [
        {
            id: 'regret_purchases',
            question: 'How often do you regret purchases you made on impulse?',
            options: [
                { value: 'a', text: 'Often - I frequently wish I hadn\'t bought something', trait: 'regretful_buyer', score: -2 },
                { value: 'b', text: 'Rarely - I usually justify my purchases somehow', trait: 'rationalizer', score: 0 }
            ]
        },
        {
            id: 'shopping_triggers',
            question: 'What most triggers you to make unplanned purchases?',
            options: [
                { value: 'a', text: 'Discounts and limited-time offers', trait: 'deal_seeker', score: -2 },
                { value: 'b', text: 'Seeing friends/influencers with the product', trait: 'social_buyer', score: -1 }
            ]
        }
    ],

    // Follow-up for disciplined planners
    planning: [
        {
            id: 'budget_tracking',
            question: 'How do you track your spending?',
            options: [
                { value: 'a', text: 'App or spreadsheet - I know my exact expenses', trait: 'tracks_expenses', score: 5 },
                { value: 'b', text: 'Mental notes - I have a rough idea', trait: 'rough_tracker', score: 2 }
            ]
        },
        {
            id: 'financial_planning',
            question: 'How far ahead do you plan your finances?',
            options: [
                { value: 'a', text: '6 months to a year or more', trait: 'long_term_planner', score: 5 },
                { value: 'b', text: 'Month to month, based on bills due', trait: 'short_term_planner', score: 2 }
            ]
        }
    ],

    // Risk assessment (always asked)
    risk: [
        {
            id: 'unexpected_expense',
            question: 'An unexpected ₹10,000 expense comes up. You:',
            options: [
                { value: 'a', text: 'Can cover it from your emergency savings', trait: 'has_budget', score: 5 },
                { value: 'b', text: 'Need to adjust this month\'s spending or borrow', trait: 'no_buffer', score: -2 }
            ]
        },
        {
            id: 'investment_approach',
            question: 'When it comes to investing money, you prefer:',
            options: [
                { value: 'a', text: 'High-risk, high-reward options (crypto, stocks)', trait: 'risk_taker', score: -1 },
                { value: 'b', text: 'Safe, steady returns (FD, PPF, mutual funds)', trait: 'conservative', score: 3 }
            ]
        }
    ]
}

const APPS_LIST = [
    { name: 'PhonePe', category: 'finance', risk: false },
    { name: 'Google Pay', category: 'finance', risk: false },
    { name: 'Paytm', category: 'finance', risk: false },
    { name: 'CRED', category: 'finance', risk: false },
    { name: 'Dream11', category: 'gambling', risk: true },
    { name: 'MPL', category: 'gambling', risk: true },
    { name: 'Teen Patti', category: 'gambling', risk: true },
    { name: 'Rummy Circle', category: 'gambling', risk: true },
    { name: 'WinZO', category: 'gambling', risk: true },
    { name: 'Binance', category: 'crypto', risk: true },
    { name: 'WazirX', category: 'crypto', risk: true },
    { name: 'CoinSwitch', category: 'crypto', risk: true },
    { name: 'LinkedIn', category: 'productivity', risk: false },
    { name: 'Udemy', category: 'education', risk: false },
    { name: 'Swiggy', category: 'food', risk: false },
    { name: 'Zomato', category: 'food', risk: false },
]

function QuestionnaireStep({ onNext, onDataCollected }) {
    const [answers, setAnswers] = useState({})
    const [questionPath, setQuestionPath] = useState(['core']) // Track which categories we've visited
    const [impulseScore, setImpulseScore] = useState(5)
    const [selectedApps, setSelectedApps] = useState([])
    const [deviceAge, setDeviceAge] = useState(12)
    const [dailyUsage, setDailyUsage] = useState(4)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [showAdditionalSection, setShowAdditionalSection] = useState(false)

    // Build the adaptive question sequence based on answers
    const questionSequence = useMemo(() => {
        let sequence = [...QUESTION_POOL.core]

        // Add follow-up questions based on core answers
        for (const [questionId, answerValue] of Object.entries(answers)) {
            const allQuestions = Object.values(QUESTION_POOL).flat()
            const question = allQuestions.find(q => q.id === questionId)
            const selectedOption = question?.options.find(o => o.value === answerValue)

            if (selectedOption?.nextCategory && QUESTION_POOL[selectedOption.nextCategory]) {
                // Add follow-up questions from the triggered category
                const followUpQuestions = QUESTION_POOL[selectedOption.nextCategory]
                for (const fq of followUpQuestions) {
                    if (!sequence.find(sq => sq.id === fq.id)) {
                        sequence.push(fq)
                    }
                }
            }
        }

        // Always add risk questions at the end
        for (const rq of QUESTION_POOL.risk) {
            if (!sequence.find(sq => sq.id === rq.id)) {
                sequence.push(rq)
            }
        }

        return sequence
    }, [answers])

    const currentQuestion = questionSequence[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex >= questionSequence.length - 1
    const progressPercent = ((currentQuestionIndex + 1) / (questionSequence.length + 1)) * 100

    const handleAnswerSelect = (questionId, optionValue) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionValue }))
    }

    const handleNext = () => {
        if (isLastQuestion) {
            setShowAdditionalSection(true)
        } else {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const handlePrevious = () => {
        if (showAdditionalSection) {
            setShowAdditionalSection(false)
        } else if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const toggleApp = (appName) => {
        setSelectedApps(prev =>
            prev.includes(appName)
                ? prev.filter(a => a !== appName)
                : [...prev, appName]
        )
    }

    const handleSubmit = () => {
        // Calculate behavioral traits from answers
        const quizAnswers = {
            saves_regularly: ['salary_behavior', 'savings_method'].some(id => {
                const q = questionSequence.find(q => q.id === id)
                return q?.options.find(o => o.value === answers[id])?.trait?.includes('sav')
            }),
            waits_before_purchase: answers.flash_sale === 'b',
            has_budget: answers.unexpected_expense === 'a',
            tracks_expenses: answers.budget_tracking === 'a',
            avoids_impulsive_buying: answers.flash_sale === 'b' && answers.regret_purchases !== 'a'
        }

        // Calculate total behavioral score from all answered questions
        let totalScore = 0
        let answeredCount = 0
        Object.entries(answers).forEach(([questionId, answerValue]) => {
            const question = questionSequence.find(q => q.id === questionId)
            const option = question?.options.find(o => o.value === answerValue)
            if (option) {
                totalScore += option.score
                answeredCount++
            }
        })

        const behavioralData = {
            impulse_control_score: impulseScore,
            installed_apps: selectedApps,
            quiz_answers: quizAnswers,
            device_age_months: deviceAge,
            app_usage_hours_daily: dailyUsage,
            ipsative_score: totalScore,
            questions_answered: answeredCount,
            adaptive_path: questionPath // Track which question paths were triggered
        }

        onDataCollected(behavioralData)
        onNext()
    }

    const canProceed = currentQuestion && answers[currentQuestion.id]

    return (
        <div className="wizard-step questionnaire-step">
            <div className="step-header">
                <ClipboardList size={40} className="step-icon" />
                <h2 className="step-title">Behavioral Assessment</h2>
                <p className="step-description">
                    Answer honestly - your responses help us understand your financial behavior.
                    <span className="adaptive-note">
                        <Brain size={14} /> Questions adapt based on your answers
                    </span>
                </p>
            </div>

            {!showAdditionalSection ? (
                <div className="questions-section">
                    {/* Progress bar */}
                    <div className="adaptive-progress">
                        <div className="adaptive-progress-bar">
                            <div
                                className="adaptive-progress-fill"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <span className="adaptive-progress-text">
                            Question {currentQuestionIndex + 1} of ~{questionSequence.length}
                        </span>
                    </div>

                    {/* Current Question */}
                    {currentQuestion && (
                        <div className="question-card adaptive-question" key={currentQuestion.id}>
                            <div className="question-number">Q{currentQuestionIndex + 1}</div>
                            <p className="question-text">{currentQuestion.question}</p>
                            <div className="question-options">
                                {currentQuestion.options.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`option-btn ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
                                        onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                                    >
                                        <span className="option-letter">{option.value.toUpperCase()}</span>
                                        <span className="option-text">{option.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="page-navigation">
                        {currentQuestionIndex > 0 && (
                            <button
                                className="btn btn-secondary"
                                onClick={handlePrevious}
                            >
                                Previous
                            </button>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed}
                        >
                            {isLastQuestion ? 'Continue to Final Section' : 'Next'}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="additional-section">
                    <div className="questions-progress">
                        Final Section: Additional Information
                    </div>

                    {/* Impulse Control Slider */}
                    <div className="slider-section">
                        <label className="slider-label">
                            <span>How would you rate your impulse control?</span>
                            <span className="slider-value">{impulseScore}/10</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={impulseScore}
                            onChange={(e) => setImpulseScore(parseInt(e.target.value))}
                            className="impulse-slider"
                        />
                        <div className="slider-labels">
                            <span>😟 Often overspend</span>
                            <span>😊 Very disciplined</span>
                        </div>
                    </div>

                    {/* App Selection */}
                    <div className="apps-section">
                        <label className="section-label">
                            <Smartphone size={18} />
                            Which of these apps do you have installed?
                        </label>
                        <div className="apps-grid">
                            {APPS_LIST.map((app) => (
                                <button
                                    key={app.name}
                                    className={`app-chip ${selectedApps.includes(app.name) ? 'selected' : ''} ${app.risk ? 'risky' : ''}`}
                                    onClick={() => toggleApp(app.name)}
                                >
                                    {app.name}
                                    {app.risk && selectedApps.includes(app.name) && (
                                        <span className="risk-indicator">⚠</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Device Info */}
                    <div className="device-section">
                        <div className="device-input">
                            <label>
                                <Clock size={16} />
                                Phone age (months)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="60"
                                value={deviceAge}
                                onChange={(e) => setDeviceAge(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <div className="device-input">
                            <label>
                                <Smartphone size={16} />
                                Daily screen time (hours)
                            </label>
                            <input
                                type="number"
                                min="0.5"
                                max="16"
                                step="0.5"
                                value={dailyUsage}
                                onChange={(e) => setDailyUsage(parseFloat(e.target.value) || 1)}
                            />
                        </div>
                    </div>

                    <div className="page-navigation">
                        <button
                            className="btn btn-secondary"
                            onClick={handlePrevious}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleSubmit}
                        >
                            Submit & Analyze
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default QuestionnaireStep
