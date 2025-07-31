import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FieldType } from '@prisma/client';
import { ApiResponse } from '../types';

// Resource definition validation schema
export const resourceDefinitionSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Resource name must start with a letter and contain only letters, numbers, and underscores'),
  displayName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  fields: z.array(z.object({
    name: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
    displayName: z.string().max(100).optional(),
    type: z.nativeEnum(FieldType),
    isRequired: z.boolean().default(false),
    isUnique: z.boolean().default(false),
    defaultValue: z.any().optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      enum: z.array(z.string()).optional()
    }).optional()
  })).min(1, 'At least one field is required')
});

// Query parameter validation schema
export const queryOptionsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Validation middleware generator
export function validateSchema<T>(schema: z.ZodSchema<T>, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      const data = req[property];
      const validated = schema.parse(data);
      (req as any)[`validated${property.charAt(0).toUpperCase() + property.slice(1)}`] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      next(error);
    }
  };
}