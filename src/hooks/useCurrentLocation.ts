import Geolocation from '@react-native-community/geolocation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationPermissionStatus = 'pending' | 'granted' | 'denied';

// GeolocationError codes. Only the first is the farmer refusing; the others are the device.
const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;

/** A fix that times out indoors is common, so it is retried a few times before it is called a wall. */
const MAX_FIX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 4000;

// 'auto' uses Google Play Services' fused provider when the phone has it. The legacy
// LocationManager it falls back to needs a GPS satellite fix, which is what timed out indoors.
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

/**
 * Android grants nothing from the manifest alone, and getCurrentPosition then fails silently.
 * `check` first: `request` on an already-granted permission is harmless, but on one the farmer
 * ticked "don't ask again" for it resolves denied at once, and asking every time the app was
 * foregrounded was what kept re-opening the denied screen.
 */
async function ensureLocationPermission(): Promise<boolean> {
  // iOS asks on first use, driven by the usage string in Info.plist.
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (await PermissionsAndroid.check(permission)) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function getFix(options: {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
      options,
    );
  });
}

function errorCode(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? Number((error as { code: unknown }).code)
    : undefined;
}

/**
 * Asked on mount, because a fix takes seconds and the farmer spends them framing. Unlike the
 * earlier best-effort version, `X-05`/`D-HARD-BLOCK` makes location mandatory: `status` is what
 * `ReportCaptureScreen` gates submit on, not just a courtesy to pass along when it is there.
 *
 * `denied` means the farmer (or the device's location switch) really is the reason there is no
 * fix. A slow fix is `pending` and retried; and once a fix exists no later failure takes the
 * status back from `granted`, so a transient error cannot re-block a screen that already works.
 */
// Shared by reports, map and community, so it sits in hooks/ rather than a feature.
export function useCurrentLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationPermissionStatus>('pending');
  const cancelledRef = useRef(false);
  const inFlightRef = useRef(false);
  const hasFixRef = useRef(false);
  const attemptsRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(
    async function run(isRetry = false): Promise<void> {
      // The permission dialog itself backgrounds the app, and the AppState listener below
      // fires when it closes: without this guard that starts a second check on top of the first.
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;

      if (!isRetry) {
        attemptsRef.current = 0;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      try {
        const isGranted = await ensureLocationPermission();
        if (cancelledRef.current) {
          return;
        }

        if (!isGranted) {
          setStatus('denied');
          return;
        }

        let fix: Coordinates;
        try {
          // A ten-minute-old fix is fine; high accuracy because this pins a canal for a crew.
          fix = await getFix({ enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 });
        } catch (error) {
          if (errorCode(error) === PERMISSION_DENIED) {
            throw error;
          }
          // GPS cold or indoors: the network/fused provider answers in a second or two and is
          // plenty to place a report on a map.
          fix = await getFix({ enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 });
        }

        if (cancelledRef.current) {
          return;
        }
        hasFixRef.current = true;
        setLocation(fix);
        setStatus('granted');
      } catch (error) {
        if (cancelledRef.current) {
          return;
        }

        if (hasFixRef.current) {
          // Keep the last good fix and the status it earned.
          return;
        }

        const code = errorCode(error);
        if (code === PERMISSION_DENIED || code === POSITION_UNAVAILABLE) {
          // Permission revoked, or the device's location switch is off: only settings fixes it.
          setStatus('denied');
          return;
        }

        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_FIX_ATTEMPTS) {
          setStatus('denied');
          return;
        }

        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          run(true);
        }, RETRY_DELAY_MS);
      } finally {
        inFlightRef.current = false;
      }
    },
    [],
  );

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
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      subscription.remove();
    };
  }, [check]);

  // A wrapper so a press handler's event argument can never be read as `isRetry`.
  const recheck = useCallback(() => {
    check();
  }, [check]);

  return { location, status, recheck };
}
