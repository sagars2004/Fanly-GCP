# Fanly GCP: Hackathon Demo Walkthrough & Setup Guide

This document provides a step-by-step guide to run the application locally and walk through the demo scenarios.

---

## 1. Quick Local Setup

Follow these commands to boot up the application in two terminal tabs.

### Terminal 1: Run the FastAPI Backend Agent
```bash
# Navigate to the workspace root
cd /Users/sagarsahu/Desktop/Projects/Fanly-GCP

# Create a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r agent/requirements.txt

# Run the seeding script to compile local listings embeddings
python3 data/scripts/seed_elastic.py

# Launch the FastAPI web server on port 8000
uvicorn agent.api.main:app --reload --port 8000
```

### Terminal 2: Run the Next.js Frontend
```bash
# Navigate to the frontend directory
cd /Users/sagarsahu/Desktop/Projects/Fanly-GCP/frontend

# Launch the Next.js development server
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

---

## 2. Story Walkthrough Scenario (FIFA World Cup 2026)

### Scenario A: Fan Search Flow (Multilingual AI Matcher)
1. **Land on Home Page**: Navigate to `http://localhost:3000`. You are greeted by a beautiful modern dashboard.
2. **Switch Language**: Change the language selector in the navbar to **PT (Português)**. The entire UI changes instantly.
3. **Type User Search**: In the AI search bar, type:
   > *"Preciso de um quarto perto do estádio para o jogo do Brasil no dia 20 de junho, orçamento de 80 dólares"*
   *(Translation: "I need a room near the stadium for the Brazil match on June 20th, budget of 80 dollars")*
4. **AI Match Processing**: Click **"Buscar com Matcher IA"**. 
   - The backend parses the query, detects Portuguese, identifies dates (June 20th), extracts budget ($80), and matches the team ("Brazil").
   - The Left Feed dynamically updates to show Maria Silva's Harrison Room and Lucas Santos's Brazilian Haven!
   - The Right Chat box prints a helpful paragraph in Portuguese detailing the matched game (Brazil vs Argentina on June 20th at MetLife Stadium), notes that it is a high-attendance day, recommends transit tips, and highlights why Maria and Lucas are perfect hosts (both speak Portuguese, Harrison is 10 mins from MetLife).

---

### Scenario B: Booking Request Flow & Confetti
1. **View Listing details**: On Maria's listing card, click **"Solicitar Estadia"** (Request Stay).
2. **Check Match schedule overlay**: On the details page, look at the dates picker set to `June 18 - June 21`. The **Match Schedule Overlay** automatically loads the FIFA schedules showing that **Brazil vs Germany** is on June 18th and **Brazil vs Argentina** is on June 20th at MetLife, showing warning logs for crowds.
3. **Request stay**: In the pricing panel, click the button **"Solicitar Estadia"**.
4. **Success state**: A colorful explosion of confetti pops on screen! A booking request is saved.

---

### Scenario C: Host Management & Agreement Generator
1. **Navigate to Dashboard**: Click **"Meu Painel"** (My Dashboard) in the navbar.
2. **Open Host Tab**: Select the **"Host Management"** tab.
3. **Review Guest Request**: You see Carlos Silva's request for June 18 - 21. Click **"Accept Request"**.
4. **Contract Generated**: Upon clicking accept, a new confetti spray pops. The booking is marked as accepted, and the backend dynamically drafts a plain-language housing contract in Portuguese.
5. **View Contract**: Click **"View Hosting Agreement"**. A premium paper-style contract modal appears showing the complete terms, dates, price, and rules, stamped with a "Verified Agreement" badge.

---

### Scenario D: Host Listing Creator
1. **Add space**: Click **"Become a Host"** in the navbar.
2. **AI Pricing check**: As you fill out the room form details, look at the **AI Pricing Assistant** box. It analyzes the World Cup schedules and suggests a competitive price range ($65 - $110/night) for hosting during peak matches.
3. **Publish listing**: Click **"Publish Listing"** to immediately add your space to the searchable pool.
