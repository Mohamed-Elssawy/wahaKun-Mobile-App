import Geolocation from '@react-native-community/geolocation';
import { useEffect, useState } from 'react';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** Asked on mount, because a fix takes seconds and the farmer spends them framing. */
export function useCurrentLocation() {
  // No permission state is returned: coordinates are optional, so nothing may gate submit.
  const [location, setLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    let cancelled = false;

    Geolocation.getCurrentPosition(
      position => {
        if (!cancelled) {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      },
      // Refusal, timeout and a radio that is off are one outcome: send without them.
      () => {},
      // A ten-minute-old fix is fine; high accuracy because this pins a canal for a crew.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 600000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
