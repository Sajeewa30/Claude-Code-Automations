import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dirname, "../../.env") });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function optional(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const googleAds = {
  clientId: required("GOOGLE_ADS_CLIENT_ID"),
  clientSecret: required("GOOGLE_ADS_CLIENT_SECRET"),
  refreshToken: required("GOOGLE_ADS_REFRESH_TOKEN"),
  developerToken: required("GOOGLE_ADS_DEVELOPER_TOKEN"),
  customerId: required("GOOGLE_ADS_CUSTOMER_ID"),
  loginCustomerId: optional("GOOGLE_ADS_LOGIN_CUSTOMER_ID"),
};

export const anthropic = {
  apiKey: required("ANTHROPIC_API_KEY"),
};
