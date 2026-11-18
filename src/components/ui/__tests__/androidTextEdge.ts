// A model of where RN 0.86/Fabric puts a line of text on Android (the edge, not the style object) - Jest has no layout engine, and BiText's old tests said 'right' while the glyphs landed left; MEASURED below is what E9 measured on-device, and BiText.test.tsx checks the model against it every run (see TextLayoutManager.kt:128-213 for the source behavior this models).

import { ARABIC_NAME, LATIN_NAME } from '@/__fixtures__/bidi';

export type Dir = 'rtl' | 'ltr';
export type Edge = 'left' | 'right' | 'center';

// Deliberately not the app's detectDirection - a model sharing the code under test could never disagree with it.
const FIRST_STRONG = /([A-Za-z])|([؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿])/;

function scriptOf(text: string): Dir {
  const match = FIRST_STRONG.exec(text);

  return match && match[2] ? 'rtl' : 'ltr';
}

export type Line = {
  /** The layout direction the Text sits in: the app's, from the locale. */
  layout: Dir;
  /** The Text's own Yoga `direction` style, if any; unset inherits the layout's. */
  own?: Dir;
  /** The Text's textAlign. Named `align` because this is a description, not a style object. */
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  text: string;
};

export function androidEdge({ layout, own, align, text }: Line): Edge {
  const paragraphRtl = (own ?? layout) === 'rtl';
  const scriptRtl = scriptOf(text) === 'rtl';
  const swap = paragraphRtl !== scriptRtl;

  if (align === 'center') return 'center';

  const normal = align === 'right' ? swap : !swap;
  const contentStart: Edge = scriptRtl ? 'right' : 'left';
  const contentEnd: Edge = scriptRtl ? 'left' : 'right';

  return normal ? contentStart : contentEnd;
}

// Verdicts depend only on the first strong character, so any Arabic/Latin string reproduces the device run.
const AR = ARABIC_NAME;
const EN = LATIN_NAME;

// E9 Phase 0 device measurements (emulator 1080x2400@420); gaps are px of empty space either side of the ink, so a reader can see how unambiguous each verdict was.
export const MEASURED: ReadonlyArray<{
  cell: string;
  line: Line;
  edge: Edge;
  gaps: string;
}> = [
  {
    cell: 'old, Arabic, Arabic UI',
    line: { layout: 'rtl', align: 'right', text: AR },
    edge: 'left',
    gaps: 'L1/R729',
  },
  {
    cell: 'old, Arabic, English UI',
    line: { layout: 'ltr', align: 'right', text: AR },
    edge: 'right',
    gaps: 'L730/R0',
  },
  {
    cell: 'old, Latin, Arabic UI',
    line: { layout: 'rtl', align: 'left', text: EN },
    edge: 'right',
    gaps: 'L724/R2',
  },
  {
    cell: 'old, Latin, English UI',
    line: { layout: 'ltr', align: 'left', text: EN },
    edge: 'left',
    gaps: 'L4/R721',
  },
  {
    cell: 'candidate, Arabic, Arabic UI',
    line: { layout: 'rtl', align: 'auto', text: AR },
    edge: 'right',
    gaps: 'L762/R0',
  },
  {
    cell: 'candidate, Arabic, English UI',
    line: { layout: 'ltr', align: 'auto', text: AR },
    edge: 'left',
    gaps: 'L3/R758',
  },
  {
    cell: 'candidate, Latin, Arabic UI',
    line: { layout: 'rtl', align: 'auto', text: EN },
    edge: 'right',
    gaps: 'L737/R2',
  },
  {
    cell: 'candidate, Latin, English UI',
    line: { layout: 'ltr', align: 'auto', text: EN },
    edge: 'left',
    gaps: 'L3/R736',
  },
  {
    cell: 'direction, Arabic, Arabic UI',
    line: { layout: 'rtl', own: 'rtl', align: 'auto', text: AR },
    edge: 'right',
    gaps: 'L762/R0',
  },
  {
    cell: 'direction, Arabic, English UI',
    line: { layout: 'ltr', own: 'rtl', align: 'auto', text: AR },
    edge: 'right',
    gaps: 'L762/R0',
  },
  {
    cell: 'direction, Latin, Arabic UI',
    line: { layout: 'rtl', own: 'ltr', align: 'auto', text: EN },
    edge: 'left',
    gaps: 'L3/R736',
  },
  {
    cell: 'direction, Latin, English UI',
    line: { layout: 'ltr', own: 'ltr', align: 'auto', text: EN },
    edge: 'left',
    gaps: 'L3/R736',
  },
];
