# Database Schema Reference

This document describes the database schema used by the application. The project uses Prisma ORM with SQLite for development.

## Schema Location

The Prisma schema file is located at: `/backend/prisma/schema.prisma`

## Models

### User

Represents a user in the system.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Unique identifier | Primary Key, UUID, Default: uuid() |
| email | String | User's email address | Unique |
| name | String? | User's display name | Optional |
| createdAt | DateTime | Creation timestamp | Default: now() |

### ExampleTask

Represents a task in the task management system.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Unique identifier | Primary Key, UUID, Default: uuid() |
| name | String | Task name/title | Required |
| assignedToName | String? | Name of person assigned | Optional |
| assignedToAvatar | String? | Avatar URL of assignee | Optional |
| dueDate | DateTime? | Task due date | Optional |
| priority | TaskPriority | Task priority level | Default: MEDIUM |
| status | TaskStatus | Current task status | Default: UPCOMING |
| createdAt | DateTime | Creation timestamp | Default: now() |
| updatedAt | DateTime | Last update timestamp | Auto-updated |

### MonthlyAnalytics

Stores monthly analytics data.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | String | Unique identifier | Primary Key, UUID, Default: uuid() |
| month | Int | Month (1-12) | Required |
| year | Int | Year | Required |
| sessionDuration | Float | Average session duration | Required |
| pageViews | Int | Total page views | Required |
| totalVisits | Int | Total visits | Required |

**Unique Constraint:** Combination of (month, year) must be unique.

## Enums

### TaskStatus

Represents the status of a task.

| Value | Description |
|-------|-------------|
| UPCOMING | Task is planned but not started |
| IN_PROGRESS | Task is currently being worked on |
| COMPLETED | Task has been completed |

### TaskPriority

Represents the priority level of a task.

| Value | Description |
|-------|-------------|
| LOW | Low priority task |
| MEDIUM | Medium priority task |
| HIGH | High priority task |

## Database Management

### Migrations

To create and run database migrations:

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations
npm run db:migrate:dev
```

### Seeding

To seed the database with initial data:

```bash
cd backend
npm run db:seed
```

The seed file is located at: `/backend/prisma/seed.ts`

### Database File

In development, the SQLite database file is stored at: `/backend/prisma/dev.db`

### Prisma Studio

To browse the database using Prisma Studio:

```bash
cd backend
npx prisma studio
```

## Relationships

Currently, there are no defined relationships between models. Each model operates independently.

## Indexes

No custom indexes are defined beyond the default primary key indexes.

## Future Considerations

1. **User-Task Relationship**: Consider adding a relationship between User and ExampleTask for task assignment.
2. **Soft Deletes**: Consider adding `deletedAt` fields for soft delete functionality.
3. **Audit Fields**: Consider adding `createdBy` and `updatedBy` fields for audit trails.
4. **Additional Indexes**: Add indexes on frequently queried fields like `status` and `priority` for better performance.