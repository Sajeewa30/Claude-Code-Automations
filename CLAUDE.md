# Ad Relevance SOP Automation

## Project Overview

This project automates the "Improve Ad Relevance" SOP for Google Ads. It diagnoses semantic mismatches between ad groups, keywords, and RSA assets, then generates fixes.

## Architecture

Two delivery paths share a common TypeScript core:

1. **Claude Code slash command** (`/improve-ad-relevance`) — interactive, phase-by-phase with user approval
2. **n8n workflows** (`n8n/`) — automated, triggered via webhook or schedule

## Key Directories

- `src/google-ads/` — API client, GAQL queries, TypeScript types
- `src/analysis/` — Phase 1 (headline test, intent classifier) + Phase 2 (splitter, query promoter)
- `src/generation/` — Phase 3 (headline writer, description writer)
- `src/prompts/` — Claude AI prompt templates (Mustache-style `{{vars}}`)
- `src/output/` — Report builder (Markdown) + CSV builder (Google Ads Editor format)
- `n8n/` — 4 workflow JSONs (main orchestrator + 3 phase sub-workflows)
- `output/` — Generated reports and CSVs (gitignored)

## Running Scripts

```bash
npx tsx src/analysis/headline-test.ts
npx tsx src/analysis/intent-classifier.ts
npx tsx src/generation/headline-writer.ts
```

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- Google Ads API credentials (OAuth client, refresh token, developer token, customer ID)
- Anthropic API key

## n8n Setup

1. Import `n8n/phase1-diagnose.json`, `phase2-structure.json`, `phase3-copy.json` as separate workflows
2. Import `n8n/main-workflow.json` as the orchestrator
3. Update the "Execute Workflow" nodes in the orchestrator with the actual sub-workflow IDs
4. Configure Google Ads OAuth2 API credential in n8n
5. Set `ANTHROPIC_API_KEY` in n8n environment variables

## SOP Phases

| Phase | Purpose | Modules |
|-------|---------|---------|
| 1: Diagnose | Headline Test + Intent Alignment | `headline-test.ts`, `intent-classifier.ts` |
| 2: Fix Structure | Split ad groups + Query promotion | `structure-splitter.ts`, `query-promoter.ts` |
| 3: Fix Copy | Headlines + Descriptions | `headline-writer.ts`, `description-writer.ts` |

## Character Limits (enforced in code)

- Headlines: 30 characters max
- Descriptions: 90 characters max
- URL Path 1/2: 15 characters max each
