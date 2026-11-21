import type { ApiMode, ForcedLanguageFailure, ForcedLocale } from './env';

export const API_MODE_OVERRIDE: ApiMode | null = 'gateway';
export const API_GATEWAY_URL_OVERRIDE: string | null =
  'https://junior-primate-garment.ngrok-free.dev';
export const HOST_OVERRIDE: string | null = null;

// Build-time, like MOCK_ROLE/MOCK_SCENARIO: SPEC 16.2 resolves this once, at module init. Null leaves it to the device.
export const FORCE_LOCALE_OVERRIDE: ForcedLocale | null = null;

// E7/S-12 has no service, so there's no USE_MOCK_* to force its failure states; null is the committed default.
export const FORCE_LANGUAGE_FAILURE_OVERRIDE: ForcedLanguageFailure | null = null;
