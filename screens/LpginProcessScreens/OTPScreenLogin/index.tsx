import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import styles from './OTPScreen';
import { useEffect, useRef, useState } from 'react';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const OTPScreenLogin = ({ navigation, route }: any) => {
  const phoneNumber: string = route?.params?.phoneNumber ?? '01012345678';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const code = digits.join('');
  const isValid = code.length === OTP_LENGTH;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleChangeDigit = (text: string, index: number) => {
    const value = text.replace(/[^0-9]/g, '');
    setError('');

    if (value.length > 1) {
      // Handles pasted codes
      const pasted = value.slice(0, OTP_LENGTH).split('');
      const newDigits = Array(OTP_LENGTH).fill('');
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
    // TODO: trigger resend API call here
  };

  const handleVerifyPress = () => {
    if (!isValid) {
      setError('يرجى إدخال رمز التحقق كاملاً');
      return;
    }
    setError('');
    navigation.navigate('SuccessedRegistration', { phoneNumber, code });
  };

  const handleVerifyByEmail = () => {
    navigation.navigate('EmailOtpVerification', { phoneNumber });
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
              <Text style={styles.namingQuestion}>تحقق من رقمك</Text>
              <Text style={styles.namingSubQuestion}>
                أرسلنا رمزاً مكوناً من 6 أرقام إلى{'\n'}
                {phoneNumber}
              </Text>
            </View>

            <View style={styles.inputfeildContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ادخل رمز التحقق</Text>
                <View style={styles.otpRow}>
                  {digits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={ref => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                      value={digit}
                      onChangeText={text => handleChangeDigit(text, index)}
                      onKeyPress={e => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={OTP_LENGTH}
                      textAlign="center"
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleResend}
                  disabled={secondsLeft > 0}
                >
                  <Text style={styles.resendText}>
                    {secondsLeft > 0
                      ? `إعادة الإرسال خلال ${formatTime(secondsLeft)}`
                      : 'إعادة إرسال الرمز'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.nextButton, !isValid && styles.disabledButton]}
              onPress={handleVerifyPress}
              activeOpacity={isValid ? 0.7 : 1}
            >
              <Text style={styles.textOfNext}>تحقق</Text>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleVerifyByEmail} activeOpacity={0.7}>
            <Text style={styles.noCodeText}>
              لم تستلم الرمز؟{' '}
              <Text style={styles.noCodeLink}>تحقق من البريد الإلكتروني</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default OTPScreenLogin;