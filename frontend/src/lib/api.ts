// API client for communicating with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface FieldDefinition {
  name: string;
  displayName?: string;
  type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TEXT' | 'JSON';
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string | number | boolean | null;
}

export interface ResourceDefinition {
  name: string;
  displayName?: string;
  description?: string;
  fields: FieldDefinition[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
}

export interface Resource {
  id: number;
  name: string;
  displayName: string | null;
  description: string | null;
  tableName: string;
  createdAt: string;
  updatedAt: string;
  fields: {
    id: number;
    name: string;
    displayName: string | null;
    type: string;
    isRequired: boolean;
    isUnique: boolean;
    defaultValue: string | null;
    validation: string | null;
    order: number;
  }[];
}

// Generic API call function
async function apiCall<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: 'Network error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Resource management APIs
export const resourcesApi = {
  // Create a new resource
  createResource: async (definition: ResourceDefinition): Promise<ApiResponse<Resource>> => {
    return apiCall<Resource>('/resources/define-resource', {
      method: 'POST',
      body: JSON.stringify(definition),
    });
  },

  // Get all resources
  getAllResources: async (): Promise<ApiResponse<Resource[]>> => {
    return apiCall<Resource[]>('/resources');
  },

  // Get a specific resource
  getResource: async (name: string): Promise<ApiResponse<Resource>> => {
    return apiCall<Resource>(`/resources/${encodeURIComponent(name)}`);
  },

  // Update a resource
  updateResource: async (name: string, definition: ResourceDefinition): Promise<ApiResponse<Resource>> => {
    return apiCall<Resource>(`/resources/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(definition),
    });
  },

  // Delete a resource
  deleteResource: async (name: string): Promise<ApiResponse> => {
    return apiCall(`/resources/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },

  // Get resource endpoints
  getResourceEndpoints: async (name: string): Promise<ApiResponse<{ resource: Resource; endpoints: EndpointInfo[] }>> => {
    return apiCall(`/resources/${encodeURIComponent(name)}/endpoints`);
  },
};

// Dynamic data APIs
export const dataApi = {
  // Get all data for a resource
  getData: async (resourceName: string, queryOptions?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>[]>> => {
    const params = new URLSearchParams();
    if (queryOptions) {
      Object.entries(queryOptions).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = `/${encodeURIComponent(resourceName)}${queryString ? `?${queryString}` : ''}`;
    return apiCall<Record<string, unknown>[]>(endpoint);
  },

  // Get specific data by ID
  getDataById: async (resourceName: string, id: number): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiCall(`/${encodeURIComponent(resourceName)}/${id}`);
  },

  // Create new data
  createData: async (resourceName: string, data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiCall(`/${encodeURIComponent(resourceName)}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update data
  updateData: async (resourceName: string, id: number, data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiCall(`/${encodeURIComponent(resourceName)}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete data
  deleteData: async (resourceName: string, id: number): Promise<ApiResponse> => {
    return apiCall(`/${encodeURIComponent(resourceName)}/${id}`, {
      method: 'DELETE',
    });
  },
};

// Test API endpoint
export const testEndpoint = async (
  method: string,
  url: string,
  body?: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string; status?: number }> => {
  try {
    const options: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, options);
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    return {
      success: response.ok,
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};