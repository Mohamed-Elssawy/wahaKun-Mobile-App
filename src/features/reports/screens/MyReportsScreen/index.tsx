import { useNavigation } from '@react-navigation/native';
import { FileSearch, FileText } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, screenPadding, spacing } from '@/theme';

import { ProgressRing } from '../../components/ProgressRing';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportFilterTabs } from '../../components/ReportFilterTabs';
import { ReportHeader } from '../../components/ReportHeader';
import { ReportRow } from '../../components/ReportRow';
import { ReportsEmptyState } from '../../components/ReportsEmptyState';
import { useMyReports } from '../../hooks/useMyReports';

import type { Report } from '../../types';

const TITLE = 'بلاغاتي';

/** F-07. The empty state splits: never filed one (X-07) reads differently to no match (X-06). */
// Rows carry only what a Report holds; the frame's tracker data has no endpoint.
export default function MyReportsScreen() {
  const navigation = useNavigation();
  const { reports, hasAnyReports, counts, filter, setFilter, isLoading, error, refresh } =
    useMyReports();

  const openReport = useCallback(
    (reportId: string) => navigation.navigate('IssueDetails', { reportId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Report }) => <ReportRow report={item} onPress={openReport} />,
    [openReport],
  );

  const renderBody = () => {
    // First load only: a focus refetch leaves the current list on screen.
    if (isLoading) {
      return (
        <View style={styles.centred}>
          <ProgressRing />
        </View>
      );
    }

    if (error) {
      return (
        <ReportErrorView
          error={error}
          unknownTitle="تعذر تحميل البلاغات"
          onRetry={refresh}
        />
      );
    }

    if (reports.length === 0) {
      return hasAnyReports ? (
        <ReportsEmptyState
          icon={FileSearch}
          title="لا توجد بلاغات مطابقة"
          message="جرّب توسيع البحث أو تغيير الفلتر."
        />
      ) : (
        <ReportsEmptyState
          icon={FileText}
          title="لم تُبلّغ عن أي مشكلة بعد"
          message="عندما تبلغ عن مشكلة، ستظهر هنا حتى تتمكن من تتبع حالتها."
          action={{
            label: 'الإبلاغ عن مشكلة',
            onPress: () => navigation.navigate('ReportCapture'),
          }}
        />
      );
    }

    return (
      <FlatList
        data={reports}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text variant="label14Bold" color="textSecondary" align="right">
            البلاغات النشطة
          </Text>
        }
      />
    );
  };

  return (
    <View style={styles.screen}>
      <ReportHeader title={TITLE} />

      <ReportFilterTabs filter={filter} counts={counts} onChange={setFilter} />

      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  list: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
    gap: spacing[16],
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[24],
    paddingHorizontal: screenPadding,
  },
});
