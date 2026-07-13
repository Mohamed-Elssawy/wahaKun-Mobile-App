import { View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import styles from './SuccessedRegistration';

const SuccessedRegistration = ({ navigation }: any) => {
  const handleStartPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
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
                <Text style={styles.stepOneText}>النهاية</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.successTitle}>اكتمل التسجيل!</Text>
            <Text style={styles.successSubtitle}>
              يمكنك الأن الاستمتاع بجميع مزايا{'\n'}التطبيق
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartPress}
            activeOpacity={0.7}
          >
            <Text style={styles.textOfStart}>بداية استخدام التطبيق</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default SuccessedRegistration;