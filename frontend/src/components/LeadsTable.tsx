import { useQuery } from '@tanstack/react-query'
import { FC, useState, useRef, useEffect } from 'react'
import { api } from '../api'
import { useApiMutation } from '../api/mutations/useApiMutation'
import { MessageCellWrapper } from './MessageCell'
import { MessageTemplateModal } from './MessageTemplateModal'

export const LeadsTable: FC = () => {
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const selectAllRef = useRef<HTMLInputElement>(null)

  const leads = useQuery({
    queryKey: ['leads', 'getMany'],
    queryFn: async () => api.leads.getMany(),
  })

  const bulkDeleteMutation = useApiMutation('leads.bulkDelete')

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

  const handleMessageSuccess = (successCount: number, totalCount: number) => {
    leads.refetch()
    if (successCount === totalCount) {
      setSuccessMessage(`Generated ${successCount} messages successfully`)
    } else {
      setSuccessMessage(`Generated ${successCount} of ${totalCount} messages (${totalCount - successCount} failed)`)
    }
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  const isAllSelected = leads.data ? selectedLeads.size === leads.data.length && leads.data.length > 0 : false
  const isIndeterminate = selectedLeads.size > 0 && !isAllSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (leads.isLoading) return <div className="leads-table-loading">Loading...</div>
  if (leads.isError) return <div className="leads-table-error">Error: {leads.error.message}</div>

  return (
    <div className="leads-table-container">
      <div className="leads-table-header">
        <h2 className="leads-table-title">All leads</h2>
        {selectedLeads.size > 0 && (
          <div className="selection-actions">
            <div className="selection-counter">
              {selectedLeads.size} selected
            </div>
            <button
              className="send-messages-button"
              onClick={handleSendMessagesClick}
            >
              Send Messages
            </button>
            <button
              className="delete-button"
              onClick={handleDeleteClick}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
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

      <MessageTemplateModal
        isOpen={showMessageModal}
        onClose={handleModalClose}
        selectedLeads={selectedLeads}
        onSuccess={handleMessageSuccess}
      />
    </div>
  )
}