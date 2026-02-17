import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../shared/config.js";
import { loadPrompt, microsToDollars } from "../shared/utils.js";
import type {
  AdGroupBundle,
  QueryPromotionResult,
} from "../google-ads/types.js";

const client = new Anthropic({ apiKey: anthropic.apiKey });

const MIN_IMPRESSIONS = 50;

/** Analyze search terms for promotion (Phase 2.2) */
export async function analyzeQueryPromotions(
  bundle: AdGroupBundle
): Promise<QueryPromotionResult> {
  const currentKeywords = bundle.keywords
    .map((k) => `- "${k.keywordText}" (${k.matchType})`)
    .join("\n");

  // Filter to high-signal search terms
  const highSignalTerms = bundle.searchTerms.filter(
    (st) => st.impressions >= MIN_IMPRESSIONS
  );

  if (highSignalTerms.length === 0) {
    return { recommendations: [] };
  }

  const searchTerms = highSignalTerms
    .map(
      (st) =>
        `- "${st.searchTerm}" | Imp: ${st.impressions} | Clicks: ${st.clicks} | Conv: ${st.conversions} | Cost: $${microsToDollars(st.costMicros)}`
    )
    .join("\n");

  const prompt = await loadPrompt("query-promotion.md", {
    adGroupName: bundle.adGroupName,
    currentKeywords,
    searchTerms,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return extractJson(text);
}

function extractJson(text: string): any {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}
