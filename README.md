# Spur Agent — AI Live Chat Support

Spur Agent is a full-stack AI customer support chat agent. Users can ask questions about **SpurStore** and receive instant replies from an AI assistant powered by Claude.

Conversations are persisted across sessions, allowing users to continue their support chat without losing previous context.

---

## Tech Stack

**Backend:** NestJS, PostgreSQL, Claude API
**Frontend:** React, Vite, Tailwind CSS

---

## Project Structure

```bash
spur-agent/
├── backend/       # NestJS API
├── frontend/      # React + Vite app
└── README.md
```

---

## Running Locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
createdb spur_agent
npm run start:dev
```

The backend runs at:

```bash
http://localhost:3000
```

---

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs at:

```bash
http://localhost:5173
```

---

## Architecture

```bash
React Frontend
     ↓
NestJS Controller
     ↓
Chat Service
     ↓
LLM Service 
     ↓
Claude API

PostgreSQL stores conversation history
```

### Request Flow

1. User sends a message from the React frontend.
2. The request reaches the NestJS chat controller.
3. The chat service fetches the existing session conversation history.
4. The message and previous context are passed to Claude.
5. Claude generates a support response.
6. The conversation is saved in PostgreSQL.
7. The AI response is returned to the frontend.

---

## Key Features

* AI-powered customer support chat for SpurStore
* Claude API integration
* Session-based conversation history
* Persistent conversations using PostgreSQL
* Clean separation between chat logic and LLM logic
* Swappable LLM provider architecture
* Input validation using class-validator DTOs
* Graceful error handling for LLM failures
* React + Vite frontend with Tailwind CSS

---

## Backend Design

The backend is built with NestJS and follows a modular service-based architecture.

### Main Responsibilities

* Handle incoming chat requests
* Validate user input
* Manage chat sessions
* Store and retrieve conversation history
* Communicate with Claude through a dedicated LLM service
* Return AI-generated responses to the frontend

The LLM logic is isolated in its own service, making it easier to replace Claude with another AI provider in the future.

---

## Frontend Design

The frontend is built using React, Vite, and Tailwind CSS.

### Main Responsibilities

* Provide a simple chat interface
* Send user messages to the backend
* Display AI responses
* Maintain session-based chat continuity
* Show loading and error states clearly

---

## Trade-offs

Some trade-offs were made to keep the project focused and simple for the first version:

* Used `synchronize: true` during development instead of TypeORM migrations
* Conversation history is fetched from PostgreSQL instead of being cached
* Claude responses are returned after completion instead of streamed
* Rate limiting is not yet implemented on the chat endpoint
* Automated tests are not included in the current version

---

## If I Had More Time

If I had more time, I would improve the project by adding:

* TypeORM migrations instead of using `synchronize: true`
* Redis caching for faster conversation history retrieval
* Claude streaming responses using Server-Sent Events
* Rate limiting on the chat endpoint
* Unit tests for services
* End-to-end tests for the chat flow
* Better admin controls for managing support knowledge
* Authentication for user-specific chat history

---

## Summary

Spur Agent is a full-stack AI support chat application built with NestJS, PostgreSQL, React, and Claude. It demonstrates how an AI agent can be integrated into a customer support flow with persistent conversation history, clean backend architecture, and a simple user-facing chat interface.
