import { useEffect, useRef } from 'react'

function ScoreGauge({ score, riskLevel, recommendation, maxLoanAmount }) {
    const canvasRef = useRef(null)

    const getScoreColor = (score) => {
        if (score >= 750) return '#22C55E'
        if (score >= 550) return '#F59E0B'
        return '#EF4444'
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const centerX = canvas.width / 2
        const centerY = canvas.height - 10
        const radius = Math.min(centerX, centerY) - 16

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Background arc
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false)
        ctx.lineWidth = 20
        ctx.strokeStyle = '#E5E7EB'
        ctx.lineCap = 'round'
        ctx.stroke()

        // Calculate progress
        const normalizedScore = Math.max(0, Math.min(1, (score - 300) / 600))
        const endAngle = Math.PI + (normalizedScore * Math.PI)

        // Gradient arc
        const gradient = ctx.createLinearGradient(0, centerY, canvas.width, centerY)
        gradient.addColorStop(0, '#EF4444')
        gradient.addColorStop(0.5, '#F59E0B')
        gradient.addColorStop(1, '#22C55E')

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false)
        ctx.lineWidth = 20
        ctx.strokeStyle = gradient
        ctx.lineCap = 'round'
        ctx.stroke()

        // Indicator dot
        const dotX = centerX + radius * Math.cos(endAngle)
        const dotY = centerY + radius * Math.sin(endAngle)

        ctx.beginPath()
        ctx.arc(dotX, dotY, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = getScoreColor(score)
        ctx.lineWidth = 4
        ctx.stroke()
    }, [score])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="score-card">
            <div className="score-gauge-container">
                <div className="score-gauge">
                    <canvas
                        ref={canvasRef}
                        width={240}
                        height={140}
                        style={{ display: 'block' }}
                    />
                    <div className="score-gauge-value">
                        <div
                            className="score-gauge-number"
                            style={{ color: getScoreColor(score) }}
                        >
                            {score}
                        </div>
                        <div className="score-gauge-label">Trust Score</div>
                    </div>
                </div>

                <div className="score-gauge-range">
                    <span>300 (High Risk)</span>
                    <span>900 (Low Risk)</span>
                </div>

                <div className={`recommendation-badge ${recommendation === 'APPROVE' ? 'approve' : 'reject'}`}>
                    {recommendation === 'APPROVE' ? '✅' : '❌'}
                    <span>{recommendation}</span>
                    <span style={{ opacity: 0.7 }}>•</span>
                    <span>{riskLevel} Risk</span>
                </div>

                {recommendation === 'APPROVE' && maxLoanAmount && (
                    <div className="max-loan-display">
                        <div className="max-loan-label">Recommended Maximum Loan</div>
                        <div className="max-loan-value">{formatCurrency(maxLoanAmount)}</div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ScoreGauge
