import { CaptureModeToggle } from './CaptureModeToggle';
import { ReportHeader } from './ReportHeader';

import type { CaptureMode } from '../types';

export type CaptureHeaderProps = {
  mode: CaptureMode;
  onModeChange: (mode: CaptureMode) => void;
  onBack: () => void;
};

/** Title and subtitle are fully determined by the mode, so they live here. */
const MODE_COPY: Record<CaptureMode, { title: string; subtitle: string }> = {
  camera: {
    title: 'الابلاغ بالكاميرا',
    subtitle: 'وجه الكاميرا نحو مشكلتك',
  },
  upload: {
    title: 'الابلاغ بالصوت',
    subtitle: 'اوصف المشكلة بصوتك أو ارفق صورة لها',
  },
};

/** Owns no state: mode lives in useReportCapture, which must drop the photo with it. */
export function CaptureHeader({ mode, onModeChange, onBack }: CaptureHeaderProps) {
  const { title, subtitle } = MODE_COPY[mode];

  return (
    <ReportHeader title={title} subtitle={subtitle} onBack={onBack}>
      <CaptureModeToggle mode={mode} onChange={onModeChange} />
    </ReportHeader>
  );
}
