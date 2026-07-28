# Loom Video Presentation Script: Multi-Agent Research Assistant

This document contains a professional, step-by-step narration and presentation script for a demo video of the **Multi-Agent Research Assistant**. It highlights our design principles, technical implementation with Groq AI, and error-handling capabilities.

---

## 📽️ Video Overview & Metadata
* **Target Duration:** 6–8 minutes
* **Target Audience:** Technical assessors, professors, developers
* **Speaker Tone:** Confident, structured, professional, and clear
* **Primary Visuals:** VS Code editor and Terminal window (divided layout or toggled)

---

## 📑 Script Timeline & Scenes

| Time | Scene | Visual Cue | Key Focus |
|---|---|---|---|
| **0:00 - 1:15** | 1. Introduction & Concept | VS Code displaying [README.md](file:///Users/bot/Downloads/Projects/AssignmentMAS/README.md) or [WRITEUP.md](file:///Users/bot/Downloads/Projects/AssignmentMAS/WRITEUP.md) | High-level architecture, coordinator-subagent pattern |
| **1:15 - 2:30** | 2. Code Walkthrough: Subagents | VS Code showing [src/agents.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/agents.ts) | Agent definitions, Principle of Least Privilege, free web search scraper with Wikipedia fallback |
| **2:30 - 3:15** | 3. Code Walkthrough: Error Hook | VS Code showing [src/hooks.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/hooks.ts) | Failure injection hook configuration |
| **3:15 - 4:45** | 4. Code Walkthrough: Orchestrator | VS Code showing [src/run.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/run.ts) | Coordinator query splitting (2 sub-questions max), Groq tool calling loop, synthesis |
| **4:45 - 6:00** | 5. Live Demo: Success Scenario | VS Code Terminal running normal query | End-to-end execution with Groq AI, console output, final report |
| **6:00 - 7:30** | 6. Live Demo: Failure Scenario | VS Code Terminal running after `.env` edit | `SIMULATE_SEARCH_FAILURE=true` behavior, graceful degradation |
| **7:30 - 8:15** | 7. Conclusion & Trade-offs | VS Code or webcam full-screen | Performance benefits, cost efficiency, summary |

---

## 🎙️ Scene-by-Scene Detailed Narration

### Scene 1: Introduction & Architecture Overview (0:00 - 1:15)

* **Visual:** VS Code displaying [WRITEUP.md](file:///Users/bot/Downloads/Projects/AssignmentMAS/WRITEUP.md). Highlight the ASCII architecture diagram.
* **Audio / Narration:**
  > "Hi everyone, and welcome to this technical walkthrough of our Multi-Agent Research Assistant. This system is implemented in TypeScript using the Groq AI SDK (`llama-3.3-70b-versatile`) and a suite of completely free-to-use search tooling.
  > 
  > The primary objective of this project is to show how complex, multi-faceted research queries can be solved robustly using a coordinator-subagent hierarchy. Rather than dumping a complicated prompt into a single LLM call—which often leads to context dilution or hallucinated facts—we divide the task among specialized agents.
  > 
  > As you can see in our architecture diagram:
  > First, the Coordinator Agent acts as the planner. It analyzes the user's research request, breaks it down into strictly 2 independent sub-questions, and triggers the researchers in parallel.
  > Second, we have 2 Web Researcher subagents. Each researcher is assigned a single sub-question and uses our custom WebSearch tool to scrape DuckDuckGo with Wikipedia API fallback for live facts.
  > Lastly, the Summarizer subagent takes all gathered findings and synthesizes them into a single, cohesive report.
  > 
  > Let's look at the codebase to see how we implement this structure."

---

### Scene 2: Code Walkthrough — Agent Definitions & Search Tool (1:15 - 2:30)

* **Visual:** Open [src/agents.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/agents.ts) in VS Code. Highlight lines 16–23 (`webResearcher` definition) and lines 30–37 (`summarizer` definition).
* **Audio / Narration:**
  > "Let's open `src/agents.ts`. We define our subagents using a structured `AgentDefinition` interface.
  > 
  > Notice the difference in tool access, which implements the Principle of Least Privilege:
  > The `web-researcher` has access strictly to `['WebSearch']`. Its system prompt instructs it to perform targeted web searches with 3 to 5-word queries, extract concise bullet points, and return them along with inline URLs.
  > In contrast, the `summarizer` has `tools: []`. By denying the summarizer any tool permissions, we prevent it from spawning unnecessary search queries during the final formatting phase. Its sole responsibility is pure text synthesis and inline citation mapping."

---

### Scene 3: Code Walkthrough — Failure Injection Hook (2:30 - 3:15)

* **Visual:** Open [src/hooks.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/hooks.ts) in VS Code.
* **Audio / Narration:**
  > "A core requirement of our system is demonstrating graceful degradation under API failure. To avoid having to force network disconnects during live demos, we created a deterministic hook inside `src/hooks.ts` called `searchFailureHook`.
  > 
  > When the environment variable `SIMULATE_SEARCH_FAILURE` is set to `true`, the hook intercepts the `WebSearch` execution request before it ever runs. It returns `allowed: false` along with a reason string. If it is `false`, it lets the search proceed normally. This interception design allows us to easily test our system's resiliency."

---

### Scene 4: Code Walkthrough — Orchestrator & Main Loop (3:15 - 4:45)

* **Visual:** Open [src/run.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/run.ts) in VS Code. Highlight Groq client instantiation and `groq.chat.completions.create` calls.
* **Audio / Narration:**
  > "Now, let me show `src/run.ts`, the main orchestrator powered by `groq-sdk` running `llama-3.3-70b-versatile`.
  > 
  > First, the Coordinator Agent decomposes the primary query into strictly 2 independent sub-questions.
  > 
  > Once the coordinator outputs these sub-questions, we parse the JSON array and launch 2 instances of `runResearcherSubagent` in parallel using `Promise.all` with a 1.5s staggered delay.
  > 
  > When Groq decides to call `WebSearch`, the orchestrator routes the request through our `searchFailureHook`. If allowed, the search executes; if blocked, the error response is injected into the chat context.
  > 
  > Finally, all researcher outputs are combined and passed as background context to our `summarizer` model, which synthesizes the final, quoted report."

---

### Scene 5: Live Demo — End-to-End Success (4:45 - 6:00)

* **Visual:** Open the terminal window at the bottom of VS Code.
  1. Show `.env` with `SIMULATE_SEARCH_FAILURE=false`.
  2. Execute:
     ```bash
     npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"
     ```
* **Audio / Narration:**
  > "Let's see the system in action using Groq AI.
  > 
  > I will run the command: `npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"`
  > 
  > Watch the console output:
  > The Coordinator Agent creates 2 focused tasks. Both tasks execute in parallel. Each researcher searches live web sources and returns 5 relevant results. Finally, the summarizer synthesizes a comprehensive final report detailing database trade-offs with live URL citations."

---

### Scene 6: Live Demo — Graceful Degradation & Failure (6:00 - 7:30)

* **Visual:** Change `SIMULATE_SEARCH_FAILURE=false` to `SIMULATE_SEARCH_FAILURE=true` in `.env` and rerun.
* **Audio / Narration:**
  > "Now let's demonstrate system resilience. I'll set `SIMULATE_SEARCH_FAILURE=true` in `.env`.
  > 
  > When we rerun, our hook denies all tool calls with `WebSearch denied: Simulated failure for demo purposes`.
  > 
  > The researchers capture the failure, and the summarizer produces a final report that explicitly highlights which sub-questions could not be researched rather than inventing data. This 'skip-with-a-note' pattern ensures full transparency."

---

### Scene 7: Conclusion & Key Takeaways (7:30 - 8:15)

* **Visual:** Focus back on [README.md](file:///Users/bot/Downloads/Projects/AssignmentMAS/README.md).
* **Audio / Narration:**
  > "To wrap up, our Multi-Agent Research Assistant provides several concrete design benefits:
  > 1. **Groq Speed**: Powered by Groq's LPU infrastructure running Llama 3.3 70B.
  > 2. **Security**: Capability isolation enforcing least-privilege tool access.
  > 3. **Resiliency**: Deterministic hook testing and graceful degradation.
  > 
  > Thank you so much for watching!"
