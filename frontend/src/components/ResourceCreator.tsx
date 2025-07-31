"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import {
  resourcesApi,
  FieldDefinition,
  ResourceDefinition,
  Resource,
} from "@/lib/api";

// Extended field definition for UI purposes
interface UIFieldDefinition extends FieldDefinition {
  isExisting?: boolean;
}

const FIELD_TYPES = [
  { value: "STRING", label: "String" },
  { value: "INTEGER", label: "Integer" },
  { value: "FLOAT", label: "Float" },
  { value: "BOOLEAN", label: "Boolean" },
  { value: "DATE", label: "Date" },
  { value: "DATETIME", label: "Date Time" },
  { value: "TEXT", label: "Text" },
  { value: "JSON", label: "JSON" },
] as const;

interface ResourceCreatorProps {
  onResourceCreated?: () => void;
  editingResource?: Resource | null;
  onEditComplete?: () => void;
}

export default function ResourceCreator({
  onResourceCreated,
  editingResource,
  onEditComplete,
}: ResourceCreatorProps) {
  const [resourceName, setResourceName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<UIFieldDefinition[]>([
    { name: "", type: "STRING", isRequired: false, isUnique: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isEditMode = !!editingResource;

  // Update form when editingResource changes
  useEffect(() => {
    if (editingResource) {
      setResourceName(editingResource.name || "");
      setDisplayName(editingResource.displayName || "");
      setDescription(editingResource.description || "");

      if (editingResource.fields && editingResource.fields.length > 0) {
        setFields(
          editingResource.fields.map((f) => {
            let defaultValue = undefined;
            let validation = undefined;

            // Safely parse JSON values
            if (f.defaultValue) {
              try {
                defaultValue = JSON.parse(f.defaultValue);
              } catch {
                defaultValue = f.defaultValue; // Use as string if JSON parsing fails
              }
            }

            if (f.validation) {
              try {
                validation = JSON.parse(f.validation);
              } catch {
                validation = f.validation; // Use as string if JSON parsing fails
              }
            }

            return {
              name: f.name,
              displayName: f.displayName || "",
              type: f.type as FieldDefinition["type"],
              isRequired: f.isRequired,
              isUnique: f.isUnique,
              defaultValue,
              validation,
              isExisting: true, // Mark as existing field
            };
          })
        );
      } else {
        setFields([
          {
            name: "",
            type: "STRING",
            isRequired: false,
            isUnique: false,
            isExisting: false,
          },
        ]);
      }
    } else {
      // Reset form when not editing
      setResourceName("");
      setDisplayName("");
      setDescription("");
      setFields([
        {
          name: "",
          type: "STRING",
          isRequired: false,
          isUnique: false,
          isExisting: false,
        },
      ]);
    }
    setMessage(null);
  }, [editingResource]);

  const addField = () => {
    setFields([
      ...fields,
      {
        name: "",
        type: "STRING",
        isRequired: false,
        isUnique: false,
        isExisting: false,
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    setFields(
      fields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const resetForm = () => {
    if (isEditMode) {
      onEditComplete?.();
    } else {
      setResourceName("");
      setDisplayName("");
      setDescription("");
      setFields([
        {
          name: "",
          type: "STRING",
          isRequired: false,
          isUnique: false,
          isExisting: false,
        },
      ]);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validation
    if (!resourceName.trim()) {
      setMessage({ type: "error", text: "Resource name is required" });
      setIsLoading(false);
      return;
    }

    const validFields = fields
      .filter((field) => field.name.trim())
      .map((field) => {
        // Remove UI-specific properties before sending to API
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isExisting, ...apiField } = field;
        return apiField;
      });
    if (validFields.length === 0) {
      setMessage({ type: "error", text: "At least one field is required" });
      setIsLoading(false);
      return;
    }

    // Check for duplicate field names
    const fieldNames = validFields.map((f) => f.name.toLowerCase());
    const uniqueFieldNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueFieldNames.size) {
      setMessage({ type: "error", text: "Field names must be unique" });
      setIsLoading(false);
      return;
    }

    const resourceDefinition: ResourceDefinition = {
      name: resourceName.trim(),
      displayName: displayName.trim() || undefined,
      description: description.trim() || undefined,
      fields: validFields,
    };

    try {
      let result;
      if (isEditMode) {
        result = await resourcesApi.updateResource(
          editingResource.name,
          resourceDefinition
        );
      } else {
        result = await resourcesApi.createResource(resourceDefinition);
      }

      if (result.success) {
        const action = isEditMode ? "updated" : "created";
        setMessage({
          type: "success",
          text: `Resource '${resourceName}' ${action} successfully!`,
        });
        if (isEditMode) {
          onEditComplete?.();
        } else {
          resetForm();
        }
        onResourceCreated?.();
      } else {
        setMessage({
          type: "error",
          text:
            result.error ||
            `Failed to ${isEditMode ? "update" : "create"} resource`,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? "Edit Resource" : "Create New Resource"}
      </h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resource Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="resourceName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Resource Name *
            </label>
            <input
              type="text"
              id="resourceName"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Book, Customer, Product"
              required
              disabled={isEditMode}
            />
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Book Management"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what this resource represents..."
          />
        </div>

        {/* Fields Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Fields</h3>
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Field
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name *
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) =>
                        updateField(index, { name: e.target.value })
                      }
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        field.isExisting ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      placeholder="e.g., title, price"
                      disabled={field.isExisting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(index, {
                          type: e.target.value as FieldDefinition["type"],
                        })
                      }
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        field.isExisting ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      disabled={field.isExisting}
                    >
                      {FIELD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="inline-flex items-center p-2 text-red-600 hover:text-red-800 focus:outline-none"
                      title="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {isEditMode ? "Cancel" : "Reset"}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Resource"
              : "Create Resource"}
          </button>
        </div>
      </form>
    </div>
  );
}
