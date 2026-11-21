import { User, UserCheck } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { ExpertBadge } from '@/features/community/components/ExpertBadge';
import { t } from '@/i18n';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { escalationSubtitle, escalationTitle } from '../lifecycle';

const ICON_CIRCLE_SIZE = 96;
const ICON_SIZE = 48;
const AVATAR_SIZE = 56;
const PRESENCE_DOT_SIZE = 8;

export type EscalationReviewer = {
  name: string;
  specialty: string;
  pictureUrl?: string;
  isVerified: boolean;
  isAvailable: boolean;
};

export type EscalationStats = {
  resolvedCount: number;
  averageRepairDays: number;
};

export type EscalationReviewerNoticeProps = {
  /** No endpoint resolves a reviewer by id yet (G7) - absent on every real build this phase. */
  reviewer?: EscalationReviewer;
  /** No endpoint at all, mock or real - absent until one exists. */
  stats?: EscalationStats;
  /** Omitted on E-11: F-06 is the owner's screen alone, the same rule as B-TRACK. */
  onOpenTracker?: () => void;
};

/** F-03b. No AI output anywhere on it by design; reviewer and stats never arrive today. */
export function EscalationReviewerNotice({
  reviewer,
  stats,
  onOpenTracker,
}: EscalationReviewerNoticeProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.iconCircle}>
        <UserCheck size={ICON_SIZE} color={colors.primary} />
      </View>

      <Text variant="h4" align="center">
        {escalationTitle()}
      </Text>
      <Text variant="body14" color="textMuted" align="center">
        {escalationSubtitle()}
      </Text>

      {reviewer ? (
        <View style={styles.reviewerSection}>
          <Text variant="label16" color="textMuted">
            {t('common.assignedExpert')}
          </Text>

          <View style={styles.card}>
            <View style={styles.cardTop}>
              {reviewer.pictureUrl ? (
                <Image source={{ uri: reviewer.pictureUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <User size={AVATAR_SIZE / 2} color={colors.textMuted} />
                </View>
              )}

              <View style={styles.identity}>
                <Text variant="label16Bold">{reviewer.name}</Text>
                <Text variant="label14" color="textMuted">
                  {reviewer.specialty}
                </Text>
                {reviewer.isAvailable ? (
                  <View style={styles.presence}>
                    <Text variant="label14" color="primary">
                      {t('common.online')}
                    </Text>
                    <View style={styles.presenceDot} />
                  </View>
                ) : null}
              </View>

              {reviewer.isVerified ? <ExpertBadge /> : null}
            </View>

            {stats ? (
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text variant="label16Bold" align="center">
                    {stats.resolvedCount}
                  </Text>
                  <Text variant="label12" color="textMuted" align="center">
                    {t('f03b.statCasesResolved')}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCell}>
                  <Text variant="label16Bold" align="center">
                    {`${stats.averageRepairDays} ${t('common.day')}`}
                  </Text>
                  <Text variant="label12" color="textMuted" align="center">
                    {t('f03b.statAvgRepairTime')}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {onOpenTracker ? (
        <Button
          label={t('f03b.trackCta')}
          onPress={onOpenTracker}
          showArrow
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[32],
    gap: spacing[8],
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[16],
  },
  reviewerSection: {
    alignSelf: 'stretch',
    gap: spacing[12],
    marginTop: spacing[32],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[20],
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[16],
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
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  presence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  presenceDot: {
    width: PRESENCE_DOT_SIZE,
    height: PRESENCE_DOT_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[16],
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: spacing[32],
  },
});
