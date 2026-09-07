import { useCallback, useEffect, useState } from 'react';
import {
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { useImagePicker } from '@/hooks/useImagePicker';
import type { PickedImage } from '@/types/image';

import { describeError } from '../errors';
import { useCurrentLocation } from './useCurrentLocation';
import { enqueueReport, QueueFullError } from '../services/reportQueue';

import type { ReportError } from '../errors';
import type { CaptureMode } from '../types';
import type { TargetCameraPosition } from 'react-native-vision-camera';

/** Where the photo under review came from, which is not the same as the tab. */
export type PhotoSource = 'camera' | 'gallery';

/** Where a submitted report got to. Only 'queued' has somewhere to navigate. */
export type SubmitResult =
  /** Stored and handed to the queue. Analysis happens there, so the wait has its own screen. */
  | { kind: 'queued'; localId: string }
  /** At REPORT_QUEUE_MAX. Nothing was dropped; the farmer has to wait or discard. */
  | { kind: 'full' }
  /** The photo could not be stored at all. */
  | { kind: 'failed' };

/** Everything F-02 does that is not layout: camera, both photo sources, and upload. */
export function useReportCapture(initialMode: CaptureMode = 'photo') {
  const [cameraPosition, setCameraPosition] = useState<TargetCameraPosition>('back');
  const device = useCameraDevice(cameraPosition);
  // Most emulators and some devices have no front camera, so the flip control hides.
  const hasOtherCameraPosition =
    useCameraDevice(cameraPosition === 'back' ? 'front' : 'back') != null;
  const { hasPermission, requestPermission } = useCameraPermission();
  const {
    hasPermission: hasMicrophonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();
  const photoOutput = usePhotoOutput();
  // No pickFromCamera: the photo tab runs a live preview, so the system camera would double up.
  const { image, error: pickerError, pickFromGallery } = useImagePicker();
  const location = useCurrentLocation();

  // Owned here because switching mode must also drop the photo being reviewed.
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  /** Decides what "try again" means on the review step: reshoot, or repick. */
  const [photoSource, setPhotoSource] = useState<PhotoSource>('camera');
  /** Owned here, not on the صوت tab, so switching to صورة keeps what was written. */
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Apart from `error`: a failed upload takes the screen, a failed capture one line.
  const [submitError, setSubmitError] = useState<ReportError | null>(null);

  // Only the photo tab needs this; the gallery picker asks for its own access.
  useEffect(() => {
    if (mode === 'photo' && !hasPermission) {
      requestPermission();
    }
  }, [mode, hasPermission, requestPermission]);

  // Only the gallery reaches useImagePicker, so anything arriving here was picked.
  useEffect(() => {
    if (image) {
      setPhoto(image);
      setPhotoSource('gallery');
    }
  }, [image]);

  // Keeps `description`: writing it and then photographing the problem is the flow.
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

  /** A picked photo reopens the picker; a captured one clears to reveal the preview. */
  const retakePhoto = useCallback(() => {
    discardPhoto();
    if (photoSource === 'gallery') {
      pickFromGallery();
    }
  }, [discardPhoto, photoSource, pickFromGallery]);

  const flipCamera = useCallback(() => {
    setCameraPosition(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  /** Asked on tap, not on entering the tab: a text box should not demand a microphone. */
  const requestMicrophone = useCallback(async () => {
    if (hasMicrophonePermission) {
      return true;
    }
    return requestMicrophonePermission();
  }, [hasMicrophonePermission, requestMicrophonePermission]);

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
      setPhotoSource('camera');
    } catch {
      setError('تعذر التقاط الصورة، حاول مرة أخرى');
    }
  }, [photoOutput]);

  /** The queue persists the photo before any network call, so there is no offline branch. */
  // Returns as soon as the photo is stored; ReportAnalyzing watches the rest by localId.
  const submit = useCallback(async (): Promise<SubmitResult> => {
    if (!photo) {
      return { kind: 'failed' };
    }

    setIsSubmitting(true);

    try {
      // Spread, not branch: a refused location permission must never block a report.
      const queued = await enqueueReport({
        photo,
        description: description.trim() || undefined,
        ...location,
      });

      return { kind: 'queued', localId: queued.localId };
    } catch (err) {
      if (err instanceof QueueFullError) {
        return { kind: 'full' };
      }
      // Only reached if the photo itself could not be stored, which no retry fixes.
      setSubmitError(describeError(err, 'تعذر حفظ الصورة، حاول مرة أخرى.'));
      return { kind: 'failed' };
    } finally {
      setIsSubmitting(false);
    }
  }, [photo, description, location]);

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
    isPreviewActive: mode === 'photo' && !photo && hasPermission && device != null,
    photo,
    photoSource,
    description,
    setDescription,
    requestMicrophone,
    capture,
    pickFromGallery,
    discardPhoto,
    retakePhoto,
    submit,
    isSubmitting,
    /** Only set when the photo could not be stored. Connectivity no longer lands here. */
    submitError,
    /** One string for the screen, whichever step produced it. */
    error: error || pickerError,
  };
}
