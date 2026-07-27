# Multi-Agent Research Assistant (Gemini API & Free Tools)

A CLI multi-agent research assistant built using **Google Gemini API** (`@google/generative-ai`) and free web search tools in TypeScript.

The system uses a coordinator-subagent architecture:
- **Coordinator (Main Agent)**: Receives the user question, breaks it into independent sub-questions, delegates to `web-researcher` subagents in parallel, and finally delegates to the `summarizer` subagent.
- **Web Researcher Subagents**: Runs per sub-question, uses free `WebSearch` (DuckDuckGo search) to gather real-time findings and sources.
- **Summarizer Subagent**: Consolidates all collected research into a final structured answer with zero tool access.

---

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` and set your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   SIMULATE_SEARCH_FAILURE=false
   ```
   *(Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/))*

3. **Run Research Assistant:**
   ```bash
   npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"
   ```

---

## Architecture & Design Reasoning

### 1. Why Gemini API Multi-Agent Hierarchy?
- **Context Isolation**: Subagents execute in isolated chat contexts. The coordinator isn't overwhelmed by intermediate search logs, and sub-questions don't contaminate each other's context.
- **Native Parallelism**: `web-researcher` subagents execute concurrently across independent sub-questions using `Promise.all`.
- **Tool Scoping**: Tool permissions are explicitly restricted per `AgentDefinition` (`web-researcher` has `["WebSearch"]`, `summarizer` has `[]`), enforcing least-privilege security.

### 2. Free Web Search Tool Integration
- **Zero Paid Search APIs Required**: Implemented using free DuckDuckGo web search returning real URLs, titles, and snippets.
- **Clean Parallelism**: Independent research sub-questions present a natural, real-world case for parallel subagent execution.

### 3. Tool Restriction Strategy ("Least Privilege")
- **`web-researcher` (`tools: ["WebSearch"]`)**: Given only search permissions to gather facts.
- **`summarizer` (`tools: []`)**: Pure synthesis agent. Giving it zero tools prevents unnecessary search calls or accidental side-effects during aggregation.

### 4. Deterministic Failure Simulation via Hooks
- Instead of relying on random upstream API failures during a live camera presentation, a failure injection hook intercepts `WebSearch` calls.
- When `SIMULATE_SEARCH_FAILURE=true`, the hook returns `{ allowed: false, reason: "Simulated failure for demo purposes" }`, cleanly testing failure resilience on camera.

---

## Demo Instructions

### Example Research Questions
1. **Database Workloads:**
   ```bash
   npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"
   ```
2. **Language Ecosystems:**
   ```bash
   npm start -- "Compare Rust and Go for building high-throughput microservices."
   ```

### Demonstrating Failure Resilience (Live Demo)
1. Edit `.env` to set `SIMULATE_SEARCH_FAILURE=true`.
2. Re-run one of the demo questions:
   ```bash
   npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"
   ```
3. **Observe**:
   - The coordinator delegates to the researcher subagents.
   - The failure hook denies `WebSearch` calls with a simulated failure message.
   - The coordinator detects the research gap, passes the failure status to the `summarizer`, and the summarizer produces a final response that explicitly acknowledges the unfulfilled research area rather than crashing or inventing data.
# RAG-Pipeline
