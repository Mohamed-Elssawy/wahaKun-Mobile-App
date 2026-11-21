// Device-local: neither S-07 toggle has a field on AppUser or an endpoint yet.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'wk.prefs.notifications';

export type NotificationPreferences = {
  /** Farmer only. "تنبيهات المنطقة الحرجة" */
  criticalArea: boolean;
  /** Both roles. "إشعارات التعليقات و المحادثات" */
  comments: boolean;
  /** Expert only. "إشعارات الانتظار الطويل" */
  longWait: boolean;
  /** Expert only. "إشعارات الحالات الجديدة" */
  newCase: boolean;
};

/** All on, matching how S-07 draws them for either role. */
const DEFAULTS: NotificationPreferences = {
  criticalArea: true,
  comments: true,
  longWait: true,
  newCase: true,
};

export async function loadPreferences(): Promise<NotificationPreferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    return DEFAULTS;
  }

  try {
    // Spread over the defaults so a preference added later is not undefined.
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<NotificationPreferences>) };
  } catch {
    return DEFAULTS;
  }
}

export async function savePreference(
  key: keyof NotificationPreferences,
  value: boolean,
): Promise<void> {
  const current = await loadPreferences();
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, [key]: value }));
}
