# AI Assistant Prompts and Use Cases

This document provides examples of effective prompts and common use cases when interacting with the AI assistant within this project codebase.

## Getting Started

- **Be Specific:** Clearly state your goal and provide context (filenames, function names, concepts).
- **Provide Code (if applicable):** Use code blocks or attach relevant files.
- **Iterate:** If the first response isn't perfect, provide feedback and refine your request.

## Use Case Categories

### 1. Code Generation & Modification

**Example: Create a new API endpoint**
```
"Create a new API endpoint for user profile management at /api/users/profile that supports GET and PUT operations. Follow the existing patterns in exerciseTask.controller.ts"
```

**Example: Add validation to existing endpoint**
```
"Add input validation to the POST /api/exercises/tasks endpoint to ensure the dueDate is in the future"
```

**Example: Create a React component**
```
"Create a new UserProfile component that fetches and displays user data from /api/users/profile. Use the same pattern as ExerciseTaskList component"
```

### 2. Debugging & Error Resolution

**Example: Debug API error**
```
"I'm getting a 404 error when calling GET /api/exercises/tasks/123. Help me debug why the endpoint isn't found"
```

**Example: Fix TypeScript error**
```
"I'm getting a TypeScript error 'Property 'id' does not exist on type 'never'' in ExerciseTaskList.tsx line 45. How do I fix this?"
```

**Example: Database query issue**
```
"My Prisma query in exerciseTask.controller.ts is returning null even though the task exists in the database. Help me debug the findUnique query"
```

### 3. Code Explanation & Understanding

**Example: Explain middleware flow**
```
"Explain how the validation middleware in exerciseTask.validator.ts works and how it integrates with the Express routes"
```

**Example: Trace data flow**
```
"Trace how data flows from the ExerciseTaskList component through the API client to the backend and back"
```

**Example: Understand database schema**
```
"Explain the relationship between the ExampleTask and User models in the Prisma schema and how they're used in the application"
```

### 4. Refactoring & Optimization

**Example: Refactor duplicate code**
```
"The exerciseTask.controller.ts has duplicate error handling code. Refactor it to use a shared error handling utility"
```

**Example: Optimize database queries**
```
"The GET /api/exercises/tasks endpoint is slow. Optimize the Prisma query to use select instead of returning all fields"
```

**Example: Improve component performance**
```
"The ExerciseTaskList component re-renders too often. Add React.memo and useCallback to optimize performance"
```

### 5. Documentation

**Example: Generate API documentation**
```
"Generate OpenAPI/Swagger documentation for all endpoints in exerciseTask.routes.ts"
```

**Example: Document component props**
```
"Add comprehensive JSDoc comments to the ExerciseTaskList component including all props and their types"
```

**Example: Create setup guide**
```
"Create a detailed setup guide for new developers joining the project, including all prerequisites and common issues"
```

### 6. Planning & Strategy

**Example: Plan new feature**
```
"I need to add user authentication to the application. Create a detailed implementation plan following the template in docs/plans/TEMPLATE-Feature-Implementation-Plan.md"
```

**Example: Architecture decision**
```
"Should we use JWT or session-based authentication for this application? Analyze pros and cons for our use case"
```

**Example: Migration strategy**
```
"Plan the migration from SQLite to PostgreSQL for production deployment. What steps are needed and what are the risks?"
```

### 7. Database & Prisma

**Example: Create new model**
```
"Create a new Prisma model for Comments that relates to ExampleTask. Include fields for content, authorId, and timestamps"
```

**Example: Write complex query**
```
"Write a Prisma query to get all tasks assigned to a user with their completed tasks count and average completion time"
```

**Example: Generate seed data**
```
"Update the seed.ts file to generate 50 realistic tasks with varied statuses, priorities, and due dates"
```

### 8. Testing & Quality Assurance

**Example: Write unit tests**
```
"Write unit tests for the exerciseTask.controller.ts using Jest and supertest. Cover all CRUD operations"
```

**Example: Integration testing**
```
"Create an integration test that verifies the complete flow from frontend component to database for creating a task"
```

**Example: Add linting rules**
```
"Configure ESLint to enforce consistent code style across the project. Add rules for React hooks and async/await"
```

### 9. Security & Best Practices

**Example: Security audit**
```
"Review the exerciseTask API endpoints for common security vulnerabilities like SQL injection, XSS, and CSRF"
```

**Example: Add rate limiting**
```
"Implement rate limiting for the API endpoints to prevent abuse. Use express-rate-limit with appropriate settings"
```

**Example: Environment security**
```
"Review our environment variable usage and ensure no sensitive data is exposed to the frontend"
``` 