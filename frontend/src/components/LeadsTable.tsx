import { useQuery } from '@tanstack/react-query'
import { FC, useState, useRef, useEffect } from 'react'
import { api } from '../api'
import { useApiMutation } from '../api/mutations/useApiMutation'
import { GuessGenderOutput } from '../api/types/leads/guessGender'
import { MessageCellWrapper } from './MessageCell'
import { MessageTemplateModal } from './MessageTemplateModal'
import { CSVImportModal } from './CSVImportModal'

export const LeadsTable: FC = () => {
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showCSVImportModal, setShowCSVImportModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [genderErrors, setGenderErrors] = useState<Array<{leadId: number, leadName: string, error: string}>>([])
  const [showEnrichDropdown, setShowEnrichDropdown] = useState(false)
  const selectAllRef = useRef<HTMLInputElement>(null)
  const enrichDropdownRef = useRef<HTMLDivElement>(null)

  const leads = useQuery({
    queryKey: ['leads', 'getMany'],
    queryFn: async () => api.leads.getMany(),
  })

  const bulkDeleteMutation = useApiMutation('leads.bulkDelete')
  const guessGenderMutation = useApiMutation('leads.guessGender')

  const handleSelectLead = (leadId: number, checked: boolean) => {
    const newSelection = new Set(selectedLeads)
    if (checked) {
      newSelection.add(leadId)
    } else {
      newSelection.delete(leadId)
    }
    setSelectedLeads(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && leads.data) {
      const allLeadIds = new Set(leads.data.map(lead => lead.id))
      setSelectedLeads(allLeadIds)
    } else {
      setSelectedLeads(new Set())
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    const leadIds = Array.from(selectedLeads)
    bulkDeleteMutation.mutate({ leadIds }, {
      onSuccess: () => {
        setSelectedLeads(new Set())
        setShowDeleteConfirm(false)
        setGenderErrors([]) // Clear any gender errors
        setErrorMessage('')
      }
    })
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const handleSendMessagesClick = () => {
    setShowMessageModal(true)
  }

  const handleModalClose = () => {
    setShowMessageModal(false)
  }

  const handleCSVImportClick = () => {
    setShowCSVImportModal(true)
  }

  const handleCSVImportClose = () => {
    setShowCSVImportModal(false)
  }

  const handleCSVImportSuccess = (imported: number, errors: number) => {
    leads.refetch()
    if (imported > 0) {
      setSuccessMessage(`Successfully imported ${imported} lead${imported !== 1 ? 's' : ''}${errors > 0 ? ` (${errors} error${errors !== 1 ? 's' : ''})` : ''}`)
    } else {
      setErrorMessage(`Import failed${errors > 0 ? ` (${errors} error${errors !== 1 ? 's' : ''})` : ''}`)
    }
    setGenderErrors([])
    setTimeout(() => {
      setSuccessMessage('')
      setErrorMessage('')
    }, 5000)
  }

  const handleMessageSuccess = (successCount: number, totalCount: number) => {
    leads.refetch()
    setSuccessMessage(`Generated ${successCount} of ${totalCount} messages successfully`)
    setErrorMessage('')
    setGenderErrors([]) // Clear any gender errors
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  const handleGuessGenderClick = () => {
    const leadIds = Array.from(selectedLeads)
    guessGenderMutation.mutate({ leadIds }, {
      onSuccess: (data: GuessGenderOutput) => {
        leads.refetch()
        const successCount = data.results.filter((result) => result.success).length
        const failedResults = data.results.filter((result) => !result.success)
        const failedCount = failedResults.length
        
        // Collect error details for failed predictions
        const errorDetails = failedResults.map((result) => {
          const lead = leads.data?.find(l => l.id === result.leadId)
          const firstName = lead?.firstName || ''
          return {
            leadId: result.leadId,
            leadName: firstName,
            error: result.error || 'Unknown error'
          }
        })
        
        // Set success message if there are any successful predictions
        if (successCount > 0) {
          setSuccessMessage(`Successfully predicted gender for ${successCount} lead(s)`)
        } else {
          setSuccessMessage('')
        }
        
        // Set error message if there are any failed predictions
        if (failedCount > 0) {
          setErrorMessage(`Error predicting gender for ${failedCount} lead(s)`)
          setGenderErrors(errorDetails)
        } else {
          setErrorMessage('')
          setGenderErrors([])
        }
        
        // Clear messages after 8 seconds (longer for errors)
        setTimeout(() => {
          setSuccessMessage('')
          setErrorMessage('')
          setGenderErrors([])
        }, 8000)
        
        setSelectedLeads(new Set())
      },
      onError: (error) => {
        console.error('Gender guessing error:', error)
        setErrorMessage('')
        setGenderErrors([])
      }
    })
    setShowEnrichDropdown(false)
  }

  const handleEnrichDropdownToggle = () => {
    setShowEnrichDropdown(!showEnrichDropdown)
  }

  const handleEnrichOptionClick = (option: 'gender' | 'message') => {
    if (option === 'gender') {
      handleGuessGenderClick()
    } else if (option === 'message') {
      handleSendMessagesClick()
    }
  }

  const isAllSelected = leads.data ? selectedLeads.size === leads.data.length && leads.data.length > 0 : false
  const isIndeterminate = selectedLeads.size > 0 && !isAllSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (enrichDropdownRef.current && !enrichDropdownRef.current.contains(event.target as Node)) {
        setShowEnrichDropdown(false)
      }
    }

    if (showEnrichDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEnrichDropdown])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (leads.isLoading) return <div className="leads-table-loading">Loading...</div>
  if (leads.isError) return <div className="leads-table-error">Error: {leads.error.message}</div>

  return (
    <div className="leads-table-container">
      <div className="leads-table-header">
        <h2 className="leads-table-title">All leads</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {selectedLeads.size > 0 && (
            <div className="selection-actions">
            <div className="selection-counter">
              {selectedLeads.size} selected
            </div>
            <div className="enrich-dropdown-container" ref={enrichDropdownRef}>
              <button
                className="enrich-dropdown-button"
                onClick={handleEnrichDropdownToggle}
              >
                Enrich ▼
              </button>
              {showEnrichDropdown && (
                <div className="enrich-dropdown-menu">
                  <button
                    className="enrich-dropdown-item"
                    onClick={() => handleEnrichOptionClick('gender')}
                    disabled={guessGenderMutation.isPending}
                  >
                    {guessGenderMutation.isPending ? 'Guessing...' : 'Gender'}
                  </button>
                  <button
                    className="enrich-dropdown-item"
                    onClick={() => handleEnrichOptionClick('message')}
                  >
                    Message
                  </button>
                </div>
              )}
            </div>
            <button
              className="delete-button"
              onClick={handleDeleteClick}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
            </div>
          )}
          <button
            className="import-csv-button"
            onClick={handleCSVImportClick}
          >
            Import CSV
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-dialog">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}? 
              This action cannot be undone.
            </p>
            <div className="confirmation-buttons">
              <button
                className="cancel-button"
                onClick={handleDeleteCancel}
                disabled={bulkDeleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={handleDeleteConfirm}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            {bulkDeleteMutation.isError && (
              <div className="delete-error">
                Error: {bulkDeleteMutation.error?.message || 'Failed to delete leads'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="leads-table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="select-checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all leads"
                />
              </th>
              <th>First name</th>
              <th>Last name</th>
              <th>Country</th>
              <th>Gender</th>
              <th>Message</th>
              <th>Created at</th>
            </tr>
          </thead>
          <tbody>
            {leads.data?.map((lead) => (
              <tr key={lead.id} className={selectedLeads.has(lead.id) ? 'selected' : ''}>
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                    aria-label={`Select ${lead.firstName} ${lead.lastName || ''}`}
                  />
                </td>
                <td>{lead.firstName}</td>
                <td>{lead.lastName || '-'}</td>
                <td>{lead.countryCode || '-'}</td>
                <td>{lead.gender ? lead.gender.charAt(0).toUpperCase() + lead.gender.slice(1) : '-'}</td>
                <td className="message-column">
                  <MessageCellWrapper message={lead.message} />
                </td>
                <td>{formatDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.data?.length === 0 && (
        <div className="leads-table-empty">
          No leads found.
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message" style={{top: successMessage ? '6rem' : '2rem'}}>
          {errorMessage}
          {genderErrors.length > 0 && (
            <div className="error-details">
              <ul className="error-details-list">
                {genderErrors.map((error, index) => (
                  <li key={index} className="error-detail-item">
                    <strong>Lead {error.leadId}</strong>
                    {error.leadName && <span> ({error.leadName})</span>}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {guessGenderMutation.isError && (
        <div className="error-message" style={{top: successMessage || errorMessage ? '10rem' : '2rem'}}>
          Error: {guessGenderMutation.error?.message || 'Failed to guess gender'}
        </div>
      )}

      <MessageTemplateModal
        isOpen={showMessageModal}
        onClose={handleModalClose}
        selectedLeads={selectedLeads}
        leadsData={leads.data || []}
        onSuccess={handleMessageSuccess}
      />

      <CSVImportModal
        isOpen={showCSVImportModal}
        onClose={handleCSVImportClose}
        onSuccess={handleCSVImportSuccess}
      />
    </div>
  )
}