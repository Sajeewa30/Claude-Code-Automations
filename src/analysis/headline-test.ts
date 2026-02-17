import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../shared/config.js";
import { loadPrompt } from "../shared/utils.js";
import type { AdGroupBundle, HeadlineTestResult } from "../google-ads/types.js";

const client = new Anthropic({ apiKey: anthropic.apiKey });

/** Run the Headline Test (Phase 1.1) for a single ad group */
export async function runHeadlineTest(
  bundle: AdGroupBundle
): Promise<HeadlineTestResult> {
  const keywordList = bundle.keywords
    .map((k) => `- "${k.keywordText}" (${k.matchType}, ${k.impressions} imp)`)
    .join("\n");

  const prompt = await loadPrompt("headline-test.md", {
    adGroupName: bundle.adGroupName,
    keywordList,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const json = extractJson(text);

  return {
    adGroupId: bundle.adGroupId,
    adGroupName: bundle.adGroupName,
    passes: json.passes,
    suggestedHeadline: json.suggestedHeadline || null,
    intentClusters: json.intentClusters || [],
    reasoning: json.reasoning || "",
  };
}

/** Run Headline Test for all ad group bundles */
export async function runHeadlineTestAll(
  bundles: AdGroupBundle[]
): Promise<HeadlineTestResult[]> {
  const results: HeadlineTestResult[] = [];
  for (const bundle of bundles) {
    if (bundle.keywords.length === 0) continue;
    results.push(await runHeadlineTest(bundle));
  }
  return results;
}

function extractJson(text: string): any {
  // Try to extract JSON from markdown code blocks or raw text
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}
