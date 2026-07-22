import { useCallback, useState } from 'react';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import type { PickedImage } from '@/features/auth/types';

import type { ImagePickerResponse } from 'react-native-image-picker';

const PICKER_OPTIONS = { mediaType: 'photo', quality: 0.7 } as const;

/**
 * Camera / gallery selection for the profile picture step.
 *
 * Keeps the picked asset in the {uri, type, fileName} shape React Native's
 * FormData needs, so it can be handed straight to buildRegisterFormData
 * without reshaping later in the flow.
 */
export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [error, setError] = useState('');

  const handleResponse = useCallback((response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      setError(
        response.errorCode === 'permission'
          ? 'يرجى السماح بالوصول إلى الكاميرا أو المعرض.'
          : 'تعذر اختيار الصورة، حاول مرة أخرى.',
      );
      return;
    }

    const asset = response.assets?.[0];
    if (asset?.uri) {
      setError('');
      setImage({ uri: asset.uri, type: asset.type, fileName: asset.fileName });
    }
  }, []);

  const pickFromCamera = useCallback(() => {
    launchCamera(
      { ...PICKER_OPTIONS, cameraType: 'back', saveToPhotos: true },
      handleResponse,
    );
  }, [handleResponse]);

  const pickFromGallery = useCallback(() => {
    launchImageLibrary(PICKER_OPTIONS, handleResponse);
  }, [handleResponse]);

  return { image, error, pickFromCamera, pickFromGallery };
}
