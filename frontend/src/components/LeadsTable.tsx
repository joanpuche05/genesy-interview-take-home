import { useQuery } from '@tanstack/react-query'
import { FC, useState, useRef, useEffect } from 'react'
import { api } from '../api'

export const LeadsTable: FC = () => {
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  const leads = useQuery({
    queryKey: ['leads', 'getMany'],
    queryFn: async () => api.leads.getMany(),
  })

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
          <div className="selection-counter">
            {selectedLeads.size} selected
          </div>
        )}
      </div>

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
                <td>-</td>
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
    </div>
  )
}