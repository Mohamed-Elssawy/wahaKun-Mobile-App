import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, SearchableDropdown, Text } from '@/components/ui';
import { getAreasForGovernorate } from '@/constants/areas';
import { governorates } from '@/constants/governorates';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';
import type { LocationItem } from '@/types/location';

import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';

type ActiveField = 'governorate' | 'area' | null;

/** Step 3 of the registration wizard. */
export default function LocationScreen({ navigation }: ScreenProps<'Location'>) {
  const { update } = useRegistrationDraft();
  const [governorate, setGovernorate] = useState<LocationItem | null>(null);
  const [area, setArea] = useState<LocationItem | null>(null);
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const areaOptions = useMemo(() => getAreasForGovernorate(governorate), [governorate]);
  const isValid = Boolean(governorate && area);

  /**
   * Only one dropdown may be open. Opening a field simply means the other one
   * stops being the active field — no timing tricks needed.
   */
  const openHandlerFor = (field: Exclude<ActiveField, null>) => (open: boolean) => {
    setActiveField(previous => {
      if (open) {
        return field;
      }
      return previous === field ? null : previous;
    });
  };

  const handleGovernorateSelect = (item: LocationItem) => {
    setGovernorate(item);
    // Areas are scoped to a governorate, so the previous pick is now invalid.
    setArea(null);
    setActiveField(null);
  };

  const handleNext = () => {
    if (!isValid) {
      return;
    }
    update({ governorate: governorate ?? undefined, location: area ?? undefined });
    navigation.navigate('Role');
  };

  return (
    <Screen
      footer={
        <Button label="التالي" onPress={handleNext} showArrow disabled={!isValid} />
      }
    >
      <WizardHeader step={3} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" align="center">
            أين تقع أرضك؟
          </Text>
          <Text variant="body14" color="textSecondary" align="center">
            يساعدنا هذا في ربطك بالخبراء والبلاغات القريبة منك.
          </Text>
        </View>

        <View style={styles.fields}>
          <SearchableDropdown
            label="المحافظة"
            placeholder="ابحث عن المحافظة"
            data={governorates}
            onSelect={handleGovernorateSelect}
            isOpen={activeField === 'governorate'}
            onOpenChange={openHandlerFor('governorate')}
          />

          <SearchableDropdown
            label="المنطقة"
            placeholder="ابحث عن المنطقة"
            data={areaOptions}
            onSelect={item => {
              setArea(item);
              setActiveField(null);
            }}
            isOpen={activeField === 'area'}
            onOpenChange={openHandlerFor('area')}
            disabled={!governorate}
            disabledPlaceholder="اختر المحافظة أولاً"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xxxl,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxxl,
  },
  intro: {
    gap: spacing.md,
  },
  fields: {
    gap: spacing.xl,
  },
});
