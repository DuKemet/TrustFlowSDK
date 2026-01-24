import { Building2, Shield, CheckCircle2, ChevronRight } from 'lucide-react'

const BANKS = [
    { id: 'sbi', name: 'State Bank of India', color: '#1a4d8f' },
    { id: 'hdfc', name: 'HDFC Bank', color: '#004c8f' },
    { id: 'icici', name: 'ICICI Bank', color: '#f37021' },
    { id: 'axis', name: 'Axis Bank', color: '#97144d' },
    { id: 'kotak', name: 'Kotak Mahindra', color: '#ed1c24' },
    { id: 'pnb', name: 'Punjab National Bank', color: '#004e8c' },
]

function AAConsentStep({ onNext, selectedBank, setSelectedBank }) {
    return (
        <div className="wizard-step aa-consent-step">
            <div className="step-header">
                <div className="aa-logo">
                    <Shield size={40} className="aa-icon" />
                    <span className="aa-title">Account Aggregator</span>
                </div>
                <h2 className="step-title">Connect Your Bank Account</h2>
                <p className="step-description">
                    Securely share your financial data through India's Account Aggregator framework.
                    Your data is encrypted and only used for credit assessment.
                </p>
            </div>

            <div className="bank-selection">
                <h3 className="bank-selection-title">Select Your Bank</h3>
                <div className="bank-grid">
                    {BANKS.map((bank) => (
                        <button
                            key={bank.id}
                            className={`bank-card ${selectedBank === bank.id ? 'selected' : ''}`}
                            onClick={() => setSelectedBank(bank.id)}
                        >
                            <div
                                className="bank-logo"
                                style={{ backgroundColor: bank.color }}
                            >
                                <Building2 size={24} color="white" />
                            </div>
                            <span className="bank-name">{bank.name}</span>
                            {selectedBank === bank.id && (
                                <CheckCircle2 size={20} className="bank-check" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="consent-terms">
                <div className="consent-header">
                    <Shield size={18} />
                    <span>Data Sharing Consent</span>
                </div>
                <ul className="consent-list">
                    <li>✓ Last 6 months of transaction history</li>
                    <li>✓ Account balance and type</li>
                    <li>✓ Income and expense patterns</li>
                    <li>✓ Data encrypted with 256-bit SSL</li>
                </ul>
                <p className="consent-note">
                    By clicking "I Agree", you consent to share your financial data
                    for credit assessment purposes only.
                </p>
            </div>

            <button
                className="btn btn-primary btn-lg consent-btn"
                onClick={onNext}
                disabled={!selectedBank}
            >
                I Agree & Connect
                <ChevronRight size={20} />
            </button>
        </div>
    )
}

export default AAConsentStep
