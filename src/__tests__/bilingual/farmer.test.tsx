import { androidEdge } from '@/components/ui/__tests__/androidTextEdge';
import type { Dir } from '@/components/ui/__tests__/androidTextEdge';

import { expectLocaleFonts, prune, renderBilingual, snapshotOf } from './harness';

import type { Locale } from './harness';
import type { ReactTestRendererJSON } from 'react-test-renderer';

/** D5 archetypes 5-8, 11 and 12; fixture content is author-supplied Arabic and stays Arabic in both trees (L-AS-AUTHORED). */

const text = (trees: Record<Locale, unknown>, locale: Locale) =>
  prune(trees[locale] as never).join('\n');

const noop = () => {};

/** Each Text's own string and its own Yoga direction, if it declares one. */
function textNodes(
  node: ReactTestRendererJSON | string,
  out: Array<{ text: string; own?: Dir }> = [],
): Array<{ text: string; own?: Dir }> {
  if (typeof node === 'string') return out;

  if (node.type === 'Text') {
    const style = [node.props.style]
      .flat(Infinity)
      .reduce((all, part) => ({ ...all, ...part }), {});
    const own = (node.children ?? []).filter(child => typeof child === 'string').join('');

    out.push({ text: own, own: style.direction });
  }
  for (const child of node.children ?? []) textNodes(child, out);

  return out;
}

describe('F-07 · tab bar, four tabs (archetype 5)', () => {
  const screen = () => ({ __esModule: true, default: () => null });
  const trees = renderBilingual(
    () => {
      const { NavigationContainer } = require('@react-navigation/native');
      const { HomeTabs } = require('@/navigation/HomeTabs');

      return (
        <NavigationContainer>
          <HomeTabs />
        </NavigationContainer>
      );
    },
    {
      '@/features/community/screens/CommunityFeedScreen': screen,
      '@/features/map/screens/OasisMapScreen': screen,
      '@/features/reports/screens/MyReportsScreen': screen,
    },
  );

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('keeps every English tab label inside the 10-character budget', () => {
    // The screens are mocked to null, so the tab labels are the only Text in the tree.
    const labels = [...text(trees, 'en').matchAll(/^\s*Text .* "([^"]*)"$/gm)].map(
      m => m[1],
    );

    expect(labels.length).toBe(4);
    for (const label of labels) expect(label.length).toBeLessThanOrEqual(10);
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('F-01 · feed card (archetype 6)', () => {
  const trees = renderBilingual(() => {
    const { FeedPostCard } = require('@/features/community/components/FeedPostCard');
    const { SEED_POSTS } = require('@/features/community/fixtures');

    return (
      <FeedPostCard post={SEED_POSTS[0]} onPress={noop} onConfirm={noop} onShare={noop} />
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('keeps the author content in its own language in both locales', () => {
    const { SEED_POSTS } = require('@/features/community/fixtures');
    const body = SEED_POSTS[0].description ?? SEED_POSTS[0].title;

    expect(text(trees, 'ar')).toContain(String(body).slice(0, 12));
    expect(text(trees, 'en')).toContain(String(body).slice(0, 12));
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('F-04 · hero and pinned composer (archetype 7)', () => {
  const trees = renderBilingual(() => {
    const { View } = require('react-native');
    const { ReportHero } = require('@/features/reports/components/ReportHero');
    const {
      CommentComposer,
    } = require('@/features/community/components/CommentComposer');
    const { SEED_POSTS } = require('@/features/community/fixtures');

    return (
      <View>
        <ReportHero
          title={SEED_POSTS[0].title}
          severity="critical"
          onBack={noop}
          onShare={noop}
        />
        <CommentComposer canPost isPosting={false} onSubmit={async () => true} />
      </View>
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

// C61, fixed in E10: node 2's chip isolates the diagnosis so it no longer flips the whole chip's direction.
describe('F-06 · six-node timeline, pending approval (archetype 8)', () => {
  const trees = renderBilingual(() => {
    const { buildTrackerView } = require('@/features/reports/trackerView');
    const { ReportTimeline } = require('@/features/reports/components/ReportTimeline');
    const fixtures = require('@/__fixtures__/bilingual');
    const nodes = buildTrackerView(
      fixtures.PENDING_APPROVAL_REPORT,
      fixtures.PENDING_APPROVAL_DETAILS,
    );

    return (
      <ReportTimeline nodes={nodes} onConfirm={noop} onReject={noop} isActing={false} />
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('sets the node titles through the timelineNode role: 16 in Arabic, 18 in English', () => {
    expect(text(trees, 'ar')).toMatch(/Text Cairo-SemiBold 16\/24 /);
    expect(text(trees, 'ar')).not.toMatch(/Text Cairo-SemiBold 18\/30 /);
    expect(text(trees, 'en')).toMatch(/Text Cairo-SemiBold 18\/30 /);
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('F-04 comments, standing in for E-10 chat (archetype 11)', () => {
  // E-10 has no route; the comment thread stands in, the one built surface with the same claim.
  const trees = renderBilingual(() => {
    const { CommentThread } = require('@/features/community/components/CommentThread');
    const { SEED_COMMENTS } = require('@/features/community/fixtures');
    const comments = SEED_COMMENTS.slice(0, 2);

    return (
      <CommentThread
        comments={comments}
        total={comments.length}
        hasMore={false}
        isLoading={false}
        isLoadingMore={false}
        hasError={false}
        onLoadMore={noop}
        onRetry={noop}
      />
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  // E9: asserts the rendered EDGE, not the textAlign value - matching value but opposite edge is how C47 stayed green.
  it("puts the Arabic comment on its own edge and the name on the layout's, in both locales", () => {
    const { SEED_COMMENTS } = require('@/features/community/fixtures');
    const [first] = SEED_COMMENTS;
    const edgeOf = (locale: Locale, content: string) => {
      const line = textNodes(trees[locale]).find(node => node.text.includes(content));

      return line
        ? androidEdge({
            layout: locale === 'ar' ? 'rtl' : 'ltr',
            own: line.own,
            text: line.text,
          })
        : 'missing';
    };

    expect([edgeOf('ar', first.text), edgeOf('en', first.text)]).toEqual([
      'right',
      'right',
    ]);
    expect([edgeOf('ar', first.authorName), edgeOf('en', first.authorName)]).toEqual([
      'right',
      'left',
    ]);
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('F-05 · map search, legend and peek (archetype 12)', () => {
  // Side-mirroring only shows on a device (requirement 6); the tree can only hold content and faces.
  const trees = renderBilingual(() => {
    const { View } = require('react-native');
    const { MapSearchBar } = require('@/features/map/components/MapSearchBar');
    const { MapLegend } = require('@/features/map/components/MapLegend');
    const { MapPeekCard } = require('@/features/map/components/MapPeekCard');
    const { MAP_ISSUE } = require('@/__fixtures__/bilingual');

    return (
      <View>
        <MapSearchBar isExpanded value="" onChange={noop} onToggle={noop} />
        <MapLegend isExpanded onToggle={noop} />
        <MapPeekCard issue={MAP_ISSUE} />
      </View>
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});
