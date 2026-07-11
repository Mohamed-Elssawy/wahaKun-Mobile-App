import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import SearchableDropdown from '../../component/SearchableDropdown';
import { governorates } from '../../data/governorates';
import { getAreasForGovernorate } from '../../data/Areas';
import { LocationItem } from '../../types/Location';

import styles from './LocationSelection';

type ActiveField = 'governorate' | 'area' | null;

const LocationSelection = ({ navigation }: any) => {
  const [selectedGovernorate, setSelectedGovernorate] =
    useState<LocationItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(
    null,
  );

  const [activeField, setActiveField] = useState<ActiveField>(null);
  const areaOptions = useMemo(
    () => getAreasForGovernorate(selectedGovernorate),
    [selectedGovernorate],
  );

  const isValid = !!selectedGovernorate && !!selectedLocation;
  const handleOpenChangeFor =
    (field: Exclude<ActiveField, null>) => (open: boolean) => {
      setActiveField(prev => {
        if (open) return field;
        return prev === field ? null : prev;
      });
    };

  const handleGovernorateSelect = (item: LocationItem) => {
    setSelectedGovernorate(item);
    setSelectedLocation(null);
    setActiveField(null);
  };

  const handleLocationSelect = (item: LocationItem) => {
    setSelectedLocation(item);
    setActiveField(null);
  };

  const handleNextPress = () => {
    if (!isValid) {
      return;
    }

    navigation.navigate('RoleSelection', {
      governorate: selectedGovernorate,
      location: selectedLocation,
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.bodyheader}>
          {/* Header */}

          <View style={styles.header}>
            <View style={styles.headerNavigation}>
              <View style={styles.StepOneWithLogoContainer}>
                <Image
                  source={require('../../assets/images/palmTreeLogoBlack.png')}
                  style={styles.palmTreeLogo}
                />

                <Text style={styles.stepOneText}>الخطوة الثالثة</Text>
              </View>

              <Text style={styles.goBack}>العودة</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          {/* Body */}

          <View style={styles.bodyContainer}>
            <View style={styles.questionContainer}>
              <Text style={styles.question}>اختر واحتك / قريتك / منطقتك</Text>
            </View>
            <View style={styles.searchContainer}>
              <SearchableDropdown
                label="المحافظة"
                placeholder="ابحث"
                data={governorates}
                onSelect={handleGovernorateSelect}
                isOpen={activeField === 'governorate'}
                onOpenChange={handleOpenChangeFor('governorate')}
              />
            </View>
            <View style={styles.searchContainer}>
              <SearchableDropdown
                key={selectedGovernorate?.id ?? 'no-governorate'}
                label="الواحة / القرية / المنطقة"
                placeholder="ابحث"
                disabledPlaceholder="اختر المحافظة أولاً"
                data={areaOptions}
                disabled={!selectedGovernorate}
                onSelect={handleLocationSelect}
                isOpen={activeField === 'area'}
                onOpenChange={handleOpenChangeFor('area')}
              />
            </View>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isValid && styles.disabledButton]}
            onPress={handleNextPress}
            disabled={!isValid}
            activeOpacity={isValid ? 0.7 : 1}
          >
            <Text style={styles.textOfNext}>التالي</Text>

            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default LocationSelection;
