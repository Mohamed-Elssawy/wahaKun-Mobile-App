import { CloudOff, ShieldAlert, WifiOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';
import { t } from '@/i18n';

import type { ReportError } from '../errors';
import type { LucideIcon } from 'lucide-react-native';

export type ReportErrorViewProps = {
  error: ReportError;
  /** Each screen supplies its own, since only the caller knows what it was doing. */
  unknownTitle: string;
  /** X-05 names the upload and promises the photo survives, which X-01 would drop. */
  offline?: { icon: LucideIcon; title: string; message: string };
  onRetry: () => void;
};

/** Chooses from ReportError.kind. Nothing here reads message text. */
export function ReportErrorView({
  error,
  unknownTitle,
  offline,
  onRetry,
}: ReportErrorViewProps) {
  if (error.kind === 'offline') {
    return (
      <StateScreen
        icon={offline?.icon ?? WifiOff}
        title={offline?.title ?? t('x01.title')}
        message={offline?.message ?? error.message}
        action={{ label: t('common.tryAgain'), onPress: onRetry }}
      />
    );
  }

  if (error.kind === 'unauthorized') {
    // No retry: the call fails the same way until the session is renewed elsewhere.
    return (
      <StateScreen
        icon={ShieldAlert}
        title={t('x05.sessionExpiredTitle')}
        message={error.message}
      />
    );
  }

  return (
    <StateScreen
      icon={CloudOff}
      title={unknownTitle}
      message={error.message}
      action={{ label: t('common.tryAgain'), onPress: onRetry }}
    />
  );
}
