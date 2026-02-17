You are restructuring a Google Ads ad group that failed the Headline Test (multiple intents detected).

## Ad Group: "{{adGroupName}}"
## Campaign: "{{campaignName}}"

### Intent Clusters Identified:
{{intentClusters}}

### All Keywords with Metrics:
{{keywordMetrics}}

## Task

Recommend a new ad group structure that fixes the intent divergence.

## Rules

1. Each new ad group must pass the Headline Test (one coherent intent theme)
2. Name new ad groups descriptively: "{CampaignTheme} - {Intent/Topic}"
3. Assign each keyword to exactly ONE new ad group
4. For each new ad group, recommend negative keywords to prevent traffic bleed between groups
5. Preserve the highest-performing ad group name if possible (preserves Quality Score history)
6. Never consolidate past the point where ads stop being specific
7. Negative keywords should use appropriate match types (broad match negative for general blocking)

## Return JSON only:

```json
{
  "currentAdGroup": string,
  "recommendedAdGroups": [
    {
      "name": string,
      "theme": string,
      "keywords": [{ "text": string, "matchType": string }],
      "negativeKeywords": [{ "text": string, "matchType": string }],
      "suggestedHeadline": string
    }
  ],
  "reasoning": string
}
```
