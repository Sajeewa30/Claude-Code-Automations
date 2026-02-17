import { googleAds } from "../shared/config.js";
import type {
  KeywordData,
  RsaAdData,
  RsaAsset,
  SearchTermData,
  AdGroupPerformance,
  AdGroupBundle,
} from "./types.js";
import {
  keywordsByAdGroupQuery,
  rsaAdsQuery,
  searchTermsQuery,
  adGroupPerformanceQuery,
} from "./queries.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_API_BASE = "https://googleads.googleapis.com/v18";

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Refresh OAuth2 access token */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: googleAds.clientId,
      client_secret: googleAds.clientSecret,
      refresh_token: googleAds.refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

/** Execute a GAQL query via searchStream */
async function executeGaql(customerId: string, query: string): Promise<any[]> {
  const token = await getAccessToken();
  const cleanId = customerId.replace(/-/g, "");
  const url = `${ADS_API_BASE}/customers/${cleanId}/googleAds:searchStream`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "developer-token": googleAds.developerToken,
  };

  if (googleAds.loginCustomerId) {
    headers["login-customer-id"] = googleAds.loginCustomerId.replace(/-/g, "");
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Ads API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as any[];
  // searchStream returns an array of batches, each with a results array
  return data.flatMap((batch: any) => batch.results || []);
}

// --- Data fetchers ---

export async function fetchKeywords(
  customerId: string,
  dateRange = "LAST_30_DAYS"
): Promise<KeywordData[]> {
  const rows = await executeGaql(customerId, keywordsByAdGroupQuery(dateRange));
  return rows.map((r: any) => ({
    adGroupId: r.adGroup.id,
    adGroupName: r.adGroup.name,
    campaignId: r.campaign.id,
    campaignName: r.campaign.name,
    keywordText: r.adGroupCriterion.keyword.text,
    matchType: r.adGroupCriterion.keyword.matchType,
    impressions: Number(r.metrics.impressions),
    clicks: Number(r.metrics.clicks),
    conversions: Number(r.metrics.conversions),
    costMicros: Number(r.metrics.costMicros),
    averageCpc: Number(r.metrics.averageCpc),
  }));
}

export async function fetchRsaAds(customerId: string): Promise<RsaAdData[]> {
  const rows = await executeGaql(customerId, rsaAdsQuery());
  return rows.map((r: any) => ({
    adGroupId: r.adGroup.id,
    adGroupName: r.adGroup.name,
    adId: r.adGroupAd.ad.id,
    headlines: (r.adGroupAd.ad.responsiveSearchAd?.headlines || []).map(
      (h: any): RsaAsset => ({ text: h.text, pinnedField: h.pinnedField || undefined })
    ),
    descriptions: (r.adGroupAd.ad.responsiveSearchAd?.descriptions || []).map(
      (d: any): RsaAsset => ({ text: d.text, pinnedField: d.pinnedField || undefined })
    ),
    status: r.adGroupAd.status,
    finalUrls: r.adGroupAd.ad.finalUrls || [],
  }));
}

export async function fetchSearchTerms(
  customerId: string,
  dateRange = "LAST_30_DAYS"
): Promise<SearchTermData[]> {
  const rows = await executeGaql(customerId, searchTermsQuery(dateRange));
  return rows.map((r: any) => ({
    adGroupId: r.adGroup.id,
    adGroupName: r.adGroup.name,
    searchTerm: r.searchTermView.searchTerm,
    status: r.searchTermView.status,
    impressions: Number(r.metrics.impressions),
    clicks: Number(r.metrics.clicks),
    conversions: Number(r.metrics.conversions),
    costMicros: Number(r.metrics.costMicros),
  }));
}

export async function fetchAdGroupPerformance(
  customerId: string,
  dateRange = "LAST_30_DAYS"
): Promise<AdGroupPerformance[]> {
  const rows = await executeGaql(customerId, adGroupPerformanceQuery(dateRange));
  return rows.map((r: any) => ({
    adGroupId: r.adGroup.id,
    adGroupName: r.adGroup.name,
    campaignId: r.campaign.id,
    campaignName: r.campaign.name,
    impressions: Number(r.metrics.impressions),
    clicks: Number(r.metrics.clicks),
    conversions: Number(r.metrics.conversions),
    costMicros: Number(r.metrics.costMicros),
  }));
}

/** Fetch all data and bundle by ad group */
export async function fetchAdGroupBundles(
  customerId: string,
  dateRange = "LAST_30_DAYS"
): Promise<AdGroupBundle[]> {
  const [keywords, rsaAds, searchTerms, performance] = await Promise.all([
    fetchKeywords(customerId, dateRange),
    fetchRsaAds(customerId),
    fetchSearchTerms(customerId, dateRange),
    fetchAdGroupPerformance(customerId, dateRange),
  ]);

  // Group by ad group ID
  const adGroupIds = new Set(performance.map((p) => p.adGroupId));
  const bundles: AdGroupBundle[] = [];

  for (const agId of adGroupIds) {
    const perf = performance.find((p) => p.adGroupId === agId);
    if (!perf) continue;

    bundles.push({
      adGroupId: agId,
      adGroupName: perf.adGroupName,
      campaignId: perf.campaignId,
      campaignName: perf.campaignName,
      keywords: keywords.filter((k) => k.adGroupId === agId),
      rsaAds: rsaAds.filter((a) => a.adGroupId === agId),
      searchTerms: searchTerms.filter((s) => s.adGroupId === agId),
      performance: perf,
    });
  }

  return bundles;
}
