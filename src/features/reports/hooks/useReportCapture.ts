import { useCallback, useEffect, useState } from 'react';
import {
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { useImagePicker } from '@/hooks/useImagePicker';
import type { PickedImage } from '@/types/image';

import { describeError } from '../errors';
import { reportApi } from '../services';
import { useCurrentLocation } from './useCurrentLocation';

import type { ReportError } from '../errors';
import type { CaptureMode, Report } from '../types';
import type { TargetCameraPosition } from 'react-native-vision-camera';

/** Everything F-02 does that is not layout: camera, both photo sources, and upload. */
export function useReportCapture() {
  const [cameraPosition, setCameraPosition] = useState<TargetCameraPosition>('back');
  const device = useCameraDevice(cameraPosition);
  // Most emulators and some devices have no front camera, so the flip control hides.
  const hasOtherCameraPosition =
    useCameraDevice(cameraPosition === 'back' ? 'front' : 'back') != null;
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput();
  const { image, error: pickerError, pickFromCamera, pickFromGallery } = useImagePicker();
  const location = useCurrentLocation();

  // Owned here because switching mode must also drop the photo being reviewed.
  const [mode, setMode] = useState<CaptureMode>('camera');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Apart from `error`: a failed upload takes the screen, a failed capture one line.
  const [submitError, setSubmitError] = useState<ReportError | null>(null);

  // Only camera mode needs this; the gallery picker asks for its own access.
  useEffect(() => {
    if (mode === 'camera' && !hasPermission) {
      requestPermission();
    }
  }, [mode, hasPermission, requestPermission]);

  // Mirrored so a gallery photo goes through the same review step as a camera shot.
  useEffect(() => {
    if (image) {
      setPhoto(image);
    }
  }, [image]);

  const changeMode = useCallback((next: CaptureMode) => {
    setPhoto(null);
    setError('');
    setSubmitError(null);
    setMode(next);
  }, []);

  const discardPhoto = useCallback(() => {
    setPhoto(null);
    setError('');
    setSubmitError(null);
  }, []);

  const flipCamera = useCallback(() => {
    setCameraPosition(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  const capture = useCallback(async () => {
    setError('');
    try {
      const taken = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
      // capturePhotoToFile returns a bare path; <Image> and FormData both need file://.
      setPhoto({
        uri: `file://${taken.filePath}`,
        type: 'image/jpeg',
        fileName: 'report.jpg',
      });
    } catch {
      setError('تعذر التقاط الصورة، حاول مرة أخرى');
    }
  }, [photoOutput]);

  /** Returns the created report, or null on failure. */
  const submit = useCallback(async (): Promise<Report | null> => {
    if (!photo) {
      return null;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Spread, not branch: a refused location permission must never block a report.
      return await reportApi.createReport({ photo, ...location });
    } catch (err) {
      setSubmitError(describeError(err, 'تحقق من اتصالك بالانترنت وحاول مرة أخرى.'));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [photo, location]);

  return {
    mode,
    changeMode,
    device,
    hasPermission,
    canFlipCamera: hasOtherCameraPosition,
    flipCamera,
    /** The screen mounts <Camera>, so its output is exposed rather than owned here. */
    photoOutput,
    /** The live preview is only worth running in this one combination of states. */
    isPreviewActive: mode === 'camera' && !photo && hasPermission && device != null,
    photo,
    capture,
    pickFromCamera,
    pickFromGallery,
    discardPhoto,
    submit,
    isSubmitting,
    /** Set when the upload failed; the photo is kept so retry can resend it. */
    submitError,
    /** One string for the screen, whichever step produced it. */
    error: error || pickerError,
  };
}
