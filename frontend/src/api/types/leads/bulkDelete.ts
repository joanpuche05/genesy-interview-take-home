export type LeadsBulkDeleteInput = {
  leadIds: number[]
}

export type LeadsBulkDeleteOutput = {
  deletedCount: number
  message: string
}

export type LeadsBulkDeleteErrorOutput = {
  error: string
  details?: string
}