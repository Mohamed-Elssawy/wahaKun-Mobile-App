import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Inbox, MessageCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUnreadChats } from '@/features/expert/hooks/useUnreadChats';
import ExpertChatsScreen from '@/features/expert/screens/ExpertChatsScreen';
import ExpertInboxScreen from '@/features/expert/screens/ExpertInboxScreen';
import ExpertMapScreen from '@/features/expert/screens/ExpertMapScreen';
import { colors, radii, shadows, spacing, textStyles } from '@/theme';

import MapFilledIcon from '@assets/icons/map-filled.svg';

import type { ExpertTabParamList } from './types';

const Tab = createBottomTabNavigator<ExpertTabParamList>();

const ICON_SIZE = 24;

const BAR_CONTENT_HEIGHT = 52;

const DOT_SIZE = 8;

type TabIconProps = { color: string };

const ExpertInboxIcon = ({ color }: TabIconProps) => (
  <Inbox size={ICON_SIZE} color={color} />
);

const ExpertMapIcon = ({ color }: TabIconProps) => (
  <MapFilledIcon width={ICON_SIZE} height={ICON_SIZE} color={color} />
);

/**
 * §8.3 wants a green dot, WhatsApp-style, where tabBarBadge draws a red numeric pill. Drawing
 * it as part of the icon also keeps it inside the 24pt box the other two tabs occupy.
 */
// Reads the hook itself rather than taking a prop, so tabBarIcon stays one stable component
// and the navigator does not rebuild the tab on every unread change.
const ExpertChatsIcon = ({ color }: TabIconProps) => {
  const { hasUnread } = useUnreadChats();

  return (
    <View>
      <MessageCircle size={ICON_SIZE} color={color} />
      {hasUnread ? <View style={styles.dot} /> : null}
    </View>
  );
};

export function ExpertTabs() {
  const insets = useSafeAreaInsets();
  // Keep breathing room under the labels on devices reporting no bottom inset.
  const bottomInset = Math.max(insets.bottom, spacing[8]);

  return (
    <Tab.Navigator
      // Declared left to right as the bar shows them, which puts §8.3's الوارد on the right.
      // ExpertInbox is last, so the landing tab has to be named explicitly.
      initialRouteName="ExpertInbox"
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
        name="ExpertChats"
        component={ExpertChatsScreen}
        options={{ tabBarLabel: 'المحادثات', tabBarIcon: ExpertChatsIcon }}
      />
      <Tab.Screen
        name="ExpertMap"
        component={ExpertMapScreen}
        options={{ tabBarLabel: 'خريطة الواحة', tabBarIcon: ExpertMapIcon }}
      />
      {/* §8.3: الوارد carries no badge and no count, however long the queue is. */}
      <Tab.Screen
        name="ExpertInbox"
        component={ExpertInboxScreen}
        options={{ tabBarLabel: 'الوارد', tabBarIcon: ExpertInboxIcon }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    // No flexDirection: this lands on the outer container, and items row inside it.
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
  dot: {
    position: 'absolute',
    top: 0,
    // Trailing edge of the glyph, which is the leading edge of the row under RTL.
    right: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
  },
});
