import { CheckCircle2, CloudOff, UploadCloud } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { t, tPlural } from '@/i18n';
import { colors, radii, screenPadding, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { useReportQueue } from '../hooks/useReportQueue';

import type { LucideIcon } from 'lucide-react-native';

const ICON_SIZE = 18;
const DONE_VISIBLE_MS = 3000;

type Banner = {
  icon: LucideIcon;
  text: string;
  fill: ColorToken;
  ink: ColorToken;
};

export type QueueBannerProps = {
  /** A list loaded earlier is on screen, so "showing the last update" is true. */
  showsLastUpdate: boolean;
};

/** X-01 as a banner, not a wall: an offline farmer can still work. Renders null when quiet. */
export function QueueBanner({ showsLastUpdate }: QueueBannerProps) {
  const { isOnline, isSending, waitingCount } = useReportQueue();
  const [showDone, setShowDone] = useState(false);
  const [wasWaiting, setWasWaiting] = useState(false);

  useEffect(() => {
    if (waitingCount > 0) {
      setWasWaiting(true);
      return;
    }

    // Only worth confirming if there was something to confirm.
    if (!wasWaiting) {
      return;
    }

    setWasWaiting(false);
    setShowDone(true);
  }, [waitingCount, wasWaiting]);

  // Its own effect: sharing the one above let its cleanup clear this timer early.
  useEffect(() => {
    if (!showDone) {
      return;
    }
    const timer = setTimeout(() => setShowDone(false), DONE_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [showDone]);

  const banner = describeQueueBanner({
    isOnline,
    isSending,
    waitingCount,
    showDone,
    showsLastUpdate,
  });
  if (!banner) {
    return null;
  }

  const { icon: Icon, text, fill, ink } = banner;

  return (
    <View
      style={[styles.banner, { backgroundColor: colors[fill] }]}
      accessibilityRole="alert"
      accessibilityLabel={text}
    >
      <Icon size={ICON_SIZE} color={colors[ink]} />
      <Text variant="label12" color={ink} style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

/** Exported for its test: which banner, if any, a queue state shows. */
export function describeQueueBanner({
  isOnline,
  isSending,
  waitingCount,
  showDone,
  showsLastUpdate,
}: {
  isOnline: boolean;
  isSending: boolean;
  waitingCount: number;
  showDone: boolean;
  showsLastUpdate: boolean;
}): Banner | null {
  if (isSending) {
    return {
      icon: UploadCloud,
      text: t('x01.sending'),
      fill: 'infoTint',
      ink: 'infoText',
    };
  }

  // W6: on a fresh offline launch with nothing loaded, X-01's own "no connection" body says it.
  if (!isOnline && waitingCount === 0 && !showsLastUpdate) {
    return null;
  }

  if (!isOnline) {
    return {
      icon: CloudOff,
      // Naming the count is the point: a queue nobody can see is worse than a failure.
      text:
        waitingCount > 0
          ? t('x01.offlineQueued', {
              countLabel: tPlural('reports.queuedCount', waitingCount),
            })
          : t('x01.offlineStale'),
      fill: 'warningTint',
      ink: 'warningText',
    };
  }

  if (showDone) {
    return {
      icon: CheckCircle2,
      text: t('x01.allSent'),
      fill: 'successTint',
      ink: 'successText',
    };
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    marginHorizontal: screenPadding,
    marginTop: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radii[6],
  },
  text: {
    flex: 1,
  },
});
