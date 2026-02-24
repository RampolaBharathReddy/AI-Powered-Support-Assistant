AI-Powered-Support-Assistant

A full-stack AI-powered support assistant built using React, Node.js, SQLite, and OpenAI.
The assistant answers user questions strictly based on provided product documentation and maintains session-based conversation history.

Features:-

Chat-based UI (React)

Session handling using localStorage

Conversation history stored in SQLite

Context-aware responses (last 5 message pairs)

Document-based answering (docs.json)

Strict no-hallucination rule

Rate limiting

Error handling & fallback mode

Modern styled chat UI

Tech Stack

Frontend:--

1.React.js

2.Fetch API

Backend:--

1.Node.js

2.Express.js

3.SQLite

OpenAI API (with fallback mode)

Project Structure:--

ai-support-assistant
│
├── backend
│   ├── server.js
│   ├── db.js
│   ├── docs.json
│   ├── package.json
│   └── .env.example
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
└── README.md

Setup Instructions

1.Backend Setup

Navigate to backend:

cd backend
npm install

Create a .env file:

OPENAI_API_KEY

Run server:

node server.js

Backend runs on:

http://localhost:5000

2.Frontend Setup

Navigate to frontend:

cd frontend
npm install
npm start

Frontend runs on:

http://localhost:3000

API Endpoints
POST /api/chat

Request

{
  "sessionId": "abc123",
  "message": "How do I reset my password?"
}

Response

{
  "reply": "Users can reset password from Settings > Security.",
  "contextUsed": 2,
  "tokensUsed": 0
}
GET /api/conversations/:sessionId

Returns full conversation for a session.

GET /api/sessions

Returns all session IDs with last updated timestamp.

Database Schema
sessions
Column	Type
id	TEXT
created_at	DATETIME
updated_at	DATETIME
messages
Column	Type
id	INTEGER (PK)
session_id	TEXT
role	TEXT ("user" / "assistant")
content	TEXT
created_at	DATETIME
Document-Based Answering

The assistant strictly answers using docs.json.

If the answer is not found:

Sorry, I don’t have information about that.

No hallucination is allowed.

Context Handling

Last 5 user + assistant message pairs

Retrieved from SQLite (not in-memory)

Sent along with documentation to the LLM

Fallback Mode

If OpenAI API is unavailable or quota exceeded:

The system switches to rule-based document matching

Ensures the app remains functional

Maintains strict document-only responses

--- END---

