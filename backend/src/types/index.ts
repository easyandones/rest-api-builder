import { FieldType } from '@prisma/client';

// API response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Resource definition type
export interface ResourceDefinition {
  name: string;
  displayName?: string;
  description?: string;
  fields: FieldDefinition[];
}

// Field definition type
export interface FieldDefinition {
  name: string;
  displayName?: string;
  type: FieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: any;
  validation?: FieldValidation;
}

// Field validation type
export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
}

// Dynamic endpoint information
export interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

// Resource data query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

// Database connection configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

// SQL type mapping
export const SQL_TYPE_MAPPING: Record<FieldType, string> = {
  STRING: 'VARCHAR(255)',
  INTEGER: 'INTEGER',
  FLOAT: 'DECIMAL(10,2)',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  DATETIME: 'TIMESTAMP',
  TEXT: 'TEXT',
  JSON: 'JSONB'
};

// Environment variables type
export interface Environment {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  CORS_ORIGIN: string;
  API_PREFIX: string;
}