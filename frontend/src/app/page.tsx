'use client';

import { useState } from 'react';
import { Database, Code } from 'lucide-react';
import ResourceCreator from '@/components/ResourceCreator';
import ApiExplorer from '@/components/ApiExplorer';
import { Resource } from '@/lib/api';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const handleResourceCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    // Scroll to the top where ResourceCreator is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditComplete = () => {
    setEditingResource(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">REST API Generator</h1>
                <p className="text-sm text-gray-600">Create and test dynamic REST APIs instantly</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="http://localhost:3001/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Code className="w-4 h-4 mr-2" />
                API Docs
              </a>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Welcome to REST API Generator</h2>
            <p className="text-gray-600 mb-4">
              This tool allows you to dynamically create REST API resources and test them in real-time. 
              Define your data models with custom fields, and the system will automatically generate 
              full CRUD endpoints with PostgreSQL persistence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-medium">Create Resources:</span> Define your data structure with fields, types, and constraints
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-medium">Auto-Generate APIs:</span> Get full CRUD endpoints (GET, POST, PUT, DELETE) instantly
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <span className="font-medium">Test & Explore:</span> Interactive API testing with real-time responses
                </div>
              </div>
            </div>
          </div>

          {/* Resource Creator */}
          <ResourceCreator 
            onResourceCreated={handleResourceCreated} 
            editingResource={editingResource}
            onEditComplete={handleEditComplete}
          />

          {/* API Explorer */}
          <ApiExplorer 
            refreshTrigger={refreshTrigger} 
            onEditResource={handleEditResource}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              REST API Generator
            </div>
            <div className="text-sm text-gray-500">
              REST API Generator
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
