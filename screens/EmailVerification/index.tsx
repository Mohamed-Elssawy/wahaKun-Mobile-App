import { View, Text, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import styles from './EmailVerification';
import { useState } from 'react';

const EmailVerification = ({ navigation, route }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isValid = email.trim().length > 0 && password.trim().length > 0;


  const handleNextPress = () => {
    if (!isValid) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError('');
    navigation.navigate('PhoneNumberVerification', {
      ...route?.params,
      email: email.trim(),
      password,
    });
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
                <Text style={styles.stepOneText}>الخطوة الخامسة</Text>
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
            <View style={styles.textContainer}>
              <Text style={styles.namingQuestion}>أدخل بريدك الإلكتروني</Text>
              <Text style={styles.namingSubQuestion}>
                استخدمه للدخول في حال فقدان الوصول لرقم هاتفك.
              </Text>
            </View>

            <View style={styles.inputfeildContainer}>
              {/* Email Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    setError('');
                  }}
                  placeholder="ahmed.rashidi@gmail.com"
                  placeholderTextColor="#B1B2B2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="left"
                />
              </View>

              {/* Password Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>كلمة المرور</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordTextInput}
                    value={password}
                    onChangeText={text => {
                      setPassword(text);
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#B1B2B2"
                    textAlign="left"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#57595A" />
                    ) : (
                      <Eye size={20} color="#57595A" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
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

export default EmailVerification;
