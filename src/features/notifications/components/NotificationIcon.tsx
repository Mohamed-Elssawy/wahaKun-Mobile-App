import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FilePlus,
  HelpCircle,
  MessageCircle,
  Sparkles,
  User,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme';

import type { NotificationIconType } from '../types';
import type { LucideIcon } from 'lucide-react-native';

export type NotificationIconProps = {
  type: NotificationIconType;
};

const CIRCLE_SIZE = 44;
const GLYPH_SIZE = 20;

/** §8.1's icon taxonomy, never colour alone: each row is a tint plus a glyph. */
const TAXONOMY: Record<
  NotificationIconType,
  { tint: string; fg: string; Icon: LucideIcon }
> = {
  hazard: { tint: colors.errorTint, fg: colors.error, Icon: AlertTriangle },
  expertReviewed: { tint: colors.successTint, fg: colors.success, Icon: User },
  caseAssigned: { tint: colors.successTint, fg: colors.success, Icon: FilePlus },
  aiDiagnosis: { tint: colors.successTint, fg: colors.success, Icon: Sparkles },
  comment: { tint: colors.infoTint, fg: colors.info, Icon: MessageCircle },
  scheduling: { tint: colors.successTint, fg: colors.success, Icon: Calendar },
  confirmationRequest: { tint: colors.warningTint, fg: colors.warning, Icon: HelpCircle },
  resolved: { tint: colors.successTint, fg: colors.success, Icon: CheckCircle2 },
  rejectedReopened: { tint: colors.errorTint, fg: colors.error, Icon: AlertCircle },
};

export function NotificationIcon({ type }: NotificationIconProps) {
  const { tint, fg, Icon } = TAXONOMY[type];

  return (
    <View style={[styles.circle, { backgroundColor: tint }]}>
      <Icon size={GLYPH_SIZE} color={fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
