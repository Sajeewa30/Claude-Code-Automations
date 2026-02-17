/** GAQL queries for the Improve Ad Relevance SOP */

export function keywordsByAdGroupQuery(dateRange = "LAST_30_DAYS"): string {
  return `
    SELECT
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      metrics.average_cpc
    FROM keyword_view
    WHERE campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND ad_group_criterion.status = 'ENABLED'
      AND segments.date DURING ${dateRange}
    ORDER BY metrics.impressions DESC
  `.trim();
}

export function rsaAdsQuery(): string {
  return `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.status,
      ad_group_ad.ad.final_urls
    FROM ad_group_ad
    WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
  `.trim();
}

export function searchTermsQuery(dateRange = "LAST_30_DAYS"): string {
  return `
    SELECT
      ad_group.id,
      ad_group.name,
      search_term_view.search_term,
      search_term_view.status,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros
    FROM search_term_view
    WHERE campaign.status = 'ENABLED'
      AND segments.date DURING ${dateRange}
      AND metrics.impressions > 0
    ORDER BY metrics.impressions DESC
  `.trim();
}

export function adGroupPerformanceQuery(dateRange = "LAST_30_DAYS"): string {
  return `
    SELECT
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros
    FROM ad_group
    WHERE campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND segments.date DURING ${dateRange}
  `.trim();
}
