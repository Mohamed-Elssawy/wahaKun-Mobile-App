import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { useNavigation } from '@react-navigation/native';
import { LocateFixed, MapPinned } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { AppHeader, StaleBanner, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { colors, spacing } from '@/theme';

import { MapClusterPin } from './MapClusterPin';
import { MAP_CONTROL_ICON, MapControlButton } from './MapControlButton';
import { MapLegend } from './MapLegend';
import { MapNotice } from './MapNotice';
import { MapPeekSheet } from './MapPeekSheet';
import { MapPin } from './MapPin';
import { MapSearchBar } from './MapSearchBar';
import { MapUserDot } from './MapUserDot';
import { DEFAULT_CENTER, DEFAULT_ZOOM, useOasisMap } from '../hooks/useOasisMap';
import { SATELLITE_STYLE, TILE_ATTRIBUTION } from '../tiles';

import type { MapPeekAction } from './MapPeekSheet';
import type { MapIssue } from '../types';
import type { ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import type { NativeSyntheticEvent } from 'react-native';

const EMPTY = {
  all: {
    title: 'f05.emptyTitle',
    message: 'f05.emptyBody',
  },
  filtered: {
    title: 'f07.noResultsTitle',
    message: 'f05.noSearchResults',
  },
} as const satisfies Record<string, { title: TranslationKey; message: TranslationKey }>;

const CAMERA_DURATION_MS = 600;

export type OasisMapBodyProps = {
  /** C-CTA: the only thing that differs between F-05 and E-08, called per row. */
  buildPeekAction: (issue: MapIssue) => MapPeekAction;
};

/** Shared body: the zoom decides the chrome, and only the peek's CTA is role-aware. */
export function OasisMapBody({ buildPeekAction }: OasisMapBodyProps) {
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
    hasData,
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

  const isSheetOpen = selected.length > 0;

  // C56 / B-COLLAPSE: derived rather than forced, so dismissing the sheet restores whatever state the viewer had.
  const isSearchExpanded = !isSheetOpen && (isSearchOpen || hasQuery);
  const isLegendExpanded = !isSheetOpen && isLegendOpen;

  // Clears on the way down, so the map is never filtered by a query the viewer cannot see.
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
      title={t('f05.title')}
      avatarUrl={avatarUrl}
      onOpenProfile={() => navigation.navigate('Profile')}
      onOpenNotifications={() => navigation.navigate('Notifications')}
    />
  );

  // An error with nothing cached is a hard failure; with pins drawn it is D-STALE and they stay.
  if (error && !hasData) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.fallback}>
          <ReportErrorView
            error={error}
            unknownTitle={t('f05.loadErrorTitle')}
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
          // Seeded separately: the target is released once the viewer pans, and this is the start state.
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
            // A cluster zooms in, unless it is coincident: the sheet lists those instead.
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

        {error ? <StaleBanner message={t('f05.staleBanner')} onRetry={retry} /> : null}

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
              title={t(hasQuery ? EMPTY.filtered.title : EMPTY.all.title)}
              message={t(hasQuery ? EMPTY.filtered.message : EMPTY.all.message)}
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
            accessibilityLabel={t('f05.locateMe')}
          />
        </View>

        {/* MapLibre draws no attribution of its own, and Esri's terms require it. */}
        <Text variant="label12" color="textInverse" style={styles.attribution}>
          {TILE_ATTRIBUTION}
        </Text>

        {isSheetOpen ? (
          <MapPeekSheet
            issues={selected}
            buildAction={buildPeekAction}
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
  // The legend leads and the locate control takes the far edge.
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[12],
    paddingBottom: spacing[12],
  },
  attribution: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing[12],
    paddingBottom: spacing[4],
    // The imagery behind it is arbitrary, so the label carries its own scrim.
    backgroundColor: colors.overlay,
  },
});
