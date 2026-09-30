# Masal AI LeadPilot

AI-powered lead prioritization and sales assistance platform built for real-estate sales teams.

LeadPilot converts inbound customer enquiries into structured leads, analyzes buying intent using AI, assigns a lead score and priority, and provides a lead-specific Copilot and AI Follow-Up Planner to help salespeople decide what to do next.

---

## 🚀 Live Application

**Frontend:**
https://masal-ai-leadpilot.vercel.app

**Backend API:**
https://leadpilot-backend-ite9.onrender.com

**API Documentation:**
https://leadpilot-backend-ite9.onrender.com/docs

---

## 🎯 Problem

Sales teams often receive many inbound enquiries but lack a consistent way to determine:

* Which leads require immediate attention
* How serious a prospect is
* What the customer's actual requirements are
* What objections or missing information need to be addressed
* What the salesperson should do next
* How and when to follow up
* What questions should be asked during qualification

LeadPilot addresses this by combining structured lead management with AI-powered analysis and sales assistance.

---

## ✨ Features

### 1. Lead Intake

Salespeople can create and store leads with information such as:

* Customer name
* Location
* Property requirements
* Budget
* Purchase timeline
* Inbound customer message

---

### 2. Multiple Saved Leads

The dashboard provides a centralized view of saved leads and their current priority.

Each lead displays relevant information including:

* Lead name
* Location
* Requirements
* Budget
* Timeline
* AI score
* Priority

---

### 3. AI Lead Analysis

LeadPilot uses Gemini to analyze each lead and generate:

* Lead score
* Priority classification
* Customer requirements
* Potential objections or concerns
* Recommended sales action
* Suggested response

The scoring system categorizes leads into:

* **HOT**
* **WARM**
* **COLD**

The classification is based on the information available for the individual lead.

---

### 4. Lead-Specific AI Copilot

Each lead has a dedicated Copilot.

The Copilot receives the selected lead's relevant context, including:

* Customer profile
* Requirements
* Budget
* Timeline
* Lead score
* Priority
* AI analysis

It can then answer salesperson questions in the context of that specific lead.

For example:

> "What should I ask this lead before scheduling a site visit?"

The response is generated based on the selected customer's context rather than functioning as a generic chatbot.

---

### 5. AI Follow-Up Planner

**Original Feature**

The Follow-Up Planner recommends the next appropriate sales follow-up based on the lead's context.

It generates:

* Recommended communication channel
* Suggested follow-up timing
* Tactical rationale
* Tailored outreach message
* Exactly three qualification questions

The planner adapts its strategy according to lead intent.

For example, an urgent 30-day buyer can receive a more action-oriented follow-up, while a 6–12 month prospect can receive a lower-pressure nurturing approach.

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      Salesperson     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React + Vite UI    │
                    │       Vercel         │
                    └──────────┬───────────┘
                               │ HTTPS / REST API
                               ▼
                    ┌──────────────────────┐
                    │     FastAPI API      │
                    │       Render         │
                    └───────┬───────┬──────┘
                            │       │
                    ┌───────▼───┐   │
                    │  SQLite   │   │
                    │ Database  │   │
                    └───────────┘   │
                                    ▼
                           ┌─────────────────┐
                           │   Gemini API    │
                           │  AI Analysis &  │
                           │     Copilot     │
                           └─────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Python
* FastAPI
* Pydantic
* SQLite

### AI

* Google Gemini API
* `google-genai` Python SDK

### Deployment

* Vercel — frontend
* Render — backend

### Version Control

* Git
* GitHub

---

## 🤖 AI Model & Integration

LeadPilot uses the Google Gemini API through the official `google-genai` Python SDK.

The backend uses:

```text
Primary Model:
gemini-3.8-flash

Fallback Model:
gemini-3.5-flash-lite
```

The Gemini API key is stored only on the backend as an environment variable.

The frontend never receives or exposes the Gemini API key.

---

## 🔄 How AI Is Called

The frontend communicates with the FastAPI backend through REST endpoints.

The general flow is:

```text
User selects lead
       ↓
Frontend sends request
       ↓
FastAPI receives request
       ↓
Backend retrieves lead context
       ↓
Backend builds AI prompt
       ↓
Gemini generates response
       ↓
Backend validates/structures response
       ↓
Frontend displays result
```

AI is used for:

1. Lead analysis
2. Lead scoring and priority classification
3. Suggested sales responses
4. Lead-specific Copilot conversations
5. Follow-Up Planner recommendations

---

## 🔌 API Endpoints

| Method | Endpoint              | Purpose                       |
| ------ | --------------------- | ----------------------------- |
| GET    | `/leads`              | Retrieve saved leads          |
| GET    | `/leads/{id}`         | Retrieve a specific lead      |
| POST   | `/leads`              | Create a new lead             |
| POST   | `/leads/{id}/analyze` | Run AI analysis               |
| POST   | `/leads/{id}/chat`    | Ask the lead-specific Copilot |
| DELETE | `/leads/{id}`         | Delete a lead                 |

Interactive API documentation is available through FastAPI's `/docs` endpoint.

---

## 💻 Local Setup

### Prerequisites

* Python 3.10+
* Node.js
* npm
* Gemini API key

---

### 1. Clone the repository

```bash
git clone https://github.com/rishi232/masal-ai-leadpilot.git
cd masal-ai-leadpilot
```

---

### 2. Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
DATABASE_URL=sqlite:///./leadpilot.db
ALLOWED_ORIGINS=http://localhost:5173
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

Open a second terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend

| Variable                | Purpose                    |
| ----------------------- | -------------------------- |
| `GEMINI_API_KEY`        | Gemini API authentication  |
| `GEMINI_MODEL`          | Primary Gemini model       |
| `GEMINI_FALLBACK_MODEL` | Fallback Gemini model      |
| `DATABASE_URL`          | SQLite database connection |
| `ALLOWED_ORIGINS`       | Allowed frontend origins   |

### Frontend

| Variable       | Purpose                         |
| -------------- | ------------------------------- |
| `VITE_API_URL` | Base URL of the FastAPI backend |

**Never commit `.env` files or API keys to GitHub.**

---

## 🧠 Technical Decisions

### Why FastAPI?

FastAPI provides a lightweight Python API layer and integrates naturally with Python-based AI services.

### Why SQLite?

SQLite keeps the prototype simple and removes the need for a separate database server during development.

### Why Gemini?

Gemini provides the generative AI capabilities required for contextual lead analysis, sales assistance, and follow-up generation.

### Why separate AI logic from API routes?

AI functionality is isolated into backend service/prompt modules so that API routes remain focused on request handling while AI behavior can be modified independently.

### Why use a lead-specific Copilot?

A general chatbot would not know which customer the salesperson is currently handling. LeadPilot passes the selected lead's context into the Copilot so that responses are grounded in that particular customer.

---

## 🛡️ AI Reliability & Error Handling

The backend includes handling for common AI service failures.

The application:

* Uses a primary and fallback Gemini model
* Handles API quota errors
* Handles unavailable AI services
* Validates AI-generated structured responses
* Sanitizes backend errors before returning them
* Clamps generated scores to the expected scoring range
* Ensures priority classifications remain within HOT/WARM/COLD

If the AI service is temporarily unavailable or quota is exhausted, the application can return a controlled error instead of exposing raw provider errors to the user.

---

## ⚠️ Known Limitations

### SQLite Persistence

The current deployment uses SQLite on the Render web service.

This is suitable for the assignment prototype, but SQLite storage on an ephemeral free deployment should not be treated as production-grade persistent storage. A production system should use a managed database such as PostgreSQL.

### Property Inventory

LeadPilot does not currently maintain a live real-estate property inventory.

Therefore, the AI assistant should not claim that a specific property is available unless such inventory data is actually provided.

### AI-Generated Content

AI responses are generated from the information available in the lead record and may require salesperson verification before being sent to customers.

### No Live CRM Integration

The current prototype stores leads within its own database and does not yet integrate with an external CRM.

---

## 📊 Example Lead Prioritization

The prototype can distinguish between leads with different buying timelines.

| Lead         | Score | Priority | Timeline    |
| ------------ | ----: | -------- | ----------- |
| Rahul Sharma |    90 | HOT      | 30 days     |
| Priya        |    85 | HOT      | ~3 months   |
| Aman Gupta   |    50 | WARM     | 6–12 months |

The purpose of the score is to help salespeople prioritize their workflow based on the information available for each lead.

---

## 🎥 Demonstration Flow

A typical LeadPilot demonstration follows this sequence:

```text
Create Lead
     ↓
Save Lead
     ↓
AI Analysis
     ↓
Score + Priority
     ↓
Requirements + Objections
     ↓
Recommended Action
     ↓
Suggested Response
     ↓
Open Lead Copilot
     ↓
Ask Contextual Question
     ↓
Follow-Up Planner
     ↓
Recommended Channel + Timing
     ↓
Outreach Message + 3 Questions
```

---

## 📁 Project Structure

```text
masal-ai-leadpilot/
│
├── backend/
│   ├── main.py
│   ├── ai_service.py
│   ├── prompts.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalysisPanel.jsx
│   │   │   ├── Copilot.jsx
│   │   │   ├── FollowUpPlanner.jsx
│   │   │   ├── LeadCard.jsx
│   │   │   └── LeadForm.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── LeadDetails.jsx
│   │   │
│   │   └── services/
│   │       └── api.js
│   │
│   ├── package.json
│   └── vite.config.js
│
├── render.yaml
├── .gitignore
└── README.md
```

---

## 🔒 AI Usage Disclosure

AI tools were used during development to assist with implementation, debugging, prompt refinement, documentation, and development workflow.

The core application concept, lead prioritization workflow, lead-specific Copilot, Follow-Up Planner feature, application architecture, integration decisions, testing, and deployment configuration were developed and validated as part of this project.

AI-generated outputs in the application are treated as assistance for salespeople and should be reviewed before being used for customer communication.

---

## 👨‍💻 Project

**Masal AI LeadPilot**

An AI-assisted lead prioritization and sales enablement platform designed to help salespeople understand customer intent, prioritize leads, and determine the next best follow-up action.

