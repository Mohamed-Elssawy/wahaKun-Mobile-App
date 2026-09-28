import { useState } from 'react';

import { describeError } from '@/features/reports/errors';
import { useImagePicker } from '@/hooks/useImagePicker';

import { useProfile } from './useProfile';
import { userApi } from '../services';

const UPLOAD_ERROR = 'تعذر رفع الصورة، حاول مرة أخرى';

/** Two calls, not one: MediaStorage takes the bytes, then User/update stores its key. */
export function useProfilePicture() {
  const { user, isLoading, error, retry, save, isSaving, saveError } = useProfile();
  const { image, error: pickerError, pickFromCamera, pickFromGallery } = useImagePicker();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const submit = async (): Promise<boolean> => {
    if (!image) {
      return false;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const objectKey = await userApi.uploadProfilePicture(image);
      return await save({ picture: objectKey });
    } catch (err) {
      setUploadError(describeError(err, UPLOAD_ERROR).message);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    currentPicture: user?.picture,
    image,
    pickFromCamera,
    pickFromGallery,
    submit,
    isSubmitting: isUploading || isSaving,
    // The picker's own failure matters as much as the two network ones.
    errorMessage: uploadError || saveError?.message || pickerError,
    isLoading,
    loadError: error,
    retry,
  };
}
