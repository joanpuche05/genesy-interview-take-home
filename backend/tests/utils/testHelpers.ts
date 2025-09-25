import { PrismaClient } from '.prisma/test-client';

const prisma = new PrismaClient();

export interface CreateLeadData {
  firstName: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  countryCode?: string;
  companyName?: string;
  message?: string;
}

export const createTestLead = async (data: CreateLeadData = { firstName: 'John' }) => {
  return await prisma.lead.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email || null,
      jobTitle: data.jobTitle || null,
      countryCode: data.countryCode || null,
      companyName: data.companyName || null,
      message: data.message || null,
    },
  });
};

export const createMultipleTestLeads = async (count: number, baseData: Partial<CreateLeadData> = {}) => {
  const leads = [];
  for (let i = 0; i < count; i++) {
    const lead = await createTestLead({
      firstName: baseData.firstName || `User${i + 1}`,
      lastName: baseData.lastName || `LastName${i + 1}`,
      email: baseData.email || `user${i + 1}@example.com`,
      ...baseData,
    });
    leads.push(lead);
  }
  return leads;
};

export const getLeadCount = async () => {
  return await prisma.lead.count();
};

export const clearAllLeads = async () => {
  await prisma.lead.deleteMany();
};

export { prisma };