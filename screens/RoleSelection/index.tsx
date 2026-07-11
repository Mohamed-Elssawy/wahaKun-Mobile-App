import { View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import ExpertIcon from '../../assets/icons/expert.svg';
import FarmerIcon from '../../assets/icons/farmer.svg'
import styles from './RoleSelection';
import { useState } from 'react';

const RoleSelection = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const isValid = fullName.trim().length > 0;

  const handleNextPress = () => {
    if (!isValid) {
      setError('يرجى تحديد دورك');
      return;
    }
    setError('');
    navigation.navigate('EmailVerification', { fullName: fullName.trim() });
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
              <TouchableOpacity style={styles.card}>
                <FarmerIcon width={29} height={32} color='#0A4B25' />
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>مزارع</Text>
                  <Text style={styles.cardSubtitle}>
                    الإبلاغ عن المشاكل وتتبعها
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.card}>
                <ExpertIcon width={29} height={32} color='#0A4B25' />
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>خبير ميداني</Text>
                  <Text style={styles.cardSubtitle}>مراجعة وحل الحالات</Text>
                </View>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>{' '}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton]}
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
