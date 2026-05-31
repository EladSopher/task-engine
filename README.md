# Task Engineering Engine

A high-performance full-stack task management monorepo designed with a decoupled architectural framework. The system separates client presentation from server-side business logic, enabling independent development, testing, and deployment of each layer while maintaining a clear API contract between them.

---

## Key Features

| Capability | Description |
|---|---|
| **Async architecture** | Non-blocking Express controllers with `async/await` Prisma operations for scalable request handling |
| **Real-time logging middleware** | Global request logger captures HTTP method, URL path, and ISO timestamp on every inbound request |
| **Automated Jest integration testing** | Supertest-powered API tests validate creation, validation, and pagination behavior against a live Express instance |
| **Prisma ORM data persistence** | Type-safe database access with SQLite, schema migrations, and UUID primary keys |
| **Dynamic frontend controls** | Vanilla JS dashboard with status filtering, paginated task lists, and resilient error handling when the API is offline |

---

## Repository Structure

```
task-engine-backend/
├── backend/                  # Node.js / Express API
│   ├── prisma/               # Schema, migrations, SQLite database
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middlewares/      # Logger and cross-cutting concerns
│   │   ├── models/           # Prisma data-access layer
│   │   ├── routes/           # Express route definitions
│   │   ├── app.js            # Express application (exported for tests)
│   │   └── server.js         # HTTP server entry point
│   └── tests/                # Jest integration test suite
└── frontend/                 # Static client dashboard
    ├── index.html
    └── app.js
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND CLIENT                                 │
│              (frontend/index.html + app.js)                             │
│                                                                         │
│   • Task creation form          • Status filter dropdown                │
│   • Paginated task cards        • fetch() → http://localhost:5000       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    │  HTTP (CORS-enabled)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS ROUTING LAYER                              │
│                         (src/routes/)                                   │
│                                                                         │
│   GET  /health                                                          │
│   GET  /api/tasks          POST /api/tasks                              │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MIDDLEWARE STACK                                │
│                                                                         │
│   cors()  →  logger  →  express.json()                                  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTROLLERS                                    │
│                      (src/controllers/)                                 │
│                                                                         │
│   createTask()          getAllTasks()                                     │
│   • Validates payload   • Parses page / limit / status query params       │
│   • Returns 201/400     • Returns 200 with filtered, paginated results  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODEL / DATA ACCESS                               │
│                        (src/models/)                                    │
│                                                                         │
│   prisma.task.create()          prisma.task.findMany()                  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRISMA ORM  →  SQLite                                │
│                      (prisma/dev.db)                                    │
│                                                                         │
│   Task { id, title, description, status, createdAt }                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Contract

Base URL: `http://localhost:5000`

### `GET /health`

System status check.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |
| **Success** | `200 OK` |

**Response body**

```json
{ "status": "ok" }
```

---

### `GET /api/tasks`

Retrieve a paginated, optionally filtered list of tasks.

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | None |
| **Success** | `200 OK` |

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-indexed). Offset is calculated as `(page - 1) × limit`. |
| `limit` | integer | `10` | Maximum number of tasks returned per page. |
| `status` | string | *(none)* | Optional filter. When provided, only tasks matching the status are returned (e.g. `pending`, `completed`). |

**Example request**

```
GET /api/tasks?page=1&limit=5&status=pending
```

**Example response**

```json
[
  {
    "id": "282ff51d-af4d-4269-8b8a-852b735a46e5",
    "title": "Review pull request",
    "description": "Check API changes before merge",
    "status": "pending",
    "createdAt": "2026-05-31T14:25:49.186Z"
  }
]
```

---

### `POST /api/tasks`

Create a new task.

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | None |
| **Content-Type** | `application/json` |
| **Success** | `201 Created` |
| **Validation error** | `400 Bad Request` |

**Request body**

| Field | Type | Required | Default | Rules |
|---|---|---|---|---|
| `title` | string | **Yes** | — | Must be present and non-empty. Returns `400` if missing. |
| `description` | string | No | `null` | Optional free-text description. |
| `status` | string | No | `"pending"` | Set automatically by the server on creation. Not accepted from the client payload. |

**Example request**

```json
{
  "title": "Deploy staging environment",
  "description": "Run migration and smoke tests"
}
```

**Example success response** (`201`)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Deploy staging environment",
  "description": "Run migration and smoke tests",
  "status": "pending",
  "createdAt": "2026-05-31T14:30:00.000Z"
}
```

**Example error response** (`400`)

```json
{ "error": "Title is required" }
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (if one does not already exist):

```env
DATABASE_URL="file:./dev.db"
```

Apply database migrations and generate the Prisma client:

```bash
npx prisma migrate dev
```

Start the development server with hot reload:

```bash
npm run dev
```

The API listens on **port 5000** by default. You should see:

```
Server listening on port 5000
```

> **Note:** If the port is already in use, stop the conflicting process or set a different port in `.env` (e.g. `PORT=5001`).

### Frontend Setup

With the backend running, open the dashboard in your browser:

```
frontend/index.html
```

You can open the file directly from your file explorer, or serve it locally:

```bash
cd frontend
npx serve .
```

The client communicates with the API at `http://localhost:5000` and displays connection status, task cards, status filters, and pagination controls.

---

## Automation Testing Suite

Integration tests live in `backend/tests/` and run against the exported Express app (no live server port required).

From the `backend/` directory:

```bash
npm test
```

This executes Jest with Supertest and validates:

- `POST /api/tasks` returns `201` with valid payload
- `POST /api/tasks` returns `400` when `title` is missing
- `GET /api/tasks` pagination returns the correct number of limited items

For verbose output:

```bash
npx jest --verbose
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **API** | Node.js, Express 5, CORS |
| **Database** | SQLite, Prisma ORM |
| **Testing** | Jest, Supertest |
| **Frontend** | HTML, Tailwind CSS (CDN), Vanilla JavaScript |
| **Dev tooling** | nodemon, dotenv |

---

## License

ISC
