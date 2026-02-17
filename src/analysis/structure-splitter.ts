import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../shared/config.js";
import { loadPrompt, microsToDollars } from "../shared/utils.js";
import type {
  AdGroupBundle,
  HeadlineTestResult,
  SplitRecommendation,
} from "../google-ads/types.js";

const client = new Anthropic({ apiKey: anthropic.apiKey });

/** Recommend ad group splits (Phase 2.1) for an ad group that failed the Headline Test */
export async function recommendSplit(
  bundle: AdGroupBundle,
  headlineTest: HeadlineTestResult
): Promise<SplitRecommendation> {
  const intentClusters = JSON.stringify(headlineTest.intentClusters, null, 2);

  const keywordMetrics = bundle.keywords
    .map(
      (k) =>
        `- "${k.keywordText}" (${k.matchType}) | Imp: ${k.impressions} | Clicks: ${k.clicks} | Conv: ${k.conversions} | Cost: $${microsToDollars(k.costMicros)}`
    )
    .join("\n");

  const prompt = await loadPrompt("split-recommend.md", {
    adGroupName: bundle.adGroupName,
    campaignName: bundle.campaignName,
    intentClusters,
    keywordMetrics,
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
