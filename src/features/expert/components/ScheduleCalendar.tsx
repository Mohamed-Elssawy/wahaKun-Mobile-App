import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { MONTHS, WEEKDAYS } from '@/features/reports/relativeTime';
import { colors, radii, spacing } from '@/theme';

import { dateKey } from '../scheduleWindow';

const CELL_SIZE = 40;

type Cell = { date: Date; key: string; inMonth: boolean };

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Sunday-first grid, padded to full weeks on both ends so every row has 7 cells. */
function buildGrid(month: Date): Cell[] {
  const first = startOfMonth(month);
  const leading = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), index - leading + 1);
    return { date, key: dateKey(date), inMonth: date.getMonth() === month.getMonth() };
  });
}

export type ScheduleCalendarProps = {
  /** Which month the calendar opens on; defaults to today's. The chevrons browse from there. */
  initialMonth?: Date;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  /** `C-WINDOW`: only these dates are tappable. */
  isDateEnabled: (date: string) => boolean;
};

/** §8.3's E-03 month calendar. Out-of-window dates get a dedicated disabled look, distinct
 * from the adjacent-month grey the drawn frame already has - §8.3 flags the two as different. */
export function ScheduleCalendar({
  initialMonth,
  selectedDate,
  onSelectDate,
  isDateEnabled,
}: ScheduleCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(initialMonth ?? new Date()));
  const today = useMemo(() => dateKey(new Date()), []);
  const grid = useMemo(() => buildGrid(month), [month]);

  return (
    <View style={styles.card}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => setMonth(current => addMonths(current, -1))}
          accessibilityRole="button"
          accessibilityLabel="الشهر السابق"
          hitSlop={hitSlop}
        >
          <ChevronRight size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text variant="h5">{`${MONTHS[month.getMonth()]} ${month.getFullYear()}`}</Text>

        <TouchableOpacity
          onPress={() => setMonth(current => addMonths(current, 1))}
          accessibilityRole="button"
          accessibilityLabel="الشهر التالي"
          hitSlop={hitSlop}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map(day => (
          <Text key={day} variant="label12" color="textSecondary" align="center" style={styles.cell}>
            {day.slice(0, 2)}
          </Text>
        ))}
      </View>

      <View style={styles.weeks}>
        {Array.from({ length: grid.length / 7 }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {grid.slice(weekIndex * 7, weekIndex * 7 + 7).map(cell => {
              const isEnabled = cell.inMonth && isDateEnabled(cell.key);
              const isSelected = cell.key === selectedDate;
              const isToday = cell.key === today;

              return (
                <TouchableOpacity
                  key={cell.key}
                  style={styles.cell}
                  disabled={!isEnabled}
                  onPress={() => onSelectDate(cell.key)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isEnabled, selected: isSelected }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && !isSelected && styles.dayToday,
                      isSelected && styles.daySelected,
                    ]}
                  >
                    <Text
                      variant="label14"
                      color={
                        isSelected
                          ? 'textInverse'
                          : !cell.inMonth
                            ? 'textMuted'
                            : !isEnabled
                              ? 'disabled'
                              : 'textPrimary'
                      }
                    >
                      {cell.date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  card: {
    gap: spacing[12],
  },
  nav: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekRow: {
    flexDirection: 'row-reverse',
  },
  weeks: {
    gap: spacing[4],
  },
  cell: {
    width: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: CELL_SIZE - spacing[8],
    height: CELL_SIZE - spacing[8],
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  daySelected: {
    backgroundColor: colors.primaryPressed,
  },
});
