# REST API Generator

A full-stack web application that allows users to dynamically define new resources and automatically generate complete CRUD endpoints with PostgreSQL persistence. This project fulfills the assignment requirements for building a REST API generator within the given timeframe.

## 📋 Assignment Requirements Fulfilled

✅ **Frontend (React-based)**

- Resource Creator Form with multiple field type support
- API Explorer showing all resources and available endpoints
- Direct endpoint testing interface (GET, POST, PUT, DELETE)
- Resource editing interface with field management

✅ **Backend (Node.js/Express)**

- `POST /define-resource` endpoint for resource definitions
- Auto-generated CRUD endpoints: `/api/<resource>`, `/api/<resource>/:id`
- Dynamic PostgreSQL table creation for each resource
- Field-type enforcement and basic validation
- Resource definition and data persistence

✅ **Database (PostgreSQL)**

- All data stored in PostgreSQL (no in-memory storage)
- Dynamic table creation and management
- Support for field editing with automatic DB migrations

✅ **Additional Requirements**

- Docker support with docker-compose.yml
- Complete setup and run instructions
- Sample API calls documentation
- Usable via UI without code changes

## 🛠 Technology Stack

**Frontend (React-based)**

- Next.js 15 (React framework)
- TypeScript
- Tailwind CSS
- Lucide React (icons)

**Backend (Node.js/Express)**

- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

**DevOps**

- Docker & Docker Compose
- Prisma Migrate

## 🚀 Quick Start (Docker - Recommended)

1. **Clone and setup environment**

   ```bash
   git clone <repository-url>
   cd rest-api-builder

   # Setup environment variables
   cp backend/.env.example backend/.env
   # Edit backend/.env file if needed (default values work for Docker)
   ```

2. **Start all services**

   ```bash
   # Start all services (PostgreSQL, backend, frontend)
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - Health Check: http://localhost:3001/health

The application will automatically:

- Set up PostgreSQL database
- Run database migrations
- Start the React frontend
- Start the Node.js/Express backend

## 💻 Manual Setup (Alternative)

If you prefer running without Docker:

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- yarn or npm

### Backend Setup

```bash
cd backend
yarn install
cp .env.example .env
# Edit .env with your PostgreSQL connection
npx prisma migrate dev --name init
npx prisma generate
yarn dev
```

### Frontend Setup

```bash
cd frontend
yarn install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
yarn dev
```

## 🗄️ PostgreSQL Configuration

**Default Database Settings:**

```
Host: localhost (postgres service in Docker)
Port: 5432
Database: rest_api_builder
Username: postgres
Password: postgres
```

**Environment Variables:**

```bash
# Backend (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rest_api_builder?schema=public
PORT=3001
CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📝 Sample API Calls

### 1. Define a New Resource

```bash
curl -X POST http://localhost:3001/api/resources/define-resource \
  -H "Content-Type: application/json" \
  -d '{
    "name": "book",
    "displayName": "Book Management",
    "fields": [
      {"name": "title", "type": "STRING"},
      {"name": "author", "type": "STRING"},
      {"name": "pages", "type": "INTEGER"},
      {"name": "published", "type": "BOOLEAN"}
    ]
  }'
```

### 2. Auto-Generated Endpoints

After creating the "book" resource, these endpoints are automatically available:

- `GET /api/book` - List all books
- `GET /api/book/:id` - Get specific book
- `POST /api/book` - Create new book
- `PUT /api/book/:id` - Update book
- `DELETE /api/book/:id` - Delete book

### 3. Use the Generated API

```bash
# Create a book
curl -X POST http://localhost:3001/api/book \
  -H "Content-Type: application/json" \
  -d '{"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "pages": 180, "published": true}'

# Get all books
curl http://localhost:3001/api/book

# Get specific book
curl http://localhost:3001/api/book/1

# Update book
curl -X PUT http://localhost:3001/api/book/1 \
  -H "Content-Type: application/json" \
  -d '{"pages": 190}'

# Delete book
curl -X DELETE http://localhost:3001/api/book/1
```

## 📊 Supported Field Types

| Type       | Description                  | Example                |
| ---------- | ---------------------------- | ---------------------- |
| `STRING`   | Text field (up to 255 chars) | "John Doe"             |
| `INTEGER`  | Whole numbers                | 42                     |
| `BOOLEAN`  | True/false values            | true                   |
| `FLOAT`    | Decimal numbers              | 3.14                   |
| `DATE`     | Date only                    | "2024-01-01"           |
| `DATETIME` | Date and time                | "2024-01-01T10:00:00Z" |
| `TEXT`     | Long text content            | "Description..."       |
| `JSON`     | JSON objects                 | {"key": "value"}       |

**Field Features:**

- Multiple field types support
- Field editing with automatic database migrations
- Dynamic table schema updates
- Type validation and enforcement

## 🔧 Key Features

### Frontend (React-based)

- **Resource Creator Form**: Input resource name, add/remove fields with 8 different types
- **API Explorer**: Lists all defined resources with available endpoints
- **Direct Testing**: Test GET, POST, PUT, DELETE endpoints directly from the UI
- **Resource Editing**: Edit existing resources with field addition/removal

### Backend (Node.js/Express)

- **Resource Definition**: `POST /define-resource` endpoint
- **Auto-Generated CRUD**: Complete set of endpoints for each resource
- **Dynamic Tables**: PostgreSQL tables created automatically for each resource
- **Field Validation**: Type enforcement and constraint validation
- **Schema Migrations**: Support for editing fields after resource creation

### Database (PostgreSQL)

- All resource definitions and data stored in PostgreSQL
- Dynamic table creation and management
- Automatic schema migrations for field changes

## ✅ Assignment Compliance

This implementation meets all the specified requirements:

- ✅ React-based frontend with resource creator and API explorer
- ✅ Node.js/Express backend with auto-generated endpoints
- ✅ PostgreSQL-only data storage (no in-memory or SQLite)
- ✅ Docker support with docker-compose.yml
- ✅ Field editing with database migrations
- ✅ Complete setup instructions and sample API calls
- ✅ Fully functional via UI without code changes

## 🐞 Troubleshooting

**Check Services:**

```bash
# Health check
curl http://localhost:3001/health

# View logs
docker-compose logs -f

# Database connection
docker-compose exec postgres psql -U postgres -d rest_api_builder -c "\\dt"
```

**Common Issues:**

- Ensure Docker is running
- Check ports 3000, 3001, 5432 are available
- Verify PostgreSQL is accessible
