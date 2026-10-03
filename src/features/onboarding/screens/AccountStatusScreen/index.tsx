import { CircleAlert, Hourglass } from 'lucide-react-native';

import { Screen, StateScreen } from '@/components/ui';
import type { ScreenProps , AccountStatusState } from '@/navigation/types';

import type { LucideIcon } from 'lucide-react-native';

const BACK_LABEL = 'العودة';

type StatusCopy = {
  icon: LucideIcon;
  title: string;
  message: string;
  /** §5.4's registers: pending is warm because nothing has gone wrong yet. */
  register: 'warm' | 'blocking';
};

const COPY: Record<AccountStatusState, StatusCopy> = {
  pending: {
    icon: Hourglass,
    title: 'طلبك قيد المراجعة',
    message: 'سنراسلك على بريدك الإلكتروني بالقرار بعد مراجعة الإدارة لطلبك.',
    register: 'warm',
  },
  rejected: {
    icon: CircleAlert,
    title: 'لم تتم الموافقة على طلبك',
    message: 'يمكنك مراسلة الإدارة لمعرفة سبب القرار.',
    register: 'blocking',
  },
  suspended: {
    icon: CircleAlert,
    title: 'تم إيقاف حسابك',
    message: 'تواصل مع الإدارة لمعرفة التفاصيل. تم إعادة إسناد حالاتك المفتوحة.',
    register: 'blocking',
  },
};

/**
 * S-08. Routed to from §4.1 and nowhere else. It must not establish a session or expose any
 * shell, which is why it is a root route with one way out rather than a screen inside one.
 */
// Not yet designed: §8.1 gives the glyph, the headline and the single action, and no frame.
export default function AccountStatusScreen({
  route,
  navigation,
}: ScreenProps<'AccountStatus'>) {
  const { icon, title, message, register } = COPY[route.params.state];

  return (
    <Screen>
      <StateScreen
        icon={icon}
        title={title}
        message={message}
        register={register}
        // S-02, per §4.1. A reset, so the back stack cannot return to a half-made session.
        action={{
          label: BACK_LABEL,
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
        }}
      />
    </Screen>
  );
}
