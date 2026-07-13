import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import EnterYourFullName from '../screens/EnterYourFallName';
import LocationSelection from '../screens/LocationSelection'
import AddProfilePic from '../screens/AddProfilePic';
import RoleSelection from '../screens/RoleSelection';
import EmailVerification from '../screens/EmailVerification';
import PhoneNumberVerification from '../screens/PhoneNumberVerification';
import OTPScreen from '../screens/OTP-Screen';
import SuccessedRegistration from '../screens/SuccessedRegistration';
import LoginScreen from '../screens/LpginProcessScreens/LoginWithNumber';
import OTPScreenLogin from '../screens/LpginProcessScreens/OTPScreenLogin';
import EmailLogin from '../screens/LpginProcessScreens/LoginWithEmail'

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left', // ensures consistent slide transition on both platforms
          animationDuration: 10,
          gestureEnabled: true, // allows swipe gestures for navigation
          // gestureDirection: 'horizontal', // ensures consistent swipe direction on both platforms
          presentation: 'card', // ensures consistent slide transition on both platforms
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="EnterYourFullName" component={EnterYourFullName} />
        <Stack.Screen name="AddProfilePic" component={AddProfilePic} />
        <Stack.Screen name="LocationSelection" component={LocationSelection} />
        <Stack.Screen name="RoleSelection" component={RoleSelection} />
        <Stack.Screen name="EmailVerification" component={EmailVerification} />
        <Stack.Screen name="PhoneNumberVerification" component={PhoneNumberVerification} />
        <Stack.Screen name="OTPScreen" component={OTPScreen} />
        <Stack.Screen name="SuccessedRegistration" component={SuccessedRegistration} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="OTPScreenLogin" component={OTPScreenLogin} />
        <Stack.Screen name="EmailLogin" component={EmailLogin} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}