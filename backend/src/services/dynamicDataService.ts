import { pgPool, prisma } from '../utils/database';
import { QueryOptions, ApiResponse } from '../types';

export class DynamicDataService {
  
  // Create data
  async createData(resourceName: string, data: Record<string, any>): Promise<ApiResponse> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { name: resourceName },
        include: { fields: true }
      });

      if (!resource) {
        return {
          success: false,
          error: 'Resource not found',
          message: `Resource '${resourceName}' not found`
        };
      }

      // Data validation
      const validationResult = await this.validateData(data, resource.fields);
      if (!validationResult.success) {
        return validationResult;
      }

      const client = await pgPool.connect();
      
      try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`);

        const sql = `
          INSERT INTO "${resource.tableName}" (${columns.map(col => `"${col}"`).join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const result = await client.query(sql, values);

        return {
          success: true,
          data: result.rows[0],
          message: 'Data created successfully'
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating data:', error);
      return {
        success: false,
        error: 'Failed to create data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get data (list)
  async getData(resourceName: string, options: QueryOptions = {}): Promise<ApiResponse> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { name: resourceName }
      });

      if (!resource) {
        return {
          success: false,
          error: 'Resource not found',
          message: `Resource '${resourceName}' not found`
        };
      }

      const client = await pgPool.connect();
      
      try {
        let sql = `SELECT * FROM "${resource.tableName}"`;
        const params: any[] = [];
        let paramCount = 0;

        // Filtering
        if (options.filter && Object.keys(options.filter).length > 0) {
          const conditions = [];
          for (const [key, value] of Object.entries(options.filter)) {
            paramCount++;
            conditions.push(`"${key}" = $${paramCount}`);
            params.push(value);
          }
          sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Sorting
        if (options.sort) {
          const order = options.order || 'asc';
          sql += ` ORDER BY "${options.sort}" ${order.toUpperCase()}`;
        } else {
          sql += ` ORDER BY created_at DESC`;
        }

        // Pagination
        const limit = options.limit || 50;
        const page = options.page || 1;
        const offset = (page - 1) * limit;

        sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(limit, offset);

        const result = await client.query(sql, params);

        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM "${resource.tableName}"`;
        const countParams: any[] = [];
        let countParamCount = 0;

        if (options.filter && Object.keys(options.filter).length > 0) {
          const conditions = [];
          for (const [key, value] of Object.entries(options.filter)) {
            countParamCount++;
            conditions.push(`"${key}" = $${countParamCount}`);
            countParams.push(value);
          }
          countSql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const countResult = await client.query(countSql, countParams);
        const total = parseInt(countResult.rows[0].total);

        return {
          success: true,
          data: {
            items: result.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
            }
          }
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return {
        success: false,
        error: 'Failed to fetch data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get data (single)
  async getDataById(resourceName: string, id: number): Promise<ApiResponse> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { name: resourceName }
      });

      if (!resource) {
        return {
          success: false,
          error: 'Resource not found',
          message: `Resource '${resourceName}' not found`
        };
      }

      const client = await pgPool.connect();
      
      try {
        const sql = `SELECT * FROM "${resource.tableName}" WHERE id = $1`;
        const result = await client.query(sql, [id]);

        if (result.rows.length === 0) {
          return {
            success: false,
            error: 'Data not found',
            message: `Data with id ${id} not found`
          };
        }

        return {
          success: true,
          data: result.rows[0]
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching data by id:', error);
      return {
        success: false,
        error: 'Failed to fetch data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update data
  async updateData(resourceName: string, id: number, data: Record<string, any>): Promise<ApiResponse> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { name: resourceName },
        include: { fields: true }
      });

      if (!resource) {
        return {
          success: false,
          error: 'Resource not found',
          message: `Resource '${resourceName}' not found`
        };
      }

      // Data validation
      const validationResult = await this.validateData(data, resource.fields, true);
      if (!validationResult.success) {
        return validationResult;
      }

      const client = await pgPool.connect();
      
      try {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, index) => `"${col}" = $${index + 1}`);

        const sql = `
          UPDATE "${resource.tableName}" 
          SET ${setClause.join(', ')}
          WHERE id = $${columns.length + 1}
          RETURNING *
        `;

        const result = await client.query(sql, [...values, id]);

        if (result.rows.length === 0) {
          return {
            success: false,
            error: 'Data not found',
            message: `Data with id ${id} not found`
          };
        }

        return {
          success: true,
          data: result.rows[0],
          message: 'Data updated successfully'
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating data:', error);
      return {
        success: false,
        error: 'Failed to update data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete data
  async deleteData(resourceName: string, id: number): Promise<ApiResponse> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { name: resourceName }
      });

      if (!resource) {
        return {
          success: false,
          error: 'Resource not found',
          message: `Resource '${resourceName}' not found`
        };
      }

      const client = await pgPool.connect();
      
      try {
        const sql = `DELETE FROM "${resource.tableName}" WHERE id = $1 RETURNING *`;
        const result = await client.query(sql, [id]);

        if (result.rows.length === 0) {
          return {
            success: false,
            error: 'Data not found',
            message: `Data with id ${id} not found`
          };
        }

        return {
          success: true,
          data: result.rows[0],
          message: 'Data deleted successfully'
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      return {
        success: false,
        error: 'Failed to delete data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Data validation
  private async validateData(data: Record<string, any>, fields: any[], isUpdate = false): Promise<ApiResponse> {
    for (const field of fields) {
      const value = data[field.name];
      
      // Check required fields (only for creation)
      if (!isUpdate && field.isRequired && (value === undefined || value === null)) {
        return {
          success: false,
          error: 'Validation error',
          message: `Field '${field.name}' is required`
        };
      }

      // Type check if value exists
      if (value !== undefined && value !== null) {
        const typeValidation = this.validateFieldType(value, field.type);
        if (!typeValidation.valid) {
          return {
            success: false,
            error: 'Validation error',
            message: `Field '${field.name}': ${typeValidation.message}`
          };
        }

        // Additional validation
        if (field.validation) {
          const validationRules = JSON.parse(field.validation);
          const validationResult = this.validateFieldRules(value, validationRules, field.name);
          if (!validationResult.valid) {
            return {
              success: false,
              error: 'Validation error',
              message: validationResult.message!
            };
          }
        }
      }
    }

    return { success: true };
  }

  // Field type validation
  private validateFieldType(value: any, type: string): { valid: boolean; message?: string } {
    switch (type) {
      case 'STRING':
      case 'TEXT':
        if (typeof value !== 'string') {
          return { valid: false, message: 'Must be a string' };
        }
        break;
      case 'INTEGER':
        if (!Number.isInteger(value)) {
          return { valid: false, message: 'Must be an integer' };
        }
        break;
      case 'FLOAT':
        if (typeof value !== 'number') {
          return { valid: false, message: 'Must be a number' };
        }
        break;
      case 'BOOLEAN':
        if (typeof value !== 'boolean') {
          return { valid: false, message: 'Must be a boolean' };
        }
        break;
      case 'DATE':
      case 'DATETIME':
        if (isNaN(Date.parse(value))) {
          return { valid: false, message: 'Must be a valid date' };
        }
        break;
      case 'JSON':
        try {
          if (typeof value === 'string') {
            JSON.parse(value);
          }
        } catch {
          return { valid: false, message: 'Must be valid JSON' };
        }
        break;
    }
    return { valid: true };
  }

  // Field rule validation
  private validateFieldRules(value: any, rules: any, fieldName: string): { valid: boolean; message?: string } {
    if (rules.min !== undefined && value < rules.min) {
      return { valid: false, message: `Field '${fieldName}' must be at least ${rules.min}` };
    }
    if (rules.max !== undefined && value > rules.max) {
      return { valid: false, message: `Field '${fieldName}' must be at most ${rules.max}` };
    }
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return { valid: false, message: `Field '${fieldName}' must be at least ${rules.minLength} characters` };
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return { valid: false, message: `Field '${fieldName}' must be at most ${rules.maxLength} characters` };
    }
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      return { valid: false, message: `Field '${fieldName}' format is invalid` };
    }
    if (rules.enum && !rules.enum.includes(value)) {
      return { valid: false, message: `Field '${fieldName}' must be one of: ${rules.enum.join(', ')}` };
    }
    return { valid: true };
  }
}