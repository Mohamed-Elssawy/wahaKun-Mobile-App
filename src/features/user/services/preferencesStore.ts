// Device-local, and labelled as such in the UI.

// Neither S-07 toggle has a field on AppUser or an endpoint. Move to UserService when they exist.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'wk.prefs.notifications';

export type NotificationPreferences = {
  /** "تنبيهات المنطقة الحرجة" */
  criticalArea: boolean;
  /** "إشعارات التعليقات" */
  comments: boolean;
};

/** Both on, matching how S-07 draws them. */
const DEFAULTS: NotificationPreferences = {
  criticalArea: true,
  comments: true,
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
