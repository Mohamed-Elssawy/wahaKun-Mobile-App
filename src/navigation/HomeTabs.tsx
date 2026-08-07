import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MyReportsScreen from '@/features/reports/screens/MyReportsScreen';
import { colors, shadows, spacing, textStyles } from '@/theme';

import FilePlusIcon from '@assets/icons/file-plus.svg';
import HomeIcon from '@assets/icons/home.svg';
import MapFilledIcon from '@assets/icons/map-filled.svg';
import ReportsIcon from '@assets/icons/reports.svg';

import { createPlaceholderScreen } from './PlaceholderScreen';

import type { HomeTabParamList } from './types';

const Tab = createBottomTabNavigator<HomeTabParamList>();

const CommunityFeedScreen = createPlaceholderScreen('الرئيسية');
const OasisMapScreen = createPlaceholderScreen('خريطة الواحة');
const ReportAnIssueScreen = createPlaceholderScreen('الإبلاغ عن مشكلة');

const ICON_SIZE = 24;

const BAR_CONTENT_HEIGHT = 52;

type TabIconProps = { color: string };

const CommunityFeedIcon = ({ color }: TabIconProps) => (
  <HomeIcon width={ICON_SIZE} height={ICON_SIZE} color={color} />
);
const ReportAnIssueIcon = ({ color }: TabIconProps) => (
  <FilePlusIcon width={ICON_SIZE} height={ICON_SIZE} color={color} />
);
const OasisMapIcon = ({ color }: TabIconProps) => (
  <MapFilledIcon width={ICON_SIZE} height={ICON_SIZE} color={color} />
);
const MyReportsIcon = ({ color }: TabIconProps) => (
  <ReportsIcon width={ICON_SIZE} height={ICON_SIZE} color={color} />
);

export function HomeTabs() {
  const insets = useSafeAreaInsets();
  // Keep breathing room under the labels on devices reporting no bottom inset.
  const bottomInset = Math.max(insets.bottom, spacing[8]);
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.bar,
          { height: BAR_CONTENT_HEIGHT + bottomInset, paddingBottom: bottomInset },
        ],
      }}
    >
      <Tab.Screen
        name="CommunityFeed"
        component={CommunityFeedScreen}
        options={{ tabBarLabel: 'الرئيسية', tabBarIcon: CommunityFeedIcon }}
      />
      <Tab.Screen
        name="ReportAnIssue"
        component={ReportAnIssueScreen}
        options={{ tabBarLabel: 'إبلاغ عن مشكلة', tabBarIcon: ReportAnIssueIcon }}
        // Action tab: it renders no screen, and the tab's own nav cannot reach the stack.
        listeners={{
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('ReportCapture');
          },
        }}
      />
      <Tab.Screen
        name="OasisMap"
        component={OasisMapScreen}
        options={{ tabBarLabel: 'خريطة الواحة', tabBarIcon: OasisMapIcon }}
      />
      <Tab.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{ tabBarLabel: 'بلاغاتي', tabBarIcon: MyReportsIcon }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    // Decorative: the tab items are identified by icon + label, not this edge.
    borderTopColor: colors.borderStrong,
    paddingTop: spacing[8],
    ...shadows.sheet,
  },
  item: {
    // Figma's tab is a 40-tall vertical stack: 24 icon + 4 gap + 12 label.
    height: 40,
  },
  label: {
    ...textStyles.label12,
  },
});
