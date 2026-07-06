import React from 'react';
import { View, Text, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {

  faAngleLeft,
} from '@fortawesome/free-solid-svg-icons';
import { UserPlus, LogIn } from 'lucide-react-native';
import styles from './App.Style';
const App = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../assets/images/palmTreeLogo.png')}
            style={styles.palmTreeLogo}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Waha KUN</Text>
            <Text style={styles.subtitle}>واحة كُن</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>مرحباً بك</Text>
            <Text style={styles.subText}>هل تستخدم التطبيق للمرة الأولى؟</Text>
          </View>
          <View style={styles.cardsContainer}>
            <TouchableOpacity style={styles.card} onPress={() => {}}>
              <UserPlus size={32} color="#1A6B3C" style={{ marginLeft: 12 }} />
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>مستخدم جديد</Text>
                <Text style={styles.cardSubtitle}>أنشئ حسابك الآن وابدأ</Text>
              </View>
              <FontAwesomeIcon icon={faAngleLeft} size={24} color="#1F2223" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => {}}>
              <LogIn size={32} color="#1A6B3C" style={{ marginLeft: 12 }} />
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>لدي حساب بالفعل</Text>
                <Text style={styles.cardSubtitle}>سجل الدخول بسرعة</Text>
              </View>
              <FontAwesomeIcon icon={faAngleLeft} size={24} color="#1F2223" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            باستخدامك للتطبيق، أنت توافق على {' '}
            <Text
              style={styles.fotterLink}
              onPress={() => Linking.openURL('https://your-website.com/terms')}
            >
              شروط الاستخدام و سياسة الخصوصية{' '}
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
