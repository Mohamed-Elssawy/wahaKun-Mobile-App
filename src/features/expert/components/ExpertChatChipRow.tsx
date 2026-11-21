import { ChevronDown } from 'lucide-react-native';

import { FilterChip, FilterChipRow } from '@/components/ui';
import { t } from '@/i18n';
import { colors } from '@/theme';

import type { ExpertChatFilter } from '../hooks/useExpertChats';

export type ExpertChatChipRowProps = {
  filters: readonly ExpertChatFilter[];
  onToggleFilter: (filter: ExpertChatFilter) => void;
};

const CHEVRON_SIZE = 18;

/** E-09's chip row. ترتيب draws the chevron but opens nothing: one sort mode is documented. */
export function ExpertChatChipRow({ filters, onToggleFilter }: ExpertChatChipRowProps) {
  const sortLabel = t('e09.sortNewest');

  return (
    <FilterChipRow>
      <FilterChip
        label={sortLabel}
        onPress={() => {}}
        accessibilityLabel={sortLabel}
        trailing={<ChevronDown size={CHEVRON_SIZE} color={colors.textStrong} />}
      />

      <FilterChip
        label={t('e09.filterUnread')}
        isActive={filters.includes('unread')}
        onPress={() => onToggleFilter('unread')}
      />

      <FilterChip
        label={t('e09.filterActiveOnly')}
        isActive={filters.includes('active')}
        onPress={() => onToggleFilter('active')}
      />
    </FilterChipRow>
  );
}
