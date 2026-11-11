export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'number' | 'symbol';

export type PasswordRule = {
  id: PasswordRuleId;
  label: string;
  test: (password: string) => boolean;
};

/** §8.1's five S-05.3 rules. */
export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: '8 أحرف على الأقل', test: value => value.length >= 8 },
  { id: 'upper', label: 'حرف كبير واحد على الأقل', test: value => /[A-Z]/.test(value) },
  { id: 'lower', label: 'حرف صغير واحد على الأقل', test: value => /[a-z]/.test(value) },
  { id: 'number', label: 'رقم واحد على الأقل', test: value => /[0-9]/.test(value) },
  {
    id: 'symbol',
    label: 'رمز واحد على الأقل',
    test: value => /[^A-Za-z0-9]/.test(value),
  },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every(rule => rule.test(password));
}
