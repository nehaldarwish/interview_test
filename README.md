# Tekkr Full Stack Hiring Challenge

A full-stack LLM-powered chat application built with Fastify, React, React Query, and shadcn/ui.  
The solution focuses on clarity, modularity, and easy extensibility.

## Overview

This project extends the provided starter code to include:

- LLM-based chat responses
- Multi-chat support with persistence
- Inline project plan preview with expandable sections
- Loading states and error handling
- Local storage persistence
- Optional model selector for switching AI providers

The backend uses an easily replaceable LLM service layer, allowing quick integration of OpenAI, Anthropic, or Gemini models.

## Features

### LLM Chat
Messages are sent to the backend and processed by the configured LLM. Responses are rendered in the chat window with proper loading indicators.

### Multi-Chat Management
Users can create new chats, switch between existing ones, and retain all history after reload. The previously opened chat is restored automatically.

### Project Plan Preview
If the LLM returns structured project plan data, the frontend renders an inline preview with collapsible workstreams and deliverables. Previews can appear anywhere within a message.

### Persistence
All chats and metadata are stored in the browser’s local storage.  
Backend storage is in-memory, as required.

### Architecture
- **Frontend:** React, shadcn/ui, React Query  
- **Backend:** Fastify, Node.js  
- **State & Persistence:** Local storage + query caching  
- **LLM Provider:** Abstracted wrapper for interchangeable models

## Setup

### Environment Configuration
Before running the project, create a .env file in the server directory with the following configuration:

  **API Keys**
    OPENAI_API_KEY=

    ANTHROPIC_API_KEY=

    GEMINI_API_KEY=

  **Server Configuration**
    PORT=8000

  **CORS Configuration**
    CORS_ORIGIN=http://localhost:5173

### Backend

cd server

npm install

npm start

### Frontend
cd web

npm install

npm start


Frontend runs on port 3000. Backend runs on port 8000.

## Project Structure

/web React frontend

/server Fastify backend

## Notes
- No database required; in-memory store is used.
- No mobile/responsive requirements.
- No test suite included, per challenge instructions.
