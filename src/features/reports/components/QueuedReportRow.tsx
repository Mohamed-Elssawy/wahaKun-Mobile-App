import { AlertTriangle, Clock, CloudOff, UploadCloud } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { useQueuedPhoto } from '../hooks/useQueuedPhoto';
import { formatRelativeTime } from '../relativeTime';

import type { QueuedReport } from '../types';
import type { LucideIcon } from 'lucide-react-native';

export type QueuedReportRowProps = {
  report: QueuedReport;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
};

const STRIPE_HEIGHT = 3;
const THUMBNAIL_SIZE = 82;
const META_ICON_SIZE = 14;
const NOTICE_ICON_SIZE = 20;

const UNTITLED = 'بلاغ بدون وصف';
const WAITING_NOTICE =
  'البلاغ محفوظ على جهازك — سيُرسل تلقائيًا عند عودة الاتصال بالإنترنت';

type Presentation = {
  icon: LucideIcon;
  label: string;
  stripe: ColorToken;
  ink: ColorToken;
};

/** No severity badge: guessing a colour before the model runs claims something unknown. */
export function QueuedReportRow({ report, onRetry, onDiscard }: QueuedReportRowProps) {
  const { icon: Icon, label, stripe, ink } = present(report);
  const title = report.description || UNTITLED;
  const hasFailed = report.state === 'failed';
  const photoUri = useQueuedPhoto(report.localId);

  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: colors[stripe] }]} />

      <View style={styles.body}>
        {/* Already JPEG, so this costs a data URI rather than a decode. */}
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
            <Icon size={24} color={colors[ink]} />
          </View>
        )}

        <View style={styles.text}>
          <Text variant="label16Bold" align="right" numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.meta}>
            <View style={[styles.chip, { backgroundColor: colors[stripe] }]}>
              <Text variant="label12" color="textInverse">
                {label}
              </Text>
            </View>

            <Clock size={META_ICON_SIZE} color={colors.textSecondary} />
            <Text variant="label12" color="textSecondary">
              {formatRelativeTime(report.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* X-09. Dropped once it has failed, where the actions below take over. */}
      {hasFailed ? null : (
        <View style={styles.notice}>
          <CloudOff size={NOTICE_ICON_SIZE} color={colors.primary} />
          <Text
            variant="label12"
            color="primaryPressed"
            align="right"
            style={styles.noticeText}
          >
            {WAITING_NOTICE}
          </Text>
        </View>
      )}

      {hasFailed ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => onRetry(report.localId)}
            accessibilityRole="button"
          >
            <Text variant="label14Bold" color="primary">
              إعادة المحاولة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => onDiscard(report.localId)}
            accessibilityRole="button"
          >
            <Text variant="label14Bold" color="errorText">
              حذف البلاغ
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function present(report: QueuedReport): Presentation {
  if (report.state === 'uploading') {
    return { icon: UploadCloud, label: 'جاري الإرسال', stripe: 'info', ink: 'infoText' };
  }
  if (report.state === 'failed') {
    return {
      icon: AlertTriangle,
      label: 'تعذر الإرسال',
      stripe: 'error',
      ink: 'errorText',
    };
  }
  return {
    icon: Clock,
    label: 'في انتظار الإرسال',
    stripe: 'warning',
    ink: 'warningText',
  };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[12],
    overflow: 'hidden',
    ...shadows.card,
  },
  stripe: {
    height: STRIPE_HEIGHT,
  },
  body: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[12],
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radii[6],
    backgroundColor: colors.surfaceMuted,
  },
  thumbnailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    marginHorizontal: spacing[12],
    marginBottom: spacing[12],
    padding: spacing[8],
    borderRadius: radii[12],
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryTint,
  },
  noticeText: {
    flex: 1,
  },
  text: {
    flex: 1,
    gap: spacing[8],
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
  },
  chip: {
    borderRadius: radii[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[2],
  },
  actions: {
    flexDirection: 'row-reverse',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    // Clears the 48dp Android minimum on its own, without a hitSlop.
    paddingVertical: spacing[12],
    minHeight: 48,
    justifyContent: 'center',
  },
});
