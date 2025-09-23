import { FC, useState, useEffect, useRef } from 'react'
import { useApiMutation } from '../api/mutations/useApiMutation'
import { GenerateMessagesInput } from '../api/types/leads/generateMessages'
import { ApiOutput } from '../api'
import { api } from '../api'

interface DetailedError {
  leadId: number
  leadName: string
  error: string
}

interface MessageTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  selectedLeads: Set<number>
  leadsData: ApiOutput<typeof api.leads.getMany>
  onSuccess: (successCount: number, totalCount: number) => void
}

export const MessageTemplateModal: FC<MessageTemplateModalProps> = ({
  isOpen,
  onClose,
  selectedLeads,
  leadsData,
  onSuccess,
}) => {
  const [template, setTemplate] = useState('')
  const [validationError, setValidationError] = useState('')
  const [detailedErrors, setDetailedErrors] = useState<DetailedError[]>([])
  const [generationSummary, setGenerationSummary] = useState<{successCount: number, totalCount: number} | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const generateMessagesMutation = useApiMutation('leads.generateMessages')

  const validateTemplate = (template: string): boolean => {
    if (!template.trim()) {
      setValidationError('Template cannot be empty')
      return false
    }

    // Define valid field names
    const validFields = new Set(['firstName', 'lastName', 'email', 'jobTitle', 'countryCode', 'companyName', 'message'])
    
    // Extract all field names from template
    const fieldPattern = /\{(\w+)\}/g
    const foundFields = new Set<string>()
    let match
    while ((match = fieldPattern.exec(template)) !== null) {
      foundFields.add(match[1])
    }
    
    if (foundFields.size === 0) {
      setValidationError('Template must contain at least one field placeholder like {firstName}, {lastName}, etc.')
      return false
    }
    
    // Check for invalid field names
    const invalidFields = Array.from(foundFields).filter(field => !validFields.has(field))
    if (invalidFields.length > 0) {
      setValidationError(`Invalid field${invalidFields.length > 1 ? 's' : ''}: {${invalidFields.join('}, {')}}`)
      return false
    }

    setValidationError('')
    return true
  }

  const handleTemplateChange = (value: string) => {
    setTemplate(value)
    if (validationError && value.trim()) {
      validateTemplate(value)
    }
  }

  const handleSubmit = async () => {
    if (!validateTemplate(template)) {
      return
    }

    const input: GenerateMessagesInput = {
      template: template.trim(),
      leadIds: Array.from(selectedLeads),
    }

    generateMessagesMutation.mutate(input, {
      onSuccess: (result) => {
        const successCount = result.results.filter(r => r.success).length
        const totalCount = result.results.length
        const failedResults = result.results.filter(r => !r.success)
        
        // Always set the summary when we get results
        setGenerationSummary({ successCount, totalCount })
        
        if (failedResults.length > 0) {
          // Create detailed error messages
          const errors: DetailedError[] = failedResults.map(failedResult => {
            const lead = leadsData.find(l => l.id === failedResult.leadId)
            const leadName = lead ? `${lead.firstName}${lead.lastName ? ' ' + lead.lastName : ''}` : `Lead ${failedResult.leadId}`
            return {
              leadId: failedResult.leadId,
              leadName,
              error: failedResult.error || 'Unknown error'
            }
          })
          setDetailedErrors(errors)
          // Don't close modal when there are errors
        } else {
          // Only close modal when all messages succeed
          onSuccess(successCount, totalCount)
          handleClose()
        }
      }
    })
  }

  const handleClose = () => {
    setTemplate('')
    setValidationError('')
    setDetailedErrors([])
    setGenerationSummary(null)
    generateMessagesMutation.reset()
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

  // Focus management
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  // Trap focus in modal
  useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, textarea, input, [tabindex]:not([tabindex="-1"])'
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

  const isLoading = generateMessagesMutation.isPending
  const hasError = generateMessagesMutation.isError
  const isValid = template.trim() && !validationError

  return (
    <div 
      className="message-template-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="message-template-dialog"
      >
        <div className="message-template-header">
          <h3 id="modal-title">Send Message Template</h3>
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
          <div className="selected-leads-info">
            {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
          </div>

          <div className="template-input-section">
            <label htmlFor="message-template" className="template-label">
              Message Template
            </label>
            <textarea
              ref={textareaRef}
              id="message-template"
              className="template-textarea"
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder="Enter message template using {firstName}, {lastName}, {email}, {jobTitle}, {countryCode}, {companyName}"
              disabled={isLoading}
              rows={4}
              aria-describedby={validationError ? "template-error" : undefined}
            />
            {validationError && (
              <div id="template-error" className="template-validation-error" role="alert">
                {validationError}
              </div>
            )}
            
            <div className="available-fields-info">
              <span className="available-fields-label">Available fields:</span>
              <span className="available-fields-list">
                {'{firstName}, {lastName}, {email}, {jobTitle}, {countryCode}, {companyName}, {message}'}
              </span>
            </div>
          </div>

          {generationSummary && (
            <div className="generation-summary-section">
              <h4 className="generation-summary-title">Generation Results:</h4>
              <div className="generation-summary-content">
                <span className="summary-success">
                  {generationSummary.successCount} succeeded
                </span>
                {generationSummary.successCount < generationSummary.totalCount && (
                  <>
                    <span className="summary-separator"> • </span>
                    <span className="summary-failed">
                      {generationSummary.totalCount - generationSummary.successCount} failed
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {detailedErrors.length > 0 && (
            <div className="detailed-errors-section">
              <h4 className="detailed-errors-title">Error Details:</h4>
              <div className="detailed-errors-list">
                {detailedErrors.map((error) => (
                  <div key={error.leadId} className="detailed-error-item">
                    Message for <strong>{error.leadName}</strong> was not generated because{' '}
                    {error.error.toLowerCase().includes('missing') 
                      ? `these fields are missing: ${error.error.replace(/^Missing field[s]?: /i, '')}`
                      : error.error.toLowerCase().includes('not available') || error.error.toLowerCase().includes('invalid')
                        ? `${error.error.toLowerCase()}`
                        : error.error.toLowerCase()
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasError && !detailedErrors.length && (
            <div className="template-api-error" role="alert">
              Error: {generateMessagesMutation.error?.message || 'Failed to generate messages'}
            </div>
          )}
        </div>

        <div className="message-template-footer">
          <button
            className="template-cancel-button"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="template-generate-button"
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Messages'}
          </button>
        </div>
      </div>
    </div>
  )
}