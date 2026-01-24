import { Shield, FileSearch, ClipboardList, Brain, CheckCircle } from 'lucide-react'

const STEPS = [
    { id: 1, name: 'Consent', icon: Shield },
    { id: 2, name: 'Fetch Data', icon: FileSearch },
    { id: 3, name: 'Questionnaire', icon: ClipboardList },
    { id: 4, name: 'Analysis', icon: Brain },
    { id: 5, name: 'Results', icon: CheckCircle },
]

function StepProgress({ currentStep }) {
    return (
        <div className="step-progress">
            <div className="step-progress-container">
                {STEPS.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = currentStep > step.id
                    const isActive = currentStep === step.id
                    const isPending = currentStep < step.id

                    return (
                        <div key={step.id} className="step-item-wrapper">
                            <div
                                className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                            >
                                <div className="step-circle">
                                    {isCompleted ? (
                                        <CheckCircle size={20} />
                                    ) : (
                                        <Icon size={20} />
                                    )}
                                </div>
                                <span className="step-name">{step.name}</span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default StepProgress
