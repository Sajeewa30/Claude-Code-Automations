/** Keyword data from keyword_view */
export interface KeywordData {
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
  keywordText: string;
  matchType: "EXACT" | "PHRASE" | "BROAD";
  impressions: number;
  clicks: number;
  conversions: number;
  costMicros: number;
  averageCpc: number;
}

/** RSA ad with its assets */
export interface RsaAdData {
  adGroupId: string;
  adGroupName: string;
  adId: string;
  headlines: RsaAsset[];
  descriptions: RsaAsset[];
  status: string;
  finalUrls: string[];
}

export interface RsaAsset {
  text: string;
  pinnedField?: "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" | "DESCRIPTION_1" | "DESCRIPTION_2";
}

/** Search term from search_term_view */
export interface SearchTermData {
  adGroupId: string;
  adGroupName: string;
  searchTerm: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  costMicros: number;
}

/** Ad group performance summary */
export interface AdGroupPerformance {
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  costMicros: number;
}

/** Grouped data for a single ad group (used across phases) */
export interface AdGroupBundle {
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
  keywords: KeywordData[];
  rsaAds: RsaAdData[];
  searchTerms: SearchTermData[];
  performance: AdGroupPerformance;
}

// --- Analysis result types ---

export interface HeadlineTestResult {
  adGroupId: string;
  adGroupName: string;
  passes: boolean;
  suggestedHeadline: string | null;
  intentClusters: IntentCluster[];
  reasoning: string;
}

export interface IntentCluster {
  clusterName: string;
  theme: string;
  keywords: string[];
  suggestedHeadline: string;
}

export interface IntentClassificationResult {
  adGroupId: string;
  adGroupName: string;
  keywords: { keyword: string; intent: IntentType; confidence: number }[];
  dominantIntent: IntentType;
  copyMatchesIntent: boolean;
  mismatchDetails: string | null;
  recommendedCopyDirection: string;
}

export type IntentType = "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL";

export interface SplitRecommendation {
  currentAdGroup: string;
  recommendedAdGroups: {
    name: string;
    theme: string;
    keywords: { text: string; matchType: string }[];
    negativeKeywords: { text: string; matchType: string }[];
  }[];
  reasoning: string;
}

export interface QueryPromotionResult {
  recommendations: {
    searchTerm: string;
    action: "PROMOTE_EXACT" | "PROMOTE_PHRASE" | "DKI_CANDIDATE" | "IGNORE" | "NEGATIVE";
    targetAdGroup: string;
    reasoning: string;
    metrics: { impressions: number; clicks: number; conversions: number; costMicros: number };
  }[];
}

export interface GeneratedHeadlines {
  method: "STATIC" | "DKI" | "COMBO";
  headlines: {
    position: number;
    text: string;
    pinTo: number | null;
    purpose: string;
    charCount: number;
  }[];
  dkiDefault: string | null;
}

export interface GeneratedDescriptions {
  descriptions: {
    position: number;
    text: string;
    purpose: string;
    containsKeyword: boolean;
    charCount: number;
  }[];
}

// --- Diagnosis aggregate ---

export interface DiagnosisReport {
  customerId: string;
  dateRange: string;
  adGroups: {
    adGroupId: string;
    adGroupName: string;
    campaignName: string;
    keywordCount: number;
    totalImpressions: number;
    headlineTest: HeadlineTestResult;
    intentClassification: IntentClassificationResult;
    needsSplit: boolean;
    needsCopyFix: boolean;
  }[];
}
