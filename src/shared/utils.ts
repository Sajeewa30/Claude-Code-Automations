import { readFile } from "fs/promises";
import { resolve } from "path";

/** Load a prompt template from src/prompts/ and replace {{variables}} */
export async function loadPrompt(
  filename: string,
  vars: Record<string, string>
): Promise<string> {
  const path = resolve(import.meta.dirname, "../prompts", filename);
  let template = await readFile(path, "utf-8");
  for (const [key, value] of Object.entries(vars)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }
  return template;
}

/** Format a number as currency (micros to dollars) */
export function microsToDollars(micros: number): string {
  return (micros / 1_000_000).toFixed(2);
}

/** Get today's date as YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Truncate text to max length with ellipsis */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
