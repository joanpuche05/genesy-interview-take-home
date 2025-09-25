import { execSync } from 'child_process';
import { PrismaClient } from '.prisma/test-client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Generate test client and push schema
  execSync('npx prisma generate --schema=./prisma/schema.test.prisma', { stdio: 'pipe' });
  execSync('npx prisma db push --schema=./prisma/schema.test.prisma --force-reset', { stdio: 'pipe' });
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.lead.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };