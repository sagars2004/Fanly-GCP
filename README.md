# Fanly-GCP

Fanly is a peer-to-peer (P2P) housing exchange and conversational matching platform specifically designed for the **2026 FIFA World Cup™** in the NY/NJ metropolitan area. It connects international traveling fans with verified local hosts, providing an affordable, community-first alternative to price-gouging hotels while navigating local short-term housing regulations with automated, legally-compliant lease agreements.

This repository is distributed under the OSI-approved **Apache License 2.0** (see the LICENSE file in the codebase).
---

## Technology Stack Breakdown

Fanly's architecture is composed of four main components structured in a clean, unified flow:

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 14 (React) | A highly responsive, tailwind-styled interface containing autocomplete tournament searchers, contextual overlays for World Cup match schedules, dynamic listing details, and an interactive chat helper. |
| **Backend Orchestrator** | FastAPI (Python) | Coordinates authentication, booking pipelines, text classifications, and APIs bridging the client interface, AI models, and database indices. |
| **Database & Search** | Elasticsearch | Persistent cloud database indexing property listings, user profiles, bookings, matches, and generated lease agreements. |
| **AI Reasoning Engine** | Google Gemini 3 & Agent Builder SDK | Parses natural language intents, classifies user intents, and utilizes Model Context Protocol (MCP) tools to retrieve listing and schedule data dynamically. |

### Infrastructure & Cloud Hosting
* **Model Hosting**: Google Cloud Vertex AI (orchestrating `gemini-3.5` or custom override models).
* **Database Hosting**: Elastic Cloud on Google Cloud Platform (GCP) for serverless Elasticsearch and Kibana analytics.
* **Serverless Hosting**: Google Cloud Run hosting containerized instances of the web frontend and API orchestrator.

---

## Setup and Run Instructions

### Prerequisites
* **Node.js** (v20.19.0+ recommended)
* **Python** (v3.10+ recommended)
* **Elasticsearch Index Credentials** (Elastic Cloud connection)
* **Google Cloud Project Credentials** (Vertex AI and Agent Builder APIs enabled)

### Environment Configuration
Create a `.env` file in the root of the project and populate the required configuration variables:
```env
GOOGLE_GENAI_USE_VERTEXAI
GOOGLE_CLOUD_PROJECT_ID
GOOGLE_CLOUD_PROJECT_NUMBER
GOOGLE_CLOUD_LOCATION

ELASTIC_URL
ELASTIC_API_KEY
```

---

### Backend Execution (FastAPI)
1. Navigate to the root directory.
2. Initialize virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn agent.api.main:app --reload --port 8000
   ```
   *The backend automatically checks, creates, and seeds indices (`fanly_users`, `fanly_listings`, `fanly_matches`) on startup using the environment configuration.*

---

### Frontend Execution (Next.js)
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

---

## How to Use the App (User Role Playbooks)

### As a Guest (Browsing & Searching)
* **Browse Local Attractions**: Review the curated NYC/NJ attractions gallery at the bottom of the home feed.
* **Smart Search**: Use the search bar to choose a FIFA host city (e.g. *New York* or *Jersey City*), check-in dates, and whom you are rooting for.
* **Match Context**: Searching dates automatically triggers the *Match Schedule Overlay*, displaying exact World Cup matches playing in the local stadium during your stay.
* **AI Chat Helper**: Chat with the Gemini assistant on the right panel in your native language (English, Spanish, Arabic, Portuguese, French) to get instant matching recommendations without logging in.

### As a Fan (Stays & Bookings)
* **Authentication**: Click the profile menu (top right), select **Log In**, and use the demo Guest email and password configured in your `.env` file.
* **Request a Stay**: Click on any listing card to inspect the details and click **Request Booking with Host**.
* **Safety Rules**: Stays are limited to one active request per listing. If you try to submit a duplicate request, a warning popup will inform you that a pending request already exists.
* **Dashboard Tracking**: Visit your dashboard (under the profile dropdown) to check status logs, review details, or cancel your request.
* **View Contracts**: Once the host accepts your request, a legally-compliant lease agreement is generated. Click **View Contract** in the dashboard to review your customized terms.

### As a Host (Listing Stays & Approvals)
* **Authentication**: Log in with the verified Host admin email and password configured in your `.env` file.
* **Create Host Space**: Click the **Become a Host** link in the header.
* **Security Gate**: To list a space, complete the Host Security Verification form. Enter the host credentials to unlock the Host Dashboard and Listing Editor.
* **Submit Space**: Create a listing with pricing rates, description, available dates, spoken languages, and team preferences. The system maps the properties to your host profile and indices it immediately in Elasticsearch.
* **Manage Stays**: Go to the **Host Tab** on your dashboard to see pending guest applications. Click **Accept** or **Decline**. Accepting a request automatically seals a binding short-term contract, instantly viewable by both parties.
