import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../shared/config.js";
import { loadPrompt } from "../shared/utils.js";
import type {
  AdGroupBundle,
  IntentClassificationResult,
} from "../google-ads/types.js";

const client = new Anthropic({ apiKey: anthropic.apiKey });

/** Run Intent Classification (Phase 1.2) for a single ad group */
export async function classifyIntent(
  bundle: AdGroupBundle
): Promise<IntentClassificationResult> {
  const keywordList = bundle.keywords
    .map((k) => `- "${k.keywordText}" (${k.impressions} imp, ${k.clicks} clicks)`)
    .join("\n");

  const currentHeadlines = bundle.rsaAds
    .flatMap((ad) => ad.headlines.map((h) => h.text))
    .map((h) => `- "${h}"`)
    .join("\n") || "- (no headlines found)";

  const currentDescriptions = bundle.rsaAds
    .flatMap((ad) => ad.descriptions.map((d) => d.text))
    .map((d) => `- "${d}"`)
    .join("\n") || "- (no descriptions found)";

  const prompt = await loadPrompt("intent-classify.md", {
    adGroupName: bundle.adGroupName,
    keywordList,
    currentHeadlines,
    currentDescriptions,
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
    keywords: json.keywords || [],
    dominantIntent: json.dominantIntent,
    copyMatchesIntent: json.copyMatchesIntent,
    mismatchDetails: json.mismatchDetails || null,
    recommendedCopyDirection: json.recommendedCopyDirection || "",
  };
}

/** Run intent classification for all bundles */
export async function classifyIntentAll(
  bundles: AdGroupBundle[]
): Promise<IntentClassificationResult[]> {
  const results: IntentClassificationResult[] = [];
  for (const bundle of bundles) {
    if (bundle.keywords.length === 0) continue;
    results.push(await classifyIntent(bundle));
  }
  return results;
}

function extractJson(text: string): any {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}
