import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

import type { Coordinates } from '@/hooks/useCurrentLocation';
import { colors } from '@/theme';

export type MapUserDotProps = {
  location: Coordinates;
};

const SOURCE_ID = 'user-location';

// F-05 draws a 16 blue disc with a 2 white ring, which is also the legend's swatch.
const RADIUS = 8;
const RING = 2;

/** Where the farmer is. A layer, not a Marker: a Marker takes touches and swallowed taps on the pin. */
// Not MapLibre's own UserLocation either: it stayed silent on the emulator with a fix set.
export function MapUserDot({ location }: MapUserDotProps) {
  return (
    <GeoJSONSource
      id={SOURCE_ID}
      data={{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
      }}
    >
      <Layer
        id={`${SOURCE_ID}-dot`}
        source={SOURCE_ID}
        type="circle"
        paint={{
          'circle-radius': RADIUS,
          'circle-color': colors.info,
          'circle-stroke-width': RING,
          'circle-stroke-color': colors.surface,
        }}
      />
    </GeoJSONSource>
  );
}
