import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { isRTL } from './locale';

import type { LucideProps } from 'lucide-react-native';

/** Components, not consts: a module-scope `isRTL() ? A : B` would resolve before resolveLocale() reads the stored choice. */

/** Back. `›` in Arabic, `‹` in English. G-01 fixes the position; the locale picks the glyph. */
export function BackIcon(props: LucideProps) {
  const Icon = isRTL() ? ChevronRight : ChevronLeft;
  return <Icon {...props} />;
}

/** Forward: a card chevron, a link chevron, a next-month control. */
export function ForwardIcon(props: LucideProps) {
  const Icon = isRTL() ? ChevronLeft : ChevronRight;
  return <Icon {...props} />;
}

/** G-02's arrow, on a primary button that navigates forward. An arrow, not a chevron. */
export function ForwardArrow(props: LucideProps) {
  const Icon = isRTL() ? ArrowLeft : ArrowRight;
  return <Icon {...props} />;
}

/** The same slot pointed the other way, for a CTA that navigates backward. */
export function BackArrow(props: LucideProps) {
  const Icon = isRTL() ? ArrowRight : ArrowLeft;
  return <Icon {...props} />;
}
