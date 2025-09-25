export type GuessGenderInput = {
  leadIds: number[]
}

export type GuessGenderOutput = {
  results: Array<{
    leadId: number
    success: boolean
    gender?: string
    probability?: number
    error?: string
  }>
}

export type GuessGenderErrorOutput = {
  error: string
  details?: string
}