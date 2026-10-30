import type { ErrorCode } from "@/lib/api";

export type ApiErrorCode = Exclude<ErrorCode, "unknown">;

/** The status `crates/nowvi-api/src/error.rs` pairs with each `{"error": code}` body. */
export const ERROR_STATUS: Record<ApiErrorCode, number> = {
  invalid_url: 400,
  unsupported_platform: 422,
  platform_unavailable: 503,
  too_long: 422,
  not_found: 404,
  rate_limited: 429,
  extract_failed: 502,
  busy: 503,
  too_early: 425,
  expired: 410,
  payments_disabled: 503,
  invalid_token: 401,
};

export const errorBody = (code: ApiErrorCode) => ({ error: code });
