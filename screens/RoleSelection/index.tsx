import { View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import ExpertIcon from '../../assets/icons/expert.svg';
import FarmerIcon from '../../assets/icons/farmer.svg';
import styles from './RoleSelection';
import { useState } from 'react';

type Role = 'farmer' | 'expert';

const RoleSelection = ({ navigation }: any) => {
  // Which card is currently picked — a single value (not two booleans) so
  // selecting one card is automatically "the other card is not selected",
  // the same pattern used for the open/closed dropdowns on LocationSelection.
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [error, setError] = useState('');

  const isValid = selectedRole !== null;

  const handleCardPress = (role: Role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleNextPress = () => {
    if (!isValid) {
      setError('يرجى تحديد دورك');
      return;
    }
    setError('');
    navigation.navigate('EmailVerification', { role: selectedRole });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerAndInputText}>
          <View style={styles.header}>
            <View style={styles.headerNavigation}>
              <View style={styles.StepOneWithLogoContainer}>
                <Image
                  source={require('../../assets/images/palmTreeLogoBlack.png')}
                  style={styles.palmTreeLogo}
                />
                <Text style={styles.stepOneText}>الخطوة الرابعة</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.goBack}>العودة</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.namingQuestion}>اختر دورك</Text>
            <View style={styles.cardsContainer}>
              <TouchableOpacity
                style={[
                  styles.card,
                  selectedRole === 'farmer' && styles.cardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleCardPress('farmer')}
              >
                <FarmerIcon width={29} height={32} color="#0A4B25" />
                <View style={styles.cardTextWrap}>
                  <Text
                    style={[
                      styles.cardTitle,
                      selectedRole === 'farmer' && styles.cardTitleSelected,
                    ]}
                  >
                    مزارع
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      selectedRole === 'farmer' && styles.cardSubtitleSelected,
                    ]}
                  >
                    الإبلاغ عن المشاكل وتتبعها
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.card,
                  selectedRole === 'expert' && styles.cardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleCardPress('expert')}
              >
                <ExpertIcon width={29} height={32} color="#0A4B25" />
                <View style={styles.cardTextWrap}>
                  <Text
                    style={[
                      styles.cardTitle,
                      selectedRole === 'expert' && styles.cardTitleSelected,
                    ]}
                  >
                    خبير ميداني
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      selectedRole === 'expert' && styles.cardSubtitleSelected,
                    ]}
                  >
                    مراجعة وحل الحالات
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isValid && styles.disabledButton]}
            onPress={handleNextPress}
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

export default RoleSelection;