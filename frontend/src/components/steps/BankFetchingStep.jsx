import { useEffect, useState } from 'react'
import { Database, FileSearch, BarChart3, CheckCircle } from 'lucide-react'

const LOADING_STAGES = [
    { icon: Database, text: 'Connecting to your bank...', duration: 1500 },
    { icon: FileSearch, text: 'Fetching transaction history...', duration: 2000 },
    { icon: BarChart3, text: 'Analyzing spending patterns...', duration: 1500 },
    { icon: CheckCircle, text: 'Data retrieved successfully!', duration: 500 },
]

function BankFetchingStep({ onNext, bankName }) {
    const [currentStage, setCurrentStage] = useState(0)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        let totalDuration = LOADING_STAGES.reduce((sum, s) => sum + s.duration, 0)
        let elapsed = 0

        const stageTimeouts = LOADING_STAGES.map((stage, index) => {
            const timeout = setTimeout(() => {
                setCurrentStage(index)
            }, elapsed)
            elapsed += stage.duration
            return timeout
        })

        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval)
                    return 100
                }
                return prev + (100 / (totalDuration / 50))
            })
        }, 50)

        // Auto advance to next step
        const advanceTimeout = setTimeout(() => {
            onNext()
        }, totalDuration + 500)

        return () => {
            stageTimeouts.forEach(clearTimeout)
            clearInterval(progressInterval)
            clearTimeout(advanceTimeout)
        }
    }, [onNext])

    const CurrentIcon = LOADING_STAGES[currentStage]?.icon || Database

    return (
        <div className="wizard-step bank-fetching-step">
            <div className="fetching-animation">
                <div className="fetching-icon-wrapper">
                    <div className="fetching-pulse"></div>
                    <div className="fetching-icon">
                        <CurrentIcon size={48} />
                    </div>
                </div>

                <h2 className="fetching-title">
                    {LOADING_STAGES[currentStage]?.text || 'Processing...'}
                </h2>

                <div className="fetching-progress-container">
                    <div className="fetching-progress-bar">
                        <div
                            className="fetching-progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="fetching-progress-text">{Math.round(progress)}%</span>
                </div>

                <div className="fetching-stages">
                    {LOADING_STAGES.map((stage, index) => (
                        <div
                            key={index}
                            className={`fetching-stage ${index < currentStage ? 'completed' : ''} ${index === currentStage ? 'active' : ''}`}
                        >
                            <div className="stage-dot"></div>
                            <span className="stage-text">{stage.text.replace('...', '')}</span>
                        </div>
                    ))}
                </div>

                <p className="fetching-note">
                    Securely retrieving data from {bankName || 'your bank'}...
                </p>
            </div>
        </div>
    )
}

export default BankFetchingStep
