import { ChevronDown } from 'lucide-react-native';

import { FilterChip, FilterChipRow } from '@/components/ui';
import { colors } from '@/theme';

import type { ExpertChatFilter } from '../hooks/useExpertChats';

export type ExpertChatChipRowProps = {
  filters: readonly ExpertChatFilter[];
  onToggleFilter: (filter: ExpertChatFilter) => void;
};

const SORT_LABEL = 'ترتيب: الأحدث';
const UNREAD_LABEL = 'غير مقروءة';
const ACTIVE_LABEL = 'نشطة فقط';

const CHEVRON_SIZE = 18;

/** E-09's chip row. ترتيب draws the chevron but opens nothing: one sort mode is documented. */
export function ExpertChatChipRow({ filters, onToggleFilter }: ExpertChatChipRowProps) {
  return (
    <FilterChipRow>
      <FilterChip
        label={SORT_LABEL}
        onPress={() => {}}
        accessibilityLabel={SORT_LABEL}
        trailing={<ChevronDown size={CHEVRON_SIZE} color={colors.textStrong} />}
      />

      <FilterChip
        label={UNREAD_LABEL}
        isActive={filters.includes('unread')}
        onPress={() => onToggleFilter('unread')}
      />

      <FilterChip
        label={ACTIVE_LABEL}
        isActive={filters.includes('active')}
        onPress={() => onToggleFilter('active')}
      />
    </FilterChipRow>
  );
}
