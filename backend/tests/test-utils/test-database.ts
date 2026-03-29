import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs';

const prismaBinary = path.join(
  __dirname,
  '../../../node_modules/.bin/prisma'
);

export class TestDatabase {
  private dbName: string;
  private dbUrl: string;
  public client: PrismaClient;

  constructor() {
    // Generate unique database name for each test suite
    this.dbName = `test_${randomBytes(8).toString('hex')}.db`;
    this.dbUrl = `file:./${this.dbName}`;
    
    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = this.dbUrl;
    
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: this.dbUrl,
        },
      },
    });
  }

  async setup(): Promise<void> {
    try {
      // Push the schema to the test database
      execSync(`${prismaBinary} db push --force-reset`, {
        env: {
          ...process.env,
          DATABASE_URL: this.dbUrl,
        },
      });
      
      await this.client.$connect();
    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    try {
      await this.client.$disconnect();
      
      // Remove test database file
      const dbPath = path.join(__dirname, '../../', this.dbName);
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
      
      // Also remove journal file if exists
      const journalPath = `${dbPath}-journal`;
      if (fs.existsSync(journalPath)) {
        fs.unlinkSync(journalPath);
      }
    } catch (error) {
      console.error('Failed to teardown test database:', error);
    }
  }

  async seed(): Promise<void> {
    // Add seed data for tests
    await this.client.exampleTask.createMany({
      data: [
        {
          id: 'seed-task-1',
          name: 'Test Task 1',
          assignedToName: 'John Doe',
          assignedToAvatar: 'avatar1.jpg',
          dueDate: new Date('2024-12-31'),
          status: 'UPCOMING',
          priority: 'HIGH',
        },
        {
          id: 'seed-task-2',
          name: 'Test Task 2',
          assignedToName: 'Jane Smith',
          assignedToAvatar: 'avatar2.jpg',
          dueDate: new Date('2024-11-30'),
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
        },
        {
          id: 'seed-task-3',
          name: 'Test Task 3',
          status: 'COMPLETED',
          priority: 'LOW',
        },
      ],
    });

    await this.client.monthlyAnalytics.createMany({
      data: [
        {
          year: 2024,
          month: 1,
          sessionDuration: 120,
          pageViews: 10000,
          totalVisits: 5000,
        },
        {
          year: 2024,
          month: 2,
          sessionDuration: 130,
          pageViews: 12000,
          totalVisits: 6000,
        },
      ],
    });
  }

  async clearDatabase(): Promise<void> {
    // Clear all data from tables
    await this.client.exampleTask.deleteMany({});
    await this.client.monthlyAnalytics.deleteMany({});
  }
}