import {
  ARABIC_QUOTING_LATIN,
  ARABIC_SERVER_MESSAGE,
  ARABIC_TOO_LONG,
  ARABIC_WITH_EXCEPTION,
  ENGLISH_SERVER_MESSAGE,
  ERROR_CATALOGUE_AR,
  ERROR_CATALOGUE_EN,
} from '@/__fixtures__/serverMessages';
import type { ForcedLocale } from '@/config/env';

/** The server-message-vs-local-fallback decision, locale-dependent since E4 replaced the old Arabic containment test. */
function load(forced: ForcedLocale | null) {
  jest.resetModules();
  jest.doMock('@/config/env', () => ({ FORCE_LOCALE: forced }));
  jest.doMock('@/i18n/ar.json', () => ERROR_CATALOGUE_AR);
  jest.doMock('@/i18n/en.json', () => ERROR_CATALOGUE_EN);

  return require('../errorMessages') as typeof import('../errorMessages');
}

describe('isDisplayable', () => {
  it('shows a server message written in the active locale', () => {
    expect(load(null).isDisplayable(ARABIC_SERVER_MESSAGE)).toBe(true);
    // Symmetric with the row above, and new: before E4 this always lost to the fallback.
    expect(load('en').isDisplayable(ENGLISH_SERVER_MESSAGE)).toBe(true);
  });

  it('refuses one written in the other language, in both directions', () => {
    expect(load(null).isDisplayable(ENGLISH_SERVER_MESSAGE)).toBe(false);
    // The row that was broken: this passed the containment test and was shown.
    expect(load('en').isDisplayable(ARABIC_SERVER_MESSAGE)).toBe(false);
  });

  it('refuses content with no strong character, which carries no language', () => {
    const { isDisplayable } = load(null);

    expect(isDisplayable('1043')).toBe(false);
    expect(isDisplayable('#1043 — 24-48 (91%)')).toBe(false);
    expect(isDisplayable('')).toBe(false);
    expect(isDisplayable(undefined)).toBe(false);
  });

  // These guards sit in front of the script test and keep raw backend prose off a farmer's screen.
  it('still refuses a stack trace or a sentence too long to be copy', () => {
    const { isDisplayable } = load(null);

    expect(isDisplayable(ARABIC_WITH_EXCEPTION)).toBe(false);
    expect(isDisplayable('at Npgsql.NpgsqlConnection.Open()')).toBe(false);
    expect(isDisplayable(ARABIC_TOO_LONG)).toBe(false);
  });

  it('follows the first strong character, so a quoted part number does not flip it', () => {
    expect(load(null).isDisplayable(ARABIC_QUOTING_LATIN)).toBe(true);
    expect(load('en').isDisplayable(ARABIC_QUOTING_LATIN)).toBe(false);
  });
});

describe('resolveUserMessage', () => {
  it('prefers the frontend copy for a code it knows, in the active locale', () => {
    expect(load(null).resolveUserMessage('CONFLICT', 409, ARABIC_SERVER_MESSAGE)).toBe(
      ERROR_CATALOGUE_AR['errors.api.alreadyExists'],
    );
    expect(load('en').resolveUserMessage('CONFLICT', 409, ARABIC_SERVER_MESSAGE)).toBe(
      ERROR_CATALOGUE_EN['errors.api.alreadyExists'],
    );
  });

  it('falls through to the status copy when the server message is the wrong language', () => {
    // No code, so the server message is the only other candidate - and it loses.
    expect(load('en').resolveUserMessage(undefined, 409, ARABIC_SERVER_MESSAGE)).toBe(
      ERROR_CATALOGUE_EN['errors.api.conflict'],
    );
  });

  it('uses the server message when it is in the active locale and no code matched', () => {
    expect(load(null).resolveUserMessage(undefined, 409, ARABIC_SERVER_MESSAGE)).toBe(
      ARABIC_SERVER_MESSAGE,
    );
    expect(load('en').resolveUserMessage(undefined, 409, ENGLISH_SERVER_MESSAGE)).toBe(
      ENGLISH_SERVER_MESSAGE,
    );
  });

  // CONVENTIONS.md: branch on status and code, never on message text.
  it('reads the code before the status, and the status before nothing', () => {
    const { resolveUserMessage, codeMessage, statusMessage } = load(null);

    expect(codeMessage('CONFLICT')).toBe(ERROR_CATALOGUE_AR['errors.api.alreadyExists']);
    expect(codeMessage('NOT_A_REAL_CODE')).toBeUndefined();
    expect(resolveUserMessage('NOT_A_REAL_CODE', 409, undefined)).toBe(
      statusMessage(409),
    );
  });
});

describe('the catalogue keys this module holds', () => {
  // Keys only, nothing resolved at module scope, so the locale isn't frozen before §16.2 loads it.
  it('maps every code and status to a key, never to a message', () => {
    const { CODE_KEYS, STATUS_KEYS } = load(null);

    for (const value of [...Object.values(CODE_KEYS), ...Object.values(STATUS_KEYS)]) {
      expect(value).toMatch(/^errors\.[a-z]+\.[A-Za-z]+$/);
    }
  });
});
