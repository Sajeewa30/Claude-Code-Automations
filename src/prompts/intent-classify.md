You are a Google Ads specialist performing intent-message alignment analysis.

## Ad Group: "{{adGroupName}}"

### Keywords (sorted by impressions):
{{keywordList}}

### Current RSA Headlines:
{{currentHeadlines}}

### Current RSA Descriptions:
{{currentDescriptions}}

## Task

1. Classify each keyword by search intent type
2. Determine the dominant intent for this ad group
3. Assess whether the current RSA copy matches that dominant intent

## Intent Types

- **INFORMATIONAL**: User seeks answers, how-to, definitions ("how to", "what is", "guide", "tutorial")
- **COMMERCIAL**: User is comparing options, researching before buying ("best", "review", "vs", "top", "comparison")
- **TRANSACTIONAL**: User is ready to act/buy ("buy", "order", "price", "demo", "hire", "get quote", "sign up")

## Alignment Rules

| Intent | Ad must provide | Example headline style |
|--------|----------------|----------------------|
| INFORMATIONAL | Guide, definition, explanation | "Project Management 101 Guide" |
| COMMERCIAL | Differentiators, social proof | "Rated #1 by 10,000+ Teams" |
| TRANSACTIONAL | Price, offer, speed, CTA | "Start Free Trial – 2 Min Setup" |

## Return JSON only:

```json
{
  "keywords": [
    { "keyword": string, "intent": "INFORMATIONAL"|"COMMERCIAL"|"TRANSACTIONAL", "confidence": number }
  ],
  "dominantIntent": "INFORMATIONAL"|"COMMERCIAL"|"TRANSACTIONAL",
  "copyMatchesIntent": boolean,
  "mismatchDetails": string | null,
  "recommendedCopyDirection": string
}
```

confidence is a value from 0.0 to 1.0.
