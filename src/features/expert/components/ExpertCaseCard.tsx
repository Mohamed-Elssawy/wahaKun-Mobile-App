import { Clock, RotateCcw, User, Users } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import {
  AiConfidenceChip,
  Button,
  SeverityBadge,
  StatusChip,
  Text,
} from '@/components/ui';
import { STATUS_ICONS } from '@/features/reports/components/statusIcon';
import {
  CONFIDENCE_THRESHOLD,
  describeStatus,
  RESCHEDULE_LABEL,
} from '@/features/reports/lifecycle';
import type { ExpertCta } from '@/features/reports/lifecycle';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import { colors, radii, shadows, spacing } from '@/theme';

import type { ExpertCaseSummary } from '../types';

export type ExpertCaseCardProps = {
  summary: ExpertCaseSummary;
  cta: ExpertCta;
  onPrimary: (cta: ExpertCta) => void;
  /** §8.3 ⚠: registered so the control exists, but entering reschedule is out of scope here. */
  onReschedule: () => void;
};

const REOPENED_LABEL = 'معاد فتحها';
const AVATAR_SIZE = 36;
const AVATAR_ICON = 18;
const CORROBORATION_ICON = 14;
const STRIP_HEIGHT = 4;
const STEP_LABEL: Record<ExpertCta['action'], string> = {
  review: 'مراجعة',
  continue: 'متابعة',
  view: 'عرض',
};

/** §8.3's E-01 card: both triage axes on one card, the amber chip's only home, and a CTA
 * that comes from `expertCtaFor` alone - never a status switch of this component's own. */
export function ExpertCaseCard({
  summary,
  cta,
  onPrimary,
  onReschedule,
}: ExpertCaseCardProps) {
  const severity = describeSeverity(summary.severity);
  const status = describeStatus(summary.status);
  const isConfident = summary.confidence >= CONFIDENCE_THRESHOLD;

  return (
    <View style={styles.card}>
      <View style={[styles.strip, { backgroundColor: colors[severity.color] }]} />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="h5" align="right" numberOfLines={2} style={styles.title}>
            {summary.title}
          </Text>

          <SeverityBadge
            level={severity.tier}
            label={severity.label}
            color={severity.color}
          />
        </View>

        {summary.status === 'Reopened' ? (
          <View style={styles.reopenedChip}>
            <RotateCcw size={CORROBORATION_ICON} color={colors.warningText} />
            <Text variant="label12Bold" color="warningText">
              {REOPENED_LABEL}
            </Text>
          </View>
        ) : null}

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Clock size={CORROBORATION_ICON} color={colors.textSecondary} />
            <Text variant="label12" color="textSecondary">
              {formatRelativeTime(summary.createdAt)}
            </Text>
          </View>

          {summary.corroborationCount > 0 ? (
            <View style={styles.metaItem}>
              <Users size={CORROBORATION_ICON} color={colors.primary} />
              <Text variant="label12Bold" color="primary">
                {`${summary.corroborationCount} نفس المشكلة`}
              </Text>
            </View>
          ) : null}
        </View>

        <AiConfidenceChip
          diagnosis={summary.title}
          confidence={summary.confidence}
          isConfident={isConfident}
        />

        <View style={styles.identity}>
          <View style={styles.reporter}>
            {summary.reporterAvatar ? (
              <Image source={{ uri: summary.reporterAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <User size={AVATAR_ICON} color={colors.textPrimary} />
              </View>
            )}
            <Text variant="label14" color="textSecondary">
              {summary.reporterName}
            </Text>
          </View>

          <View style={styles.referencePill}>
            <Text variant="label12" color="textSecondary">
              {`#${summary.reportId}`}
            </Text>
          </View>

          <StatusChip
            icon={STATUS_ICONS[status.icon]}
            label={status.label}
            color={status.color}
          />
        </View>

        <View style={styles.footer}>
          {cta.secondaryAction === 'reschedule' ? (
            <Button
              label={RESCHEDULE_LABEL}
              variant="secondary"
              onPress={onReschedule}
              style={styles.footerButton}
            />
          ) : null}

          <Button
            label={STEP_LABEL[cta.action]}
            onPress={() => onPrimary(cta)}
            style={styles.footerButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[16],
    overflow: 'hidden',
    ...shadows.card,
  },
  strip: {
    height: STRIP_HEIGHT,
  },
  body: {
    padding: spacing[16],
    gap: spacing[12],
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  title: {
    flex: 1,
  },
  reopenedChip: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
    backgroundColor: colors.warningTint,
  },
  meta: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
  identity: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  reporter: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  referencePill: {
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  footer: {
    flexDirection: 'row-reverse',
    gap: spacing[12],
  },
  footerButton: {
    flex: 1,
    width: undefined,
  },
});
