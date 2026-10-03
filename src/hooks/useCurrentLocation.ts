import Geolocation from '@react-native-community/geolocation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationPermissionStatus = 'pending' | 'granted' | 'denied';

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

/**
 * Asked on mount, because a fix takes seconds and the farmer spends them framing. Unlike the
 * earlier best-effort version, `X-05`/`D-HARD-BLOCK` makes location mandatory: `status` is what
 * `ReportCaptureScreen` gates submit on, not just a courtesy to pass along when it is there.
 */
// Shared by reports, map and community, so it sits in hooks/ rather than a feature.
export function useCurrentLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationPermissionStatus>('pending');
  const cancelledRef = useRef(false);

  const check = useCallback(() => {
    ensureLocationPermission()
      .then(isGranted => {
        if (cancelledRef.current) {
          return;
        }

        if (!isGranted) {
          setStatus('denied');
          return;
        }

        Geolocation.getCurrentPosition(
          position => {
            if (!cancelledRef.current) {
              setStatus('granted');
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            }
          },
          () => {
            // A permission grant that still fails to produce a fix (radio off, no signal) is
            // not the same refusal X-05 describes, but there is nothing else to send with.
            if (!cancelledRef.current) {
              setStatus('denied');
            }
          },
          // A ten-minute-old fix is fine; high accuracy because this pins a canal for a crew.
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 600000 },
        );
      })
      .catch(() => {
        if (!cancelledRef.current) {
          setStatus('denied');
        }
      });
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    check();

    // X-05's primary action is "open settings" - re-check on return so a grant there is seen
    // without the farmer having to back out of the capture screen and in again.
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        check();
      }
    });

    return () => {
      cancelledRef.current = true;
      subscription.remove();
    };
  }, [check]);

  return { location, status, recheck: check };
}
