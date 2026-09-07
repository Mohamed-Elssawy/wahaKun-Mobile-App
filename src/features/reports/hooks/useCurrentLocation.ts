import Geolocation from '@react-native-community/geolocation';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** Android grants nothing from the manifest alone, and getCurrentPosition then fails silently. */
async function ensureLocationPermission(): Promise<boolean> {
  // iOS asks on first use, driven by the usage string in Info.plist.
  if (Platform.OS !== 'android') {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** Asked on mount, because a fix takes seconds and the farmer spends them framing. */
export function useCurrentLocation() {
  // No permission state is returned: coordinates are optional, so nothing may gate submit.
  const [location, setLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    let cancelled = false;

    ensureLocationPermission()
      .then(isGranted => {
        if (!isGranted || cancelled) {
          return;
        }

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
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
