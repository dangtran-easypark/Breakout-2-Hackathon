import request from 'supertest';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { TestDatabase } from '../../test-utils/test-database';
import { createApp } from '../../../src/app';

describe('ExampleTask Routes - Integration Tests', () => {
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

  describe('GET /api/exercises/tasks', () => {
    it('should return all tasks', async () => {
      // Act
      const response = await request(app)
        .get('/api/exercises/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        status: expect.any(String),
        priority: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should filter tasks by status', async () => {
      // Act
      const response = await request(app)
        .get('/api/exercises/tasks?status=UPCOMING')
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('UPCOMING');
      expect(response.body[0].name).toBe('Test Task 1');
    });

    it('should return 422 for invalid status', async () => {
      // Act
      const response = await request(app)
        .get('/api/exercises/tasks?status=INVALID')
        .expect(422);

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toMatchObject({
        msg: expect.stringContaining('Invalid status'),
      });
    });
  });

  describe('GET /api/exercises/tasks/:id', () => {
    it('should return a task by id', async () => {
      // Act
      const response = await request(app)
        .get('/api/exercises/tasks/seed-task-1')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: 'seed-task-1',
        name: 'Test Task 1',
        assignedToName: 'John Doe',
        assignedToAvatar: 'avatar1.jpg',
        dueDate: expect.any(String),
        status: 'UPCOMING',
        priority: 'HIGH',
      });
    });

    it('should return 404 for non-existent task', async () => {
      // Act
      const response = await request(app)
        .get('/api/exercises/tasks/non-existent-id')
        .expect(404);

      // Assert
      expect(response.body).toMatchObject({
        error: 'Task not found',
      });
    });
  });

  describe('POST /api/exercises/tasks', () => {
    it('should create a new task with all fields', async () => {
      // Arrange
      const newTask = {
        name: 'New Integration Test Task',
        assignedToName: 'Test User',
        assignedToAvatar: 'test-avatar.jpg',
        dueDate: new Date('2024-12-31').toISOString(),
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      };

      // Act
      const response = await request(app)
        .post('/api/exercises/tasks')
        .send(newTask)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...newTask,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify in database
      const savedTask = await testDb.client.exampleTask.findUnique({
        where: { id: response.body.id },
      });
      expect(savedTask).toBeTruthy();
      expect(savedTask?.name).toBe(newTask.name);
    });

    it('should create a task with minimum required fields', async () => {
      // Arrange
      const newTask = {
        name: 'Minimal Task',
      };

      // Act
      const response = await request(app)
        .post('/api/exercises/tasks')
        .send(newTask)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        name: 'Minimal Task',
        status: 'UPCOMING', // Default
        priority: 'MEDIUM', // Default
        assignedToName: null,
        assignedToAvatar: null,
        dueDate: null,
      });
    });

    it('should return 422 for invalid data', async () => {
      // Act
      const response = await request(app)
        .post('/api/exercises/tasks')
        .send({}) // Missing required name
        .expect(422);

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toMatchObject({
        path: 'name',
        msg: expect.stringContaining('required'),
      });
    });

    it('should return 422 for invalid enum values', async () => {
      // Act
      const response = await request(app)
        .post('/api/exercises/tasks')
        .send({
          name: 'Test Task',
          status: 'INVALID_STATUS',
        })
        .expect(422);

      // Assert
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].path).toBe('status');
    });
  });

  describe('PUT /api/exercises/tasks/:id', () => {
    it('should update a task', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Task Name',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
      };

      // Act
      const response = await request(app)
        .put('/api/exercises/tasks/seed-task-1')
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: 'seed-task-1',
        ...updateData,
      });

      // Verify in database
      const updatedTask = await testDb.client.exampleTask.findUnique({
        where: { id: 'seed-task-1' },
      });
      expect(updatedTask?.name).toBe('Updated Task Name');
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
    });

    it('should update only provided fields', async () => {
      // Act
      const response = await request(app)
        .put('/api/exercises/tasks/seed-task-1')
        .send({ priority: TaskPriority.LOW })
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: 'seed-task-1',
        name: 'Test Task 1', // Original name preserved
        priority: TaskPriority.LOW,
        status: 'UPCOMING', // Original status preserved
      });
    });

    it('should return 404 for non-existent task', async () => {
      // Act
      const response = await request(app)
        .put('/api/exercises/tasks/non-existent')
        .send({ name: 'Updated' })
        .expect(404);

      // Assert
      expect(response.body).toMatchObject({
        error: 'Task not found',
      });
    });

    it('should return 422 for invalid data', async () => {
      // Act
      const response = await request(app)
        .put('/api/exercises/tasks/seed-task-1')
        .send({ priority: 'INVALID_PRIORITY' })
        .expect(422);

      // Assert
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/exercises/tasks/:id', () => {
    it('should delete a task', async () => {
      // Act
      const response = await request(app)
        .delete('/api/exercises/tasks/seed-task-1')
        .expect(204);

      // Assert
      expect(response.body).toEqual({});

      // Verify task is deleted from database
      const deletedTask = await testDb.client.exampleTask.findUnique({
        where: { id: 'seed-task-1' },
      });
      expect(deletedTask).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      // Act
      const response = await request(app)
        .delete('/api/exercises/tasks/non-existent')
        .expect(404);

      // Assert
      expect(response.body).toMatchObject({
        error: 'Task not found',
      });
    });

    it('should handle concurrent delete attempts gracefully', async () => {
      // Act - Attempt to delete the same task twice
      await request(app)
        .delete('/api/exercises/tasks/seed-task-1')
        .expect(204);

      const response = await request(app)
        .delete('/api/exercises/tasks/seed-task-1')
        .expect(404);

      // Assert
      expect(response.body).toMatchObject({
        error: 'Task not found',
      });
    });
  });
});