import { LeadsCreateInput, LeadsCreateOutput } from '../types/leads/create'
import { LeadsDeleteInput, LeadsDeleteOutput } from '../types/leads/delete'
import { LeadsBulkDeleteInput, LeadsBulkDeleteOutput } from '../types/leads/bulkDelete'
import { LeadsGetManyInput, LeadsGetManyOutput } from '../types/leads/getMany'
import { LeadsGetOneInput, LeadsGetOneOutput } from '../types/leads/getOne'
import { LeadsUpdateInput, LeadsUpdateOutput } from '../types/leads/update'
import { ApiModule, endpoint } from '../utils'

export const leadsApi = {
  getMany: endpoint<LeadsGetManyOutput, LeadsGetManyInput>('get', '/leads'),
  getOne: endpoint<LeadsGetOneOutput, LeadsGetOneInput>('get', ({ id }) => `/leads/${id}`),
  create: endpoint<LeadsCreateOutput, LeadsCreateInput>('post', '/leads'),
  delete: endpoint<LeadsDeleteOutput, LeadsDeleteInput>('delete', ({ id }) => `/leads/${id}`),
  bulkDelete: endpoint<LeadsBulkDeleteOutput, LeadsBulkDeleteInput>('post', '/leads/bulk-delete'),
  update: endpoint<LeadsUpdateOutput, LeadsUpdateInput>('put', ({ id }) => `/leads/${id}`),
} as const satisfies ApiModule
