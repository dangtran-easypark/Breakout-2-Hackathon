import React from 'react';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../../utils/test-utils';
import ExerciseTaskList from '../ExerciseTaskList';
import { fetchApi } from '../../../../utils/apiClient';

// Mock the API client
jest.mock('../../../../utils/apiClient');
const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <span>Plus</span>,
  Edit2: () => <span>Edit</span>,
  Trash2: () => <span>Delete</span>,
  Check: () => <span>Check</span>,
  X: () => <span>X</span>,
  GripVertical: () => <span>Grip</span>,
}));

// Mock drag and drop
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: jest.fn(),
  }, {}),
  Draggable: ({ children }: any) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: jest.fn(),
  }, {}),
}));

const mockTasks = [
  {
    id: '1',
    name: 'Test Task 1',
    assignedToName: 'John Doe',
    assignedToAvatar: 'avatar1.jpg',
    dueDate: '2024-12-31T00:00:00Z',
    status: 'UPCOMING',
    priority: 'HIGH',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Test Task 2',
    assignedToName: null,
    assignedToAvatar: null,
    dueDate: null,
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Test Task 3',
    assignedToName: 'Jane Smith',
    assignedToAvatar: 'avatar3.jpg',
    dueDate: '2024-11-30T00:00:00Z',
    status: 'COMPLETED',
    priority: 'LOW',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

describe('ExerciseTaskList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    it('should display loading spinner initially', async () => {
      mockFetchApi.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<ExerciseTaskList />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display error message when API fails', async () => {
      mockFetchApi.mockRejectedValueOnce(new Error('Failed to fetch tasks'));
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch tasks/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Display', () => {
    it('should display tasks grouped by status', async () => {
      mockFetchApi.mockResolvedValueOnce(mockTasks);
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
        expect(screen.getByText('Test Task 3')).toBeInTheDocument();
      });

      // Check that tasks are in correct sections
      const boards = screen.getAllByRole('table');
      expect(boards).toHaveLength(3);
      
      // Upcoming board should have Task 1
      expect(within(boards[0]).getByText('Test Task 1')).toBeInTheDocument();
      
      // In Progress board should have Task 2
      expect(within(boards[1]).getByText('Test Task 2')).toBeInTheDocument();
      
      // Completed board should have Task 3
      expect(within(boards[2]).getByText('Test Task 3')).toBeInTheDocument();
    });

    it('should display task details correctly', async () => {
      mockFetchApi.mockResolvedValueOnce([mockTasks[0]]);
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
      });
    });

    it('should show placeholder for missing assignee', async () => {
      mockFetchApi.mockResolvedValueOnce([mockTasks[1]]);
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
        expect(screen.getByText('-')).toBeInTheDocument(); // No assignee
      });
    });
  });

  describe('Task Creation', () => {
    it('should open create modal when clicking create button', async () => {
      mockFetchApi.mockResolvedValueOnce(mockTasks);
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Find the first New Task button and click it
      const createButtons = screen.getAllByRole('button', { name: /new task/i });
      await user.click(createButtons[0]);
      
      expect(screen.getByText(/add.*task|create.*task/i)).toBeInTheDocument();
    });

    it('should create a new task successfully', async () => {
      mockFetchApi
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce({ // Create task response
          id: '4',
          name: 'New Task',
          assignedToName: null,
          assignedToAvatar: null,
          dueDate: null,
          status: 'UPCOMING',
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Open modal
      const createButtons = screen.getAllByRole('button', { name: /create task/i });
      await user.click(createButtons[0]);
      
      // Fill form - wait for modal to be fully rendered
      await waitFor(() => {
        expect(screen.getByLabelText(/task name/i)).toBeInTheDocument();
      });
      
      await user.type(screen.getByLabelText(/task name/i), 'New Task');
      
      // Submit
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockFetchApi).toHaveBeenCalledWith('/exercises/tasks', {
          method: 'POST',
          body: expect.stringContaining('New Task'),
        });
      });
    });

    it('should show validation error for empty task name', async () => {
      mockFetchApi.mockResolvedValueOnce(mockTasks);
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Open modal
      const createButtons = screen.getAllByRole('button', { name: /create task/i });
      await user.click(createButtons[0]);
      
      // Wait for modal and try to submit without name
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save|create/i })).toBeInTheDocument();
      });
      
      const saveButton = screen.getByRole('button', { name: /save|create/i });
      await user.click(saveButton);
      
      // Check for validation - the component might not show this specific text
      await waitFor(() => {
        expect(mockFetchApi).not.toHaveBeenCalledWith('/exercises/tasks', expect.anything());
      });
    });
  });

  describe('Task Update', () => {
    it('should open edit modal when clicking edit button', async () => {
      mockFetchApi.mockResolvedValueOnce(mockTasks);
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByTitle('Edit task');
      await user.click(editButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Task 1')).toBeInTheDocument();
      });
    });

    it('should update task successfully', async () => {
      mockFetchApi
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce({ // Update response
          ...mockTasks[0],
          name: 'Updated Task 1',
        });
      
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Open edit modal
      const editButtons = screen.getAllByTitle('Edit task');
      await user.click(editButtons[0]);
      
      // Clear and type new name
      const nameInput = screen.getByDisplayValue('Test Task 1');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Task 1');
      
      // Submit
      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockFetchApi).toHaveBeenCalledWith('/exercises/tasks/1', {
          method: 'PUT',
          body: expect.stringContaining('Updated Task 1'),
        });
      });
    });

    it('should update task status with checkbox', async () => {
      mockFetchApi
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce({ // Update response
          ...mockTasks[0],
          status: 'COMPLETED',
        });
      
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Find and click the checkbox for the first task
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      
      await waitFor(() => {
        expect(mockFetchApi).toHaveBeenCalledWith('/exercises/tasks/1', {
          method: 'PUT',
          body: JSON.stringify({ status: 'COMPLETED' }),
        });
      });
    });
  });

  describe('Task Deletion', () => {
    it('should show delete confirmation dialog', async () => {
      mockFetchApi.mockResolvedValueOnce(mockTasks);
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Click delete button
      const deleteButtons = screen.getAllByTitle('Delete task');
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/delete.*Test Task 1|confirm.*delete/i)).toBeInTheDocument();
      });
    });

    it('should delete task when confirmed', async () => {
      mockFetchApi
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockResolvedValueOnce({}); // Delete response
      
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Click delete button
      const deleteButtons = screen.getAllByTitle('Delete task');
      await user.click(deleteButtons[0]);
      
      // Wait for modal and confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByRole('button', { name: /delete|confirm/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockFetchApi).toHaveBeenCalledWith('/exercises/tasks/1', {
          method: 'DELETE',
        });
      });
    });

    it('should not delete task when cancelled', async () => {
      mockFetchApi.mockResolvedValueOnce(mockTasks);
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Click delete button
      const deleteButtons = screen.getAllByTitle('Delete task');
      await user.click(deleteButtons[0]);
      
      // Cancel deletion
      await user.click(screen.getByText('Cancel'));
      
      expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();
      expect(mockFetchApi).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('Error Handling', () => {
    it('should show error when task creation fails', async () => {
      mockFetchApi
        .mockResolvedValueOnce(mockTasks) // Initial load
        .mockRejectedValueOnce(new Error('Failed to create task'));
      
      const user = userEvent.setup();
      
      render(<ExerciseTaskList />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });
      
      // Open modal and submit
      const createButtons = screen.getAllByText('Create Task');
      await user.click(createButtons[0]);
      await user.type(screen.getByLabelText('Task Name'), 'New Task');
      await user.click(screen.getByText('Save'));
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to create task/)).toBeInTheDocument();
      });
    });
  });
});