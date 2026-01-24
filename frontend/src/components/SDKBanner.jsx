import { Code2, Package, Cpu, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const INTEGRATION_CODE = `// Install the TrustFlow SDK
npm install @trustflow/credit-sdk

// Initialize in your lending app
import { TrustFlow } from '@trustflow/credit-sdk';

const trustflow = new TrustFlow({
    apiKey: 'your_api_key',
    environment: 'production'
});

// Trigger credit assessment flow
const result = await trustflow.assess({
    aaConsentToken: consentToken,  // From Account Aggregator
    behavioralData: {
        quizAnswers: userResponses,
        installedApps: appList,
        deviceAge: 18
    }
});

// Use the result
if (result.recommendation === 'APPROVE') {
    disburseLoan(result.maxLoanAmount);
}`

const WEBHOOK_CODE = `// Configure webhooks for async results
trustflow.onAssessmentComplete((result) => {
    console.log('Trust Score:', result.score);
    console.log('Max Loan:', result.maxLoanAmount);
    console.log('AI Verdict:', result.verdict);
});`

function SDKBanner() {
    const [showCode, setShowCode] = useState(false)

    return (
        <div className="sdk-banner">
            <div className="sdk-badge">
                <Package size={16} />
                <span>SDK DEMO</span>
            </div>

            <div className="sdk-content">
                <div className="sdk-main">
                    <h2 className="sdk-title">
                        <Cpu size={24} />
                        TrustFlow Credit SDK
                    </h2>
                    <p className="sdk-description">
                        This is a <strong>demonstration</strong> of the TrustFlow Alternative Credit Scoring SDK.
                        In production, this entire flow is embedded as a <strong>white-label component</strong> into
                        your lending application via our JavaScript SDK.
                    </p>

                    <div className="sdk-features">
                        <div className="sdk-feature">
                            <span className="feature-icon"></span>
                            <span>Drop-in React/JS Component</span>
                        </div>
                        <div className="sdk-feature">
                            <span className="feature-icon"></span>
                            <span>AA Framework Integration</span>
                        </div>
                        <div className="sdk-feature">
                            <span className="feature-icon"></span>
                            <span>AI-Powered Scoring Engine</span>
                        </div>
                        <div className="sdk-feature">
                            <span className="feature-icon"></span>
                            <span>Built-in Fraud Detection</span>
                        </div>
                    </div>
                </div>

                <button
                    className="sdk-code-toggle"
                    onClick={() => setShowCode(!showCode)}
                >
                    <Code2 size={18} />
                    {showCode ? 'Hide' : 'View'} Integration Code
                    {showCode ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {showCode && (
                <div className="sdk-code-section">
                    <div className="code-block">
                        <div className="code-header">
                            <span className="code-lang">JavaScript / React</span>
                            <span className="code-file">your-lending-app.js</span>
                        </div>
                        <pre className="code-content">{INTEGRATION_CODE}</pre>
                    </div>

                    <div className="code-block">
                        <div className="code-header">
                            <span className="code-lang">Webhook Handler</span>
                            <span className="code-file">webhooks.js</span>
                        </div>
                        <pre className="code-content">{WEBHOOK_CODE}</pre>
                    </div>

                    <div className="api-endpoints">
                        <h4>Available API Endpoints</h4>
                        <div className="endpoint">
                            <span className="method post">POST</span>
                            <code>/api/v1/assess</code>
                            <span className="desc">Full credit assessment</span>
                        </div>
                        <div className="endpoint">
                            <span className="method get">GET</span>
                            <code>/api/v1/score/:id</code>
                            <span className="desc">Get assessment result</span>
                        </div>
                        <div className="endpoint">
                            <span className="method post">POST</span>
                            <code>/api/v1/fraud-check</code>
                            <span className="desc">Standalone fraud detection</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="sdk-footer">
                <span className="demo-note">
                    👆 This demo simulates the SDK experience. The actual SDK provides:
                </span>
                <div className="sdk-extras">
                    <span>White-label UI</span>
                    <span>•</span>
                    <span>Custom Branding</span>
                    <span>•</span>
                    <span>Webhooks</span>
                    <span>•</span>
                    <span>REST API</span>
                </div>
            </div>
        </div>
    )
}

export default SDKBanner
