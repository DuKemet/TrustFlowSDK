import { useRef } from 'react'
import { Upload, UserCircle, RotateCcw, Loader2 } from 'lucide-react'

function UploadCard({ onLoadDemo, onReset, onUpload, isLoading, personaLoaded, demoData }) {
    const fileInputRef = useRef(null)

    const handleFileUpload = (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result)
                onUpload(jsonData)
            } catch (error) {
                alert('Invalid JSON file. Please upload a valid JSON file with financial and behavioral data.')
            }
        }
        reader.readAsText(file)
    }

    const triggerFileUpload = () => {
        fileInputRef.current?.click()
    }

    if (personaLoaded && !isLoading) {
        return (
            <div className="upload-section">
                <div className="upload-card">
                    <h2 className="upload-card-title">Analysis Complete</h2>
                    <p className="upload-card-description">
                        The applicant data has been processed. View the detailed results below.
                    </p>
                    <div className="upload-actions">
                        <button className="btn btn-secondary" onClick={onReset}>
                            <span className="btn-icon">
                                <RotateCcw size={18} />
                            </span>
                            Analyze Another Applicant
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="upload-section">
            <div className="upload-card">
                <h2 className="upload-card-title">Analyze New Applicant</h2>
                <p className="upload-card-description">
                    Upload applicant data in JSON format or use a demo profile to see the AI-powered credit assessment in action.
                </p>

                <div className="upload-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                    />

                    <button
                        className="btn btn-success btn-lg"
                        onClick={triggerFileUpload}
                        disabled={isLoading}
                    >
                        <span className="btn-icon">
                            <Upload size={18} />
                        </span>
                        Upload JSON File
                    </button>

                    <button
                        className="btn btn-primary btn-lg"
                        onClick={onLoadDemo}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="btn-icon" style={{ animation: 'spin 1s linear infinite' }}>
                                    <Loader2 size={18} />
                                </span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">
                                    <UserCircle size={18} />
                                </span>
                                Try Demo Profile
                            </>
                        )}
                    </button>
                </div>

                <div className="upload-hint">
                    <strong>Expected format:</strong> JSON with <code>financial</code> and <code>behavioral</code> objects
                    <br />
                    <span style={{ opacity: 0.7 }}>
                        Use <code>sample_applicant.json</code> or <code>fraud_test.json</code> from the project folder for testing.
                    </span>
                </div>
            </div>
        </div>
    )
}

export default UploadCard
