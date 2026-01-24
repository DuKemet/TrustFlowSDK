import { useEffect, useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'

const ANALYSIS_STAGES = [
    'Analyzing financial patterns...',
    'Processing behavioral signals...',
    'Running fraud detection checks...',
    'Calculating credit score...',
    'Generating AI verdict...',
    'Preparing detailed report...'
]

function ProcessingStep({ onComplete }) {
    const [currentStage, setCurrentStage] = useState(0)
    const [dots, setDots] = useState('')

    useEffect(() => {
        // Animate dots
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.')
        }, 400)

        // Cycle through stages
        const stageInterval = setInterval(() => {
            setCurrentStage(prev => {
                if (prev >= ANALYSIS_STAGES.length - 1) {
                    return prev
                }
                return prev + 1
            })
        }, 800)

        return () => {
            clearInterval(dotsInterval)
            clearInterval(stageInterval)
        }
    }, [])

    return (
        <div className="wizard-step processing-step">
            <div className="processing-animation">
                <div className="processing-icon-wrapper">
                    <div className="processing-glow"></div>
                    <div className="processing-ring"></div>
                    <div className="processing-icon">
                        <Brain size={48} />
                    </div>
                    <Sparkles className="processing-sparkle s1" size={16} />
                    <Sparkles className="processing-sparkle s2" size={12} />
                    <Sparkles className="processing-sparkle s3" size={14} />
                </div>

                <h2 className="processing-title">
                    AI Analysis in Progress{dots}
                </h2>

                <p className="processing-stage">
                    {ANALYSIS_STAGES[currentStage]}
                </p>

                <div className="processing-stages-list">
                    {ANALYSIS_STAGES.map((stage, index) => (
                        <div
                            key={index}
                            className={`processing-stage-item ${index < currentStage ? 'completed' : ''} ${index === currentStage ? 'active' : ''}`}
                        >
                            <div className="stage-indicator">
                                {index < currentStage ? '✓' : index === currentStage ? '●' : '○'}
                            </div>
                            <span>{stage.replace('...', '')}</span>
                        </div>
                    ))}
                </div>

                <p className="processing-note">
                    Our AI is analyzing your financial and behavioral data to generate a comprehensive credit assessment.
                </p>
            </div>
        </div>
    )
}

export default ProcessingStep
