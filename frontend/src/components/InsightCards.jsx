import { Wallet, Brain, Bot, ClipboardList } from 'lucide-react'

function InsightCards({ financialScore, behavioralScore, aiVerdict, reasoning }) {
    const getScoreStatus = (score) => {
        if (score >= 70) return 'good'
        if (score >= 50) return 'medium'
        return 'poor'
    }

    const categorizeReasoning = (items) => {
        return items?.map(item => {
            if (item.includes('✓') || item.includes('Good') || item.includes('Excellent') || item.includes('Strong')) {
                return { text: item, type: 'positive' }
            } else if (item.includes('⚠') || item.includes('⛔') || item.includes('Low') || item.includes('Risk')) {
                return { text: item, type: 'negative' }
            }
            return { text: item, type: 'neutral' }
        }) || []
    }

    const financialReasoning = reasoning?.filter(r =>
        r.includes('savings') || r.includes('income') || r.includes('lender') || r.includes('Expense') || r.includes('loan')
    ) || []

    const behavioralReasoning = reasoning?.filter(r =>
        r.includes('Impulse') || r.includes('apps') || r.includes('Saves') ||
        r.includes('Waits') || r.includes('budget') || r.includes('expense') ||
        r.includes('✓') || r.includes('⚠')
    ) || []

    return (
        <div className="insights-grid">
            {/* Financial Health Card */}
            <div className="insight-card">
                <div className="insight-card-header">
                    <div className="insight-card-icon financial">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <div className="insight-card-title">Financial Health</div>
                        <div className="insight-card-subtitle">Income & Savings Analysis</div>
                    </div>
                </div>

                <div className={`insight-card-score ${getScoreStatus(financialScore)}`}>
                    {financialScore}<span style={{ fontSize: '18px', fontWeight: 500, opacity: 0.5 }}>/100</span>
                </div>

                <div className="progress-bar">
                    <div
                        className={`progress-bar-fill ${getScoreStatus(financialScore)}`}
                        style={{ width: `${financialScore}%` }}
                    />
                </div>

                {financialReasoning.length > 0 && (
                    <div className="reasoning-tags">
                        {categorizeReasoning(financialReasoning.slice(0, 3)).map((item, idx) => (
                            <span key={idx} className={`reasoning-tag ${item.type}`}>{item.text}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Behavioral Stability Card */}
            <div className="insight-card">
                <div className="insight-card-header">
                    <div className="insight-card-icon behavioral">
                        <Brain size={24} />
                    </div>
                    <div>
                        <div className="insight-card-title">Behavioral Signals</div>
                        <div className="insight-card-subtitle">Digital Footprint Analysis</div>
                    </div>
                </div>

                <div className={`insight-card-score ${getScoreStatus(behavioralScore)}`}>
                    {behavioralScore}<span style={{ fontSize: '18px', fontWeight: 500, opacity: 0.5 }}>/100</span>
                </div>

                <div className="progress-bar">
                    <div
                        className={`progress-bar-fill ${getScoreStatus(behavioralScore)}`}
                        style={{ width: `${behavioralScore}%` }}
                    />
                </div>

                {behavioralReasoning.length > 0 && (
                    <div className="reasoning-tags">
                        {categorizeReasoning(behavioralReasoning.slice(0, 3)).map((item, idx) => (
                            <span key={idx} className={`reasoning-tag ${item.type}`}>{item.text}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Verdict Card */}
            <div className="insight-card">
                <div className="insight-card-header">
                    <div className="insight-card-icon ai">
                        <Bot size={24} />
                    </div>
                    <div>
                        <div className="insight-card-title">AI Risk Assessment</div>
                        <div className="insight-card-subtitle">Powered by Gemini 2.0</div>
                    </div>
                </div>

                <div className="insight-card-content">
                    {aiVerdict || 'AI analysis completed using rule-based fallback scoring.'}
                </div>
            </div>

            {/* Full Analysis Breakdown */}
            {reasoning && reasoning.length > 0 && (
                <div className="insight-card full-width">
                    <div className="insight-card-header">
                        <div className="insight-card-icon" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <div className="insight-card-title">Complete Analysis Breakdown</div>
                            <div className="insight-card-subtitle">All factors considered in this assessment</div>
                        </div>
                    </div>

                    <div className="reasoning-tags">
                        {categorizeReasoning(reasoning).map((item, idx) => (
                            <span key={idx} className={`reasoning-tag ${item.type}`}>{item.text}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default InsightCards
