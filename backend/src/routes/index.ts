import { Router } from 'express';
import resourceRoutes from './resources';
import { createDynamicRoutes } from './dynamicApi';

const router = Router();

// API status check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'REST API Builder Backend API',
    version: '1.0.0',
    endpoints: {
      resources: '/resources',
      dynamicApi: '/:resource',
      health: '/health'
    }
  });
});

// Resource management routes
router.use('/resources', resourceRoutes);

// Dynamic API routes (must come after resource management routes)
router.use(createDynamicRoutes());

export default router;