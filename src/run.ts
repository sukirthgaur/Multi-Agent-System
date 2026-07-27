import "dotenv/config";
import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  SchemaType,
  Part,
} from "@google/generative-ai";
import { webResearcher, summarizer, executeWebSearch } from "./agents.js";
import { searchFailureHook } from "./hooks.js";

/**
 * Main execution script for the multi-agent research assistant.
 * What: Initializes prompt, delegates to subagents via Google Gemini API, and outputs progress.
 * Why: Demonstrates multi-agent orchestration relying on Gemini API capabilities and free tools.
 */
async function main() {
  // Extract research question from command-line arguments (supports quoted and unquoted input)
  const question = process.argv.slice(2).join(" ").trim();
  if (!question) {
    console.error('Usage: npm start -- "What are the key trade-offs between PostgreSQL and MongoDB for high-write workloads?"');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.error("❌ Error: GEMINI_API_KEY is missing or unconfigured in .env file.");
    console.error("Please set GEMINI_API_KEY in your .env file with a valid key from Google AI Studio.");
    process.exit(1);
  }

  console.log(`\n🔍 Researching: "${question}"\n`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  try {
    // ---------------------------------------------------------
    // Phase 1: Coordinator Agent - Decompose research question
    // ---------------------------------------------------------
    console.log("🤖 [Coordinator] Analyzing prompt and planning sub-questions...");
    const coordinatorModel = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction:
        "You are a research coordinator. Analyze the user question and break it down into 2 to 3 independent, specific sub-questions suitable for parallel web research. Return strictly a JSON array of strings containing only the sub-questions, e.g. [\"subquestion 1\", \"subquestion 2\"]. Do not include markdown code block formatting or extra commentary.",
    });

    const coordResponse = await coordinatorModel.generateContent(`Research question: ${question}`);
    let coordText = coordResponse.response.text().trim();
    
    // Strip markdown formatting if present
    coordText = coordText.replace(/```json/g, "").replace(/```/g, "").trim();

    let subQuestions: string[] = [];
    try {
      subQuestions = JSON.parse(coordText);
    } catch {
      // Fallback if parsing fails
      subQuestions = [
        `Overview of ${question}`,
        `Key details and comparison for ${question}`,
      ];
    }

    console.log(`\n📋 Coordinator created ${subQuestions.length} research tasks:`);
    subQuestions.forEach((sq, idx) => console.log(`   ${idx + 1}. ${sq}`));

    // ---------------------------------------------------------
    // Phase 2: Web Researcher Subagents - Parallel Execution
    // ---------------------------------------------------------
    const webSearchToolDeclaration: FunctionDeclaration = {
      name: "WebSearch",
      description: "Searches the web for information given a specific query string.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: "Search query string",
          },
        },
        required: ["query"],
      },
    };

    const runResearcherSubagent = async (subQuestion: string, index: number): Promise<string> => {
      console.log(`\n🤖 [Coordinator] Delegating to subagent: ${webResearcher.name} (Task ${index + 1})`);
      console.log(`   Task: ${subQuestion}`);

      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: webResearcher.prompt,
        tools: [{ functionDeclarations: [webSearchToolDeclaration] }],
      });

      const chat = model.startChat();
      let response = await chat.sendMessage(`Investigate this sub-question: ${subQuestion}`);

      // Handle function calls iteratively
      while (response.response.functionCalls() && response.response.functionCalls()!.length > 0) {
        const functionCalls = response.response.functionCalls()!;
        const toolResponseParts: Part[] = [];

        for (const call of functionCalls) {
          if (call.name === "WebSearch") {
            const queryArg = (call.args as any)?.query || subQuestion;
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

            toolResponseParts.push({
              functionResponse: {
                name: "WebSearch",
                response: functionResult,
              },
            });
          }
        }

        // Send function execution results back to model
        response = await chat.sendMessage(toolResponseParts);
      }

      return response.response.text();
    };

    // Execute web-researcher subagents in parallel
    const researchFindings = await Promise.all(
      subQuestions.map((sq, idx) => runResearcherSubagent(sq, idx))
    );

    // ---------------------------------------------------------
    // Phase 3: Summarizer Subagent - Synthesis (Zero Tools)
    // ---------------------------------------------------------
    console.log(`\n🤖 [Coordinator] Delegating to subagent: ${summarizer.name}`);
    console.log(`   Task: Synthesizing all collected research findings`);

    const summarizerModel = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: summarizer.prompt,
      tools: [], // Pure synthesis agent with zero tool permissions
    });

    let combinedContext = `Original Research Question: ${question}\n\n`;
    subQuestions.forEach((sq, idx) => {
      combinedContext += `--- Research Findings for Sub-question ${idx + 1}: "${sq}" ---\n`;
      combinedContext += `${researchFindings[idx]}\n\n`;
    });

    const finalResponse = await summarizerModel.generateContent(combinedContext);
    const finalAnswer = finalResponse.response.text();

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
