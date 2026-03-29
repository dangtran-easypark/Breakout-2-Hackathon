import { TaskStatus, TaskPriority } from '@prisma/client';
import * as exampleTaskService from '../../../src/services/exampleTask.service';
import * as taskRepository from '../../../src/repositories/exampleTask.repository';

// Mock the repository module
jest.mock('../../../src/repositories/exampleTask.repository');

describe('ExampleTask Service', () => {
  // Cast the mocked repository for type safety
  const mockTaskRepository = taskRepository as jest.Mocked<typeof taskRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTasks', () => {
    it('should return all tasks when no status filter is provided', async () => {
      // Arrange
      const mockTasks = [
        {
          id: '1',
          name: 'Task 1',
          assignedToName: 'John Doe',
          assignedToAvatar: 'avatar1.jpg',
          dueDate: new Date('2024-12-31'),
          status: TaskStatus.UPCOMING,
          priority: TaskPriority.HIGH,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Task 2',
          assignedToName: null,
          assignedToAvatar: null,
          dueDate: null,
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockTaskRepository.findTasks.mockResolvedValue(mockTasks);

      // Act
      const result = await exampleTaskService.getAllTasks();

      // Assert
      expect(result).toEqual(mockTasks);
      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(undefined);
      expect(mockTaskRepository.findTasks).toHaveBeenCalledTimes(1);
    });

    it('should return filtered tasks when status is provided', async () => {
      // Arrange
      const mockTasks = [
        {
          id: '1',
          name: 'Task 1',
          assignedToName: 'John Doe',
          assignedToAvatar: 'avatar1.jpg',
          dueDate: new Date('2024-12-31'),
          status: TaskStatus.UPCOMING,
          priority: TaskPriority.HIGH,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockTaskRepository.findTasks.mockResolvedValue(mockTasks);

      // Act
      const result = await exampleTaskService.getAllTasks(TaskStatus.UPCOMING);

      // Assert
      expect(result).toEqual(mockTasks);
      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(TaskStatus.UPCOMING);
      expect(mockTaskRepository.findTasks).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no tasks exist', async () => {
      // Arrange
      mockTaskRepository.findTasks.mockResolvedValue([]);

      // Act
      const result = await exampleTaskService.getAllTasks();

      // Assert
      expect(result).toEqual([]);
      expect(mockTaskRepository.findTasks).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      // Arrange
      const mockTask = {
        id: '1',
        name: 'Task 1',
        assignedToName: 'John Doe',
        assignedToAvatar: 'avatar1.jpg',
        dueDate: new Date('2024-12-31'),
        status: TaskStatus.UPCOMING,
        priority: TaskPriority.HIGH,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTaskRepository.findTaskById.mockResolvedValue(mockTask);

      // Act
      const result = await exampleTaskService.getTaskById('1');

      // Assert
      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledTimes(1);
    });

    it('should return null when task not found', async () => {
      // Arrange
      mockTaskRepository.findTaskById.mockResolvedValue(null);

      // Act
      const result = await exampleTaskService.getTaskById('nonexistent');

      // Assert
      expect(result).toBeNull();
      expect(mockTaskRepository.findTaskById).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('createTask', () => {
    it('should create task with all fields', async () => {
      // Arrange
      const taskData = {
        name: 'New Task',
        assignedToName: 'John Doe',
        assignedToAvatar: 'avatar1.jpg',
        dueDate: new Date('2024-12-31'),
        status: TaskStatus.UPCOMING,
        priority: TaskPriority.HIGH,
      };
      const mockCreatedTask = {
        id: '1',
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTaskRepository.createTask.mockResolvedValue(mockCreatedTask);

      // Act
      const result = await exampleTaskService.createTask(taskData);

      // Assert
      expect(result).toEqual(mockCreatedTask);
      expect(mockTaskRepository.createTask).toHaveBeenCalledWith(taskData);
      expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(1);
    });

    it('should create task with only required fields', async () => {
      // Arrange
      const taskData = {
        name: 'Minimal Task',
      };
      const mockCreatedTask = {
        id: '1',
        name: 'Minimal Task',
        assignedToName: null,
        assignedToAvatar: null,
        dueDate: null,
        status: TaskStatus.UPCOMING,
        priority: TaskPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTaskRepository.createTask.mockResolvedValue(mockCreatedTask);

      // Act
      const result = await exampleTaskService.createTask(taskData);

      // Assert
      expect(result).toEqual(mockCreatedTask);
      expect(mockTaskRepository.createTask).toHaveBeenCalledWith(taskData);
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Task',
        status: TaskStatus.COMPLETED,
      };
      const mockUpdatedTask = {
        id: '1',
        name: 'Updated Task',
        assignedToName: 'John Doe',
        assignedToAvatar: 'avatar1.jpg',
        dueDate: new Date('2024-12-31'),
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTaskRepository.updateTask.mockResolvedValue(mockUpdatedTask);

      // Act
      const result = await exampleTaskService.updateTask('1', updateData);

      // Assert
      expect(result).toEqual(mockUpdatedTask);
      expect(mockTaskRepository.updateTask).toHaveBeenCalledWith('1', updateData);
      expect(mockTaskRepository.updateTask).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Task',
      };
      const prismaError = new Error('Record not found');
      mockTaskRepository.updateTask.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(exampleTaskService.updateTask('nonexistent', updateData))
        .rejects.toThrow('Record not found');
      expect(mockTaskRepository.updateTask).toHaveBeenCalledWith('nonexistent', updateData);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      // Arrange
      const mockDeletedTask = {
        id: '1',
        name: 'Task to Delete',
        assignedToName: 'John Doe',
        assignedToAvatar: 'avatar1.jpg',
        dueDate: new Date('2024-12-31'),
        status: TaskStatus.UPCOMING,
        priority: TaskPriority.HIGH,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTaskRepository.deleteTask.mockResolvedValue(mockDeletedTask);

      // Act
      const result = await exampleTaskService.deleteTask('1');

      // Assert
      expect(result).toEqual(mockDeletedTask);
      expect(mockTaskRepository.deleteTask).toHaveBeenCalledWith('1');
      expect(mockTaskRepository.deleteTask).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const prismaError = new Error('Record not found');
      mockTaskRepository.deleteTask.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(exampleTaskService.deleteTask('nonexistent'))
        .rejects.toThrow('Record not found');
      expect(mockTaskRepository.deleteTask).toHaveBeenCalledWith('nonexistent');
    });
  });
});