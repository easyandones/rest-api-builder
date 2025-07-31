"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Edit,
} from "lucide-react";
import {
  resourcesApi,
  dataApi,
  testEndpoint,
  Resource,
  EndpointInfo,
} from "@/lib/api";

interface ApiExplorerProps {
  refreshTrigger?: number;
  onEditResource?: (resource: Resource) => void;
}

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}

export default function ApiExplorer({
  refreshTrigger,
  onEditResource,
}: ApiExplorerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {}
  );
  const [testBodies, setTestBodies] = useState<Record<string, string>>({});
  const [testIds, setTestIds] = useState<Record<string, string>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [resourceData, setResourceData] = useState<Record<string, unknown[]>>(
    {}
  );
  const [showDataModal, setShowDataModal] = useState<{
    resource: string;
    data: unknown[];
  } | null>(null);

  const loadResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await resourcesApi.getAllResources();
      if (result.success && result.data) {
        setResources(result.data);
        setError(null);
      } else {
        // API call succeeded but returned an error
        setError(result.error || "Failed to load resources");
        setResources([]);
      }
    } catch (err) {
      // Network error or other exception
      console.error("Failed to load resources:", err);
      setError(
        "Unable to connect to the backend server. Please check if the server is running."
      );
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [refreshTrigger]);

  const toggleResource = (resourceName: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resourceName)) {
      newExpanded.delete(resourceName);
    } else {
      newExpanded.add(resourceName);
    }
    setExpandedResources(newExpanded);
  };

  const getEndpoints = (resourceName: string): EndpointInfo[] => [
    {
      method: "GET",
      path: `/${resourceName}`,
      description: `Get all ${resourceName} items`,
    },
    {
      method: "GET",
      path: `/${resourceName}/:id`,
      description: `Get a specific ${resourceName} item by ID`,
    },
    {
      method: "POST",
      path: `/${resourceName}`,
      description: `Create a new ${resourceName} item`,
    },
    {
      method: "PUT",
      path: `/${resourceName}/:id`,
      description: `Update a specific ${resourceName} item`,
    },
    {
      method: "DELETE",
      path: `/${resourceName}/:id`,
      description: `Delete a specific ${resourceName} item`,
    },
  ];

  const testEndpointCall = async (method: string, path: string) => {
    const testKey = `${method}-${path}`;

    try {
      let body = undefined;
      let testPath = path;

      // Handle ID placeholder for specific item endpoints
      if (path.includes(":id")) {
        const idValue = testIds[testKey];
        if (!idValue) {
          // Only validate ID for endpoints that require it (/:id paths)
          setTestResults({
            ...testResults,
            [testKey]: {
              success: false,
              error: "ID is required for this endpoint",
            },
          });
          return;
        }
        testPath = path.replace(":id", idValue);
      }

      // Handle request body for POST/PUT
      if ((method === "POST" || method === "PUT") && testBodies[testKey]) {
        try {
          body = JSON.parse(testBodies[testKey]);
        } catch {
          // If JSON parsing fails, send empty object
          body = {};
        }
      }

      const result = await testEndpoint(method, testPath, body);
      setTestResults({
        ...testResults,
        [testKey]: result,
      });
    } catch {
      setTestResults({
        ...testResults,
        [testKey]: { success: false, error: "Network error" },
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
      } catch {
        console.error("Failed to copy text");
      }
      document.body.removeChild(textArea);
    }
  };

  const deleteResource = async (resourceName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the "${resourceName}" resource? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const result = await resourcesApi.deleteResource(resourceName);
      if (result.success) {
        loadResources(); // Refresh the list
      } else {
        alert(`Failed to delete resource: ${result.error}`);
      }
    } catch {
      alert("Failed to delete resource");
    }
  };

  const loadResourceData = async (resourceName: string) => {
    try {
      const result = await dataApi.getData(resourceName);
      if (result.success && result.data) {
        // Backend returns { items: [...], pagination: {...} }
        // Extract the items array
        let dataArray: unknown[] = [];
        if (Array.isArray(result.data)) {
          dataArray = result.data;
        } else if (
          result.data &&
          typeof result.data === "object" &&
          "items" in result.data
        ) {
          const resultData = result.data as { items?: unknown[] };
          dataArray = Array.isArray(resultData.items) ? resultData.items : [];
        }

        setResourceData({
          ...resourceData,
          [resourceName]: dataArray,
        });
        setShowDataModal({ resource: resourceName, data: dataArray });
      } else {
        // Handle case where no data is returned
        setShowDataModal({ resource: resourceName, data: [] });
      }
    } catch {
      console.error("Failed to load resource data");
      setShowDataModal({ resource: resourceName, data: [] });
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-green-600 bg-green-50";
      case "POST":
        return "text-blue-600 bg-blue-50";
      case "PUT":
        return "text-yellow-600 bg-yellow-50";
      case "DELETE":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const generateSampleBody = (resource: Resource, method: string): string => {
    if (method !== "POST" && method !== "PUT") return "";

    const sampleData: Record<string, unknown> = {};
    resource.fields.forEach((field) => {
      switch (field.type) {
        case "STRING":
          sampleData[field.name] = "sample text";
          break;
        case "INTEGER":
          sampleData[field.name] = 42;
          break;
        case "FLOAT":
          sampleData[field.name] = 3.14;
          break;
        case "BOOLEAN":
          sampleData[field.name] = true;
          break;
        case "DATE":
          sampleData[field.name] = "2024-01-01";
          break;
        case "DATETIME":
          sampleData[field.name] = "2024-01-01T10:00:00Z";
          break;
        case "TEXT":
          sampleData[field.name] = "Lorem ipsum dolor sit amet";
          break;
        case "JSON":
          sampleData[field.name] = { key: "value" };
          break;
        default:
          sampleData[field.name] = null;
      }
    });

    return JSON.stringify(sampleData, null, 2);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading API resources...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">⚠</span>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Connection Error
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadResources}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state only when no error and no resources
  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Resources Found
          </h3>
          <p className="text-gray-600">
            Create your first resource above to start generating API endpoints.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                API Explorer
              </h2>
              <p className="text-sm text-gray-600">
                Test your generated REST API endpoints
              </p>
            </div>
          </div>
          <button
            onClick={loadResources}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="space-y-4">
          {resources.map((resource) => {
            const isExpanded = expandedResources.has(resource.name);
            const endpoints = getEndpoints(resource.name);

            return (
              <div
                key={resource.name}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleResource(resource.name)}
                        className="flex items-center space-x-2 text-left hover:text-blue-600 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {resource.displayName || resource.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {resource.description ||
                              `API endpoints for ${resource.name}`}
                          </p>
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadResourceData(resource.name)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Data
                      </button>
                      <button
                        onClick={() => onEditResource?.(resource)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteResource(resource.name)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {endpoints.map((endpoint) => {
                      const testKey = `${endpoint.method}-${endpoint.path}`;
                      const result = testResults[testKey];

                      return (
                        <div
                          key={testKey}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getMethodColor(
                                  endpoint.method
                                )}`}
                              >
                                {endpoint.method}
                              </span>
                              <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {endpoint.path}
                              </code>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      `${endpoint.method} ${endpoint.path}`
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy endpoint"
                                >
                                  {copiedText ===
                                  `${endpoint.method} ${endpoint.path}` ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <button
                                onClick={() =>
                                  testEndpointCall(
                                    endpoint.method,
                                    endpoint.path
                                  )
                                }
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Test
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {endpoint.description}
                          </p>

                          {/* ID Input for endpoints that need it */}
                          {endpoint.path.includes(":id") && (
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                ID (required)
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={testIds[testKey] || ""}
                                  onChange={(e) =>
                                    setTestIds({
                                      ...testIds,
                                      [testKey]: e.target.value,
                                    })
                                  }
                                  placeholder="Enter ID"
                                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                  onClick={() =>
                                    loadResourceData(resource.name)
                                  }
                                  className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                  title="View all IDs"
                                >
                                  View All IDs
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Request Body for POST/PUT */}
                          {(endpoint.method === "POST" ||
                            endpoint.method === "PUT") && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-gray-700">
                                  Request Body (JSON)
                                </label>
                                <button
                                  onClick={() => {
                                    const sample = generateSampleBody(
                                      resource,
                                      endpoint.method
                                    );
                                    setTestBodies({
                                      ...testBodies,
                                      [testKey]: sample,
                                    });
                                  }}
                                  className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                >
                                  Generate Sample
                                </button>
                              </div>
                              <textarea
                                value={testBodies[testKey] || ""}
                                onChange={(e) =>
                                  setTestBodies({
                                    ...testBodies,
                                    [testKey]: e.target.value,
                                  })
                                }
                                placeholder={`Enter JSON data for ${endpoint.method} request`}
                                rows={4}
                                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}

                          {/* Test Result */}
                          {result && (
                            <div className="mt-3">
                              {/* Response Header - Outside the colored area */}
                              <div className="mb-2 flex items-center">
                                <span className="text-sm font-medium text-gray-700 mr-2">
                                  Response:
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                                    result.status
                                      ? result.status >= 200 &&
                                        result.status < 300
                                        ? "text-green-600 bg-green-50" // 2xx Success - Green
                                        : result.status >= 300 &&
                                          result.status < 400
                                        ? "text-blue-600 bg-blue-50" // 3xx Redirect - Blue
                                        : result.status >= 400 &&
                                          result.status < 500
                                        ? "text-orange-600 bg-orange-50" // 4xx Client Error - Orange
                                        : result.status >= 500
                                        ? "text-red-600 bg-red-50" // 5xx Server Error - Red
                                        : "text-gray-600 bg-gray-50" // Other
                                      : "text-gray-600 bg-gray-50" // ERROR
                                  }`}
                                >
                                  {result.status || "ERROR"}
                                </span>
                              </div>

                              {/* Response Content Area */}
                              <div
                                className={`p-3 rounded-md border ${
                                  result.success
                                    ? "bg-green-50 border-green-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                              >
                                <pre
                                  className={`text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40 ${
                                    result.success
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {result.error ||
                                    JSON.stringify(result.data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Data for &quot;{showDataModal.resource}&quot;
              </h3>
              <button
                onClick={() => setShowDataModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              {!showDataModal.data ||
              !Array.isArray(showDataModal.data) ||
              showDataModal.data.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No data found for this resource.
                </p>
              ) : (
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Available IDs:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {showDataModal.data.map(
                        (item: unknown, index: number) => {
                          const itemObj = item as { id?: number | string };
                          return (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                              onClick={() => {
                                const idStr =
                                  itemObj.id?.toString() ||
                                  (index + 1).toString();
                                navigator.clipboard.writeText(idStr);
                                setCopiedText(idStr);
                                setTimeout(() => setCopiedText(null), 1000);
                              }}
                            >
                              {itemObj.id || index + 1}
                            </span>
                          );
                        }
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Full Data:
                    </h4>
                    <pre className="text-xs font-mono bg-gray-50 p-4 rounded overflow-auto">
                      {JSON.stringify(showDataModal.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
