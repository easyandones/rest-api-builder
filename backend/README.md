# REST API Generator - Backend

The Node.js/Express backend component of the REST API Generator assignment. Provides dynamic resource creation and auto-generated CRUD endpoints.

## Assignment Requirements Fulfilled

✅ **Resource Definition Endpoint**

- `POST /define-resource` accepts resource definitions

✅ **Auto-Generated CRUD Endpoints**

- `GET /api/<resource>` - List all
- `GET /api/<resource>/:id` - Get one
- `POST /api/<resource>` - Create
- `PUT /api/<resource>/:id` - Update
- `DELETE /api/<resource>/:id` - Delete

✅ **Database Integration**

- Dynamically creates PostgreSQL tables for each resource
- Field-type enforcement and basic validation
- Stores all resource definitions and user data
- Supports field editing with database migrations

## Technology Stack

**Backend (Node.js/Express)**

- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

## Quick Start

**With Docker (Recommended):**

```bash
# From project root
cp .env.example .env  # Setup environment
docker-compose up -d
# Backend available at http://localhost:3001/api
```

**Manual Setup:**

```bash
cd backend
yarn install
cp .env.example .env
# Edit .env with PostgreSQL connection
npx prisma migrate dev --name init
npx prisma generate
yarn dev
```

## Environment Variables

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rest_api_builder?schema=public
PORT=3001
CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api
```

## API Endpoints

### Resource Definition

```http
POST /api/resources/define-resource
Content-Type: application/json

{
  "name": "book",
  "displayName": "Book Management",
  "description": "A simple book management system",
  "fields": [
    {"name": "title", "type": "STRING"},
    {"name": "author", "type": "STRING"},
    {"name": "pages", "type": "INTEGER"},
    {"name": "published", "type": "BOOLEAN"}
  ]
}
```

### Auto-Generated CRUD Endpoints

After defining a "book" resource, these endpoints are automatically created:

```http
GET    /api/book           # List all books
GET    /api/book/:id       # Get specific book
POST   /api/book           # Create new book
PUT    /api/book/:id       # Update book
DELETE /api/book/:id       # Delete book
```

### Resource Management

```http
GET    /api/resources           # List all resources
GET    /api/resources/:name     # Get specific resource
PUT    /api/resources/:name     # Update resource definition
DELETE /api/resources/:name     # Delete resource
```

## Supported Field Types

| Type       | PostgreSQL Type | Example                |
| ---------- | --------------- | ---------------------- |
| `STRING`   | VARCHAR(255)    | "Hello World"          |
| `INTEGER`  | INTEGER         | 42                     |
| `BOOLEAN`  | BOOLEAN         | true                   |
| `FLOAT`    | DECIMAL(10,2)   | 3.14                   |
| `DATE`     | DATE            | "2024-01-01"           |
| `DATETIME` | TIMESTAMP       | "2024-01-01T10:00:00Z" |
| `TEXT`     | TEXT            | "Long description..."  |
| `JSON`     | JSONB           | {"key": "value"}       |

## Available Scripts

```bash
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server
yarn prisma:generate  # Generate Prisma client
yarn prisma:push      # Push schema to database
yarn prisma:studio    # Open Prisma Studio
```
