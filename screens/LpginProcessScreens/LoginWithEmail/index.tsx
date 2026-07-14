import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import styles from './EmailScreen.style';
import { useState } from 'react';
import * as authService from '../../../services/authService';
import { saveTokens } from '../../../services/tokenStorage';
import { ApiError } from '../../../services/apiClient';

const EmailLogin = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isValid) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.loginWithEmail(email.trim(), password);

      if (result.accessToken && result.refreshToken) {
        await saveTokens(result.accessToken, result.refreshToken);
      }

      setIsLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      setIsLoading(false);
      const message =
        err instanceof ApiError ? err.message : 'حدث خطأ في الاتصال، حاول مرة أخرى';
      setError(message);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email });
  };

  const handlePhoneLogin = () => {
    navigation.navigate('PhoneLogin');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerAndInputText}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowRight size={24} color="#1F2223" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.namingQuestion}>تسجيل الدخول</Text>
              <Text style={styles.namingSubQuestion}>
                استخدم بريدك الإلكتروني إذا لم{'\n'}تتمكن من الوصول لرقم هاتفك.
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

              <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.nextButton, (!isValid || isLoading) && styles.disabledButton]}
              onPress={handleLogin}
              activeOpacity={isValid ? 0.7 : 1}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.textOfNext}>تسجيل الدخول</Text>
                  <ArrowLeft size={24} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handlePhoneLogin} activeOpacity={0.7}>
            <Text style={styles.phoneLoginText}>أو الدخول برقم الهاتف</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default EmailLogin;