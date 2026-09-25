import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { useNavigation } from '@react-navigation/native';
import { LocateFixed, MapPinned } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { AppHeader, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors, spacing } from '@/theme';

import { MapClusterPin } from '../../components/MapClusterPin';
import { MAP_CONTROL_ICON, MapControlButton } from '../../components/MapControlButton';
import { MapLegend } from '../../components/MapLegend';
import { MapNotice } from '../../components/MapNotice';
import { MapPeekSheet } from '../../components/MapPeekSheet';
import { MapPin } from '../../components/MapPin';
import { MapSearchBar } from '../../components/MapSearchBar';
import { MapUserDot } from '../../components/MapUserDot';
import { DEFAULT_CENTER, DEFAULT_ZOOM, useOasisMap } from '../../hooks/useOasisMap';
import { SATELLITE_STYLE, TILE_ATTRIBUTION } from '../../tiles';

import type { ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import type { NativeSyntheticEvent } from 'react-native';

const EMPTY = {
  all: {
    title: 'لا توجد بلاغات على الخريطة',
    message: 'لم يبلغ أحد عن مشكلة في الواحة بعد. هذه أخبار جيدة.',
  },
  filtered: {
    title: 'لا توجد بلاغات مطابقة',
    message: 'جرّب كلمة أخرى للبحث في بلاغات الواحة.',
  },
} as const;

const CAMERA_DURATION_MS = 600;

/** F-05. One screen for both states: the zoom decides which chrome is showing. */
export default function OasisMapScreen() {
  const navigation = useNavigation();
  const { avatarUrl } = useIdentity();
  const {
    cameraTarget,
    onRegionChange,
    clusters,
    isZoomedIn,
    selected,
    selectIssues,
    clearSelection,
    onMapPress,
    focusCluster,
    recenter,
    userLocation,
    query,
    setQuery,
    isLoading,
    error,
    retry,
    isEmpty,
    hasQuery,
  } = useOasisMap();

  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  // Seeds both rather than forcing them: forcing made the two buttons inert at one zoom.
  useEffect(() => {
    setIsSearchOpen(!isZoomedIn);
    setIsLegendOpen(!isZoomedIn);
  }, [isZoomedIn]);

  // Stays open while a query is live: a collapsed bar would hide why the map is filtered.
  const isSearchExpanded = isSearchOpen || hasQuery;
  const isLegendExpanded = isLegendOpen;

  // Clears on the way down, so the map is never filtered by a query the farmer cannot see.
  const handleSearchToggle = () => {
    if (isSearchExpanded) {
      setQuery('');
      setIsSearchOpen(false);
      // Losing the field does not close the keyboard, which then covers half the map.
      Keyboard.dismiss();
      return;
    }
    setIsSearchOpen(true);
  };

  const handleRegionChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const [, south, , north] = event.nativeEvent.bounds;
    onRegionChange(Math.abs(north - south));
  };

  const header = (
    <AppHeader
      title="خريطة الواحة"
      avatarUrl={avatarUrl}
      onOpenProfile={() => navigation.navigate('Profile')}
    />
  );

  if (error) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.fallback}>
          <ReportErrorView
            error={error}
            unknownTitle="تعذر تحميل الخريطة"
            onRetry={retry}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={SATELLITE_STYLE}
        onRegionDidChange={handleRegionChange}
        onPress={onMapPress}
        // Both ornaments are redrawn by this screen's own chrome, so the stock ones double up.
        attribution={false}
        logo={false}
      >
        <Camera
          // Seeded separately: the target is released once the farmer pans, and this is the start state.
          initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
          duration={CAMERA_DURATION_MS}
          // Spread whole: a stop carries either a centre or the bounds a search fits to.
          {...cameraTarget}
        />

        {userLocation ? <MapUserDot location={userLocation} /> : null}

        {clusters.map(cluster => (
          <Marker
            key={cluster.id}
            lngLat={[cluster.longitude, cluster.latitude]}
            // A cluster zooms in, unless it is coincident: X-11 lists those in the sheet instead.
            onPress={() =>
              cluster.issues.length > 1 && !cluster.isCoincident
                ? focusCluster([cluster.longitude, cluster.latitude])
                : selectIssues(cluster.issues)
            }
            // A teardrop points at its coordinate; a cluster circle sits centred on it.
            anchor={cluster.issues.length > 1 ? 'center' : 'bottom'}
          >
            {cluster.issues.length > 1 ? (
              <MapClusterPin tier={cluster.tier} count={cluster.issues.length} />
            ) : (
              <MapPin tier={cluster.tier} />
            )}
          </Marker>
        ))}
      </Map>

      <View style={styles.chrome} pointerEvents="box-none">
        {header}

        <View style={styles.search} pointerEvents="box-none">
          <MapSearchBar
            isExpanded={isSearchExpanded}
            value={query}
            onChange={setQuery}
            onToggle={handleSearchToggle}
          />
        </View>

        {/* none, not box-none: this layer holds only notices, so any tap it caught would be one meant for a pin. */}
        <View style={styles.spacer} pointerEvents="none">
          {isLoading ? <MapNotice /> : null}

          {isEmpty ? (
            <MapNotice
              icon={MapPinned}
              title={hasQuery ? EMPTY.filtered.title : EMPTY.all.title}
              message={hasQuery ? EMPTY.filtered.message : EMPTY.all.message}
            />
          ) : null}
        </View>

        <View style={styles.controls} pointerEvents="box-none">
          <MapLegend
            isExpanded={isLegendExpanded}
            onToggle={() => setIsLegendOpen(open => !open)}
          />

          <MapControlButton
            icon={<LocateFixed size={MAP_CONTROL_ICON} color={colors.primary} />}
            onPress={recenter}
            accessibilityLabel="العودة إلى موقعي"
          />
        </View>

        {/* MapLibre draws no attribution of its own, and Esri's terms require it. */}
        <Text variant="label12" color="textInverse" style={styles.attribution}>
          {TILE_ATTRIBUTION}
        </Text>

        {selected.length > 0 ? (
          <MapPeekSheet
            issues={selected}
            onOpen={issueId => navigation.navigate('IssueDetails', { reportId: issueId })}
            onDismiss={clearSelection}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
  },
  // Floats over the map, so only the controls inside it may take touches.
  chrome: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  search: {
    paddingHorizontal: spacing[12],
    paddingTop: spacing[12],
  },
  spacer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // row-reverse puts the legend on the right, where the frame has it.
  controls: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[12],
    paddingBottom: spacing[12],
  },
  attribution: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[12],
    paddingBottom: spacing[4],
    // The imagery behind it is arbitrary, so the label carries its own scrim.
    backgroundColor: colors.overlay,
  },
});
