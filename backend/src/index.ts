import { createApp } from './app';
import { initializeDatabase, closeDatabase } from './utils/database';
import { ENV } from './utils/env';

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Server running on port ${ENV.PORT}`);
      console.log(`📖 Environment: ${ENV.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${ENV.PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('📪 SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('📪 SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
startServer();