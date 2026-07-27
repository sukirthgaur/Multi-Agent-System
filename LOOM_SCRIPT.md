# Multi-Agent Research Assistant — Loom Video Presentation Script

**Target Duration:** 6–8 minutes  
**Format:** Screen share with camera bubble (VS Code + Terminal)

---

## Video Outline & Timestamps

| Timestamp | Section | Visual on Screen |
|---|---|---|
| **0:00 - 1:30** | 1. High-Level Architecture & Concept | Architecture Diagram / `WRITEUP.md` |
| **1:30 - 4:00** | 2. Code Walkthrough (`agents.ts`, `hooks.ts`, `run.ts`) | VS Code Editor |
| **4:00 - 6:15** | 3. Live Demo 1: End-to-End Success | Terminal execution |
| **6:15 - 8:00** | 4. Live Demo 2: Failure & Fallback Handling | `.env` edit + Terminal execution |
| **8:00 - 8:45** | 5. Key Trade-offs & Conclusion | `README.md` / Camera full |

---

## Detailed Script & Teleprompter Guide

### 🎙️ Section 1: Introduction & Architecture Overview (0:00 - 1:30)

**[Visual: Show `WRITEUP.md` or Architecture Diagram]**

**Spoken Script:**
> "Hi everyone! Welcome to my presentation of the Multi-Agent Research Assistant built with **Google Gemini API** (`@google/generative-ai`) and free web search tools in TypeScript for our multi-agent orchestration assignment.
> 
> The objective of this project is to solve complex research queries by using a **coordinator subagent pattern** powered by Gemini API, rather than dumping everything into a single prompt or writing fragile, monolithic code.
> 
> Let's look at the architecture:
> 1. **Coordinator Agent (Main Loop)**: Powered by Gemini API, receives the user's high-level research question, breaks it down into 2 to 3 independent sub-questions, and delegates to specialized subagents in parallel.
> 2. **Web Researcher Subagent (`web-researcher`)**: Given a single sub-question, it uses a free `WebSearch` tool (DuckDuckGo search) to fetch live information and return concise bullet points with inline source URLs.
> 3. **Summarizer Subagent (`summarizer`)**: Operates with **zero tools** (`tools: []`). Its sole responsibility is pure narrative synthesis—taking gathered facts and producing a single cohesive report with citations.
> 
> This adheres strictly to the **Principle of Least Privilege**: each agent gets only the exact tools and context required for its specific task."

---

### 2. Codebase Walkthrough (1:30 - 4:00)

**[Visual: Open `src/agents.ts` in VS Code]**

**Spoken Script:**
> "Let's walk through the implementation. Everything is written cleanly in TypeScript and runnable via `tsx`.
> 
> In `src/agents.ts`, we define our two subagents and free search tool helper:
> - Notice `webResearcher` has `tools: ["WebSearch"]`. This scopes its context solely to web research. Its prompt instructs it to report concise facts with URLs or plainly state if search fails.
> - Notice `summarizer` has `tools: []`. Stripping tool access from the summarizer prevents accidental extra search queries during final formatting.
> - We also implement `executeWebSearch`, a free DuckDuckGo search function requiring zero paid API keys!
> 
> Why subagents instead of plain API calls? Subagents give us **context isolation**, **per-agent tool restriction**, and **native parallelism**."

**[Visual: Switch to `src/hooks.ts`]**

**Spoken Script:**
> "Next, let's inspect `src/hooks.ts`. The assignment requires testing graceful error degradation. Rather than waiting for an unreliable network failure, we built a deterministic failure simulator using `searchFailureHook`.
> 
> If `process.env.SIMULATE_SEARCH_FAILURE === "true"`, the hook intercepts any `WebSearch` call and returns `allowed: false` with a reason string. This allows us to safely demonstrate fallback handling live on camera."

**[Visual: Switch to `src/run.ts`]**

**Spoken Script:**
> "Finally, in `src/run.ts`, we orchestrate the agents using Google Gemini API (`GoogleGenerativeAI`):
> - First, the Coordinator agent decomposes the query into sub-questions.
> - Second, we dispatch `web-researcher` subagents in parallel across all sub-questions via `Promise.all`.
> - Whenever a subagent executes `WebSearch`, it runs through our failure simulation hook.
> - Finally, all findings are passed to the `summarizer` subagent to generate the final synthesized answer."

---

### 🎙️ Section 3: Live Demo 1 — End-to-End Success (4:00 - 6:15)

**[Visual: Open Terminal inside VS Code]**

**Spoken Script:**
> "Now let's see the system in action! I'll run a research prompt:
> `npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"`"

**[Action: Execute command in terminal]**

**Spoken Script (as terminal streams):**
> "Look at the terminal output:
> 1. The coordinator receives the prompt and breaks it into sub-questions for PostgreSQL and MongoDB high-write performance.
> 2. You can see the `🤖 [Coordinator] Delegating to subagent: web-researcher` logs appearing! Both sub-questions are dispatched in parallel.
> 3. Each `web-researcher` executes its search query via our free WebSearch tool.
> 4. Once both researchers report back, the coordinator invokes the `summarizer` subagent.
> 5. Here is the final output—a well-organized response with inline citations from live web sources!"

---

### 🎙️ Section 4: Live Demo 2 — Failure & Fallback Handling (6:15 - 8:00)

**[Visual: Open `.env` file and change `SIMULATE_SEARCH_FAILURE=false` to `true`]**

**Spoken Script:**
> "Now, let me show how the system handles agent failure gracefully.
> I will open `.env` and set `SIMULATE_SEARCH_FAILURE=true`. Now every `WebSearch` tool call will be denied by our failure hook."

**[Action: Run command in terminal again: `npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"`]**

**Spoken Script (as terminal streams):**
> "Let's watch what happens:
> 1. The coordinator delegates sub-questions to the researchers as usual.
> 2. The researcher attempts `WebSearch`, but our hook blocks it with `"Simulated failure for demo purposes"`.
> 3. The researcher plainly reports back that search was unavailable.
> 4. **Crucially, the coordinator does NOT crash or abort.** It follows our fallback prompt rules, notes the research gap, and passes the situation to the `summarizer`.
> 5. The final output explicitly highlights which sub-questions could not be researched rather than hallucinating facts. This is the **skip-with-a-note** graceful degradation pattern in action!"

---

### 🎙️ Section 5: Wrap-up & Trade-offs (8:00 - 8:45)

**[Visual: Switch back to camera or `README.md`]**

**Spoken Script:**
> "To recap the design trade-offs:
> - **Gemini API & Free Tools**: Powered by Google AI Studio's Gemini API and DuckDuckGo free search, making the entire multi-agent system completely free to run.
> - **Parallel Subagent Execution**: Subagents run concurrently using async JavaScript promises, keeping overall latency minimal.
> - **Least Privilege Security**: Scoping tools strictly per agent prevents accidental side-effects and unnecessary tool calls.
> 
> Thank you for watching!"
