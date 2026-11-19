import { expectLocaleFonts, prune, renderBilingual, snapshotOf } from './harness';

/** D5 archetypes 9 and 10. Subjects are required inside `build` (see harness.ts). */

const noop = () => {};

describe('E-02 · four-node stepper and the override (archetype 9)', () => {
  const trees = renderBilingual(() => {
    const { View } = require('react-native');
    const { ExpertStepper } = require('@/features/expert/components/ExpertStepper');
    const {
      CaseOverrideSection,
    } = require('@/features/expert/components/CaseOverrideSection');

    return (
      <View>
        <ExpertStepper current={1} />
        <CaseOverrideSection
          isOn
          onToggle={noop}
          severity="Critical"
          onChangeSeverity={noop}
          correctedDiagnosis=""
          onChangeCorrectedDiagnosis={noop}
        />
      </View>
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('lays the stepper out as one row in both locales, so the direction comes from the platform', () => {
    // A hard row-reverse or reversed node order would show as a layout-line difference here.
    const layout = (locale: 'ar' | 'en') =>
      prune(trees[locale]).filter(line => !line.trimStart().startsWith('Text '));

    expect(layout('ar').map(line => line.replace(/a11y="[^"]*"/, ''))).toEqual(
      layout('en').map(line => line.replace(/a11y="[^"]*"/, '')),
    );
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('E-01 · list with segmented tabs (archetype 10)', () => {
  // A tab key, not copy; a named constant is how scripts/i18n-copy-props.js lets a key literal pass as `value`.
  const SELECTED = 'all';
  const trees = renderBilingual(() => {
    const { SegmentedTabs } = require('@/components/ui/SegmentedTabs');
    const { t } = require('@/i18n');
    const items = [
      { key: 'all', label: t('f07.tab.all') },
      { key: 'new', label: t('status.new') },
      { key: 'underReview', label: t('status.underReview') },
      { key: 'scheduled', label: t('status.scheduled') },
      { key: 'resolved', label: t('status.resolved') },
    ];

    return (
      <SegmentedTabs items={items} value={SELECTED} onChange={noop} variant="seated" />
    );
  });

  it('renders the tab labels in the heading face at h5 in both locales', () => {
    // Tabs measured the same size in both sets of frames, so they are not one of E8's roles.
    for (const locale of ['ar', 'en'] as const) {
      const labels = prune(trees[locale]).filter(line =>
        line.trimStart().startsWith('Text '),
      );

      expect(labels).toHaveLength(5);
      for (const label of labels) expect(label).toMatch(/Text Cairo-SemiBold 16\/24 /);
    }
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});
