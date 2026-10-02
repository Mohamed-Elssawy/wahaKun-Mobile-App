import { Mic } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type FeedCardMediaProps = {
  photoUrl?: string;
  hasVoice: boolean;
};

// 310x166 in the frame, which is the card's width less its 16 padding. Held as a ratio so the
// block keeps its proportions on a narrower phone than the 390 the frame is drawn at.
const ASPECT_RATIO = 310 / 166;

const ICON_SIZE = 32;

const VOICE_LABEL = 'بلاغ صوتي';

/**
 * A card's photo, or the placeholder a voice-only report gets instead. Renders nothing at all
 * for a text-only report, which is how the frame draws the بوابة التحكم card.
 */
export function FeedCardMedia({ photoUrl, hasVoice }: FeedCardMediaProps) {
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={styles.media} resizeMode="cover" />;
  }

  if (!hasVoice) {
    return null;
  }

  return (
    <View
      style={[styles.media, styles.placeholder]}
      accessible
      accessibilityLabel={VOICE_LABEL}
    >
      <Mic size={ICON_SIZE} color={colors.primary} />
      <Text variant="label14" color="textSecondary">
        {VOICE_LABEL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    aspectRatio: ASPECT_RATIO,
    borderRadius: radii[12],
    backgroundColor: colors.surfaceMuted,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
});
