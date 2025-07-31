import { Router, Request, Response } from 'express';
import { DynamicDataService } from '../services/dynamicDataService';
import { validateSchema, queryOptionsSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error';

const router = Router();
const dynamicDataService = new DynamicDataService();

// Create dynamic CRUD routes
export function createDynamicRoutes(): Router {
  
  // GET /api/:resource - Get resource data list
  router.get('/:resource',
    validateSchema(queryOptionsSchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const resourceName = req.params.resource;
      if (!resourceName) {
        return res.status(400).json({
          success: false,
          error: 'Invalid resource name'
        });
      }
      const queryOptions = (req as any).validatedQuery || {};
      
      const result = await dynamicDataService.getData(resourceName, queryOptions);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    })
  );

  // GET /api/:resource/:id - Get specific data
  router.get('/:resource/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const resourceName = req.params.resource;
      const idParam = req.params.id;
      
      if (!resourceName || !idParam) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters'
        });
      }
      
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'ID must be a valid number'
        });
      }
      
      const result = await dynamicDataService.getDataById(resourceName, id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    })
  );

  // POST /api/:resource - Create new data
  router.post('/:resource',
    asyncHandler(async (req: Request, res: Response) => {
      const resourceName = req.params.resource;
      const data = req.body;
      
      if (!resourceName) {
        return res.status(400).json({
          success: false,
          error: 'Invalid resource name'
        });
      }
      
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid data',
          message: 'Request body cannot be empty'
        });
      }
      
      const result = await dynamicDataService.createData(resourceName, data);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    })
  );

  // PUT /api/:resource/:id - Update data
  router.put('/:resource/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const resourceName = req.params.resource;
      const idParam = req.params.id;
      const data = req.body;
      
      if (!resourceName || !idParam) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters'
        });
      }
      
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'ID must be a valid number'
        });
      }
      
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid data',
          message: 'Request body cannot be empty'
        });
      }
      
      const result = await dynamicDataService.updateData(resourceName, id, data);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    })
  );

  // DELETE /api/:resource/:id - Delete data
  router.delete('/:resource/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const resourceName = req.params.resource;
      const idParam = req.params.id;
      
      if (!resourceName || !idParam) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parameters'
        });
      }
      
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID',
          message: 'ID must be a valid number'
        });
      }
      
      const result = await dynamicDataService.deleteData(resourceName, id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    })
  );

  return router;
}