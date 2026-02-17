import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../shared/config.js";
import { loadPrompt } from "../shared/utils.js";
import type {
  AdGroupBundle,
  IntentClassificationResult,
  GeneratedHeadlines,
} from "../google-ads/types.js";

const client = new Anthropic({ apiKey: anthropic.apiKey });
const MAX_HEADLINE_CHARS = 30;
const MAX_RETRIES = 2;

/** Generate headlines (Phase 3.1) for a single ad group */
export async function generateHeadlines(
  bundle: AdGroupBundle,
  intentResult: IntentClassificationResult
): Promise<GeneratedHeadlines> {
  const keywords = bundle.keywords
    .map((k) => `"${k.keywordText}"`)
    .join(", ");

  const finalUrl =
    bundle.rsaAds[0]?.finalUrls[0] || "(no URL found)";

  const prompt = await loadPrompt("write-headlines.md", {
    adGroupName: bundle.adGroupName,
    keywords,
    dominantIntent: intentResult.dominantIntent,
    finalUrl,
  });

  let result = await callClaude(prompt);
  let retries = 0;

  // Validate character limits and retry if needed
  while (retries < MAX_RETRIES && hasOverlengthHeadlines(result)) {
    const overLength = result.headlines.filter(
      (h) => h.text.length > MAX_HEADLINE_CHARS
    );
    const fixPrompt = `Some headlines exceed the 30 character limit. Please rewrite ONLY these headlines to fit within 30 characters:\n\n${overLength.map((h) => `- H${h.position}: "${h.text}" (${h.text.length} chars)`).join("\n")}\n\nReturn the COMPLETE headlines array with all 15 headlines (fixed ones + unchanged ones) in the same JSON format.`;

    result = await callClaude(fixPrompt);
    retries++;
  }

  return result;
}

function hasOverlengthHeadlines(result: GeneratedHeadlines): boolean {
  return result.headlines.some((h) => h.text.length > MAX_HEADLINE_CHARS);
}

async function callClaude(prompt: string): Promise<GeneratedHeadlines> {
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
