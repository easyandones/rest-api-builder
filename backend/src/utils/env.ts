import { config } from 'dotenv';
import { Environment } from '../types';

// Load .env file
config();

// Parse and validate environment variables
function getEnv(): Environment {
  const env = process.env;

  // Validate required environment variables
  const required = ['DATABASE_URL'];
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Environment variable ${key} is required`);
    }
  }

  return {
    PORT: parseInt(env.PORT || '3001', 10),
    NODE_ENV: (env.NODE_ENV as Environment['NODE_ENV']) || 'development',
    DATABASE_URL: env.DATABASE_URL!,
    CORS_ORIGIN: env.CORS_ORIGIN || 'http://localhost:3000',
    API_PREFIX: env.API_PREFIX || '/api'
  };
}

export const ENV = getEnv();