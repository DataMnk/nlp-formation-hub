# Formation Hub  
### Full-Stack NLP Application with RAG, Supabase & Edge Functions

Formation Hub is a production-ready full-stack NLP application that combines secure authentication, role-based access control, vector search with pgvector, Supabase Edge Functions, and a Retrieval-Augmented Generation (RAG) chatbot.

The application is deployed live and designed to demonstrate modern AI-native architecture patterns using a clean, scalable stack.

---

## Live Application

https://whimsical-salamander-0c7593.netlify.app/

---

## Demo

<!-- Replace demo.gif with your final recording -->

![App Demo](demo.gif)

---

## Overview

Formation Hub is built around a secure, role-aware system where users authenticate via Supabase, manage editable profiles, and interact with a vector-powered RAG chatbot.

The architecture separates concerns cleanly:

- Frontend handles UI, routing, and client state.
- Supabase manages authentication, database, RLS, and Edge Functions.
- pgvector enables semantic search over embedded documents.
- Edge Functions securely handle embedding generation and RAG orchestration.
- The chatbot retrieves relevant context before generating answers.

This ensures responses are contextual, grounded, and not generic LLM outputs.

---

## Core Capabilities

### Secure Authentication & Role-Based Access

- Email/password authentication using Supabase Auth
- Persistent session management
- Role-based routing (`admin` and `member`)
- Conditional dashboards based on role
- Row Level Security enforcing data isolation

---

### Editable User Profiles

Each authenticated user can:

- View and update profile information
- Persist changes to the database
- Refresh and retain updates
- Access only their own data under RLS policies

---

### Database Architecture (Supabase + PostgreSQL)

Key tables include:

- `profiles`
- `documents`
- `letter_chunks` (vectorized embeddings)
- `chat_history`

Features:

- Foreign key relationships
- Row Level Security policies
- pgvector extension enabled
- Secure data ownership rules

---

### Vector Search & RAG Pipeline

The RAG system follows this flow:

1. Documents are ingested and chunked.
2. Embeddings are generated via Edge Function.
3. Vectors are stored using pgvector.
4. User query triggers similarity search (top-k retrieval).
5. Relevant chunks are injected into LLM prompt.
6. LLM generates contextual response.
7. Chat history is displayed (and optionally stored).

This ensures answers are grounded in the knowledge base.

---

### Supabase Edge Functions

Deployed Edge Functions:

- `ingest-letters`  
  Handles document chunking and embedding generation.

- `rag-chat`  
  Performs similarity search and context-aware response generation.

Secrets are stored securely using Supabase environment variables and are never exposed to the frontend.

---

### Modern UI Layer

The interface integrates advanced UI components from:

- 21st.dev
- ReactBits

Components are fully integrated into workflows and provide:

- Interactive dashboards
- Styled authentication flows
- Enhanced chat UI
- Modern navigation patterns
- Animated or elevated visual components

The design prioritizes clarity, structure, and production polish.

---

## Tech Stack

**Frontend**
- React (Vite + TypeScript)
- React Router
- Tailwind CSS
- 21st.dev / ReactBits components

**Backend**
- Supabase (Auth + PostgreSQL + Edge Functions)

**AI & Search**
- pgvector
- Embeddings via Edge Function
- Contextual LLM responses

**Deployment**
- Netlify (CI/CD via GitHub)

---

## Environment Variables

The following variables are required for local development and deployment:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Edge Function secrets are stored in Supabase project settings.

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/DataMnk/nlp-formation-hub.git
cd nlp-formation-hub
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

---

## Deployment

The application is deployed via Netlify with continuous deployment enabled from the `main` branch.

Any push to `main` triggers an automatic production build.

---

## Architectural Notes

- Authentication state persists across refresh.
- RLS ensures users cannot access other users’ records.
- Vector similarity search uses cosine distance.
- Embeddings are generated server-side via Edge Functions.
- The application is structured for extensibility and modular growth.

---

## License

This project is for academic and research demonstration purposes.
