import { LeadsCreateInput, LeadsCreateOutput } from '../types/leads/create'
import { LeadsDeleteInput, LeadsDeleteOutput } from '../types/leads/delete'
import { LeadsBulkDeleteInput, LeadsBulkDeleteOutput } from '../types/leads/bulkDelete'
import { LeadsGetManyInput, LeadsGetManyOutput } from '../types/leads/getMany'
import { LeadsGetOneInput, LeadsGetOneOutput } from '../types/leads/getOne'
import { LeadsUpdateInput, LeadsUpdateOutput } from '../types/leads/update'
import { GenerateMessagesInput, GenerateMessagesOutput } from '../types/leads/generateMessages'
import { GuessGenderInput, GuessGenderOutput } from '../types/leads/guessGender'
import { CSVImportInput, CSVImportOutput } from '../types/leads/csvImport'
import { ApiModule, endpoint } from '../utils'
import { axiosInstance } from '../../utils/axios'

export const leadsApi = {
  getMany: endpoint<LeadsGetManyOutput, LeadsGetManyInput>('get', '/leads'),
  getOne: endpoint<LeadsGetOneOutput, LeadsGetOneInput>('get', ({ id }) => `/leads/${id}`),
  create: endpoint<LeadsCreateOutput, LeadsCreateInput>('post', '/leads'),
  delete: endpoint<LeadsDeleteOutput, LeadsDeleteInput>('delete', ({ id }) => `/leads/${id}`),
  bulkDelete: endpoint<LeadsBulkDeleteOutput, LeadsBulkDeleteInput>('post', '/leads/bulk-delete'),
  update: endpoint<LeadsUpdateOutput, LeadsUpdateInput>('put', ({ id }) => `/leads/${id}`),
  generateMessages: endpoint<GenerateMessagesOutput, GenerateMessagesInput>('post', '/leads/generate-messages'),
  guessGender: endpoint<GuessGenderOutput, GuessGenderInput>('post', '/leads/guess-gender'),
  csvImport: async (input: CSVImportInput): Promise<CSVImportOutput> => {
    const formData = new FormData()
    formData.append('file', input.file)
    
    const response = await axiosInstance.post('/leads/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  },
} as const satisfies ApiModule
