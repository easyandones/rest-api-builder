import { prisma, pgPool } from "../utils/database";
import {
  ResourceDefinition,
  FieldDefinition,
  SQL_TYPE_MAPPING,
  ApiResponse,
} from "../types";
import { FieldType, Prisma } from "@prisma/client";

export class ResourceService {
  // Create resource
  async createResource(definition: ResourceDefinition): Promise<ApiResponse> {
    try {
      const tableName = this.generateTableName(definition.name);

      // Check if resource already exists
      const existingResource = await prisma.resource.findUnique({
        where: { name: definition.name },
      });

      if (existingResource) {
        return {
          success: false,
          error: "Resource already exists",
          message: `Resource '${definition.name}' already exists`,
        };
      }

      // Handle resource creation and table creation together in a transaction
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Save resource metadata
          const resource = await tx.resource.create({
            data: {
              name: definition.name,
              displayName: definition.displayName || null,
              description: definition.description || null,
              tableName,
              fields: {
                create: definition.fields.map((field, index) => ({
                  name: field.name,
                  displayName: field.displayName || null,
                  type: field.type,
                  isRequired: field.isRequired || false,
                  isUnique: field.isUnique || false,
                  defaultValue: field.defaultValue
                    ? JSON.stringify(field.defaultValue)
                    : null,
                  validation: field.validation
                    ? JSON.stringify(field.validation)
                    : null,
                  order: index,
                })),
              },
            },
            include: { fields: true },
          });

          // 2. Create database table
          await this.createTable(tableName, definition.fields);

          return resource;
        }
      );

      return {
        success: true,
        data: result,
        message: `Resource '${definition.name}' created successfully`,
      };
    } catch (error) {
      console.error("Error creating resource:", error);
      return {
        success: false,
        error: "Failed to create resource",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get all resources
  async getAllResources(): Promise<ApiResponse> {
    try {
      const resources = await prisma.resource.findMany({
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return {
        success: true,
        data: resources,
      };
    } catch (error) {
      console.error("Error fetching resources:", error);
      return {
        success: false,
        error: "Failed to fetch resources",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get specific resource
  async getResource(name: string): Promise<ApiResponse> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { name },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!resource) {
        return {
          success: false,
          error: "Resource not found",
          message: `Resource '${name}' not found`,
        };
      }

      return {
        success: true,
        data: resource,
      };
    } catch (error) {
      console.error("Error fetching resource:", error);
      return {
        success: false,
        error: "Failed to fetch resource",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Update resource
  async updateResource(
    name: string,
    definition: ResourceDefinition
  ): Promise<ApiResponse> {
    try {
      // Get existing resource
      const existingResource = await prisma.resource.findUnique({
        where: { name },
        include: { fields: { orderBy: { order: "asc" } } },
      });

      if (!existingResource) {
        return {
          success: false,
          error: "Resource not found",
          message: `Resource '${name}' not found`,
        };
      }

      // Handle update and schema changes together in a transaction
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Update resource metadata
          const updatedResource = await tx.resource.update({
            where: { name },
            data: {
              displayName: definition.displayName || null,
              description: definition.description || null,
            },
          });

          // 2. Compare and update fields
          await this.updateFields(tx, existingResource, definition.fields);

          // 3. Update DB schema
          await this.updateTableSchema(existingResource, definition.fields);

          // 4. Return updated resource
          return await tx.resource.findUnique({
            where: { name },
            include: { fields: { orderBy: { order: "asc" } } },
          });
        }
      );

      return {
        success: true,
        data: result,
        message: `Resource '${name}' updated successfully`,
      };
    } catch (error) {
      console.error("Error updating resource:", error);
      return {
        success: false,
        error: "Failed to update resource",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Delete resource
  async deleteResource(name: string): Promise<ApiResponse> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { name },
      });

      if (!resource) {
        return {
          success: false,
          error: "Resource not found",
          message: `Resource '${name}' not found`,
        };
      }

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Delete metadata (Fields are also deleted by Cascade)
        await tx.resource.delete({
          where: { name },
        });

        // 2. Delete actual table
        await this.dropTable(resource.tableName);
      });

      return {
        success: true,
        message: `Resource '${name}' deleted successfully`,
      };
    } catch (error) {
      console.error("Error deleting resource:", error);
      return {
        success: false,
        error: "Failed to delete resource",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Generate table name
  private generateTableName(resourceName: string): string {
    return `dyn_${resourceName.toLowerCase()}`;
  }

  // Create database table
  private async createTable(
    tableName: string,
    fields: FieldDefinition[]
  ): Promise<void> {
    const client = await pgPool.connect();

    try {
      // Basic columns (id, created_at, updated_at)
      let sql = `CREATE TABLE "${tableName}" (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()`;

      // User-defined fields
      for (const field of fields) {
        const sqlType = SQL_TYPE_MAPPING[field.type];
        let columnDef = `"${field.name}" ${sqlType}`;

        if (field.isRequired) {
          columnDef += " NOT NULL";
        }

        if (field.defaultValue !== undefined) {
          columnDef += ` DEFAULT ${this.formatDefaultValue(
            field.defaultValue,
            field.type
          )}`;
        }

        sql += `,\n        ${columnDef}`;
      }

      sql += "\n      )";

      await client.query(sql);

      // Add unique constraints
      for (const field of fields) {
        if (field.isUnique) {
          await client.query(
            `CREATE UNIQUE INDEX "${tableName}_${field.name}_unique" ON "${tableName}" ("${field.name}")`
          );
        }
      }

      // Create updated_at trigger
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      await client.query(`
        CREATE TRIGGER update_${tableName}_updated_at 
        BEFORE UPDATE ON "${tableName}" 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    } finally {
      client.release();
    }
  }

  // Drop table
  private async dropTable(tableName: string): Promise<void> {
    const client = await pgPool.connect();

    try {
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    } finally {
      client.release();
    }
  }

  // Handle field updates
  private async updateFields(
    tx: Prisma.TransactionClient,
    existingResource: {
      id: string;
      fields: Array<{
        id: string;
        name: string;
        type: string;
        isRequired: boolean;
        isUnique: boolean;
      }>;
    },
    newFields: FieldDefinition[]
  ): Promise<void> {
    const existingFields = existingResource.fields;
    const existingFieldMap = new Map(existingFields.map((f) => [f.name, f]));
    const newFieldMap = new Map(newFields.map((f) => [f.name, f]));

    // Handle deleted fields
    for (const existingField of existingFields) {
      if (!newFieldMap.has(existingField.name)) {
        await tx.field.delete({
          where: { id: existingField.id },
        });
      }
    }

    // Handle new or updated fields
    for (let i = 0; i < newFields.length; i++) {
      const newField = newFields[i];
      if (!newField) continue;

      const existingField = existingFieldMap.get(newField.name);

      if (existingField) {
        // Update existing field
        await tx.field.update({
          where: { id: existingField.id },
          data: {
            displayName: newField.displayName || null,
            type: newField.type,
            isRequired: newField.isRequired || false,
            isUnique: newField.isUnique || false,
            defaultValue: newField.defaultValue
              ? JSON.stringify(newField.defaultValue)
              : null,
            validation: newField.validation
              ? JSON.stringify(newField.validation)
              : null,
            order: i,
          },
        });
      } else {
        // Create new field
        await tx.field.create({
          data: {
            name: newField.name,
            displayName: newField.displayName || null,
            type: newField.type,
            isRequired: newField.isRequired || false,
            isUnique: newField.isUnique || false,
            defaultValue: newField.defaultValue
              ? JSON.stringify(newField.defaultValue)
              : null,
            validation: newField.validation
              ? JSON.stringify(newField.validation)
              : null,
            order: i,
            resourceId: existingResource.id,
          },
        });
      }
    }
  }

  // Handle table schema updates
  private async updateTableSchema(
    existingResource: {
      tableName: string;
      fields: Array<{
        name: string;
        type: string;
        isRequired: boolean;
        isUnique: boolean;
      }>;
    },
    newFields: FieldDefinition[]
  ): Promise<void> {
    const client = await pgPool.connect();

    try {
      const tableName = existingResource.tableName;
      const existingFields = existingResource.fields;
      const existingFieldMap = new Map(existingFields.map((f) => [f.name, f]));
      const newFieldMap = new Map(newFields.map((f) => [f.name, f]));

      // Handle deleted columns
      for (const existingField of existingFields) {
        if (!newFieldMap.has(existingField.name)) {
          await client.query(
            `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${existingField.name}"`
          );
        }
      }

      // Handle new or modified columns
      for (const newField of newFields) {
        if (!newField) continue;

        const existingField = existingFieldMap.get(newField.name);
        const sqlType = SQL_TYPE_MAPPING[newField.type];

        if (!existingField) {
          // Add new column
          let columnDef = `"${newField.name}" ${sqlType}`;

          if (newField.isRequired) {
            columnDef += " NOT NULL";
          }

          if (newField.defaultValue !== undefined) {
            columnDef += ` DEFAULT ${this.formatDefaultValue(
              newField.defaultValue,
              newField.type
            )}`;
          }

          await client.query(
            `ALTER TABLE "${tableName}" ADD COLUMN ${columnDef}`
          );

          // Add unique constraint
          if (newField.isUnique) {
            await client.query(
              `CREATE UNIQUE INDEX "${tableName}_${newField.name}_unique" ON "${tableName}" ("${newField.name}")`
            );
          }
        } else if (
          existingField.type !== newField.type ||
          existingField.isRequired !== (newField.isRequired || false) ||
          existingField.isUnique !== (newField.isUnique || false)
        ) {
          // Modify existing column
          let columnDef = `"${newField.name}" ${sqlType}`;

          if (newField.isRequired) {
            columnDef += " NOT NULL";
          }

          await client.query(
            `ALTER TABLE "${tableName}" ALTER COLUMN ${columnDef}`
          );

          // Handle unique constraints
          if (existingField.isUnique && !newField.isUnique) {
            await client.query(
              `DROP INDEX IF EXISTS "${tableName}_${newField.name}_unique"`
            );
          } else if (!existingField.isUnique && newField.isUnique) {
            await client.query(
              `CREATE UNIQUE INDEX "${tableName}_${newField.name}_unique" ON "${tableName}" ("${newField.name}")`
            );
          }
        }
      }
    } finally {
      client.release();
    }
  }

  // Format default value
  private formatDefaultValue(
    value: string | number | boolean | null,
    type: FieldType
  ): string {
    if (value === null || value === undefined) {
      return "NULL";
    }

    switch (type) {
      case FieldType.STRING:
      case FieldType.TEXT:
        return `'${value.toString().replace(/'/g, "''")}'`;
      case FieldType.INTEGER:
      case FieldType.FLOAT:
        return value.toString();
      case FieldType.BOOLEAN:
        return value ? "TRUE" : "FALSE";
      case FieldType.DATE:
      case FieldType.DATETIME:
        return `'${value}'`;
      case FieldType.JSON:
        return `'${JSON.stringify(value)}'::jsonb`;
      default:
        return `'${value}'`;
    }
  }
}
