export type LeadsGetOneInput = {
  id: number
}

export type LeadsGetOneOutput = {
  id: number
  createdAt: string
  updatedAt: string
  firstName: string
  lastName: string | null
  email: string | null
  jobTitle: string | null
  countryCode: string | null
  companyName: string | null
}
