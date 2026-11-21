import type { TranslationKey } from '@/i18n';

export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'number' | 'symbol';

export type PasswordRule = {
  id: PasswordRuleId;
  /** A key, not a resolved label: this table is built at module scope, before §16.2 reads the locale. */
  labelKey: TranslationKey;
  test: (password: string) => boolean;
};

/** §8.1's five S-05.3 rules. */
export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', labelKey: 's05.rule.length', test: value => value.length >= 8 },
  { id: 'upper', labelKey: 's05.rule.uppercase', test: value => /[A-Z]/.test(value) },
  { id: 'lower', labelKey: 's05.rule.lowercase', test: value => /[a-z]/.test(value) },
  { id: 'number', labelKey: 's05.rule.number', test: value => /[0-9]/.test(value) },
  {
    id: 'symbol',
    labelKey: 's05.rule.symbol',
    test: value => /[^A-Za-z0-9]/.test(value),
  },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every(rule => rule.test(password));
}
