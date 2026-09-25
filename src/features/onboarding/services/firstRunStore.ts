import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'wk.onboarding.introSeen';

/** First run is the absence of this flag, so the intro shows once and never again. */
export async function hasSeenIntro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    // A broken read counts as seen: replaying the intro every launch is the worse failure.
    return true;
  }
}

export async function markIntroSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {
    // Nothing to recover: the intro simply shows again next launch.
  }
}
