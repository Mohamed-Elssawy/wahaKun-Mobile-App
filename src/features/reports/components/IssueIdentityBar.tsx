import { Clock, MapPin, User } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { IssueMetaLine } from '@/features/community/components/IssueMetaLine';
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

import { formatReportReference } from '../format';
import { formatRelativeTime } from '../relativeTime';

export type IssueIdentityBarProps = {
  reportId: string;
  /** Undefined on the real path: no read endpoint resolves who filed someone else's issue. */
  authorName?: string;
  authorPicture?: string;
  createdAt: string;
  distanceLabel?: string;
};

const AVATAR_SIZE = 42;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

/** The band under F-04's hero: who filed it and when, with the reference opposite. */
export function IssueIdentityBar({
  reportId,
  authorName,
  authorPicture,
  createdAt,
  distanceLabel,
}: IssueIdentityBarProps) {
  return (
    <View style={styles.bar}>
      {authorPicture ? (
        <Image source={{ uri: authorPicture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarEmpty]}>
          <User size={AVATAR_SIZE / 2} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.identity}>
        {/* Regular at 14, matching the feed card: the frame gives the two the same weight. */}
        <Text variant="label14" align="right" numberOfLines={1}>
          {authorName || UNKNOWN_AUTHOR}
        </Text>

        <IssueMetaLine
          icons={[Clock, MapPin]}
          labels={[formatRelativeTime(createdAt), distanceLabel]}
        />
      </View>

      <View style={styles.reference}>
        <Text variant="label14" color="textSecondary">
          {formatReportReference(reportId)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: screenPadding,
    paddingVertical: spacing[12],
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...shadows.card,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
  },
  avatarEmpty: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  reference: {
    backgroundColor: colors.surfaceMuted,
    // Fully rounded in the frame, not a 12 corner.
    borderRadius: radii.pill,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
  },
});
