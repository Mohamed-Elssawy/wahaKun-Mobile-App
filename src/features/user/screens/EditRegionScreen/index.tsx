import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BackHeader, Button, Screen, SearchableDropdown, Text } from '@/components/ui';
import { getAreasForGovernorate } from '@/constants/areas';
import { governorates } from '@/constants/governorates';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';
import type { LocationItem } from '@/types/location';

import { useProfile } from '../../hooks/useProfile';

type ActiveField = 'governorate' | 'area' | null;

/** S-07's "تغيير المنطقة". Signup stopped collecting this, so here is where it is set. */
export default function EditRegionScreen({ navigation }: ScreenProps<'EditRegion'>) {
  const { user, isLoading, error, retry, save, isSaving, saveError } = useProfile();

  const [governorate, setGovernorate] = useState<LocationItem | null>(null);
  const [area, setArea] = useState<LocationItem | null>(null);
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const areaOptions = useMemo(() => getAreasForGovernorate(governorate), [governorate]);
  const isValid = Boolean(governorate && area);

  // Opening one field just means the other stops being active, so no timing tricks.
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

  const handleSave = async () => {
    if (!isValid) {
      return;
    }
    if (await save({ region: governorate?.name, village: area?.name })) {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <BackHeader onBack={() => navigation.goBack()} />
        <View style={styles.fallback}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <BackHeader onBack={() => navigation.goBack()} />
        <View style={styles.fallback}>
          <ReportErrorView
            error={error}
            unknownTitle="تعذر تحميل الملف الشخصي"
            onRetry={retry}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label="حفظ"
          onPress={handleSave}
          showArrow
          loading={isSaving}
          disabled={!isValid}
        />
      }
    >
      <BackHeader onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            أين تقع أرضك؟
          </Text>
          <Text variant="body14" color="textMuted" align="center">
            يساعدنا هذا في ربطك بالخبراء والبلاغات القريبة منك.
          </Text>
        </View>

        <View style={styles.fields}>
          <SearchableDropdown
            label="المحافظة"
            placeholder="ابحث عن المحافظة"
            data={governorates}
            initialValue={user?.region}
            onSelect={handleGovernorateSelect}
            isOpen={activeField === 'governorate'}
            onOpenChange={openHandlerFor('governorate')}
          />

          <SearchableDropdown
            label="المنطقة"
            placeholder="ابحث عن المنطقة"
            data={areaOptions}
            initialValue={user?.village}
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

        {saveError ? (
          <Text variant="label12Bold" color="errorText" align="right">
            {saveError.message}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
  },
  form: {
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[40],
  },
  intro: {
    gap: spacing[12],
  },
  fields: {
    gap: spacing[24],
  },
});
