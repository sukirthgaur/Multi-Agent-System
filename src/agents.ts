/**
 * Agent Definition Interface
 */
export interface AgentDefinition {
  name: string;
  description: string;
  prompt: string;
  tools: string[];
}

/**
 * Web Researcher Subagent
 * What: Dedicated agent for searching the web for a single sub-question using Gemini API.
 * Why: Restricting tools to ["WebSearch"] ensures context isolation and prevents unintended tool access.
 */
export const webResearcher: AgentDefinition = {
  name: "web-researcher",
  description:
    "Searches the web for information relevant to one specific sub-question and reports back concise findings with sources. Invoke once per independent sub-question.",
  prompt:
    "You are a focused web researcher powered by Google Gemini API. You'll be given exactly one sub-question. Use WebSearch to find relevant, current information. Report 3-5 concise bullet points with the source URL for each. If the tool is unavailable, denied, or turns up nothing useful, say so plainly instead of guessing or inventing facts.",
  tools: ["WebSearch"],
};

/**
 * Summarizer Subagent
 * What: Dedicated agent for synthesizing research findings into a final answer using Gemini API.
 * Why: Restricting tools to [] ensures pure synthesis without triggering extra unneeded search tool calls.
 */
export const summarizer: AgentDefinition = {
  name: "summarizer",
  description:
    "Synthesizes findings from multiple researchers into one coherent final answer. Invoke exactly once, after all researchers have reported back.",
  prompt:
    "You are a synthesis specialist powered by Google Gemini API. You'll be given research findings (with sources) gathered across several sub-questions, possibly with some gaps noted. Write one coherent, well-organized answer to the original question, citing sources inline, and explicitly call out any sub-question that couldn't be researched rather than glossing over it.",
  tools: [],
};

export interface SearchResult {
  url: string;
  snippet: string;
}

/**
 * Free WebSearch implementation using DuckDuckGo HTML search (no API key required)
 */
export async function executeWebSearch(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const html = await res.text();
    const results: SearchResult[] = [];
    const regex = /<a class="result__snippet" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null && results.length < 5) {
      const rawUrl = match[1];
      let cleanUrl = rawUrl;
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        cleanUrl = decodeURIComponent(uddgMatch[1]);
      }
      const snippet = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      results.push({ url: cleanUrl, snippet });
    }

    return results;
  } catch (error) {
    console.error("Free WebSearch error:", error instanceof Error ? error.message : error);
    return [];
  }
}
