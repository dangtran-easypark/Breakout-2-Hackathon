import request from 'supertest';
import { createApp } from '../../../src/app';
import { TestDatabase } from '../../test-utils/test-database';

describe('Debug Test', () => {
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

  it('should check if data is seeded', async () => {
    const tasks = await testDb.client.exampleTask.findMany();
    console.log('Seeded tasks:', tasks);
    expect(tasks).toHaveLength(3);
  });

  it('should get all tasks', async () => {
    const response = await request(app)
      .get('/api/exercises/tasks')
      .expect(200);
    
    console.log('Response body:', response.body);
    console.log('Response status:', response.status);
  });

  it('should get task by id with proper error', async () => {
    const response = await request(app)
      .get('/api/exercises/tasks/seed-task-1');
    
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
  });
});