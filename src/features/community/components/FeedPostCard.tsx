import {
  Clock,
  MapPin,
  MessageCircle,
  Share2,
  TriangleAlert,
  User,
} from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { colors, radii, shadows, spacing } from '@/theme';

import { distanceKm, formatDistance } from '../distance';
import { StatusPill } from './StatusPill';

import type { Coordinates } from '../distance';
import type { FeedPost } from '../types';

export type FeedPostCardProps = {
  post: FeedPost;
  /** The farmer's own position, for the "0.8 كم" line. Omitted when unknown. */
  origin?: Coordinates | null;
  onPress: (issueId: string) => void;
  onConfirm: (issueId: string) => void;
};

const AVATAR_SIZE = 40;
const AVATAR_ICON = 20;
const META_ICON = 14;
const ACTION_ICON = 18;
const PHOTO_RATIO = 3 / 2;
const STRIPE_HEIGHT = 4;

/** One post on F-01. */
export function FeedPostCard({ post, origin, onPress, onConfirm }: FeedPostCardProps) {
  const { color } = describeTierDisplay(post.tier);

  const distance =
    origin && post.latitude !== undefined && post.longitude !== undefined
      ? formatDistance(
          distanceKm(origin, { latitude: post.latitude, longitude: post.longitude }),
        )
      : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(post.issueId)}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={post.title}
    >
      <View style={[styles.stripe, { backgroundColor: colors[color] }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.author}>
            {post.reporterPicture ? (
              <Image source={{ uri: post.reporterPicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <User size={AVATAR_ICON} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.authorText}>
              {/* The real feed has no reporterId to resolve, so the row can be nameless. */}
              {post.reporterName ? (
                <Text variant="label14Bold" align="right">
                  {post.reporterName}
                </Text>
              ) : null}

              <View style={styles.meta}>
                <Clock size={META_ICON} color={colors.textSecondary} />
                <Text variant="label12" color="textSecondary">
                  {formatRelativeTime(post.createdAt)}
                </Text>

                {distance ? (
                  <>
                    <MapPin size={META_ICON} color={colors.textSecondary} />
                    <Text variant="label12" color="textSecondary">
                      {distance}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>

          <View style={[styles.severity, { backgroundColor: colors[color] }]}>
            <Text variant="label12Bold" color="textInverse">
              {describeTierDisplay(post.tier).label.replace('مشكلة خطورتها ', '')}
            </Text>
          </View>
        </View>

        <Text variant="label14" align="right">
          {post.title}
        </Text>

        {post.photoUrl ? (
          <Image source={{ uri: post.photoUrl }} style={styles.photo} />
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.confirm, post.hasConfirmed && styles.confirmDone]}
            onPress={() => onConfirm(post.issueId)}
            accessibilityRole="button"
            accessibilityState={{ selected: post.hasConfirmed }}
            accessibilityLabel="هل تواجه نفس المشكلة؟"
          >
            <Text
              variant="label12Bold"
              color={post.hasConfirmed ? 'textInverse' : 'primary'}
            >
              هل تواجه نفس المشكلة؟
            </Text>
            <TriangleAlert
              size={ACTION_ICON}
              color={post.hasConfirmed ? colors.textInverse : colors.primary}
            />
          </TouchableOpacity>

          <Text variant="label12" color="textSecondary">
            {`${post.confirmations} تأكيدات`}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <StatusPill status={post.status} />

          <View style={styles.counts}>
            <View style={styles.count}>
              <MessageCircle size={ACTION_ICON} color={colors.textSecondary} />
              <Text variant="label12" color="textSecondary">
                {String(post.commentCount)}
              </Text>
            </View>
            <View style={styles.count}>
              <Share2 size={ACTION_ICON} color={colors.textSecondary} />
              <Text variant="label12" color="textSecondary">
                {String(post.shareCount)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[12],
    // The stripe reaches the rounded corners, so the body's padding cannot inset it.
    overflow: 'hidden',
    ...shadows.card,
  },
  stripe: {
    height: STRIPE_HEIGHT,
  },
  body: {
    padding: spacing[16],
    gap: spacing[12],
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  author: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    flex: 1,
    gap: spacing[2],
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
  severity: {
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
    borderRadius: radii[4],
  },
  photo: {
    width: '100%',
    aspectRatio: PHOTO_RATIO,
    borderRadius: radii[12],
    backgroundColor: colors.surfaceMuted,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  confirm: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  confirmDone: {
    backgroundColor: colors.primary,
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  counts: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
  },
  count: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
});