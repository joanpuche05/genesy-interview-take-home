import { FC, useState, useEffect, useRef } from 'react'
import { useApiMutation } from '../api/mutations/useApiMutation'
import { GenerateMessagesInput } from '../api/types/leads/generateMessages'

interface MessageTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  selectedLeads: Set<number>
  onSuccess: (successCount: number, totalCount: number) => void
}

export const MessageTemplateModal: FC<MessageTemplateModalProps> = ({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess,
}) => {
  const [template, setTemplate] = useState('')
  const [validationError, setValidationError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const generateMessagesMutation = useApiMutation('leads.generateMessages')

  const validateTemplate = (template: string): boolean => {
    if (!template.trim()) {
      setValidationError('Template cannot be empty')
      return false
    }

    const fieldPattern = /\{(firstName|lastName|email|jobTitle|countryCode|companyName)\}/
    if (!fieldPattern.test(template)) {
      setValidationError('Template must contain at least one field placeholder like {firstName}, {lastName}, etc.')
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
        onSuccess(successCount, totalCount)
        handleClose()
      }
    })
  }

  const handleClose = () => {
    setTemplate('')
    setValidationError('')
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
          </div>

          {hasError && (
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