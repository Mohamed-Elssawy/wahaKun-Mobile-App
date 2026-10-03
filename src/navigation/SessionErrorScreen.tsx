import { useNavigation } from '@react-navigation/native';
import { WifiOff } from 'lucide-react-native';
import { useState } from 'react';

import { Screen, StateScreen } from '@/components/ui';

import { resolveBootDecision } from './bootRoute';

const TITLE = 'تعذر التحقق من حسابك';
const MESSAGE = 'تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.';
const RETRY_LABEL = 'إعادة المحاولة';

/**
 * X-01. A cold-start guard only, per D-OFFLINE-FIRST: it must never interrupt the report
 * flow, which is why §4.1 is the only thing that routes here.
 */
// Not yet designed: §5.4 gives the blocking register and one primary action, and no frame.
export default function SessionErrorScreen() {
  const navigation = useNavigation();
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    // StateScreen's action takes no loading state, so this is what stops a double tap.
    if (isRetrying) {
      return;
    }
    setIsRetrying(true);

    const decision = await resolveBootDecision();

    // Still failing, so stay put rather than resetting this screen onto itself.
    if (decision.name === 'SessionError') {
      setIsRetrying(false);
      return;
    }

    navigation.reset({ index: 0, routes: [decision] });
  };

  return (
    <Screen>
      <StateScreen
        icon={WifiOff}
        title={TITLE}
        message={MESSAGE}
        action={{ label: RETRY_LABEL, onPress: retry }}
      />
    </Screen>
  );
}
