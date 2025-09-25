export type GenerateMessagesInput = {
  template: string
  leadIds: number[]
}

export type GenerateMessagesOutput = {
  results: Array<{
    leadId: number
    success: boolean
    message?: string
    error?: string
  }>
}

export type GenerateMessagesErrorOutput = {
  error: string
  details?: string
}