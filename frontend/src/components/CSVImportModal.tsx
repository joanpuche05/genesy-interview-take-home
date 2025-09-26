import { FC, useState, useRef, useEffect, DragEvent } from 'react'
import { useApiMutation } from '../api/mutations/useApiMutation'
import { CSVImportInput, CSVImportOutput } from '../api/types/leads/csvImport'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (imported: number, errors: number) => void
}

export const CSVImportModal: FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [importResults, setImportResults] = useState<CSVImportOutput | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const csvImportMutation = useApiMutation('leads.csvImport')

  const validateFile = (file: File): string | null => {
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return 'Please select a CSV file'
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB'
    }
    
    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      return
    }
    
    setSelectedFile(file)
    setImportResults(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    const input: CSVImportInput = { file: selectedFile }

    csvImportMutation.mutate(input, {
      onSuccess: (result: CSVImportOutput) => {
        setImportResults(result)
        if (result.success && result.errors === 0) {
          // Auto-close after successful import with no errors
          setTimeout(() => {
            onSuccess(result.imported, result.errors)
            handleClose()
          }, 2000)
        } else {
          onSuccess(result.imported, result.errors)
        }
      }
    })
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResults(null)
    setDragActive(false)
    csvImportMutation.reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  // Trap focus in modal
  useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, input[type="file"], [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  if (!isOpen) return null

  const isLoading = csvImportMutation.isPending
  const hasError = csvImportMutation.isError && !importResults

  return (
    <div 
      className="message-template-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
    >
      <div 
        ref={modalRef}
        className="message-template-dialog"
      >
        <div className="message-template-header">
          <h3 id="csv-modal-title">Import CSV File</h3>
          <button
            className="modal-close-button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="message-template-body">
          {!importResults && (
            <>
              <div 
                className={`csv-upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                  disabled={isLoading}
                />
                
                {selectedFile ? (
                  <div className="selected-file-info">
                    <div className="file-icon">📄</div>
                    <div className="file-details">
                      <div className="file-name">{selectedFile.name}</div>
                      <div className="file-size">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="upload-instructions">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      <div className="upload-primary">
                        Drag and drop your CSV file here, or click to browse
                      </div>
                      <div className="upload-secondary">
                        Maximum file size: 10MB
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="csv-format-info">
                <h4>Required CSV Format:</h4>
                <p>Your CSV file should contain the following columns:</p>
                <ul>
                  <li><strong>firstName</strong> (required)</li>
                  <li><strong>lastName</strong> (required)</li>
                  <li><strong>email</strong> (required)</li>
                  <li><strong>jobTitle</strong> (optional)</li>
                  <li><strong>countryCode</strong> (optional)</li>
                  <li><strong>companyName</strong> (optional)</li>
                  <li><strong>gender</strong> (optional)</li>
                </ul>
              </div>
            </>
          )}

          {importResults && (
            <div className="import-results-section">
              <h4 className={`import-results-title ${importResults.success ? 'success' : 'error'}`}>
                Import Results
              </h4>
              
              <div className="import-summary">
                {importResults.imported > 0 && (
                  <div className="summary-success">
                    ✅ {importResults.imported} lead{importResults.imported !== 1 ? 's' : ''} imported successfully
                  </div>
                )}
                {importResults.errors > 0 && (
                  <div className="summary-failed">
                    ❌ {importResults.errors} error{importResults.errors !== 1 ? 's' : ''} encountered
                  </div>
                )}
                {importResults.errors === 0 && importResults.imported === 0 && (
                  <div className="summary-failed">
                    ❌ No leads were imported
                  </div>
                )}
              </div>

              {importResults.errorDetails && importResults.errorDetails.length > 0 && (
                <div className="import-errors">
                  <h5>Error Details:</h5>
                  <ul className="error-list">
                    {importResults.errorDetails.map((error, index) => (
                      <li key={index} className="error-item">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {hasError && (
            <div className="template-api-error" role="alert">
              Error: {csvImportMutation.error?.message || 'Failed to import CSV file'}
            </div>
          )}
        </div>

        <div className="message-template-footer">
          {!importResults || (importResults && importResults.errors > 0) ? (
            <>
              <button
                className="template-cancel-button"
                onClick={handleClose}
                disabled={isLoading}
              >
                {importResults ? 'Close' : 'Cancel'}
              </button>
              {!importResults && (
                <button
                  className="template-generate-button"
                  onClick={handleImport}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? 'Importing...' : 'Import CSV'}
                </button>
              )}
            </>
          ) : (
            <button
              className="template-generate-button"
              onClick={handleClose}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}