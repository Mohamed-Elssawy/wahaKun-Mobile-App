import { CircleAlert, Hourglass, OctagonAlert } from 'lucide-react-native';

import { Screen, StateScreen } from '@/components/ui';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { ScreenProps, AccountStatusState } from '@/navigation/types';

import type { LucideIcon } from 'lucide-react-native';

type StatusCopy = {
  icon: LucideIcon;
  /** Keys: this table is module scope, so a resolved string would predate §16.2's lookup. */
  titleKey: TranslationKey;
  messageKey: TranslationKey;
  /** §5.4's registers: pending is warm because nothing has gone wrong yet. */
  register: 'warm' | 'blocking';
};

const COPY: Record<AccountStatusState, StatusCopy> = {
  pending: {
    icon: Hourglass,
    titleKey: 's08.pendingTitle',
    messageKey: 's08.pendingBody',
    register: 'warm',
  },
  rejected: {
    icon: CircleAlert,
    titleKey: 's08.rejectedTitle',
    messageKey: 's08.rejectedBody',
    register: 'blocking',
  },
  suspended: {
    // C29: an octagon, not the circle rejected uses - a suspension is a stop, not a refusal.
    icon: OctagonAlert,
    titleKey: 's08.suspendedTitle',
    messageKey: 's08.suspendedBody',
    register: 'blocking',
  },
};

/** S-08. A root route with one way out, so it can neither open a session nor expose a shell. */
export default function AccountStatusScreen({
  route,
  navigation,
}: ScreenProps<'AccountStatus'>) {
  const { icon, titleKey, messageKey, register } = COPY[route.params.state];

  return (
    <Screen>
      <StateScreen
        icon={icon}
        title={t(titleKey)}
        message={t(messageKey)}
        register={register}
        // S-02, per §4.1. A reset, so the back stack cannot return to a half-made session.
        action={{
          label: t('common.backToHome'),
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
          // C28: returns to S-02, so G-02 gives it the BACKWARD arrow (settled for S-05.6b in E4), flipping with the locale.
          showArrowEnd: true,
        }}
      />
    </Screen>
  );
}
