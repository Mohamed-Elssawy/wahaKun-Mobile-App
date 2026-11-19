import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import type { Locale } from '@/i18n';
import { colors, radii, screenPadding, scriptFonts, shadows, spacing } from '@/theme';

import { Button } from './Button';
import { LanguageOption } from './LanguageOption';
import { Text } from './Text';

export type LanguageDialogProps = {
  isVisible: boolean;
  /** The locale the app is running in. The confirm appears only when `selected` differs. */
  active: Locale;
  selected: Locale;
  onSelect: (locale: Locale) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  isApplying?: boolean;
  /** §5.4 inline: the write failed and the active language is untouched. */
  error?: string | null;
};

const NOTE_SIZE = 12;
const NOTE_LINE_HEIGHT = 21;

// S-12: a centred dialog (D5), not a bottom sheet - fades rather than slides. Purely presentational; useLanguageSwitch owns all the state.
export function LanguageDialog({
  isVisible,
  active,
  selected,
  onSelect,
  onConfirm,
  onDismiss,
  isApplying = false,
  error = null,
}: LanguageDialogProps) {
  // §16.4: confirm shows only when selected differs from the running locale.
  const canConfirm = selected !== active;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      // Android's back button has to close it, or S-07 is unreachable behind it.
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={t('f05.close')}
      >
        {/* Swallows the press so tapping the card itself does not dismiss it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text variant="h3" align="center">
            {t('s12.title')}
          </Text>

          <View style={styles.options}>
            <LanguageOption
              label={t('s12.optionAr')}
              selected={selected === 'ar'}
              onPress={() => onSelect('ar')}
              disabled={isApplying}
            />
            <LanguageOption
              label={t('s12.optionEn')}
              selected={selected === 'en'}
              onPress={() => onSelect('en')}
              disabled={isApplying}
            />
          </View>

          {/* Both lines in both locales, each in its own script's face. See theme/scriptFonts. */}
          <View style={styles.note}>
            <Text align="center" style={styles.noteArabic}>
              {t('s12.restartNoteAr')}
            </Text>
            <Text align="center" style={styles.noteLatin}>
              {t('s12.restartNoteEn')}
            </Text>
          </View>

          {error ? (
            <Text variant="label14Bold" color="errorText" align="center">
              {error}
            </Text>
          ) : null}

          {/* G-02: it navigates nowhere, so it carries no arrow. */}
          {canConfirm ? (
            <Button label={t('s12.confirm')} onPress={onConfirm} loading={isApplying} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: screenPadding,
    padding: spacing[24],
    gap: spacing[24],
    borderRadius: radii[20],
    backgroundColor: colors.surface,
    ...shadows.raised,
  },
  options: {
    gap: spacing[16],
  },
  note: {
    gap: spacing[4],
  },
  // Pinned to the script, not to the locale: this line is Arabic in an English UI too.
  noteArabic: {
    fontFamily: scriptFonts.ar.regular,
    fontSize: NOTE_SIZE,
    lineHeight: NOTE_LINE_HEIGHT,
  },
  noteLatin: {
    fontFamily: scriptFonts.en.regular,
    fontSize: NOTE_SIZE,
    lineHeight: NOTE_LINE_HEIGHT,
  },
});
