import request from 'supertest';
import { TestDatabase } from '../../test-utils/test-database';
import { createApp } from '../../../src/app';

describe('Analytics Routes - Integration Tests', () => {
  let testDb: TestDatabase;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    app = createApp();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.clearDatabase();
    await testDb.seed();
  });

  describe('GET /api/analytics/monthly', () => {
    it('should return monthly analytics data ordered by year and month', async () => {
      // Act
      const response = await request(app)
        .get('/api/analytics/monthly')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        year: 2024,
        month: 1,
        sessionDuration: 120,
        pageViews: 10000,
        totalVisits: 5000,
      });
      expect(response.body[1]).toMatchObject({
        id: expect.any(Number),
        year: 2024,
        month: 2,
      });
    });

    it('should return empty array when no analytics data exists', async () => {
      // Arrange - Clear all data
      await testDb.clearDatabase();

      // Act
      const response = await request(app)
        .get('/api/analytics/monthly')
        .expect(200);

      // Assert
      expect(response.body).toEqual([]);
    });

    it('should handle large datasets efficiently', async () => {
      // Arrange - Add more analytics data
      const additionalData = [];
      for (let year = 2022; year < 2024; year++) {
        for (let month = 1; month <= 12; month++) {
          additionalData.push({
            year,
            month,
            sessionDuration: Math.floor(Math.random() * 200) + 60,
            pageViews: Math.floor(Math.random() * 20000) + 5000,
            totalVisits: Math.floor(Math.random() * 10000) + 1000,
          });
        }
      }
      await testDb.client.monthlyAnalytics.createMany({
        data: additionalData,
      });

      // Act
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/analytics/monthly')
        .expect(200);
      const endTime = Date.now();

      // Assert
      expect(response.body.length).toBe(26); // 2 seeded + 24 additional
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
      
      // Verify ordering
      for (let i = 1; i < response.body.length; i++) {
        const prev = response.body[i - 1];
        const current = response.body[i];
        
        if (prev.year === current.year) {
          expect(prev.month).toBeLessThanOrEqual(current.month);
        } else {
          expect(prev.year).toBeLessThan(current.year);
        }
      }
    });

    it('should handle database errors gracefully', async () => {
      // This is harder to simulate in integration tests
      // In a real scenario, you might temporarily shut down the database
      // or use dependency injection to inject a failing database client
      // For now, we'll just ensure the error handling code path exists
      
      // One approach could be to close the database connection
      await testDb.client.$disconnect();
      
      // Act
      const response = await request(app)
        .get('/api/analytics/monthly')
        .expect(500);

      // Assert
      expect(response.body).toMatchObject({
        error: expect.any(String),
      });

      // Reconnect for cleanup
      await testDb.client.$connect();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      // Act - Send multiple requests concurrently
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/api/analytics/monthly')
      );

      const responses = await Promise.all(requests);

      // Assert - All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
      });
    });

    it('should maintain data consistency across requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/analytics/monthly')
        .expect(200);

      // Modify data
      await testDb.client.monthlyAnalytics.create({
        data: {
          year: 2024,
          month: 3,
          sessionDuration: 140,
          pageViews: 15000,
          totalVisits: 7500,
        },
      });

      // Second request should see the new data
      const response2 = await request(app)
        .get('/api/analytics/monthly')
        .expect(200);

      // Assert
      expect(response1.body).toHaveLength(2);
      expect(response2.body).toHaveLength(3);
      expect(response2.body[2]).toMatchObject({
        year: 2024,
        month: 3,
      });
    });
  });
});