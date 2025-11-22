# AI Chat (API + UI)

Full-stack chat assistant with a NestJS backend, Angular frontend, and Ollama for local LLMs. The backend also handles long-term memory with pgvector and seeded personalities/models.

## Repository Layout

- `ai-chat-api/` – NestJS API (TypeORM, pgvector, LLM orchestration)
- `ai-chat-ui/` – Angular app (personality roster, chat UI, theming)

Think of this as a starter: swap in your own models, prompts, traits, and themes to make it whatever you want it to be.

## UI preview

![Personality roster](images/figma/Screenshot-2025-11-22-15-49-56.png)
![Chat view](images/figma/Screenshot-2025-11-22-16-07-33.png)
![Chat with drawer open](images/figma/Screenshot-2025-11-22-16-07-43.png)
![Edit personality](images/figma/Screenshot-2025-11-22-16-08-10.png)

## Prerequisites

- Node.js 18+ and npm
- Docker + Docker Compose (runs Postgres with pgvector; no manual DB setup required)
- [Ollama](https://ollama.com) running locally (`ollama serve`)

Recommended Ollama pulls (match the seeded data):

```
ollama pull fluffy/l3-8b-stheno-v3.2:q8_0
ollama pull dolphin-mistral:latest
ollama pull mistral:latest
ollama pull llama3.1:8b-instruct
ollama pull nomic-embed-text:latest
```

## Backend Setup (NestJS)

From the repo root:

1. Copy env vars and adjust if needed:
   ```
   cd ai-chat-api
   cp .env.example .env
   ```
2. Install deps:
   ```
   npm install
   ```
3. Start the database (pgvector) – Docker handles everything:
   ```
   docker-compose up -d
   ```
4. Seed default users/models/personalities:
   ```
   npm run seed
   ```
5. Run the API:
   ```
   npm run start:dev
   ```
   The API listens on `http://localhost:3000` with CORS enabled and serves static files from `public/`.

## Frontend Setup (Angular)

From the repo root:

```
cd ai-chat-ui
npm install
npm start
```

The app serves at `http://localhost:4200` and talks to the API at `http://localhost:3000`.

## Testing

- Backend unit tests: `cd ai-chat-api && npm test`
- Backend e2e (uses in-memory SQLite): `cd ai-chat-api && npm run test:e2e`
- Frontend tests: `cd ai-chat-ui && npm test`

## Maintenance

- Reset all non-user data (conversations, messages, long-term memory, personalities):

```
POST http://localhost:3000/maintenance/reset
```

## Notes

- Seed data registers model metadata, trait presets, and default personalities so the UI can be used right away after `npm run seed` for the models present in the seeder.

## Features (current state)

- Multiple conversations per personality with a drawer to switch or delete.
- Message feedback (good/bad) is stored but does not yet alter model behavior (WIP).
- Fully local: API, DB, and models run locally; no external calls once dependencies are installed.
- Export conversations for debugging or sharing.
- Reset endpoint to wipe conversations/messages/personas while keeping users intact.
