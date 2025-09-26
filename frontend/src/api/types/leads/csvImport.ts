export interface CSVImportInput {
  file: File
}

export interface CSVImportOutput {
  success: boolean
  imported: number
  errors: number
  message: string
  errorDetails?: string[]
}