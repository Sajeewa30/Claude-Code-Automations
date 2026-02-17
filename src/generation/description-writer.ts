import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../shared/config.js";
import { loadPrompt } from "../shared/utils.js";
import type {
  AdGroupBundle,
  IntentClassificationResult,
  GeneratedHeadlines,
  GeneratedDescriptions,
} from "../google-ads/types.js";

const client = new Anthropic({ apiKey: anthropic.apiKey });
const MAX_DESC_CHARS = 90;
const MAX_RETRIES = 2;

/** Generate descriptions (Phase 3.2) for a single ad group */
export async function generateDescriptions(
  bundle: AdGroupBundle,
  intentResult: IntentClassificationResult,
  headlines: GeneratedHeadlines
): Promise<GeneratedDescriptions> {
  const keywords = bundle.keywords
    .map((k) => `"${k.keywordText}"`)
    .join(", ");

  const finalUrl =
    bundle.rsaAds[0]?.finalUrls[0] || "(no URL found)";

  const headlinesSummary = headlines.headlines
    .map((h) => `H${h.position}: "${h.text}"`)
    .join("\n");

  const prompt = await loadPrompt("write-descriptions.md", {
    adGroupName: bundle.adGroupName,
    keywords,
    dominantIntent: intentResult.dominantIntent,
    headlines: headlinesSummary,
    finalUrl,
  });

  let result = await callClaude(prompt);
  let retries = 0;

  // Validate character limits and retry if needed
  while (retries < MAX_RETRIES && hasOverlengthDescriptions(result)) {
    const overLength = result.descriptions.filter(
      (d) => d.text.length > MAX_DESC_CHARS
    );
    const fixPrompt = `Some descriptions exceed the 90 character limit. Please rewrite ONLY these descriptions to fit within 90 characters:\n\n${overLength.map((d) => `- D${d.position}: "${d.text}" (${d.text.length} chars)`).join("\n")}\n\nReturn the COMPLETE descriptions array with all 4 descriptions in the same JSON format.`;

    result = await callClaude(fixPrompt);
    retries++;
  }

  return result;
}

function hasOverlengthDescriptions(result: GeneratedDescriptions): boolean {
  return result.descriptions.some((d) => d.text.length > MAX_DESC_CHARS);
}

async function callClaude(prompt: string): Promise<GeneratedDescriptions> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
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
