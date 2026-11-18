import { CircleCheckBig } from 'lucide-react-native';

import { tIn } from '@/i18n';
import type { Locale } from '@/i18n';
import type { RelaunchFailure } from '@/i18n/relaunch';

import { Screen } from './Screen';
import { StateScreen } from './StateScreen';

export type LanguageRelaunchProps = {
  /** The locale being switched TO. This screen is written in it, not in the running one. */
  target: Locale;
  /** Null while the restart may still succeed; set once it has failed one of two ways. */
  failure: RelaunchFailure | null;
  onRestart: () => void;
};

// S-12's relaunch (§5.4, warm register): written in the TARGET locale, not the running one; terminal, since App.tsx renders it instead of the navigator so Android back just exits.
export function LanguageRelaunch({ target, failure, onRestart }: LanguageRelaunchProps) {
  return (
    // Own Screen since App.tsx renders this instead of the navigator - nothing else supplies the safe area (AccountStatusScreen does the same).
    <Screen>
      <StateScreen
        icon={CircleCheckBig}
        register="warm"
        script={target}
        title={tIn(target, 's12.savedTitle')}
        message={
          failure ? tIn(target, 's12.savedBodyManual') : tIn(target, 's12.savedBody')
        }
        action={
          failure
            ? undefined
            : { label: tIn(target, 's12.restartAction'), onPress: onRestart }
        }
      />
    </Screen>
  );
}
