import { useCallback, useState } from 'react';

import { applyDirection, locale, storeLocale, t } from '@/i18n';
import type { Locale } from '@/i18n';
import { requireRelaunch } from '@/i18n/relaunch';

/** `applying` blocks a second confirm; `failed` leaves the dialog open with the error shown. */
export type LanguageDialogState = 'idle' | 'applying' | 'failed';

export type LanguageSwitch = {
  isOpen: boolean;
  open: () => void;
  dismiss: () => void;
  /** The locale the app is running in. It does not move until the process restarts. */
  active: Locale;
  selected: Locale;
  select: (next: Locale) => void;
  /** §16.4: choosing does not apply, so the confirm exists only while these differ. */
  canConfirm: boolean;
  state: LanguageDialogState;
  error: string | null;
  confirm: () => Promise<void>;
};

/** Owns S-12's dialog for three features (ARCHITECTURE rule 3); screens never touch storage or relaunch directly. */
export function useLanguageSwitch(): LanguageSwitch {
  // locale() is fixed for the process's life (§16.2/§16.5), so reading it per render is a constant.
  const active = locale();

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Locale>(active);
  const [state, setState] = useState<LanguageDialogState>('idle');
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(() => {
    setSelected(active);
    setState('idle');
    setError(null);
    setIsOpen(true);
  }, [active]);

  const dismiss = useCallback(() => setIsOpen(false), []);

  const select = useCallback((next: Locale) => {
    setSelected(next);
    setError(null);
  }, []);

  const confirm = useCallback(async () => {
    if (selected === active || state === 'applying') {
      return;
    }

    setState('applying');
    setError(null);

    try {
      await storeLocale(selected);
    } catch {
      // A failed store means applyDirection never runs, so stored and rendered language can't disagree.
      setSelected(active);
      setState('failed');
      setError(t('errors.language.saveFailed'));
      return;
    }

    // Order is load-bearing: forceRTL must be written by this process so the next one's Activity sees it set.
    applyDirection(selected);

    // Dismiss before the swap: requireRelaunch replaces the navigator, and a Modal unmounted mid-swap sticks on Android.
    setIsOpen(false);
    requireRelaunch(selected);

    // setLocale is deliberately skipped: typography already froze its families, so the relaunch screen reads tIn() instead.
  }, [active, selected, state]);

  return {
    isOpen,
    open,
    dismiss,
    active,
    selected,
    select,
    canConfirm: selected !== active,
    state,
    error,
    confirm,
  };
}
