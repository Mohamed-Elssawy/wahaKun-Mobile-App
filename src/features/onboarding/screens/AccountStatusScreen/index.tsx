import { CircleAlert, Hourglass } from 'lucide-react-native';

import { Screen, StateScreen } from '@/components/ui';
import type { ScreenProps, AccountStatusState } from '@/navigation/types';

import type { LucideIcon } from 'lucide-react-native';

const BACK_LABEL = 'العودة للرئيسية';

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
    message: 'سيراجعه المشرف وسنرسل لك بريداً إلكترونياً عند الموافقة',
    register: 'warm',
  },
  rejected: {
    icon: CircleAlert,
    title: 'لم تتم الموافقة على طلبك',
    message: 'راجع المشرف طلب تسجيلك و لم يتم الموافقة عليه',
    register: 'blocking',
  },
  suspended: {
    icon: CircleAlert,
    title: 'تم حظرك من استخدام التطبيق',
    message: 'تم حظرك من قبل المشرف ولا يمكنك استخدام التطبيق',
    register: 'blocking',
  },
};

/** S-08. A root route with one way out, so it can neither open a session nor expose a shell. */
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
