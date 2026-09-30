# LeadPilot AI

An AI-powered inbound lead qualification and sales execution web application built specifically for real-estate sales teams. LeadPilot AI analyzes customer inquiries, scores deal urgency, extracts key requirements and objections, generates ready-to-send responses, provides a strategic **Follow-Up Planner**, and offers an interactive **Lead Copilot** grounded strictly to each lead's profile.

---

## Overview

Real estate sales teams are inundated with unstructured inbound inquiries across WhatsApp, email, property portals, and phone calls. Sales representatives waste critical hours attempting to discern serious homebuyers from casual window-shoppers, drafting generic replies, and losing high-intent prospects to delayed follow-ups.

**LeadPilot AI** solves this by instantly transforming raw customer messages into structured sales intelligence:
1. **Instant Prioritization**: Automated heuristic scoring (0–100) and priority triage (`HOT`, `WARM`, `COLD`) based on timeline urgency, budget clarity, and requirement specificity.
2. **Actionable Insights**: Executive summary, buyer intent classification, verified requirements, and potential deal blockers/objections.
3. **Strategic Outreach**: Ready-to-send customer messaging and a dedicated **Follow-Up Planner** detailing optimal channel, timing, tactical rationale, and qualification questions.
4. **Deal Copilot**: A context-bounded AI assistant for real-time advice on call objection handling, negotiation angles, and message drafting.

---

## Features

- **Inbound Lead Intake**: Form capturing customer name, target location, property requirement, budget, buying timeline, and raw inbound message.
- **Priority Dashboard**: Live overview of total pipeline volume and breakdown of `HOT` (score &ge; 75), `WARM` (45–74), and `COLD` (< 45) leads with recommended action snippets.
- **Structured AI Lead Analysis**: Real-time extraction of executive summary, intent, key requirements list, objections list, recommended next action, and suggested response.
- **Follow-Up Planner (Original Feature)**: Channel recommendation (`WhatsApp`, `Call`, `Email`, `SMS`), target timing, tactical reasoning, copyable outreach draft, and 3 crucial qualification questions for the next touchpoint.
- **Lead-Specific AI Copilot**: Grounded conversational assistant with 1-click suggestion chips ("What should I emphasize on the call?", "Make my reply more assertive.", "What is the biggest objection?", "Give me 3 qualification questions.", "What information is missing from this lead?").
- **Robust Failure Resilience**: If an AI request fails or quota is exhausted, lead data is never lost, and users can re-run analysis on demand.

---

## Product Workflow

```
+-------------------------------------------------------------------------------+
|                             PRODUCT WORKFLOW                                  |
+-------------------------------------------------------------------------------+

  [ Customer Inbound Inquiry ]
              |
              v
  [ Salesperson Enters Lead ] --------> [ SQLite Database (backend/leadpilot.db) ]
  (Name, Location, Budget,             (Lead saved with status 201 Created)
   Requirement, Timeline, Msg)                          |
              |                                         |
              v                                         |
  [ AI Analysis Triggered ]                             |
  (POST /leads/{id}/analyze)                            |
              |                                         |
              v                                         |
  [ Google Gemini API (gemini-1.5-flash) ]              |
  - Enforced JSON schema output                         |
  - Validated by Pydantic server-side                   |
              |                                         |
              v                                         |
  [ Enriched Lead Record Saved ] <----------------------+
  (score, priority, analysis, follow_up_plan)
              |
              v
  +-------------------------------------------------------------------------+
  |                        SALESPERSON WORKSPACE                            |
  |                                                                         |
  |  1. Dashboard View:                                                     |
  |     - Priority Stats (HOT / WARM / COLD)                                |
  |     - Ranked cards sorted by score DESC, then created_at DESC           |
  |                                                                         |
  |  2. Lead Details View:                                                  |
  |     - Raw Inbound Message & Buyer Specifications                        |
  |     - AI Sales Assessment (Summary, Intent, Objections)                 |
  |     - Follow-Up Planner (Channel, Timing, Outreach Draft, 3 Questions)  |
  |     - Grounded AI Copilot (Context-aware sales advisory)                |
  +-------------------------------------------------------------------------+
```

---

## Architecture

```
+-------------------------------------------------------------------------------+
|                            SYSTEM ARCHITECTURE                                |
+-------------------------------------------------------------------------------+

   [ Web Browser (Desktop / Mobile) ]
                  |
                  |  HTTP / REST (JSON)
                  v
   [ Frontend: React + Vite + React Router ]
   * Single-page architecture with plain CSS design system
   * Client-side routing: / (Dashboard), /leads/:id (LeadDetails)
   * API abstraction layer: frontend/src/services/api.js
   * Deployed on Vercel
                  |
                  |  CORS-allowed API Requests (ALLOWED_ORIGINS)
                  v
   [ Backend: FastAPI (Python 3.10+) ]
   * main.py: REST endpoints (/health, /leads, /leads/{id}/analyze, /chat)
   * database.py: SQLAlchemy Engine & Session management
   * models.py: Lead ORM entity
   * schemas.py: Pydantic schemas with strict validation
   * ai_service.py: Gemini API caller with auto-retry and sanitization
   * prompts.py: Grounded system instructions & schema templates
   * Deployed on Render (Web Service)
        |                                       |
        | SQLAlchemy ORM                        | google-generativeai SDK
        v                                       v
   [ SQLite Database ]                 [ Google Gemini API ]
   (leadpilot.db)                      (gemini-1.5-flash)
```

---

## Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Language**: JavaScript (ES Modules, JSX)
- **Styling**: Vanilla CSS (`index.css`) with clean card layouts, responsive CSS grid, and tailored priority palettes (no heavy CSS frameworks)
- **Routing**: `react-router-dom` (v6)

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn (ASGI)
- **ORM / Database**: SQLAlchemy with SQLite (`leadpilot.db`)
- **Validation**: Pydantic v2 schemas
- **Environment**: `python-dotenv`

### Artificial Intelligence
- **SDK**: Official `google-generativeai` Python SDK
- **Model**: `gemini-1.5-flash` (or configurable to `gemini-2.0-flash` via `GEMINI_MODEL`)
- **Output Control**: Enforced JSON via `response_mime_type="application/json"` and strict server-side Pydantic validation

---

## AI Integration

- **Model Selection**: `gemini-1.5-flash` is chosen for its sub-second latency, robust instruction-following capabilities, generous free-tier limits, and native JSON mode support.
- **SDK**: Directly invokes the official `google-generativeai` Python SDK without intermediate framework bloat (no LangChain or LlamaIndex).
- **Security & Privacy**: The Gemini API key is **strictly stored in backend environment variables**. The frontend never touches or exposes API keys. Error handlers redact API tokens using regex to prevent leakage into client responses or server logs.
- **Deterministic Validation**: Analysis outputs use `response_mime_type="application/json"`. The backend validates the response against `AnalysisResultSchema`. If validation fails, the service performs an automated retry before returning a clean 502 error.

---

## How AI Analysis Works

1. **Intake & Context Assembly**: When `POST /leads/{id}/analyze` is invoked, the backend retrieves all stored customer details (name, location, property requirement, budget, buying timeline, message).
2. **System Prompt Grounding**: The model is instructed as an expert real-estate sales copilot and is explicitly forbidden from hallucinating property availability, prices, or commitments not present in the lead.
3. **Structured Inference**: Gemini processes the data and outputs:
   - `lead_score`: 0–100 integer.
   - `priority`: `HOT` (&ge; 75), `WARM` (45–74), or `COLD` (< 45).
   - `summary`: Concise 2-3 sentence deal summary.
   - `intent`: Short classification (e.g., "High purchase intent", "Exploring options").
   - `key_requirements`: List of explicit customer desires.
   - `objections`: List of anticipated deal risks, missing info, or blockers.
   - `recommended_action`: Immediate next step.
   - `suggested_response`: Drafted message ready to send to the buyer.
   - `follow_up_plan`: Channel, timing, rationale, outreach message, and 3 qualification questions.
4. **Persistence & Refresh**: The score, priority, analysis JSON, and follow-up plan are saved to the SQLite database and returned to the client.

---

## Lead Prioritization

> [!IMPORTANT]
> **Priority Signal Disclaimer**: The lead score (0–100) and priority badges (`HOT`, `WARM`, `COLD`) are **AI-generated heuristic prioritization signals**, NOT a machine-learning conversion prediction or probability of purchase.

Scoring heuristic logic instructed in the prompt:
- **Timeline Urgency**: Buyers needing homes "Immediately" or "Within 30 days" receive high score weighting, while "Just exploring" or "6+ months" receive lower score weighting.
- **Budget Clarity**: Concrete budgets (e.g., "₹80 Lakhs", "INR 3.5 Crore") score higher than vague indicators.
- **Requirement Specificity**: Explicit configurations (e.g., "3 BHK near Metro Sector 62 with parking") indicate high commitment compared to ambiguous requests.
- **Objections & Risks**: Presence of severe constraints (unrealistic budget for location, unclear financing) adjusts score downward.

---

## Follow-Up Planner

The **Follow-Up Planner** is LeadPilot AI's original core feature.

### Why this feature exists:
In high-velocity real estate sales, reps frequently ask: *"I know this lead is WARM, but what exactly should I do right now?"* 
Knowing a lead is interested is useless without immediate tactical direction. High-intent buyers contact multiple brokers simultaneously; the salesperson who reaches out through the right channel with the right qualification questions in the first 2 hours wins the mandate.

### Components:
- **Recommended Channel**: Identifies whether `WhatsApp`, `Phone Call`, `Email`, or `SMS` is most appropriate given the message context.
- **Target Timing**: E.g., *"Within 2 hours"* for urgent buyers vs. *"Next business morning"* for late-night inquiries.
- **Tactical Rationale**: Explains the psychological/sales reason behind the channel and timing.
- **Suggested Outreach Message**: One-click copyable message tailored to the buyer's requirement.
- **3 Qualification Questions**: Exactly 3 targeted questions to ask on the next call to clarify missing parameters (e.g., financing status, preferred floor, decision-maker involvement).

---

## Project Structure

```
masal-ai-leadpilot/
├── backend/
│   ├── main.py                 # FastAPI app, REST endpoints, CORS, lifespan
│   ├── database.py             # SQLAlchemy engine + session generator
│   ├── models.py               # Lead ORM entity with timestamps
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── ai_service.py           # Gemini SDK calls (analysis + copilot chat + retry)
│   ├── prompts.py              # System prompts & JSON schema definitions
│   ├── requirements.txt        # Backend dependencies
│   ├── test_backend.py         # Automated unit and integration test suite
│   ├── .env.example            # Template for backend environment variables
│   └── .gitignore              # Ignores .env, *.db, __pycache__, venv/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LeadCard.jsx        # Dashboard card with priority & score badge
│   │   │   ├── LeadForm.jsx        # Inbound lead intake modal with sample pre-fill
│   │   │   ├── AnalysisPanel.jsx   # AI summary, requirements, objections, response
│   │   │   ├── Copilot.jsx         # Lead-grounded chat UI with suggestion chips
│   │   │   └── FollowUpPlanner.jsx # Original feature: channel, timing, questions
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Stats bar, pipeline grid, empty state
│   │   │   └── LeadDetails.jsx     # Lead detail overview, re-run analysis, copilot
│   │   ├── services/
│   │   │   └── api.js              # Fetch client wrapper for backend API
│   │   ├── App.jsx                 # Router layout and navigation
│   │   ├── main.jsx                # React DOM entry point
│   │   └── index.css               # Design system & styles (no Tailwind)
│   ├── vercel.json                 # SPA client-side rewrite rules
│   ├── .env.example                # Template for frontend environment variables
│   ├── package.json                # Frontend dependencies and build scripts
│   ├── vite.config.js              # Vite bundler configuration
│   └── index.html                  # HTML entry point with metadata
│
├── render.yaml                     # Render deployment blueprint
├── README.md                       # Comprehensive project documentation
├── LICENSE                         # MIT License
└── .gitignore                      # Combined root gitignore
```

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# (On Windows cmd/powershell, copy .env.example .env)

# Configure your GEMINI_API_KEY in backend/.env:
# GEMINI_API_KEY=your_actual_gemini_api_key_here

# Run backend server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend will be live at: `http://127.0.0.1:8000` (API documentation at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Create .env from template
cp .env.example .env

# Run Vite development server
npm run dev
```
Frontend will be live at: `http://127.0.0.1:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | `AIzaSy...` (Required for AI calls) |
| `DATABASE_URL` | SQLAlchemy Database Connection URL | `sqlite:///./leadpilot.db` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173,https://your-vercel-app.vercel.app` |
| GEMINI_`MODEL` | Gemini Model Identifier | `gemini-1.5-flash` |
| `PORT` | Server listening port | `8000` |

### Frontend (`frontend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:8000` |

---

## API Endpoints

| Method | Endpoint | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server health check | None | 200 OK (`{"status":"ok"}`) |
| `POST` | `/leads` | Create a new lead | `LeadCreate` JSON | 201 Created (`LeadResponse`) |
| `GET` | `/leads` | List all leads (sorted by score DESC, then created_at DESC) | None | 200 OK (`List[LeadResponse]`) |
| `GET` | `/leads/{id}` | Retrieve single lead by ID | None | 200 OK (`LeadResponse`) / 404 |
| `POST` | `/leads/{id}/analyze` | Execute Gemini AI analysis & follow-up plan | None | 200 OK (`LeadResponse`) / 502 |
| `POST` | `/leads/{id}/chat` | Scoped conversational AI copilot | `{"question": "..."}` | 200 OK (`{"answer": "..."}`) / 502 |
| `DELETE` | `/leads/{id}` | Delete lead record | None | 200 OK (`{"detail": "..."}`) / 404 |

---

## Deployment

### Backend Deployment (Render)

1. **Create Web Service**:
   - Push repository to GitHub.
   - Log in to [Render](https://render.com) and click **New + > Web Service**.
   - Connect your GitHub repository.
2. **Configure Settings**:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `DATABASE_URL`: `sqlite:///./leadpilot.db`
   - `ALLOWED_ORIGINS`: `https://<your-vercel-app>.vercel.app,http://localhost:5173`
   - `GEMINI_MODEL`: `gemini-1.5-flash`
4. Copy the assigned Render service URL (e.g. `https://leadpilot-backend.onrender.com`).

### Frontend Deployment (Vercel)

1. **Import Project**:
   - Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
   - Select your GitHub repository.
2. **Configure Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_URL`: `https://<your-render-backend-url>.onrender.com`
4. **Deploy**:
   - Click **Deploy**. Vercel will build and assign your production frontend URL.
5. **Update Backend CORS**:
   - Add your live Vercel URL to the `ALLOWED_ORIGINS` environment variable in Render.

---

## Technical Decisions

- **FastAPI**: Chosen over Flask or Django for native asynchronous capability, automated OpenAPI documentation generation, lightweight footprint, and automatic Pydantic request/response serialization.
- **SQLite with SQLAlchemy**: Zero-setup, file-based database ideal for high-speed prototyping and single-instance deployments without requiring external database provisioning.
- **Direct `google-generativeai` SDK**: Direct SDK integration eliminates dependency bloat and unpredictable abstraction behavior introduced by heavy LLM wrappers like LangChain or LlamaIndex.
- **Structured JSON Mode**: Enforcing `response_mime_type="application/json"` combined with strict server-side Pydantic models ensures consistent, parseable responses with automated 1-retry fallback.
- **Plain CSS Design System**: Custom vanilla CSS provides fine-grained control over micro-interactions, layout density, and priority color coding without the build overhead or bundle bloat of heavy external UI libraries.

---

## Known Limitations

- **AI Inaccuracies**: While prompt engineering constrains hallucination, LLMs may misinterpret ambiguous local idioms or slang in customer messages.
- **SQLite Prototype Nature**: SQLite locks the database during write transactions, making it suitable for prototypes and demos, but not horizontally scaled multi-worker production systems (PostgreSQL would be used for high-concurrency production).
- **No User Authentication**: For prototype clarity, authentication/multi-tenancy is omitted. Any user with the URL can view and manage leads.
- **Free-Tier LLM Rate Limits**: Google AI Studio free tier enforces rate limits (requests per minute and daily quotas); heavy simultaneous usage may trigger 502 responses.
- **Heuristic Prioritization**: Lead scores are deterministic heuristic reflections of stated intent and timeline, not a trained machine-learning model validated on historical conversion datasets.

---

## AI Usage Disclosure

- **Development Phase**: ChatGPT and Claude were used for initial task scaffolding, refining prompt constraints, and generating test payloads.
- **Runtime Application**: **Google Gemini API** (`gemini-1.5-flash` via `google-generativeai` SDK) runs actively in production to execute:
  1. Automated lead analysis, scoring, and priority categorization (`POST /leads/{id}/analyze`).
  2. Follow-Up Planner strategic generation.
  3. Lead-bounded sales copilot chat queries (`POST /leads/{id}/chat`).

---

## Future Improvements

- **PostgreSQL Migration**: Swap SQLite for managed PostgreSQL (e.g. Supabase or Neon) with connection pooling for enterprise concurrency.
- **Multi-Tenant Authentication**: Role-based access control (RBAC) allowing sales managers to assign leads to specific sales representatives.
- **CRM Webhook Integrations**: Native webhooks for Salesforce, HubSpot, and WhatsApp Business API to ingest leads automatically.
- **Streaming Responses**: Enable Server-Sent Events (SSE) for real-time word-by-word streaming in the Copilot chat.
- **Historical ML Calibration**: Train an ML model on closed-won deal histories to complement the heuristic AI score with an empirical conversion probability.

---

## Deliverables & Security Verification

- **API Keys**: Confirmed that **zero** API keys or secrets are committed. Both `.gitignore` files actively exclude `.env` files. Only `.env.example` templates exist in source control.
- **Backend-Only AI**: All calls to Google Gemini API are strictly executed on the backend server. The client browser has no access to the LLM API keys.
- **License**: MIT License included.
