import { Router, Request, Response } from 'express';
import { ResourceService } from '../services/resourceService';
import { validateSchema, resourceDefinitionSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/error';
import { ApiResponse, EndpointInfo } from '../types';

const router = Router();
const resourceService = new ResourceService();

// Create resource
router.post('/define-resource', 
  validateSchema(resourceDefinitionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await resourceService.createResource((req as any).validatedBody);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  })
);

// Get all resources
router.get('/', 
  asyncHandler(async (req: Request, res: Response) => {
    const result = await resourceService.getAllResources();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  })
);

// Get specific resource
router.get('/:name', 
  asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource name'
      });
    }
    
    const result = await resourceService.getResource(name);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  })
);

// Update resource
router.put('/:name', 
  validateSchema(resourceDefinitionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource name'
      });
    }
    
    const result = await resourceService.updateResource(name, (req as any).validatedBody);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  })
);

// Delete resource
router.delete('/:name', 
  asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource name'
      });
    }
    
    const result = await resourceService.deleteResource(name);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  })
);

// Get available endpoints for resource
router.get('/:name/endpoints', 
  asyncHandler(async (req: Request, res: Response) => {
    const resourceName = req.params.name;
    
    if (!resourceName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource name'
      });
    }
    
    const result = await resourceService.getResource(resourceName);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    const endpoints: EndpointInfo[] = [
      {
        method: 'GET',
        path: `/api/${resourceName}`,
        description: `Get all ${resourceName} items`
      },
      {
        method: 'GET',
        path: `/api/${resourceName}/:id`,
        description: `Get a specific ${resourceName} item by ID`
      },
      {
        method: 'POST',
        path: `/api/${resourceName}`,
        description: `Create a new ${resourceName} item`
      },
      {
        method: 'PUT',
        path: `/api/${resourceName}/:id`,
        description: `Update a specific ${resourceName} item`
      },
      {
        method: 'DELETE',
        path: `/api/${resourceName}/:id`,
        description: `Delete a specific ${resourceName} item`
      }
    ];

    const response: ApiResponse<{ resource: any; endpoints: EndpointInfo[] }> = {
      success: true,
      data: {
        resource: result.data,
        endpoints
      }
    };

    res.json(response);
  })
);

export default router;