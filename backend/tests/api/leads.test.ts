import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestLead, createMultipleTestLeads, getLeadCount, clearAllLeads, prisma } from '../utils/testHelpers';

const app = createApp(prisma);

describe('/leads/bulk-delete', () => {
  beforeEach(async () => {
    await clearAllLeads();
  });

  describe('Success Cases', () => {
    test('should successfully delete single lead', async () => {
      const lead = await createTestLead({ firstName: 'John', email: 'john@example.com' });
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [lead.id] })
        .expect(200);

      expect(response.body).toEqual({
        deletedCount: 1,
        message: 'Successfully deleted 1 lead(s)'
      });

      const remainingCount = await getLeadCount();
      expect(remainingCount).toBe(0);
    });

    test('should successfully delete multiple leads', async () => {
      const leads = await createMultipleTestLeads(3);
      const leadIds = leads.map(lead => lead.id);
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds })
        .expect(200);

      expect(response.body).toEqual({
        deletedCount: 3,
        message: 'Successfully deleted 3 lead(s)'
      });

      const remainingCount = await getLeadCount();
      expect(remainingCount).toBe(0);
    });

    test('should return correct deletion count when some IDs exist and some don\'t', async () => {
      const leads = await createMultipleTestLeads(2);
      const existingIds = leads.map(lead => lead.id);
      const nonExistentIds = [9999, 9998];
      const allIds = [...existingIds, ...nonExistentIds];
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: allIds })
        .expect(200);

      expect(response.body).toEqual({
        deletedCount: 2,
        message: 'Successfully deleted 2 lead(s)'
      });

      const remainingCount = await getLeadCount();
      expect(remainingCount).toBe(0);
    });

    test('should return 0 deletion count for non-existent IDs', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [9999, 9998] })
        .expect(200);

      expect(response.body).toEqual({
        deletedCount: 0,
        message: 'Successfully deleted 0 lead(s)'
      });
    });

    test('should handle large arrays of IDs', async () => {
      const leads = await createMultipleTestLeads(50);
      const leadIds = leads.map(lead => lead.id);
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds })
        .expect(200);

      expect(response.body.deletedCount).toBe(50);
      expect(response.body.message).toBe('Successfully deleted 50 lead(s)');
    });
  });

  describe('Input Validation Tests', () => {
    test('should reject empty leadIds array', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [] })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid request',
        details: 'leadIds must be a non-empty array of numbers'
      });
    });

    test('should reject non-array leadIds', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: 'not-an-array' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid request',
        details: 'leadIds must be a non-empty array of numbers'
      });
    });

    test('should reject when leadIds is missing', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid request',
        details: 'leadIds must be a non-empty array of numbers'
      });
    });

    test('should reject when leadIds is null', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: null })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid request',
        details: 'leadIds must be a non-empty array of numbers'
      });
    });

    test('should reject invalid ID types (strings)', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: ['not-a-number', 'also-not-a-number'] })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid lead IDs',
        details: 'All leadIds must be positive numbers'
      });
    });

    test('should reject invalid ID types (mixed)', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [1, 'invalid', null, undefined, 2] })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid lead IDs',
        details: 'All leadIds must be positive numbers'
      });
    });

    test('should reject negative IDs', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [-1, -5] })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid lead IDs',
        details: 'All leadIds must be positive numbers'
      });
    });

    test('should reject zero IDs', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [0, 1] })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid lead IDs',
        details: 'All leadIds must be positive numbers'
      });
    });

    test('should reject decimal numbers', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [1.5, 2.7] })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid lead IDs',
        details: 'All leadIds must be positive numbers'
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send('invalid-json')
        .expect(400);
      
      // Express returns a 400 for malformed JSON
      expect(response.status).toBe(400);
    });

    test('should handle extremely large request', async () => {
      const hugeArray = Array.from({ length: 10000 }, (_, i) => i + 1);
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: hugeArray })
        .expect(200);

      expect(response.body.deletedCount).toBe(0);
      expect(response.body.message).toBe('Successfully deleted 0 lead(s)');
    });

    test('should validate request content-type', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .set('Content-Type', 'text/plain')
        .send('leadIds: [1, 2, 3]');
        
      expect(response.status).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    test('should handle duplicate IDs', async () => {
      const lead = await createTestLead({ firstName: 'John' });
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [lead.id, lead.id, lead.id] })
        .expect(200);

      expect(response.body.deletedCount).toBe(1);
      expect(response.body.message).toBe('Successfully deleted 1 lead(s)');
    });

    test('should handle concurrent deletion attempts', async () => {
      const leads = await createMultipleTestLeads(5);
      const leadIds = leads.map(lead => lead.id);
      
      // Make concurrent requests
      const [response1, response2] = await Promise.all([
        request(app).post('/leads/bulk-delete').send({ leadIds }),
        request(app).post('/leads/bulk-delete').send({ leadIds })
      ]);

      // Both requests should succeed, but total deleted should not exceed leads created
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.deletedCount + response2.body.deletedCount).toBe(5);
    });

    test('should preserve other leads when deleting specific ones', async () => {
      const allLeads = await createMultipleTestLeads(5);
      const leadsToDelete = allLeads.slice(0, 2);
      const leadsToKeep = allLeads.slice(2);
      const idsToDelete = leadsToDelete.map(lead => lead.id);
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: idsToDelete })
        .expect(200);

      expect(response.body.deletedCount).toBe(2);
      
      // Verify remaining leads still exist
      const remainingCount = await getLeadCount();
      expect(remainingCount).toBe(3);
      
      // Verify specific leads still exist
      for (const lead of leadsToKeep) {
        const foundLead = await prisma.lead.findUnique({
          where: { id: lead.id }
        });
        expect(foundLead).not.toBeNull();
      }
    });

    test('should work with very large ID numbers', async () => {
      // Test with numbers that might be at the edge of JavaScript's safe integer range
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER] })
        .expect(200);

      expect(response.body.deletedCount).toBe(0);
      expect(response.body.message).toBe('Successfully deleted 0 lead(s)');
    });
  });

  describe('Response Format Tests', () => {
    test('should return response with correct structure', async () => {
      const lead = await createTestLead();
      
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [lead.id] })
        .expect(200);

      expect(response.body).toHaveProperty('deletedCount');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.deletedCount).toBe('number');
      expect(typeof response.body.message).toBe('string');
      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('should return error response with correct structure', async () => {
      const response = await request(app)
        .post('/leads/bulk-delete')
        .send({ leadIds: [] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.details).toBe('string');
    });
  });
});