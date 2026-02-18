# A.E.G.I.S. 

Chat application built with Bun + Hono + MongoDB + Vite.

## Tech Stack

- **Backend:** Bun, Hono, MongoDB, Zod
- **Frontend:** Vite, TypeScript (vanilla)
- **Database:** MongoDB 7
- **Container:** Docker Compose

## Project Structure

```
chat-hono-app/
├── src/
│   ├── domain/
│   │   ├── entities/          # Conversation, Message
│   │   ├── dtos/              # Zod validation schemas
│   │   ├── repositories/      # Repository interfaces
│   │   └── services/          # ConversationService, AiService
│   └── infrastructure/
│       ├── controllers/       # Hono route handlers
│       ├── database/          # MongoDB connection
│       ├── middleware/         # Error handler
│       └── repositories/      # MongoDB repository implementations
├── frontend/
│   └── src/                   # Vite + TypeScript chat UI
├── docker-compose.yml
├── Dockerfile
└── index.ts                   # Entry point
```

## Prerequisites

- [Bun](https://bun.sh/) v1.3+
- [Docker](https://www.docker.com/) and Docker Compose (for containerized run)
- MongoDB 7 (if running locally without Docker)

## Getting Started

### Option 1: Docker Compose (Recommended)

Run all services (backend + frontend + MongoDB) with a single command:

```bash
docker compose up -d
```

- Backend API: http://localhost:3000
- Frontend UI: http://localhost:5173
- MongoDB: localhost:27017

Rebuild after code changes:

```bash
docker compose up -d --build
```

Stop all services:

```bash
docker compose down
```

### Option 2: Local Development

1. Install dependencies:

```bash
bun install
cd frontend && bun install && cd ..
```

2. Start MongoDB (must be running on `localhost:27017`):

```bash
# Using Docker for MongoDB only
docker run -d --name mongo -p 27017:27017 mongo:7
```

3. Start the backend (with hot reload):

```bash
MONGO_URI=mongodb://localhost:27017/chat-app bun run dev
```

4. Start the frontend (in a separate terminal):

```bash
cd frontend
bun run dev
```
## API Endpoints

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/v1/conversations`                  | List conversations       |
| POST   | `/v1/conversations`                  | Create conversation      |
| GET    | `/v1/conversations/:id`              | Get conversation         |
| PATCH  | `/v1/conversations/:id`              | Rename conversation      |
| GET    | `/v1/conversations/:id/messages`     | Get messages (paginated) |
| POST   | `/v1/conversations/:id/messages`     | Send message             |

All list endpoints support `?offset=0&limit=20` query parameters for pagination.

## Running Tests

```bash
bun test
```
