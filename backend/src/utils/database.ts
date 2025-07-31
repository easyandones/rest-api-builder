import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { ENV } from './env';

// Prisma client instance
export const prisma = new PrismaClient({
  log: ENV.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// PostgreSQL raw connection pool (for dynamic table creation)
export const pgPool = new Pool({
  connectionString: ENV.DATABASE_URL,
});

// Initialize database connection
export async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database');
    
    // PostgreSQL connection test
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL pool connected');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Close database connections
export async function closeDatabase() {
  await prisma.$disconnect();
  await pgPool.end();
  console.log('📊 Database connections closed');
}