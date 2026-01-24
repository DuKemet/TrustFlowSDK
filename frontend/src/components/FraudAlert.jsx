function FraudAlert({ fraudFlags }) {
    return (
        <div className="fraud-alert">
            <div className="fraud-alert-icon">🚨</div>
            <div className="fraud-alert-content">
                <h3>Security Risk Detected — Application Blocked</h3>
                <p>
                    {fraudFlags?.loan_stacking && 'Loan Stacking: Multiple active lenders detected indicating high default risk. '}
                    {fraudFlags?.wash_trading && 'Wash Trading: Suspicious circular transaction patterns identified. '}
                    {!fraudFlags?.loan_stacking && !fraudFlags?.wash_trading && fraudFlags?.suspicious_patterns?.length > 0 && (
                        <span>{fraudFlags.suspicious_patterns.join(' ')}</span>
                    )}
                </p>
            </div>
        </div>
    )
}

export default FraudAlert
