import { CameraOff } from 'lucide-react-native';

import { ReportFailureState } from './ReportFailureState';

export type CameraPermissionDeniedProps = {
  onOpenSettings: () => void;
};

/** Kept inside F-02, so the header's back and the upload toggle both stay reachable. */
export function CameraPermissionDenied({ onOpenSettings }: CameraPermissionDeniedProps) {
  return (
    <ReportFailureState
      icon={CameraOff}
      title="لا يمكن الوصول إلى الكاميرا"
      message="فعّل إذن الكاميرا من الإعدادات لتصوير المشكلة."
      action={{ label: 'فتح الإعدادات', onPress: onOpenSettings }}
    />
  );
}
