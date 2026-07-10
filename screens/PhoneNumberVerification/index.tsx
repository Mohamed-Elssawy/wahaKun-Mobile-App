import { View, Text, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import styles from './EnterYourFallName.style';

const EnterYourFullName = ({ navigation }: any) => {
  const handleNextPress = () => {
    // Navigate to the next screen and pass the full name as a parameter
    navigation.navigate('EnterYourPhoneNumber', { fullName });
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerNavigation}>
            <View style={styles.StepOneWithLogoContainer}>
              <Image
                source={require('../../assets/images/palmTreeLogoBlack.png')}
                style={styles.palmTreeLogo}
              />
              <Text style={styles.stepOneText}>الخطوة الاولى</Text>
            </View>
            <Text style={styles.goBack}>الخروج</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default EnterYourFullName;
