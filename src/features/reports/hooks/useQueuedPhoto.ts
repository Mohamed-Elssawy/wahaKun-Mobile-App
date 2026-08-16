import { useEffect, useState } from 'react';

import { readPhotoDataUri } from '../services/photoStore';

/** Null while loading or missing; `uploadOne` owns deciding a vanished photo is fatal. */
export function useQueuedPhoto(localId: string): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    readPhotoDataUri(localId)
      .then(result => {
        if (isCurrent) {
          setUri(result);
        }
      })
      .catch(() => {
        // Leaves the placeholder in place, which is what a missing photo shows.
      });

    return () => {
      isCurrent = false;
    };
  }, [localId]);

  return uri;
}
