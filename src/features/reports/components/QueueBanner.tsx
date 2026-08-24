import { CheckCircle2, CloudOff, UploadCloud } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
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

/** X-01 as a banner, not a wall: an offline farmer can still work. Renders null when quiet. */
export function QueueBanner() {
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

  const banner = describe({ isOnline, isSending, waitingCount, showDone });
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
      <Text variant="label12" color={ink} align="right" style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

function describe({
  isOnline,
  isSending,
  waitingCount,
  showDone,
}: {
  isOnline: boolean;
  isSending: boolean;
  waitingCount: number;
  showDone: boolean;
}): Banner | null {
  if (isSending) {
    return {
      icon: UploadCloud,
      text: 'جاري إرسال البلاغات…',
      fill: 'infoTint',
      ink: 'infoText',
    };
  }

  if (!isOnline) {
    return {
      icon: CloudOff,
      // Naming the count is the point: a queue nobody can see is worse than a failure.
      text:
        waitingCount > 0
          ? `لا يوجد اتصال — ${countLabel(waitingCount)} في انتظار الإرسال`
          : 'لا يوجد اتصال — تعرض آخر تحديث',
      fill: 'warningTint',
      ink: 'warningText',
    };
  }

  if (showDone) {
    return {
      icon: CheckCircle2,
      text: 'تم إرسال جميع البلاغات',
      fill: 'successTint',
      ink: 'successText',
    };
  }

  return null;
}

/** Arabic counts one, two and many differently; a bare number reads wrong. */
function countLabel(count: number): string {
  if (count === 1) {
    return 'بلاغ واحد';
  }
  if (count === 2) {
    return 'بلاغان';
  }
  if (count <= 10) {
    return `${count} بلاغات`;
  }
  return `${count} بلاغًا`;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row-reverse',
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
