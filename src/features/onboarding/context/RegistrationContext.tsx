import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { UserRole } from '@/features/auth/types';
import type { PickedImage } from '@/types/image';
import type { LocationItem } from '@/types/location';

import type { ReactNode } from 'react';

/** Everything the registration wizard collects across its five steps. */
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

/** Never in navigation params: the draft holds a plaintext password, and params persist. */
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
