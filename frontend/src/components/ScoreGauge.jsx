import { useEffect, useRef } from 'react'

function ScoreGauge({ score, riskLevel, recommendation, maxLoanAmount }) {
    const canvasRef = useRef(null)

    const getScoreColor = (score) => {
        if (score >= 750) return '#00ff88' // Neon Green
        if (score >= 550) return '#ffbb00' // Neon Yellow
        return '#ff3366' // Neon Red
    }

    const getGlowColor = (score) => {
        if (score >= 750) return 'rgba(0, 255, 136, 0.5)'
        if (score >= 550) return 'rgba(255, 187, 0, 0.5)'
        return 'rgba(255, 51, 102, 0.5)'
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const centerX = canvas.width / 2
        const centerY = canvas.height - 10
        const radius = Math.min(centerX, centerY) - 20

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Background arc with subtle glow
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false)
        ctx.lineWidth = 18
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
        ctx.lineCap = 'round'
        ctx.stroke()

        // Calculate progress with smooth animation
        const normalizedScore = Math.max(0, Math.min(1, (score - 300) / 600))
        const endAngle = Math.PI + (normalizedScore * Math.PI)

        // Create neon gradient with cyberpunk colors
        const gradient = ctx.createLinearGradient(0, centerY, canvas.width, centerY)
        gradient.addColorStop(0, '#ff3366')   // Neon Red
        gradient.addColorStop(0.35, '#ff6600') // Neon Orange
        gradient.addColorStop(0.5, '#ffbb00')  // Neon Yellow
        gradient.addColorStop(0.7, '#00ff88')  // Neon Green
        gradient.addColorStop(1, '#00fff2')    // Neon Cyan

        // Outer glow effect
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false)
        ctx.lineWidth = 26
        ctx.strokeStyle = getGlowColor(score)
        ctx.filter = 'blur(8px)'
        ctx.stroke()
        ctx.filter = 'none'

        // Main arc
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false)
        ctx.lineWidth = 18
        ctx.strokeStyle = gradient
        ctx.lineCap = 'round'
        ctx.stroke()

        // Neon indicator dot with glow
        const dotX = centerX + radius * Math.cos(endAngle)
        const dotY = centerY + radius * Math.sin(endAngle)

        // Outer glow for dot
        ctx.beginPath()
        ctx.arc(dotX, dotY, 16, 0, Math.PI * 2)
        ctx.fillStyle = getGlowColor(score)
        ctx.filter = 'blur(10px)'
        ctx.fill()
        ctx.filter = 'none'

        // Main dot
        ctx.beginPath()
        ctx.arc(dotX, dotY, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#0a0a0f'
        ctx.fill()
        ctx.strokeStyle = getScoreColor(score)
        ctx.lineWidth = 3
        ctx.stroke()

        // Inner dot
        ctx.beginPath()
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2)
        ctx.fillStyle = getScoreColor(score)
        ctx.fill()

        // Add tick marks for scale
        const tickCount = 7
        for (let i = 0; i <= tickCount; i++) {
            const angle = Math.PI + (i / tickCount) * Math.PI
            const innerRadius = radius - 30
            const outerRadius = radius - 22

            const x1 = centerX + innerRadius * Math.cos(angle)
            const y1 = centerY + innerRadius * Math.sin(angle)
            const x2 = centerX + outerRadius * Math.cos(angle)
            const y2 = centerY + outerRadius * Math.sin(angle)

            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 2
            ctx.stroke()
        }
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
                        width={260}
                        height={150}
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
                    <span style={{ opacity: 0.5 }}>•</span>
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
