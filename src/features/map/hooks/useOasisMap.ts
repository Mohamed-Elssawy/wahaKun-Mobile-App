import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { subscribeToIssueChanges } from '@/features/reports/services/issueEvents';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

import { boundsOf, clusterIssues, COINCIDENT_SPAN, isZoomedIn } from '../clustering';
import { filterIssues } from '../search';
import { getMapIssues } from '../services/mapService';

import type { MapIssue } from '../types';
import type { CameraStop, LngLat } from '@maplibre/maplibre-react-native';

const LOAD_ERROR = 'تعذر تحميل الخريطة، حاول مرة أخرى';

/** Siwa Oasis. Where the map opens before the farmer's own fix arrives. */
export const DEFAULT_CENTER: LngLat = [25.5195, 29.2041];

/** Wide enough to hold the oasis, which is F-05's zoomed-out state. */
export const DEFAULT_ZOOM = 11;

/** Close enough that one issue fills the frame, which is F-05's zoomed-in state. */
const CLOSE_ZOOM = 15;

/** One step in from a cluster, rather than all the way onto a single pin. */
const CLUSTER_ZOOM = 13;

/** How far south the camera slides for a stack, lifting the pin into the strip X-11's sheet leaves. */
const STACK_CAMERA_LIFT = 0.25;

/** How late the map's press may follow a marker's and still count as its tail. One press at most. */
const MARKER_PRESS_WINDOW_MS = 1200;

/** Keeps a fitted pin clear of the header, the search bar and the tab bar. */
const FIT_PADDING = { top: 180, right: 40, bottom: 140, left: 40 };

/** Where the search results are, framed so all of them are on screen at once. */
function fitTo(matches: MapIssue[]): CameraStop | null {
  const box = boundsOf(matches);
  if (!box) {
    return null;
  }

  const center: LngLat = [(box.west + box.east) / 2, (box.south + box.north) / 2];

  // A box with no area has no zoom that fits it, and matches on one canal are exactly that.
  if (box.north - box.south < COINCIDENT_SPAN && box.east - box.west < COINCIDENT_SPAN) {
    return { center, zoom: CLOSE_ZOOM };
  }

  return { bounds: [box.west, box.south, box.east, box.north], padding: FIT_PADDING };
}

export function useOasisMap() {
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** How much latitude the viewport spans, which is what decides clustering. */
  const [latitudeSpan, setLatitudeSpan] = useState(1);
  /** Where the camera is being sent, or null while the farmer is panning freely. */
  const [cameraTarget, setCameraTarget] = useState<CameraStop | null>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });
  /** Ids, not issues, so the sheet follows the refetch that runs on every focus. */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const isFocused = useRef(true);
  const markerPressedAt = useRef(0);
  /** The query the camera was last framed for, so a refetch does not re-frame it. */
  const fittedQuery = useRef('');
  const location = useCurrentLocation();

  const load = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const result = await getMapIssues();
      if (isFocused.current) {
        setIssues(result);
      }
    } catch (err) {
      if (isFocused.current) {
        setError(describeError(err, LOAD_ERROR));
      }
    } finally {
      if (isFocused.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /** Refetches on focus: a report filed seconds ago should already be a pin. */
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      load();

      // Runs on blur as well as unmount, so a slow response cannot set state after.
      return () => {
        isFocused.current = false;
      };
    }, [load]),
  );

  // The queue files reports in the background, so the map can be open when one lands.
  useEffect(
    () =>
      subscribeToIssueChanges(change => {
        if (change.kind === 'deleted') {
          setSelectedIds(ids => ids.filter(id => id !== change.issueId));
        }
        // Blurred maps skip it: the focus effect refetches on the way back anyway.
        if (isFocused.current) {
          load();
        }
      }),
    [load],
  );

  // Title and reference only: MapResponseDto carries no description, reporter or place.
  const visible = useMemo(() => filterIssues(issues, query), [issues, query]);

  // Matches off screen read as no matches, so a new query frames its own results, keyed on the query.
  useEffect(() => {
    const trimmed = query.trim();
    if (fittedQuery.current === trimmed) {
      return;
    }
    fittedQuery.current = trimmed;

    if (!trimmed) {
      return;
    }

    const stop = fitTo(visible);
    if (stop) {
      setCameraTarget(stop);
    }
  }, [query, visible]);

  const clusters = useMemo(
    () => clusterIssues(visible, latitudeSpan),
    [visible, latitudeSpan],
  );

  // Kept in the cluster's own order, which is worst first.
  const selected = useMemo(() => {
    const byId = new Map(visible.map(issue => [issue.id, issue]));
    return selectedIds
      .map(id => byId.get(id))
      .filter((issue): issue is MapIssue => issue !== undefined);
  }, [visible, selectedIds]);

  /** The map reports its own viewport; the camera prop is released so panning is free. */
  const handleRegionChange = useCallback((span: number) => {
    setLatitudeSpan(span);
    setCameraTarget(null);
  }, []);

  const focusCluster = useCallback((center: LngLat) => {
    markerPressedAt.current = Date.now();
    setCameraTarget({ center, zoom: CLUSTER_ZOOM });
  }, []);

  /** X-11: a stack opens as one sheet, since zooming could never pull it apart. */
  const selectIssues = useCallback(
    (tapped: readonly MapIssue[]) => {
      const [first] = tapped;
      markerPressedAt.current = Date.now();
      setSelectedIds(tapped.map(issue => issue.id));

      if (tapped.length === 1) {
        setCameraTarget({ center: [first.longitude, first.latitude], zoom: CLOSE_ZOOM });
        return;
      }

      // Zooming in would only redraw the same stack, so the camera holds and slides instead.
      setCameraTarget({
        center: [first.longitude, first.latitude - latitudeSpan * STACK_CAMERA_LIFT],
      });
    },
    [latitudeSpan],
  );

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  /** A marker press reaches the map too, so only a press that follows no marker dismisses. */
  const handleMapPress = useCallback(() => {
    if (
      markerPressedAt.current > 0 &&
      Date.now() - markerPressedAt.current < MARKER_PRESS_WINDOW_MS
    ) {
      markerPressedAt.current = 0;
      return;
    }
    setSelectedIds([]);
  }, []);

  const recenter = useCallback(() => {
    // A refused permission leaves the oasis centre, which is still worth showing.
    const center: LngLat = location
      ? [location.longitude, location.latitude]
      : DEFAULT_CENTER;

    setCameraTarget({ center, zoom: CLOSE_ZOOM });
  }, [location]);

  return {
    cameraTarget,
    onRegionChange: handleRegionChange,
    clusters,
    /** Which of F-05's two states is on screen. */
    isZoomedIn: isZoomedIn(latitudeSpan),
    /** Empty when nothing is open; one issue draws F-05's sheet, several draw X-11's. */
    selected,
    selectIssues,
    clearSelection,
    onMapPress: handleMapPress,
    focusCluster,
    recenter,
    userLocation: location,
    query,
    setQuery,
    isLoading,
    error,
    retry: load,
    /** Empty is not an error: an oasis with nothing open is the good outcome. */
    isEmpty: !isLoading && !error && visible.length === 0,
    hasQuery: query.trim().length > 0,
  };
}
