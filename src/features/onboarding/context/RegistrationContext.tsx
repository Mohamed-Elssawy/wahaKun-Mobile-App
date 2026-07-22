import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { PickedImage, UserRole } from '@/features/auth/types';
import type { LocationItem } from '@/types/location';

import type { ReactNode } from 'react';

/** Everything the registration wizard collects across its seven steps. */
export type RegistrationDraft = {
  fullName?: string;
  profileImage?: PickedImage | null;
  governorate?: LocationItem;
  location?: LocationItem;
  role?: UserRole;
  email?: string;
  password?: string;
};

type RegistrationContextValue = {
  draft: RegistrationDraft;
  update: (fields: Partial<RegistrationDraft>) => void;
  /** Wipes the draft. Call once registration completes or is abandoned. */
  reset: () => void;
};

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

/**
 * Holds the in-progress registration.
 *
 * The draft must not travel through navigation params. It carries the user's
 * plaintext password, and navigation state is serializable — anything in it is
 * reachable by state persistence, deep-link serialization and crash tooling.
 * Held here it stays in memory and is gone when the provider unmounts.
 */
export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RegistrationDraft>({});

  const update = useCallback((fields: Partial<RegistrationDraft>) => {
    setDraft(current => ({ ...current, ...fields }));
  }, []);

  const reset = useCallback(() => setDraft({}), []);

  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);

  return (
    <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>
  );
}

export function useRegistrationDraft(): RegistrationContextValue {
  const context = useContext(RegistrationContext);

  if (!context) {
    throw new Error('useRegistrationDraft must be used inside a RegistrationProvider');
  }

  return context;
}
