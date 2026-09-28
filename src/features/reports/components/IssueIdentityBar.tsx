import { Clock, MapPin, User } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
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
const META_ICON_SIZE = 14;

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
        <Text variant="label16Bold" align="right" numberOfLines={1}>
          {authorName || UNKNOWN_AUTHOR}
        </Text>

        <View style={styles.meta}>
          <Clock size={META_ICON_SIZE} color={colors.textMuted} />
          <Text variant="label12" color="textMuted">
            {formatRelativeTime(createdAt)}
          </Text>

          {distanceLabel ? (
            <>
              <MapPin size={META_ICON_SIZE} color={colors.textMuted} />
              <Text variant="label12" color="textMuted">
                {distanceLabel}
              </Text>
            </>
          ) : null}
        </View>
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
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
  reference: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii[12],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
  },
});
