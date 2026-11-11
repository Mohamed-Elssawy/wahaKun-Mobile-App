import { Mic } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type FeedCardMediaProps = {
  photoUrl?: string;
  hasVoice: boolean;
};

// 310x166 in the frame, held as a ratio so the block keeps its proportions on a narrower phone.
const ASPECT_RATIO = 310 / 166;

const ICON_SIZE = 32;

const VOICE_LABEL = 'بلاغ صوتي';

/** A card's photo, or a voice-only placeholder. Renders nothing for a text-only report. */
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
