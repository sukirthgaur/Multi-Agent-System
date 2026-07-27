# Loom Video Presentation Script: Multi-Agent Research Assistant

This document contains a professional, step-by-step narration and presentation script for a demo video of the **Multi-Agent Research Assistant**. It highlights our design principles, technical implementation, and error-handling capabilities.

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
| **1:15 - 2:30** | 2. Code Walkthrough: Subagents | VS Code showing [src/agents.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/agents.ts) | Agent definitions, Principle of Least Privilege, free web search scraper |
| **2:30 - 3:15** | 3. Code Walkthrough: Error Hook | VS Code showing [src/hooks.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/hooks.ts) | Failure injection hook configuration |
| **3:15 - 4:45** | 4. Code Walkthrough: Orchestrator | VS Code showing [src/run.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/run.ts) | Coordinator query splitting, parallel execution, tool calling loop, synthesis |
| **4:45 - 6:00** | 5. Live Demo: Success Scenario | VS Code Terminal running normal query | End-to-end execution, console output, final report |
| **6:00 - 7:30** | 6. Live Demo: Failure Scenario | VS Code Terminal running after `.env` edit | `SIMULATE_SEARCH_FAILURE=true` behavior, graceful degradation |
| **7:30 - 8:15** | 7. Conclusion & Trade-offs | VS Code or webcam full-screen | Performance benefits, cost efficiency, summary |

---

## 🎙️ Scene-by-Scene Detailed Narration

### Scene 1: Introduction & Architecture Overview (0:00 - 1:15)

* **Visual:** VS Code displaying [WRITEUP.md](file:///Users/bot/Downloads/Projects/AssignmentMAS/WRITEUP.md). If webcam is active, keep it in the bottom right corner. Highlight the ASCII architecture diagram.
* **Audio / Narration:**
  > "Hi everyone, and welcome to this technical walkthrough of our Multi-Agent Research Assistant. This system is implemented in TypeScript using the Google Gemini API and a suite of completely free-to-use search tooling.
  > 
  > The primary objective of this project is to show how complex, multi-faceted research queries can be solved robustly using a coordinator-subagent hierarchy. Rather than dumping a complicated prompt into a single LLM call—which often leads to context dilution or hallucinated facts—we divide the task among specialized agents.
  > 
  > As you can see in our architecture diagram:
  > First, the Coordinator Agent acts as the planner. It analyzes the user's research request, breaks it down into multiple independent sub-questions, and triggers the researchers in parallel.
  > Second, we have the Web Researcher subagents. Each researcher is assigned a single sub-question and uses our custom WebSearch tool to scrape DuckDuckGo for live facts.
  > Lastly, the Summarizer subagent takes all gathered findings and synthesizes them into a single, cohesive report.
  > 
  > Let's look at the codebase to see how we implement this structure."

---

### Scene 2: Code Walkthrough — Agent Definitions & Search Tool (1:15 - 2:30)

* **Visual:** Open [src/agents.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/agents.ts) in VS Code. Highlight lines 16–23 (`webResearcher` definition) and lines 30–37 (`summarizer` definition). Then scroll down to highlight `executeWebSearch` (lines 47–81).
* **Audio / Narration:**
  > "Let's open `src/agents.ts`. We define our subagents using a structured `AgentDefinition` interface.
  > 
  > Notice the difference in tool access, which implements the Principle of Least Privilege:
  > The `web-researcher` has access strictly to `['WebSearch']`. Its system prompt instructs it to perform a targeted web search, extract 3 to 5 concise bullet points, and return them along with inline URLs.
  > In contrast, the `summarizer` has `tools: []`. By denying the summarizer any tool permissions, we prevent it from spawning unnecessary search queries during the final formatting phase. Its sole responsibility is pure text synthesis and inline citation mapping.
  > 
  > Now, let's look at the `executeWebSearch` function below. To keep the pipeline completely free to run without requiring expensive Google Search or SerpAPI keys, we implemented a custom search scraper. It issues a standard HTTP fetch query to DuckDuckGo's HTML search interface, parses the results using a regex to extract clean URLs and snippet text, and returns them as a structured list. This avoids rate-limiting and provides rapid, free retrieval."

---

### Scene 3: Code Walkthrough — Failure Injection Hook (2:30 - 3:15)

* **Visual:** Open [src/hooks.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/hooks.ts) in VS Code. Hover over the `searchFailureHook` function (lines 12–21).
* **Audio / Narration:**
  > "A core requirement of our system is demonstrating graceful degradation under API failure. To avoid having to force network disconnects during live demos, we created a deterministic hook inside `src/hooks.ts` called `searchFailureHook`.
  > 
  > When the environment variable `SIMULATE_SEARCH_FAILURE` is set to `true`, the hook intercepts the `WebSearch` execution request before it ever hits DuckDuckGo. It returns `allowed: false` along with a reason string. If it is `false`, it lets the search proceed normally. This interception design allows us to easily test our system's resiliency, which we will demonstrate in a moment."

---

### Scene 4: Code Walkthrough — Orchestrator & Main Loop (3:15 - 4:45)

* **Visual:** Open [src/run.ts](file:///Users/bot/Downloads/Projects/AssignmentMAS/src/run.ts) in VS Code. Highlight the following sections:
  1. The Coordinator generation instruction (lines 40–47)
  2. The Parallel subagent invocation `Promise.all` (lines 143–146)
  3. The custom Tool calling loop (lines 98–138)
  4. The Summarizer execution block (lines 151–167)
* **Audio / Narration:**
  > "Now, let's examine `src/run.ts`, the main orchestrator of the pipeline.
  > 
  > First, the Coordinator Agent is initialized with a specialized system instruction. We task it with splitting the primary query into 2 or 3 independent sub-questions and returning them strictly as a raw JSON array.
  > 
  > Once the coordinator outputs these sub-questions, we parse the JSON and map them to parallel executions of `runResearcherSubagent` using `Promise.all`. This triggers multiple instances of the researcher concurrently, keeping our execution latency minimal.
  > 
  > Inside the subagent runner, we start a chat session and define the `WebSearch` tool declaration. When Gemini decides to call the tool, the orchestrator routes the request through our `searchFailureHook`. If the hook allows it, the search executes; if blocked, the error response is injected into the chat context. The subagent continues the loop until it resolves its findings.
  > 
  > Finally, all researcher outputs are combined and passed as background context to our `summarizer` model, which synthesizes the final, quoted report."

---

### Scene 5: Live Demo — End-to-End Success (4:45 - 6:00)

* **Visual:** Open the terminal window at the bottom of VS Code.
  1. Show the contents of the `.env` file using a command or by clicking the file in the sidebar, making sure `SIMULATE_SEARCH_FAILURE=false`.
  2. Execute the following command in the terminal:
     ```bash
     npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"
     ```
  3. Keep the terminal output visible as logs stream in.
* **Audio / Narration:**
  > "Let's see the system in action. First, let's verify that `SIMULATE_SEARCH_FAILURE` is set to `false` in our `.env` file.
  > 
  > I will run the command: `npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"`
  > 
  > Watch the console output:
  > The Coordinator Agent analyzes our query and generates two focused sub-questions: one regarding PostgreSQL's write limits and vacuuming overhead, and another regarding MongoDB's document model and journaling performance.
  > 
  > Next, both tasks are launched in parallel. You can see the logs from our `web-researcher` subagents executing the search queries. Each subagent successfully scrapes DuckDuckGo, gathers relevant facts, and compiles its findings.
  > 
  > Finally, the coordinator passes the compiled research output to the `summarizer` subagent. The summarizer synthesizes a comprehensive final report detailing ACID transaction overhead, replication strategies, and document locking—fully cited with live URL sources."

---

### Scene 6: Live Demo — Graceful Degradation & Failure (6:00 - 7:30)

* **Visual:** 
  1. Open the [.env](file:///Users/bot/Downloads/Projects/AssignmentMAS/.env) file. Change `SIMULATE_SEARCH_FAILURE=false` to `SIMULATE_SEARCH_FAILURE=true`. Save the file.
  2. Switch back to the terminal and execute the same start command:
     ```bash
     npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"
     ```
  3. Highlight the logs where search is denied.
* **Audio / Narration:**
  > "Now let's demonstrate the resilience of this pipeline. I'll open our `.env` file and set `SIMULATE_SEARCH_FAILURE` to `true`. This activates our failure injection hook, denying all tool calls.
  > 
  > Let's rerun the exact same research command.
  > 
  > Look at the terminal now:
  > The coordinator successfully plan and outputs the sub-questions. However, when the researcher subagents attempt to call `WebSearch`, our hook intercepts the action and outputs a warning: `WebSearch denied: Simulated failure for demo purposes`.
  > 
  > Instead of crashing or getting stuck in a loop, the researchers report back that the search is unavailable. The coordinator captures these reports, identifies the gap, and sends the details to the summarizer.
  > 
  > In the final synthesis report, the summarizer does not make up facts. Instead, it clearly states that the web search failed for these sub-questions, maintaining transparency while outputting any existing knowledge. This 'skip-with-a-note' pattern ensures our agent pipeline remains robust under actual network or tool outages."

---

### Scene 7: Conclusion & Key Takeaways (7:30 - 8:15)

* **Visual:** Focus back on [README.md](file:///Users/bot/Downloads/Projects/AssignmentMAS/README.md) or switch to a full-screen webcam.
* **Audio / Narration:**
  > "To wrap up, our Multi-Agent Research Assistant provides several concrete design benefits:
  > 
  > 1. **Zero Cost**: We run completely free using Gemini's developer tier and DuckDuckGo scrapers.
  > 2. **Security**: We maintain strict agent capabilities by utilizing isolated tools.
  > 3. **Performance**: We process web lookups in parallel, greatly reducing query-to-report latency.
  > 4. **Resiliency**: Our interceptor hook and fallback routines prevent application crashes when external APIs fail.
  > 
  > Thank you so much for watching this walkthrough. Please let me know if you have any questions!"

---

## 💡 Pro Presentation & Recording Tips
1. **Font Size:** Zoom in your VS Code font size (Cmd + `+` twice) so the code and terminal logs are clearly readable.
2. **Terminal Preparation:** Clear your terminal history before recording (`clear` or `reset`) so the demo output starts clean.
3. **Execution Pacing:** Keep the `.env` tab open next to `src/run.ts` so you can switch and toggle variables quickly.
4. **Environment Verification:** Double-check that your `GEMINI_API_KEY` is loaded and valid before launching the recording.
