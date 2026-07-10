import { View, Text, Image, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import styles from './EnterYourFallName.style';
import { useState } from 'react';

const EnterYourFullName = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const isValid = fullName.trim().length > 0;

  const handleNextPress = () => {
    if (!isValid) {
      setError('يرجى إدخال اسمك بالكامل للمتابعة');
      return;
    }
    setError('');
    // Navigate to the next screen and pass the full name as a parameter
    navigation.navigate('AddProfilePic', { fullName: fullName.trim() });
  };

  const handleExitPress = () => {
    // Leave the onboarding flow and return to the Welcome screen
    navigation.navigate('Welcome');
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
                <Text style={styles.stepOneText}>الخطوة الاولى</Text>
              </View>
              <TouchableOpacity onPress={handleExitPress}>
                <Text style={styles.goBack}>الخروج</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.namingQuestion}>ادخل اسمك بالكامل</Text>
            <View style={styles.inputFieldContainer}>
              <View style={styles.inputFieldEmpty}>
                <Text style={styles.namingText}>الاسم الكامل</Text>
                <TextInput
                  style={styles.namingTextInput}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (error) setError('');
                  }}
                  textAlign="right"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={handleNextPress}
                  keyboardType="name-phone-pad"
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          </View>
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

export default EnterYourFullName;