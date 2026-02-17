# Improve Ad Relevance SOP Automation

You are executing the Google Ads "Improve Ad Relevance" SOP. This SOP fixes semantic mismatch between Ad Groups, Keywords, and RSA Assets.

## Input

The user provides a Google Ads Customer ID (format: xxx-xxx-xxxx) as the argument: $ARGUMENTS

If no customer ID is provided, ask for it before proceeding.

Optional parameters (ask if not provided):
- Campaign filter (specific campaign IDs or "all active Search campaigns")
- Date range (default: LAST_30_DAYS)

## Setup

Before running, ensure `.env` is configured with Google Ads and Anthropic API credentials. Run scripts with `npx tsx`.

## Execution Flow

Execute each phase sequentially. **Pause after each phase** to show results and get user approval before continuing.

---

### PHASE 1: DIAGNOSE

Run the diagnosis for each ad group:

```bash
npx tsx src/analysis/headline-test.ts
npx tsx src/analysis/intent-classifier.ts
```

**1.1 Headline Test:** For each ad group, pull keywords sorted by impressions. Determine if a single headline could serve all keywords. If not, identify intent clusters.

**1.2 Intent-Message Alignment:** Classify each keyword as informational/commercial/transactional. Check if current RSA copy matches the dominant intent type.

**After Phase 1, present results to the user:**
- Show which ad groups PASSED vs FAILED the headline test
- Show intent classification and alignment status
- Ask: "Should I proceed with Phase 2 (Fix Structure) for the N failing ad groups?" (only if splits needed)
- Ask: "Should I proceed with Phase 3 (Fix Copy)?"

---

### PHASE 2: FIX STRUCTURE (only if Phase 1 found issues)

**2.1 Split & Route:**
- For each ad group that failed the headline test, generate split recommendations
- Show: new ad group names, keyword assignments, negative keyword recommendations
- Ask user to approve the proposed structure before generating CSVs

**2.2 Query Promotion:**
- Analyze search terms report (impressions >= 50)
- Apply decision filter: Does this query add DKI or QS monitoring value?
- Show promotion/negative recommendations

---

### PHASE 3: FIX COPY (always runs)

**3.1 Headline Relevance:**
- Select method per ad group: STATIC (few keywords), DKI (many variations), COMBO (mixed)
- Generate 15 headlines with semantic signal distribution
- Validate all headlines <= 30 characters
- Show headlines with purpose and pinning recommendations

**3.2 Description Relevance:**
- Generate 4 descriptions per ad group
- D1 MUST contain core keyword phrase (bold text optimization)
- Validate all descriptions <= 90 characters
- Show descriptions for review

**After Phase 3:** Allow user to request revisions to specific headlines or descriptions.

---

## Output Generation

After all phases are approved, generate output files in the `output/` directory:

1. `diagnosis-report-{date}.md` — Full diagnosis report
2. `rsa-ads-{date}.csv` — New/updated RSA ads for Google Ads Editor
3. `keywords-{date}.csv` — Keyword changes (promotions, moves)
4. `negative-keywords-{date}.csv` — Negative keywords for traffic routing
5. `ad-groups-{date}.csv` — New ad group definitions (if splits)

Tell the user the file paths and remind them to:
- Import CSVs into Google Ads Editor
- Review all changes before posting
- Monitor Ad Relevance scores for 14 days

## Important Rules

- Use the TypeScript modules in `src/` — do NOT reimplement the logic
- Always show results between phases and wait for approval
- Character limits are hard: Headlines <= 30, Descriptions <= 90
- If Claude generates over-length copy, trigger the retry logic in the writer modules
- The SOP reference document is in the project root for context on methodology
