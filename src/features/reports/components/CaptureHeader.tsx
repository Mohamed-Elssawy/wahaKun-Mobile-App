import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

import { CaptureModeToggle } from './CaptureModeToggle';
import { ReportHeader } from './ReportHeader';

import type { CaptureMode } from '../types';

export type CaptureHeaderProps = {
  mode: CaptureMode;
  onModeChange: (mode: CaptureMode) => void;
  onBack: () => void;
};

/** Title and subtitle are fully determined by the mode, so they live here. */
const MODE_COPY: Record<
  CaptureMode,
  { title: TranslationKey; subtitle: TranslationKey }
> = {
  photo: {
    title: 'f02.photoTitle',
    subtitle: 'f02.photoSubtitle',
  },
  voice: {
    title: 'f02.voiceTitle',
    subtitle: 'f02.voiceSubtitle',
  },
};

/** Owns no state: mode lives in useReportCapture, which must drop the photo with it. */
export function CaptureHeader({ mode, onModeChange, onBack }: CaptureHeaderProps) {
  const { title, subtitle } = MODE_COPY[mode];

  return (
    <ReportHeader title={t(title)} subtitle={t(subtitle)} onBack={onBack}>
      <CaptureModeToggle mode={mode} onChange={onModeChange} />
    </ReportHeader>
  );
}
