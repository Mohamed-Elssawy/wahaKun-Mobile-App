import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';

import { userApi } from '../services';
import { loadPreferences, savePreference } from '../services/preferencesStore';

import type { NotificationPreferences } from '../services/preferencesStore';
import type { UserDetails, UserUpdateRequest } from '../types';

const LOAD_ERROR = 'تعذر تحميل الملف الشخصي، حاول مرة أخرى';
const SAVE_ERROR = 'تعذر حفظ التغييرات، حاول مرة أخرى';

export function useProfile() {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [saveError, setSaveError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isMounted = useRef(true);

  // Its own empty dependency list: lifetime is a separate question from which load is live.
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Preferences are device-local, so they must not fail with the network call.
      const [details, stored] = await Promise.all([
        userApi.getUserDetails(),
        loadPreferences(),
      ]);
      if (isMounted.current) {
        setUser(details);
        setPreferences(stored);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(describeError(err, LOAD_ERROR));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Refetches on focus, so an edit made on EditRegion or EditProfilePicture shows on return.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /** Sends only what changed: UserRepo.UpdateAsync throws on zero rows, so a no-op PUT is a 500. */
  const save = useCallback(
    async (changes: UserUpdateRequest): Promise<boolean> => {
      const pending = Object.entries(changes).filter(([key, value]) => {
        const current = user?.[key as keyof UserDetails];
        return value !== undefined && value !== current;
      });

      if (pending.length === 0) {
        return true;
      }

      // UserService rebuilds Address from the request, so omitting these nulls NOT NULL columns and 500s the update.
      const payload: UserUpdateRequest = {
        region: user?.region ?? '',
        village: user?.village ?? '',
        ...Object.fromEntries(pending),
      };

      setIsSaving(true);
      setSaveError(null);

      try {
        await userApi.updateUserDetails(payload);
        if (isMounted.current) {
          setUser(current => (current ? { ...current, ...changes } : current));
        }
        return true;
      } catch (err) {
        if (isMounted.current) {
          setSaveError(describeError(err, SAVE_ERROR));
        }
        return false;
      } finally {
        if (isMounted.current) {
          setIsSaving(false);
        }
      }
    },
    [user],
  );

  /** Device-local by necessity: neither toggle has a field on the user, let alone an endpoint. */
  const togglePreference = useCallback(
    async (key: keyof NotificationPreferences): Promise<void> => {
      const next = !(preferences?.[key] ?? true);
      setPreferences(current => (current ? { ...current, [key]: next } : current));
      await savePreference(key, next);
    },
    [preferences],
  );

  return {
    user,
    preferences,
    isLoading,
    isSaving,
    error,
    saveError,
    dismissSaveError: () => setSaveError(null),
    retry: load,
    save,
    togglePreference,
  };
}
