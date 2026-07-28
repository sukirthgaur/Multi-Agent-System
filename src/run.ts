import "dotenv/config";
import Groq from "groq-sdk";
import { webResearcher, summarizer, executeWebSearch } from "./agents.js";
import { searchFailureHook } from "./hooks.js";

/**
 * Main execution script for the multi-agent research assistant.
 * What: Initializes prompt, delegates to subagents via Groq AI SDK, and outputs progress.
 * Why: Demonstrates multi-agent orchestration relying on Groq Llama 3.3 70B and free tools.
 */
async function main() {
  // Extract research question from command-line arguments (supports quoted and unquoted input)
  const question = process.argv.slice(2).join(" ").trim();
  if (!question) {
    console.error('Usage: npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"');
    process.exit(1);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    console.error("❌ Error: GROQ_API_KEY is missing or unconfigured in .env file.");
    console.error("Please set GROQ_API_KEY in your .env file with a valid key from console.groq.com");
    process.exit(1);
  }

  console.log(`\n🔍 Researching with Groq AI: "${question}"\n`);

  const groq = new Groq({ apiKey });
  const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  try {
    // ---------------------------------------------------------
    // Phase 1: Coordinator Agent - Decompose into 2 Sub-questions
    // ---------------------------------------------------------
    console.log("🤖 [Coordinator] Analyzing prompt and planning sub-questions...");
    const coordCompletion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are a research coordinator. Analyze the user question and break it down into strictly 2 independent, specific sub-questions suitable for parallel web research. Return strictly a JSON array of strings containing exactly 2 sub-questions, e.g. [\"subquestion 1\", \"subquestion 2\"]. Do not include markdown code block formatting or extra commentary.",
        },
        {
          role: "user",
          content: `Research question: ${question}`,
        },
      ],
      temperature: 0.1,
    });

    let coordText = coordCompletion.choices[0]?.message?.content?.trim() || "[]";
    // Strip markdown JSON wrapping if present
    coordText = coordText.replace(/```json/g, "").replace(/```/g, "").trim();

    let subQuestions: string[] = [];
    try {
      subQuestions = JSON.parse(coordText);
    } catch {
      // Fallback if JSON parsing fails
      subQuestions = [
        `Overview of ${question}`,
        `Key performance trade-offs for ${question}`,
      ];
    }

    // Enforce exactly 2 sub-questions max as requested
    subQuestions = subQuestions.slice(0, 2);

    console.log(`\n📋 Coordinator created ${subQuestions.length} research tasks:`);
    subQuestions.forEach((sq, idx) => console.log(`   ${idx + 1}. ${sq}`));

    // ---------------------------------------------------------
    // Phase 2: Web Researcher Subagents - Parallel Execution
    // ---------------------------------------------------------
    const groqTools = [
      {
        type: "function" as const,
        function: {
          name: "WebSearch",
          description: "Searches the web for information given a concise query string.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Short search query string (3 to 5 keywords max)",
              },
            },
            required: ["query"],
          },
        },
      },
    ];

    const runResearcherSubagent = async (subQuestion: string, index: number): Promise<string> => {
      console.log(`\n🤖 [Coordinator] Delegating to subagent: ${webResearcher.name} (Task ${index + 1})`);
      console.log(`   Task: ${subQuestion}`);

      const messages: any[] = [
        { role: "system", content: webResearcher.prompt },
        { role: "user", content: `Investigate this sub-question: ${subQuestion}` },
      ];

      let toolCallCount = 0;
      const MAX_TOOL_CALLS = 2;

      let response = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages,
        tools: groqTools,
        tool_choice: "auto",
        temperature: 0.1,
      });

      let responseMessage = response.choices[0]?.message;

      while (
        responseMessage?.tool_calls &&
        responseMessage.tool_calls.length > 0 &&
        toolCallCount < MAX_TOOL_CALLS
      ) {
        toolCallCount++;
        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === "WebSearch") {
            let queryArg = "";
            try {
              const args = JSON.parse(toolCall.function.arguments);
              queryArg = args.query || subQuestion;
            } catch {
              queryArg = subQuestion;
            }

            // Clean & truncate long queries to 5 keywords max
            const words = queryArg.split(/\s+/);
            if (words.length > 5) {
              queryArg = words.slice(0, 5).join(" ");
            }

            console.log(`   🔎 [web-researcher ${index + 1}] Executing WebSearch: "${queryArg}"`);

            // Intercept via search failure hook for demo testing
            const hookResult = await searchFailureHook("WebSearch");

            let functionResult: any;
            if (!hookResult.allowed) {
              console.log(`   ⚠️ [web-researcher ${index + 1}] WebSearch denied: ${hookResult.reason}`);
              functionResult = {
                status: "error",
                message: `Web search execution was denied: ${hookResult.reason}`,
              };
            } else {
              const searchResults = await executeWebSearch(queryArg);
              console.log(`   ✅ [web-researcher ${index + 1}] Found ${searchResults.length} search results`);
              functionResult = {
                status: "success",
                results: searchResults,
              };
            }

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult),
            });
          }
        }

        // Get next response from model after sending tool execution output
        response = await groq.chat.completions.create({
          model: MODEL_NAME,
          messages,
          tools: groqTools,
          temperature: 0.1,
        });

        responseMessage = response.choices[0]?.message;
      }

      return responseMessage?.content || "No detailed response generated.";
    };

    // Execute web-researcher subagents in parallel with staggered start delays
    const researchFindings = await Promise.all(
      subQuestions.map(async (sq, idx) => {
        if (idx > 0) {
          const delayMs = idx * 1500;
          console.log(`   ⏳ [Coordinator] Staggering subagent ${idx + 1} start by ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        return runResearcherSubagent(sq, idx);
      })
    );

    // ---------------------------------------------------------
    // Phase 3: Summarizer Subagent - Synthesis (Zero Tools)
    // ---------------------------------------------------------
    console.log(`\n🤖 [Coordinator] Delegating to subagent: ${summarizer.name}`);
    console.log(`   Task: Synthesizing all collected research findings`);

    let combinedContext = `Original Research Question: ${question}\n\n`;
    subQuestions.forEach((sq, idx) => {
      combinedContext += `--- Research Findings for Sub-question ${idx + 1}: "${sq}" ---\n`;
      combinedContext += `${researchFindings[idx]}\n\n`;
    });

    const finalCompletion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: summarizer.prompt },
        { role: "user", content: combinedContext },
      ],
      temperature: 0.2,
    });

    const finalAnswer = finalCompletion.choices[0]?.message?.content || "Synthesis failed.";

    console.log("\n=================== FINAL SYNTHESIS ===================\n");
    console.log(finalAnswer);
    console.log("\n=======================================================\n");
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Research Execution Failed: ${errMessage}\n`);
    process.exit(1);
  }
}

// Execute main CLI function
main();
