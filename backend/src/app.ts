import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/error';
import apiRoutes from './routes';
import { ENV } from './utils/env';

// Create Express app
export function createApp() {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(corsMiddleware);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'REST API Builder Backend is running',
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV
    });
  });

  // API routes
  app.use(ENV.API_PREFIX, apiRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}