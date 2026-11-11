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

/** 30s, high plus low accuracy: fires only when the native layer abandoned both reads. */
const NATIVE_READ_TIMEOUT_MS = 30000;

// The legacy LocationManager needs a satellite fix, which is what timed out indoors.
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

/** check first, then ask: either permission counts, since Approximate grants only COARSE. */
async function ensureLocationPermission(mayRequest: boolean): Promise<boolean> {
  // iOS asks on first use, driven by the usage string in Info.plist.
  if (Platform.OS !== 'android') {
    return true;
  }

  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
  if (
    (await PermissionsAndroid.check(fine)) ||
    (await PermissionsAndroid.check(coarse))
  ) {
    return true;
  }

  /** requestMultiple opens an activity even when all are denied, which loops on foreground. */
  if (!mayRequest) {
    return false;
  }

  const results = await PermissionsAndroid.requestMultiple([fine, coarse]);

  return [fine, coarse].some(
    permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}

function getFix(options: {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // Whichever of the three fires first settles it; what matters is that one always does.
    const abandoned = setTimeout(
      () => reject(new Error('NATIVE_LOCATION_READ_NEVER_SETTLED')),
      NATIVE_READ_TIMEOUT_MS,
    );
    const settle =
      <T>(then: (value: T) => void) =>
      (value: T) => {
        clearTimeout(abandoned);
        then(value);
      };

    Geolocation.getCurrentPosition(
      settle(position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      ),
      settle(reject),
      options,
    );
  });
}

function errorCode(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? Number((error as { code: unknown }).code)
    : undefined;
}

/** Mandatory, not best-effort: status gates submit. Shared by reports, map and community. */
export function useCurrentLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationPermissionStatus>('pending');
  const cancelledRef = useRef(false);
  const inFlightRef = useRef(false);
  const hasFixRef = useRef(false);
  /** Android may be asked once per mount; see `ensureLocationPermission`. */
  const hasRequestedRef = useRef(false);
  const attemptsRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async function run(isRetry = false): Promise<void> {
    // The permission dialog backgrounds the app, so without this guard a second check starts.
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
      const mayRequest = !hasRequestedRef.current;
      hasRequestedRef.current = true;
      const isGranted = await ensureLocationPermission(mayRequest);
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
        fix = await getFix({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000,
        });
      } catch (error) {
        if (errorCode(error) === PERMISSION_DENIED) {
          throw error;
        }
        // GPS cold or indoors: the fused provider answers in a second and is enough to place a report.
        fix = await getFix({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 600000,
        });
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
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    check();

    // X-05's primary action is open settings, so a grant there is seen on return.
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
