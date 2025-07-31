# REST API Generator - Frontend

The React-based frontend component of the REST API Generator assignment. Provides user interface for resource creation and API testing.

## Assignment Requirements Fulfilled

✅ **Resource Creator Form**

- Input for resource name and display name
- Add/remove fields with multiple types (string, integer, boolean, float, date, datetime, text, json)
- "Create Resource" and "Update Resource" buttons
- Resource editing with existing field management

✅ **API Explorer**

- Shows list of all defined resources
- Displays available endpoints for each resource
- Allows direct testing of endpoints (GET, POST, PUT, DELETE)
- Interactive API testing with parameter inputs and response display

## Technology Stack

**Frontend (React-based)**

- Next.js 15 (React framework)
- TypeScript
- Tailwind CSS
- Lucide React (icons)

## Quick Start

**With Docker (Recommended):**

```bash
# From project root
cp .env.example .env  # Setup environment
docker-compose up -d
# Frontend available at http://localhost:3000
```

**Manual Setup:**

```bash
cd frontend
yarn install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
yarn dev
```

## API Integration

The frontend communicates with the backend through these endpoints:

**Resource Management:**

- `POST /api/resources/define-resource` - Create new resource
- `GET /api/resources` - List all resources

**Auto-Generated Endpoints (example for "book" resource):**

- `GET /api/book` - List all books
- `GET /api/book/:id` - Get specific book
- `POST /api/book` - Create new book
- `PUT /api/book/:id` - Update book
- `DELETE /api/book/:id` - Delete book

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Available Scripts

```bash
yarn dev     # Start development server
yarn build   # Build for production
yarn start   # Start production server
yarn lint    # Run ESLint
```
