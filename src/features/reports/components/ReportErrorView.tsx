import { CloudOff, ShieldAlert, WifiOff } from 'lucide-react-native';

import { ReportFailureState } from './ReportFailureState';

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

const RETRY = 'إعادة المحاولة';

const OFFLINE_TITLE = 'لا يوجد اتصال بالإنترنت';
const UNAUTHORIZED_TITLE = 'انتهت الجلسة';

/** Chooses from ReportError.kind. Nothing here reads message text. */
export function ReportErrorView({
  error,
  unknownTitle,
  offline,
  onRetry,
}: ReportErrorViewProps) {
  if (error.kind === 'offline') {
    return (
      <ReportFailureState
        icon={offline?.icon ?? WifiOff}
        title={offline?.title ?? OFFLINE_TITLE}
        message={offline?.message ?? error.message}
        action={{ label: RETRY, onPress: onRetry }}
      />
    );
  }

  if (error.kind === 'unauthorized') {
    // No retry: the call fails the same way until the session is renewed elsewhere.
    return (
      <ReportFailureState
        icon={ShieldAlert}
        title={UNAUTHORIZED_TITLE}
        message={error.message}
      />
    );
  }

  return (
    <ReportFailureState
      icon={CloudOff}
      title={unknownTitle}
      message={error.message}
      action={{ label: RETRY, onPress: onRetry }}
    />
  );
}
